'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { withTenant } from '@/lib/tenant-context'
import { requireAuth } from '@/lib/security'
import { assertProjectAccess } from '@/lib/project-access'
import { createLogger } from '@/lib/logger'
import type { DeliverableStatus, EvidenceType, ProjectPhase } from '@prisma/client'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

// ── Validation schemas ────────────────────────────────────────────────────────

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  templateId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  targetDate: z.coerce.date().optional(),
})

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'blocked', 'completed', 'archived']).optional(),
  startDate: z.coerce.date().optional().nullable(),
  targetDate: z.coerce.date().optional().nullable(),
})

const projectNotificationSettingsSchema = z.object({
  notifyEmail: z.boolean().default(true),
  notifyReminders: z.boolean().default(true),
  notifyRaid: z.boolean().default(true),
  notifyDigest: z.boolean().default(false),
})

const createDeliverableSchema = z.object({
  subSectionExecutionId: z.string().min(1),
  code: z.string().min(1).max(50),
  name: z.string().min(1),
  description: z.string().optional(),
  phase: z.enum(['pre_commissioning', 'commissioning', 'ramp_up', 'handover']).nullable().optional(),
  domain: z.string().optional(),
  ownerId: z.string().nullable().optional(),
  startDate: z.coerce.date().nullable().optional(),
  targetDate: z.coerce.date().nullable().optional(),
  checklistItems: z.array(z.object({
    description: z.string().min(1),
    verificationMethod: z.string().optional(),
  })).default([]),
  evidenceRequirements: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(['document', 'image', 'link', 'sign_off']).default('document'),
    required: z.boolean().default(true),
    description: z.string().optional(),
  })).default([]),
})

// ── Project CRUD ──────────────────────────────────────────────────────────────

export async function createProject(
  data: z.infer<typeof createProjectSchema>,
): Promise<ActionResult<{ id: string; name: string }>> {
  let logger = createLogger()
  try {
    const auth = await requireAuth('member')
    const parsed = createProjectSchema.parse(data)
    const orgId = auth.orgId
    logger = createLogger({ orgId, userId: auth.userId })

    const project = await withTenant(orgId, async (tx) => {
      // Create the project first
      const proj = await tx.project.create({
        data: {
          organizationId: orgId,
          name: parsed.name,
          description: parsed.description,
          templateId: parsed.templateId ?? null,
          startDate: parsed.startDate ?? null,
          targetDate: parsed.targetDate ?? null,
          status: 'active',
        },
        select: { id: true, name: true },
      })

      // If a template is provided, deep-copy its hierarchy
      if (parsed.templateId) {
        const template = await tx.template.findUnique({
          where: { id: parsed.templateId, organizationId: orgId },
          include: {
            focusAreas: {
              orderBy: { order: 'asc' },
              include: {
                subSections: {
                  orderBy: { order: 'asc' },
                  include: {
                    deliverables: true,
                  },
                },
              },
            },
          },
        })

        if (!template) throw new Error('Template not found')

        for (const fa of template.focusAreas) {
          const fae = await tx.focusAreaExecution.create({
            data: {
              projectId: proj.id,
              code: fa.code,
              name: fa.name,
              order: fa.order,
            },
          })

          for (const ss of fa.subSections) {
            const sse = await tx.subSectionExecution.create({
              data: {
                focusAreaExecutionId: fae.id,
                code: ss.code,
                name: ss.name,
                order: ss.order,
              },
            })

            for (const d of ss.deliverables) {
              await tx.deliverableExecution.create({
                data: {
                  organizationId: orgId,
                  subSectionExecutionId: sse.id,
                  templateDeliverableId: d.id,
                  name: d.name,
                  code: d.code,
                  description: d.description ?? null,
                  phase: d.phase ?? null,
                  domain: d.domain ?? null,
                  status: 'planned',
                },
              })
            }
          }
        }
      }

      // Audit event
      await tx.auditEvent.create({
        data: {
          organizationId: orgId,
          projectId: proj.id,
          actorName: auth.userName,
          eventType: 'project.created',
          description: `Created project "${proj.name}"`,
          metadata: parsed.templateId ? { templateId: parsed.templateId } : undefined,
        },
      })

      const membership = await tx.organizationMembership.findUnique({
        where: { organizationId_userId: { organizationId: orgId, userId: auth.userId } },
        select: { id: true, role: true },
      })
      if (membership && membership.role !== 'owner') {
        await tx.projectAssignment.create({
          data: {
            organizationId: orgId,
            membershipId: membership.id,
            projectId: proj.id,
          },
        })
      }

      return proj
    })

    logger.info('Project created', {
      projectId: project.id,
      projectName: project.name,
      templateUsed: !!parsed.templateId,
    })
    revalidatePath('/projects')
    return { ok: true, data: project }
  } catch (e) {
    logger.error('Failed to create project', { error: (e as Error).message })
    return { ok: false, error: (e as Error).message }
  }
}

