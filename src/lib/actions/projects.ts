'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { withTenant } from '@/lib/tenant-context'
import { requireAuth } from '@/lib/security'
import { createLogger } from '@/lib/logger'
import type { DeliverableStatus } from '@prisma/client'

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

// ── Deliverable actions ───────────────────────────────────────────────────────

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
