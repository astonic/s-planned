'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { withTenant } from '@/lib/tenant-context'
import { requireAuth } from '@/lib/security'
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
  try {
    const auth = await requireAuth('member')
    const parsed = createProjectSchema.parse(data)
    const orgId = auth.orgId

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

    revalidatePath('/projects')
    return { ok: true, data: project }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function updateProject(
  id: string,
  data: z.infer<typeof updateProjectSchema>,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const parsed = updateProjectSchema.parse(data)
    const orgId = auth.orgId

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

    revalidatePath('/projects')
    revalidatePath(`/projects/${id}`)
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteProject(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth('admin')
    const orgId = auth.orgId

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

    revalidatePath('/projects')
    return { ok: true, data: undefined }
  } catch (e) {
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
  field: 'notes' | 'startDate' | 'targetDate' | 'description',
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
