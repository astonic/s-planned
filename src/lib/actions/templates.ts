'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { withTenant } from '@/lib/tenant-context'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

async function requireSession() {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) redirect('/login')
  return session
}

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

// ── Template CRUD ─────────────────────────────────────────────────────────────

export async function createTemplate(
  data: z.infer<typeof templateSchema>,
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    const session = await requireSession()
    const parsed = templateSchema.parse(data)
    const orgId = session.currentOrganizationId

    const template = await withTenant(orgId, async (tx) => {
      return tx.template.create({
        data: { organizationId: orgId, ...parsed, version: parsed.version || '1.0' },
        select: { id: true, name: true },
      })
    })

    await auditLog(orgId, session.user.name, template.id, 'template.created', `Created template "${template.name}"`)
    revalidatePath('/templates')
    return { ok: true, data: template }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function updateTemplate(
  id: string,
  data: z.infer<typeof templateSchema>,
): Promise<ActionResult> {
  try {
    const session = await requireSession()
    const parsed = templateSchema.parse(data)
    const orgId = session.currentOrganizationId

    const template = await withTenant(orgId, async (tx) => {
      return tx.template.update({
        where: { id, organizationId: orgId },
        data: parsed,
        select: { name: true },
      })
    })

    await auditLog(orgId, session.user.name, id, 'template.updated', `Updated template "${template.name}"`)
    revalidatePath('/templates')
    revalidatePath(`/templates/${id}`)
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteTemplate(id: string): Promise<ActionResult> {
  try {
    const session = await requireSession()
    const orgId = session.currentOrganizationId

    const template = await withTenant(orgId, async (tx) => {
      const t = await tx.template.findUnique({
        where: { id, organizationId: orgId },
        select: { name: true },
      })
      if (!t) throw new Error('Template not found')
      await tx.template.delete({ where: { id, organizationId: orgId } })
      return t
    })

    await auditLog(orgId, session.user.name, null, 'template.deleted', `Deleted template "${template.name}"`)
    revalidatePath('/templates')
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function cloneTemplate(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession()
    const orgId = session.currentOrganizationId

    const src = await withTenant(orgId, async (tx) => {
      return tx.template.findUnique({
        where: { id, organizationId: orgId },
        include: {
          focusAreas: {
            include: {
              subSections: {
                include: {
                  deliverables: {
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
                    create: ss.deliverables.map((d) => ({
                      code: d.code,
                      name: d.name,
                      description: d.description,
                      phase: d.phase,
                      domain: d.domain,
                      estimatedDuration: d.estimatedDuration,
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
      session.user.name,
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
    const session = await requireSession()
    const orgId = session.currentOrganizationId

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
    const session = await requireSession()
    const orgId = session.currentOrganizationId

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
    const session = await requireSession()
    const orgId = session.currentOrganizationId

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
    const session = await requireSession()
    const orgId = session.currentOrganizationId

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
    const session = await requireSession()
    const orgId = session.currentOrganizationId

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
    const session = await requireSession()
    const orgId = session.currentOrganizationId

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
    const session = await requireSession()
    const orgId = session.currentOrganizationId

    await withTenant(orgId, async (tx) => {
      await tx.deliverableTemplate.create({ data: { subSectionId, ...data } })
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
    domain: string
    estimatedDuration: number
  }>,
): Promise<ActionResult> {
  try {
    const session = await requireSession()
    const orgId = session.currentOrganizationId

    await withTenant(orgId, async (tx) => {
      await tx.deliverableTemplate.update({ where: { id }, data })
    })

    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteDeliverableTemplate(id: string): Promise<ActionResult> {
  try {
    const session = await requireSession()
    const orgId = session.currentOrganizationId

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
    const session = await requireSession()
    const orgId = session.currentOrganizationId

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
    const session = await requireSession()
    const orgId = session.currentOrganizationId

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
    const session = await requireSession()
    const orgId = session.currentOrganizationId

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
    const session = await requireSession()
    const orgId = session.currentOrganizationId

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
    const session = await requireSession()
    const orgId = session.currentOrganizationId

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
    const session = await requireSession()
    const orgId = session.currentOrganizationId

    await withTenant(orgId, async (tx) => {
      await tx.evidenceRequirement.delete({ where: { id } })
    })

    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
