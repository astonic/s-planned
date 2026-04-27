'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import ExcelJS from 'exceljs'
import { prisma } from '@/lib/db'
import { withTenant } from '@/lib/tenant-context'
import { requireAuth } from '@/lib/security'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

async function auditLog(
  orgId: string,
  actorName: string,
  templateId: string | null,
  eventType: string,
  description: string,
) {
  await prisma.auditEvent.create({
    data: { organizationId: orgId, templateId, actorName, eventType, description },
  })
}

// ── Validation schemas ────────────────────────────────────────────────────────

const templateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  industry: z.string().optional(),
  version: z.string().optional(),
})

const TEMPLATE_IMPORT_HEADERS = {
  focusAreaCode: 'Focus Area Code',
  focusAreaName: 'Focus Area Name',
  subSectionCode: 'Sub-section Code',
  subSectionName: 'Sub-section Name',
  deliverableCode: 'Deliverable Code',
  deliverableName: 'Deliverable Name',
  description: 'Description',
  phase: 'Phase',
  domain: 'Domain',
  estimatedDuration: 'Estimated Duration',
  acceptanceCriteria: 'Acceptance Criteria',
  evidenceRequirements: 'Evidence Requirements',
} as const


function asText(value: unknown): string {
  if (value instanceof Date) return value.toISOString()
  if (value && typeof value === 'object') {
    if ('text' in value && typeof value.text === 'string') return value.text.trim()
    if ('result' in value) return asText(value.result)
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((part: { text?: string }) => part.text ?? '').join('').trim()
    }
  }
  return String(value ?? '').trim()
}

function splitLines(value: unknown): string[] {
  return asText(value)
    .split(/\r?\n|;/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function parseBoolean(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return !['false', 'no', 'n', '0', 'optional'].includes(normalized)
}

function getHeaderMap(sheet: ExcelJS.Worksheet): Map<string, number> {
  const headers = new Map<string, number>()
  sheet.getRow(1).eachCell((cell, colNumber) => {
    const header = asText(cell.value)
    if (header) headers.set(header, colNumber)
  })
  return headers
}

function getCellText(row: ExcelJS.Row, headers: Map<string, number>, header: string): string {
  const colNumber = headers.get(header)
  return colNumber ? asText(row.getCell(colNumber).value) : ''
}

function parseMeta(workbook: ExcelJS.Workbook) {
  const sheet = workbook.getWorksheet('Template') ?? workbook.getWorksheet('Metadata') ?? workbook.getWorksheet('Meta')
  if (!sheet) throw new Error('Workbook must include a Template sheet.')

  const headers = getHeaderMap(sheet)
  const meta = new Map<string, string>()
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber)
    const field = getCellText(row, headers, 'Field')
    const value = getCellText(row, headers, 'Value')
    if (field) meta.set(field.toLowerCase(), value)
  }

  const name = meta.get('name')
  if (!name) throw new Error('Template sheet must include a Name value.')

  return {
    name,
    description: meta.get('description') || undefined,
    industry: meta.get('industry') || undefined,
    version: meta.get('version') || '1.0',
  }
}