export async function updateProject(
  id: string,
  data: z.infer<typeof updateProjectSchema>,
): Promise<ActionResult> {
  let logger = createLogger()
  try {
    const auth = await requireAuth('member')
    const parsed = updateProjectSchema.parse(data)
    const orgId = auth.orgId
    logger = createLogger({ orgId, userId: auth.userId })

    await withTenant(orgId, async (tx) => {
      await assertProjectAccess({ orgId, userId: auth.userId, role: auth.role, projectId: id }, tx)
      const project = await tx.project.update({
        where: { id, organizationId: orgId },
        data: parsed,
        select: { name: true },
      })

      await tx.auditEvent.create({
        data: {
          organizationId: orgId,
          projectId: id,
          actorName: auth.userName,
          eventType: 'project.updated',
          description: `Updated project "${project.name}"`,
        },
      })
    })

    logger.info('Project updated', { projectId: id })
    revalidatePath('/projects')
    revalidatePath(`/projects/${id}`)
    return { ok: true, data: undefined }
  } catch (e) {
    logger.error('Failed to update project', { projectId: id, error: (e as Error).message })
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteProject(id: string): Promise<ActionResult> {
  let logger = createLogger()
  try {
    const auth = await requireAuth('admin')
    const orgId = auth.orgId
    logger = createLogger({ orgId, userId: auth.userId })

    await withTenant(orgId, async (tx) => {
      await assertProjectAccess({ orgId, userId: auth.userId, role: auth.role, projectId: id }, tx)
      const project = await tx.project.findUnique({
        where: { id, organizationId: orgId },
        select: { name: true },
      })
      if (!project) throw new Error('Project not found')

      await tx.auditEvent.create({
        data: {
          organizationId: orgId,
          projectId: id,
          actorName: auth.userName,
          eventType: 'project.deleted',
          description: `Deleted project "${project.name}"`,
        },
      })

      await tx.project.delete({ where: { id, organizationId: orgId } })
    })

    logger.info('Project deleted', { projectId: id })
    revalidatePath('/projects')
    return { ok: true, data: undefined }
  } catch (e) {
    logger.error('Failed to delete project', { projectId: id, error: (e as Error).message })
    return { ok: false, error: (e as Error).message }
  }
}

// ── Project notification settings ────────────────────────────────────────────

export async function saveProjectNotificationSettings(
  projectId: string,
  data: z.infer<typeof projectNotificationSettingsSchema>,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const parsed = projectNotificationSettingsSchema.parse(data)
    const orgId = auth.orgId

    await withTenant(orgId, async (tx) => {
      const project = await tx.project.findUnique({
        where: { id: projectId, organizationId: orgId },
        select: { id: true, name: true },
      })
      if (!project) throw new Error('Project not found')

      await assertProjectAccess({ orgId, userId: auth.userId, role: auth.role, projectId }, tx)

      await tx.projectNotificationSettings.upsert({
        where: { projectId },
        create: { projectId, organizationId: orgId, ...parsed },
        update: parsed,
      })

      await tx.auditEvent.create({
        data: {
          organizationId: orgId,
          projectId,
          actorName: auth.userName,
          eventType: 'project.notifications.updated',
          description: `Updated notification preferences for "${project.name}"`,
          metadata: parsed,
        },
      })
    })

    revalidatePath(`/projects/${projectId}`)
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ── Deliverable actions ───────────────────────────────────────────────────────

export async function createProjectDeliverable(
  projectId: string,
  data: z.infer<typeof createDeliverableSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId
    const parsed = createDeliverableSchema.parse(data)

    const deliverable = await withTenant(orgId, async (tx) => {
      const subSection = await tx.subSectionExecution.findFirst({
        where: {
          id: parsed.subSectionExecutionId,
          focusAreaExecution: { projectId },
        },
        select: {
          id: true,
          name: true,
          focusAreaExecution: { select: { projectId: true, project: { select: { name: true, organizationId: true } } } },
        },
      })
      if (!subSection || subSection.focusAreaExecution.project.organizationId !== orgId) {
        throw new Error('Sub-section not found')
      }

      await assertProjectAccess({ orgId, userId: auth.userId, role: auth.role, projectId }, tx)

      if (parsed.ownerId) {
        const owner = await tx.person.findFirst({
          where: { id: parsed.ownerId, organizationId: orgId },
          select: { id: true },
        })
        if (!owner) throw new Error('Owner not found')
      }

      const existingCode = await tx.deliverableExecution.findFirst({
        where: {
          organizationId: orgId,
          subSectionExecutionId: parsed.subSectionExecutionId,
          code: parsed.code.trim(),
        },
        select: { id: true },
      })
      if (existingCode) throw new Error('A deliverable with this code already exists in the selected section.')

      const created = await tx.deliverableExecution.create({
        data: {
          organizationId: orgId,
          subSectionExecutionId: parsed.subSectionExecutionId,
          code: parsed.code.trim(),
          name: parsed.name.trim(),
          description: parsed.description?.trim() || null,
          phase: (parsed.phase ?? null) as ProjectPhase | null,
          domain: parsed.domain?.trim() || null,
          ownerId: parsed.ownerId || null,
          startDate: parsed.startDate ?? null,
          targetDate: parsed.targetDate ?? null,
          acceptanceCriteria: parsed.checklistItems.length
            ? {
                create: parsed.checklistItems.map((item) => ({
                  description: item.description.trim(),
                  verificationMethod: item.verificationMethod?.trim() || null,
                })),
              }
            : undefined,
          evidenceRequirements: parsed.evidenceRequirements.length
            ? {
                create: parsed.evidenceRequirements.map((item) => ({
                  name: item.name.trim(),
                  type: item.type as EvidenceType,
                  required: item.required,
                  description: item.description?.trim() || null,
                })),
              }
            : undefined,
        },
        select: { id: true, name: true, code: true },
      })

      await tx.auditEvent.create({
        data: {
          organizationId: orgId,
          projectId,
          deliverableExecutionId: created.id,
          actorName: auth.userName,
          eventType: 'deliverable.created',
          description: `Created deliverable "${created.name}"`,
          metadata: {
            code: created.code,
            subSection: subSection.name,
            checklistItems: parsed.checklistItems.length,
            evidenceRequirements: parsed.evidenceRequirements.length,
          },
        },
      })

      return created
    })

    revalidatePath(`/projects/${projectId}`)
    revalidatePath(`/projects/${projectId}/workspace`)
    return { ok: true, data: { id: deliverable.id } }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function updateDeliverableStatus(
  id: string,
  status: DeliverableStatus,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    await withTenant(orgId, async (tx) => {
      const existing = await tx.deliverableExecution.findUniqueOrThrow({
        where: { id, organizationId: orgId },
        select: { status: true, subSectionExecution: { select: { focusAreaExecution: { select: { projectId: true } } } } },
      })

      const fromStatus = existing.status
      const projectId = existing.subSectionExecution.focusAreaExecution.projectId
      await assertProjectAccess({ orgId, userId: auth.userId, role: auth.role, projectId }, tx)

      await tx.deliverableExecution.update({
        where: { id },
        data: {
          status,
          closedAt: status === 'closed' ? new Date() : null,
        },
      })

      await tx.auditEvent.create({
        data: {
          organizationId: orgId,
          projectId,
          deliverableExecutionId: id,
          actorName: auth.userName,
          eventType: 'deliverable.status_changed',
          description: `Changed deliverable status from "${fromStatus}" to "${status}"`,
          metadata: { from: fromStatus, to: status },
        },
      })

      revalidatePath(`/projects/${projectId}`)
    })

    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function updateDeliverableField(
  id: string,
  field: 'name' | 'notes' | 'startDate' | 'targetDate' | 'description',
  value: string | null,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    await withTenant(orgId, async (tx) => {
      const existing = await tx.deliverableExecution.findUniqueOrThrow({
        where: { id, organizationId: orgId },
        select: { name: true, subSectionExecution: { select: { focusAreaExecution: { select: { projectId: true } } } } },
      })

      const projectId = existing.subSectionExecution.focusAreaExecution.projectId
      await assertProjectAccess({ orgId, userId: auth.userId, role: auth.role, projectId }, tx)

      // Build update data with proper typing
      let updateData: Record<string, unknown>
      if (field === 'startDate' || field === 'targetDate') {
        updateData = { [field]: value ? new Date(value) : null }
      } else {
        updateData = { [field]: value }
      }

      await tx.deliverableExecution.update({
        where: { id },
        data: updateData,
      })

      await tx.auditEvent.create({
        data: {
          organizationId: orgId,
          projectId,
          deliverableExecutionId: id,
          actorName: auth.userName,
          eventType: 'deliverable.updated',
          description: `Updated "${field}" on deliverable "${existing.name}"`,
          metadata: { field, value },
        },
      })

      revalidatePath(`/projects/${projectId}`)
    })

    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ── Search ────────────────────────────────────────────────────────────────────

export interface SearchDeliverableResult {
  id: string
  name: string
  code: string
  description: string | null
  status: string
  phase: string | null
}

export async function searchDeliverables(
  projectId: string,
  query: string,
): Promise<ActionResult<SearchDeliverableResult[]>> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId
    const logger = createLogger({ orgId, userId: auth.userId })

    const results = await withTenant(orgId, async (tx) => {
      // Verify project exists and user has access
      const project = await tx.project.findUnique({
        where: { id: projectId, organizationId: orgId },
        select: { id: true },
      })
      if (!project) throw new Error('Project not found')
      await assertProjectAccess({ orgId, userId: auth.userId, role: auth.role, projectId }, tx)

      // Case-insensitive search on name, code, description using ilike
      const deliverables = await tx.deliverableExecution.findMany({
        where: {
          organizationId: orgId,
          subSectionExecution: {
            focusAreaExecution: { projectId },
          },
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { code: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          status: true,
          phase: true,
        },
        orderBy: { name: 'asc' },
        take: 50, // Limit results
      })

      return deliverables.map((d) => ({
        id: d.id,
        name: d.name,
        code: d.code,
        description: d.description,
        status: d.status,
        phase: d.phase,
      }))
    })

    logger.info('Searched deliverables', { projectId, query, count: results.length })
    return { ok: true, data: results }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export interface SearchRAIDResult {
  id: string
  type: string
  title: string
  description: string | null
  status: string
  severity: string
}

export async function searchRAIDItems(
  projectId: string,
  query: string,
): Promise<ActionResult<SearchRAIDResult[]>> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId
    const logger = createLogger({ orgId, userId: auth.userId })

    const results = await withTenant(orgId, async (tx) => {
      // Verify project exists
      const project = await tx.project.findUnique({
        where: { id: projectId, organizationId: orgId },
        select: { id: true },
      })
      if (!project) throw new Error('Project not found')
      await assertProjectAccess({ orgId, userId: auth.userId, role: auth.role, projectId }, tx)

      // Search by title and description
      const raidItems = await tx.rAIDItem.findMany({
        where: {
          organizationId: orgId,
          projectId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          status: true,
          severity: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })

      return raidItems.map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        description: r.description,
        status: r.status,
        severity: r.severity,
      }))
    })

    logger.info('Searched RAID items', { projectId, query, count: results.length })
    return { ok: true, data: results }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