function parseTemplateRows(workbook: ExcelJS.Workbook) {
  const sheet = workbook.getWorksheet('Deliverables')
  if (!sheet) throw new Error('Workbook must include a Deliverables sheet.')

  const headers = getHeaderMap(sheet)
  const rows: ExcelJS.Row[] = []
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber)
    let hasValue = false
    row.eachCell((cell) => {
      if (asText(cell.value)) hasValue = true
    })
    if (hasValue) rows.push(row)
  }
  if (rows.length === 0) throw new Error('Deliverables sheet must include at least one row.')

  const focusAreas = new Map<string, {
    code: string
    name: string
    subSections: Map<string, {
      code: string
      name: string
      deliverables: Array<{
        code: string
        name: string
        description?: string
        phase?: string
        domain?: string
        estimatedDuration?: number
        acceptanceCriteria: Array<{ description: string; verificationMethod?: string }>
        evidenceRequirements: Array<{ name: string; type?: string; required: boolean; description?: string }>
      }>
    }>
  }>()

  rows.forEach((row) => {
    const rowNumber = row.number
    const focusAreaCode = getCellText(row, headers, TEMPLATE_IMPORT_HEADERS.focusAreaCode)
    const focusAreaName = getCellText(row, headers, TEMPLATE_IMPORT_HEADERS.focusAreaName)
    const subSectionCode = getCellText(row, headers, TEMPLATE_IMPORT_HEADERS.subSectionCode)
    const subSectionName = getCellText(row, headers, TEMPLATE_IMPORT_HEADERS.subSectionName)
    const deliverableCode = getCellText(row, headers, TEMPLATE_IMPORT_HEADERS.deliverableCode)
    const deliverableName = getCellText(row, headers, TEMPLATE_IMPORT_HEADERS.deliverableName)

    if (!focusAreaCode || !focusAreaName || !subSectionCode || !subSectionName || !deliverableCode || !deliverableName) {
      throw new Error(`Deliverables row ${rowNumber} is missing a required code or name.`)
    }

    const phaseText = getCellText(row, headers, TEMPLATE_IMPORT_HEADERS.phase)

    const durationText = getCellText(row, headers, TEMPLATE_IMPORT_HEADERS.estimatedDuration)
    const estimatedDuration = durationText ? Number(durationText) : undefined
    if (estimatedDuration !== undefined && (!Number.isInteger(estimatedDuration) || estimatedDuration < 0)) {
      throw new Error(`Deliverables row ${rowNumber} has an invalid Estimated Duration.`)
    }

    const faKey = focusAreaCode.toLowerCase()
    let focusArea = focusAreas.get(faKey)
    if (!focusArea) {
      focusArea = { code: focusAreaCode, name: focusAreaName, subSections: new Map() }
      focusAreas.set(faKey, focusArea)
    }

    const ssKey = `${faKey}:${subSectionCode.toLowerCase()}`
    let subSection = focusArea.subSections.get(ssKey)
    if (!subSection) {
      subSection = { code: subSectionCode, name: subSectionName, deliverables: [] }
      focusArea.subSections.set(ssKey, subSection)
    }

    subSection.deliverables.push({
      code: deliverableCode,
      name: deliverableName,
      description: getCellText(row, headers, TEMPLATE_IMPORT_HEADERS.description) || undefined,
      phase: phaseText || undefined,
      domain: getCellText(row, headers, TEMPLATE_IMPORT_HEADERS.domain) || undefined,
      estimatedDuration,
      acceptanceCriteria: splitLines(getCellText(row, headers, TEMPLATE_IMPORT_HEADERS.acceptanceCriteria)).map((item) => {
        const [description, verificationMethod] = item.split('|').map((part) => part.trim())
        return { description, verificationMethod: verificationMethod || undefined }
      }),
      evidenceRequirements: splitLines(getCellText(row, headers, TEMPLATE_IMPORT_HEADERS.evidenceRequirements)).map((item) => {
        const [name, type, required, description] = item.split('|').map((part) => part.trim())
        return { name, type: type || undefined, required: required ? parseBoolean(required) : true, description: description || undefined }
      }),
    })
  })

  return Array.from(focusAreas.values()).map((focusArea, focusAreaIndex) => ({
    code: focusArea.code,
    name: focusArea.name,
    order: focusAreaIndex,
    subSections: Array.from(focusArea.subSections.values()).map((subSection, subSectionIndex) => ({
      code: subSection.code,
      name: subSection.name,
      order: subSectionIndex,
      deliverables: subSection.deliverables,
    })),
  }))
}

// ── Template CRUD ─────────────────────────────────────────────────────────────

export async function createTemplate(
  data: z.infer<typeof templateSchema>,
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    const auth = await requireAuth('member')
    const parsed = templateSchema.parse(data)
    const orgId = auth.orgId

    const template = await withTenant(orgId, async (tx) => {
      return tx.template.create({
        data: { organizationId: orgId, ...parsed, version: parsed.version || '1.0' },
        select: { id: true, name: true },
      })
    })

    await auditLog(orgId, auth.userName, template.id, 'template.created', `Created template "${template.name}"`)
    revalidatePath('/templates')
    return { ok: true, data: template }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function importTemplateFromExcel(
  formData: FormData,
): Promise<ActionResult<{ id: string; name: string; focusAreas: number; deliverables: number }>> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId
    const file = formData.get('file')

    if (!(file instanceof File)) throw new Error('Choose an Excel file to upload.')
    if (file.size === 0) throw new Error('The selected file is empty.')
    if (file.size > 5 * 1024 * 1024) throw new Error('Template imports must be 5 MB or smaller.')

    const workbook = new ExcelJS.Workbook()
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    await workbook.xlsx.load(fileBuffer as unknown as Parameters<typeof workbook.xlsx.load>[0])
    const meta = parseMeta(workbook)
    const focusAreas = parseTemplateRows(workbook)
    const deliverableCount = focusAreas.reduce(
      (total, fa) => total + fa.subSections.reduce((subTotal, ss) => subTotal + ss.deliverables.length, 0),
      0,
    )

    const template = await withTenant(orgId, async (tx) => {
      return tx.template.create({
        data: {
          organizationId: orgId,
          ...meta,
          focusAreas: {
            create: focusAreas.map((fa) => ({
              code: fa.code,
              name: fa.name,
              order: fa.order,
              subSections: {
                create: fa.subSections.map((ss) => ({
                  code: ss.code,
                  name: ss.name,
                  order: ss.order,
                  deliverables: {
                    create: ss.deliverables.map((deliverable, deliverableIndex) => ({
                      code: deliverable.code,
                      name: deliverable.name,
                      description: deliverable.description,
                      phase: deliverable.phase,
                      domain: deliverable.domain,
                      estimatedDuration: deliverable.estimatedDuration,
                      order: deliverableIndex,
                      acceptanceCriteria: deliverable.acceptanceCriteria.length
                        ? { create: deliverable.acceptanceCriteria }
                        : undefined,
                      evidenceRequirements: deliverable.evidenceRequirements.length
                        ? { create: deliverable.evidenceRequirements.filter((requirement) => requirement.name) }
                        : undefined,
                    })),
                  },
                })),
              },
            })),
          },
        },
        select: { id: true, name: true },
      })
    })

    await auditLog(
      orgId,
      auth.userName,
      template.id,
      'template.imported',
      `Imported template "${template.name}" from Excel`,
    )
    revalidatePath('/templates')
    return { ok: true, data: { ...template, focusAreas: focusAreas.length, deliverables: deliverableCount } }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function updateTemplate(
  id: string,
  data: z.infer<typeof templateSchema>,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const parsed = templateSchema.parse(data)
    const orgId = auth.orgId

    const template = await withTenant(orgId, async (tx) => {
      return tx.template.update({
        where: { id, organizationId: orgId },
        data: parsed,
        select: { name: true },
      })
    })

    await auditLog(orgId, auth.userName, id, 'template.updated', `Updated template "${template.name}"`)
    revalidatePath('/templates')
    revalidatePath(`/templates/${id}`)
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteTemplate(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    const template = await withTenant(orgId, async (tx) => {
      const t = await tx.template.findUnique({
        where: { id, organizationId: orgId },
        select: { name: true },
      })
      if (!t) throw new Error('Template not found')
      await tx.template.delete({ where: { id, organizationId: orgId } })
      return t
    })

    await auditLog(orgId, auth.userName, null, 'template.deleted', `Deleted template "${template.name}"`)
    revalidatePath('/templates')
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function cloneTemplate(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    const src = await withTenant(orgId, async (tx) => {
      return tx.template.findUnique({
        where: { id, organizationId: orgId },
        include: {
          focusAreas: {
            include: {
              subSections: {
                include: {
                  deliverables: {
                    orderBy: [{ order: 'asc' }, { code: 'asc' }],
                    include: { acceptanceCriteria: true, evidenceRequirements: true },
                  },
                },
              },
            },
          },
        },
      })
    })

    if (!src) throw new Error('Template not found')

    const clone = await withTenant(orgId, async (tx) => {
      return tx.template.create({
        data: {
          organizationId: orgId,
          name: `${src.name} (Copy)`,
          description: src.description,
          industry: src.industry,
          version: src.version,
          focusAreas: {
            create: src.focusAreas.map((fa) => ({
              code: fa.code,
              name: fa.name,
              order: fa.order,
              subSections: {
                create: fa.subSections.map((ss) => ({
                  code: ss.code,
                  name: ss.name,
                  order: ss.order,
                  deliverables: {
                    create: ss.deliverables.map((d, deliverableIndex) => ({
                      code: d.code,
                      name: d.name,
                      description: d.description,
                      phase: d.phase,
                      domain: d.domain,
                      estimatedDuration: d.estimatedDuration,
                      order: d.order ?? deliverableIndex,
                      acceptanceCriteria: {
                        create: d.acceptanceCriteria.map((ac) => ({
                          description: ac.description,
                          verificationMethod: ac.verificationMethod,
                        })),
                      },
                      evidenceRequirements: {
                        create: d.evidenceRequirements.map((er) => ({
                          name: er.name,
                          type: er.type,
                          description: er.description,
                          required: er.required,
                        })),
                      },
                    })),
                  },
                })),
              },
            })),
          },
        },
        select: { id: true, name: true },
      })
    })

    await auditLog(
      orgId,
      auth.userName,
      clone.id,
      'template.cloned',
      `Cloned template "${src.name}" → "${clone.name}"`,
    )
    revalidatePath('/templates')
    return { ok: true, data: { id: clone.id } }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ── Focus Area actions ────────────────────────────────────────────────────────

export async function addFocusArea(
  templateId: string,
  data: { code: string; name: string },
): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    await withTenant(orgId, async (tx) => {
      await tx.template.findUniqueOrThrow({ where: { id: templateId, organizationId: orgId } })
      const count = await tx.focusArea.count({ where: { templateId } })
      await tx.focusArea.create({ data: { templateId, ...data, order: count } })
    })

    revalidatePath(`/templates/${templateId}/edit`)
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function updateFocusArea(
  id: string,
  data: { code: string; name: string },
): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    const fa = await withTenant(orgId, async (tx) => {
      return tx.focusArea.update({ where: { id }, data })
    })

    revalidatePath(`/templates/${fa.templateId}/edit`)
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteFocusArea(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    const fa = await withTenant(orgId, async (tx) => {
      return tx.focusArea.delete({ where: { id } })
    })

    revalidatePath(`/templates/${fa.templateId}/edit`)
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ── SubSection actions ────────────────────────────────────────────────────────

export async function addSubSection(
  focusAreaId: string,
  data: { code: string; name: string },
): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    await withTenant(orgId, async (tx) => {
      const fa = await tx.focusArea.findUniqueOrThrow({ where: { id: focusAreaId } })
      const count = await tx.subSection.count({ where: { focusAreaId } })
      await tx.subSection.create({ data: { focusAreaId, ...data, order: count } })
      revalidatePath(`/templates/${fa.templateId}/edit`)
    })

    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function updateSubSection(
  id: string,
  data: { code: string; name: string },
): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    await withTenant(orgId, async (tx) => {
      await tx.subSection.update({ where: { id }, data })
    })

    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteSubSection(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    await withTenant(orgId, async (tx) => {
      const ss = await tx.subSection.findUniqueOrThrow({
        where: { id },
        include: { focusArea: { select: { templateId: true } } },
      })
      await tx.subSection.delete({ where: { id } })
      revalidatePath(`/templates/${ss.focusArea.templateId}/edit`)
    })

    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ── Deliverable Template actions ──────────────────────────────────────────────

export async function addDeliverableTemplate(
  subSectionId: string,
  data: { code: string; name: string; description?: string },
): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    await withTenant(orgId, async (tx) => {
      const count = await tx.deliverableTemplate.count({ where: { subSectionId } })
      await tx.deliverableTemplate.create({ data: { subSectionId, ...data, order: count } })
    })

    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function updateDeliverableTemplate(
  id: string,
  data: Partial<{
    code: string
    name: string
    description: string
    phase: string | null
    domain: string
    estimatedDuration: number
  }>,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    await withTenant(orgId, async (tx) => {
      await tx.deliverableTemplate.update({ where: { id }, data })
    })

    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function reorderDeliverableTemplates(
  subSectionId: string,
  deliverableIds: string[],
): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    await withTenant(orgId, async (tx) => {
      const subSection = await tx.subSection.findUnique({
        where: { id: subSectionId },
        include: {
          focusArea: { include: { template: { select: { id: true, organizationId: true } } } },
          deliverables: { select: { id: true } },
        },
      })

      if (!subSection || subSection.focusArea.template.organizationId !== orgId) {
        throw new Error('Sub-section not found')
      }

      const existingIds = new Set(subSection.deliverables.map((deliverable) => deliverable.id))
      const uniqueIds = Array.from(new Set(deliverableIds))
      if (uniqueIds.length !== existingIds.size || uniqueIds.some((id) => !existingIds.has(id))) {
        throw new Error('Deliverable order does not match this sub-section.')
      }

      for (let index = 0; index < uniqueIds.length; index += 1) {
        await tx.deliverableTemplate.update({
          where: { id: uniqueIds[index] },
          data: { order: index },
        })
      }

      revalidatePath(`/templates/${subSection.focusArea.template.id}/edit`)
    })

    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteDeliverableTemplate(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    await withTenant(orgId, async (tx) => {
      await tx.deliverableTemplate.delete({ where: { id } })
    })

    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ── Acceptance Criteria actions ───────────────────────────────────────────────

export async function addAcceptanceCriteria(
  deliverableTemplateId: string,
  data: { description: string; verificationMethod?: string },
): Promise<ActionResult<{ id: string }>> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    const ac = await withTenant(orgId, async (tx) => {
      return tx.acceptanceCriteria.create({
        data: { deliverableTemplateId, ...data },
        select: { id: true },
      })
    })

    return { ok: true, data: ac }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function updateAcceptanceCriteria(
  id: string,
  data: { description?: string; verificationMethod?: string },
): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    await withTenant(orgId, async (tx) => {
      await tx.acceptanceCriteria.update({ where: { id }, data })
    })

    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteAcceptanceCriteria(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    await withTenant(orgId, async (tx) => {
      await tx.acceptanceCriteria.delete({ where: { id } })
    })

    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ── Evidence Requirement actions ──────────────────────────────────────────────

export async function addEvidenceRequirement(
  deliverableTemplateId: string,
  data: { name: string; type?: string; description?: string; required?: boolean },
): Promise<ActionResult<{ id: string }>> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    const er = await withTenant(orgId, async (tx) => {
      return tx.evidenceRequirement.create({
        data: { deliverableTemplateId, required: true, ...data },
        select: { id: true },
      })
    })

    return { ok: true, data: er }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function updateEvidenceRequirement(
  id: string,
  data: { name?: string; type?: string; description?: string; required?: boolean },
): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    await withTenant(orgId, async (tx) => {
      await tx.evidenceRequirement.update({ where: { id }, data })
    })

    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteEvidenceRequirement(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    await withTenant(orgId, async (tx) => {
      await tx.evidenceRequirement.delete({ where: { id } })
    })

    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
