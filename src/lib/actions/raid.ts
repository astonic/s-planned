'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { withTenant } from '@/lib/tenant-context'
import { requireAuth } from '@/lib/security'
import type { RAIDType, RAIDSeverity, RAIDLikelihood, RAIDStatus } from '@prisma/client'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

// ── Validation schemas ────────────────────────────────────────────────────────

const raidTypeEnum = z.enum(['risk', 'assumption', 'issue', 'dependency'])
const raidSeverityEnum = z.enum(['low', 'medium', 'high', 'critical'])
const raidLikelihoodEnum = z.enum(['rare', 'unlikely', 'possible', 'likely', 'almost_certain'])
const raidStatusEnum = z.enum(['open', 'in_progress', 'closed'])

const createRAIDItemSchema = z.object({
  projectId: z.string().min(1),
  type: raidTypeEnum,
  title: z.string().min(3),
  description: z.string().optional(),
  severity: raidSeverityEnum,
  likelihood: raidLikelihoodEnum.optional(),
  owner: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  mitigationPlan: z.string().optional(),
})

const updateRAIDItemSchema = z.object({
  type: raidTypeEnum.optional(),
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  severity: raidSeverityEnum.optional(),
  likelihood: raidLikelihoodEnum.optional(),
  status: raidStatusEnum.optional(),
  owner: z.string().optional(),
  dueDate: z.coerce.date().optional().nullable(),
  mitigationPlan: z.string().optional(),
})

// ── RAID Item CRUD ────────────────────────────────────────────────────────────

export async function createRAIDItem(
  data: z.infer<typeof createRAIDItemSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const auth = await requireAuth('member')
    const parsed = createRAIDItemSchema.parse(data)
    const orgId = auth.orgId

    const item = await withTenant(orgId, async (tx) => {
      // Verify project belongs to org
      const project = await tx.project.findUnique({
        where: { id: parsed.projectId, organizationId: orgId },
        select: { id: true, name: true },
      })
      if (!project) throw new Error('Project not found')

      const raidItem = await tx.rAIDItem.create({
        data: {
          organizationId: orgId,
          projectId: parsed.projectId,
          type: parsed.type as RAIDType,
          title: parsed.title,
          description: parsed.description ?? null,
          severity: parsed.severity as RAIDSeverity,
          likelihood: (parsed.likelihood as RAIDLikelihood | undefined) ?? null,
          status: 'open',
          owner: parsed.owner ?? null,
          dueDate: parsed.dueDate ?? null,
          mitigationPlan: parsed.mitigationPlan ?? null,
        },
        select: { id: true },
      })

      await tx.auditEvent.create({
        data: {
          organizationId: orgId,
          projectId: parsed.projectId,
          actorName: auth.userName,
          eventType: 'raid.created',
          description: `Created RAID item "${parsed.title}" (${parsed.type})`,
          metadata: { raidItemId: raidItem.id, type: parsed.type, severity: parsed.severity },
        },
      })

      return raidItem
    })

    revalidatePath(`/projects/${parsed.projectId}/raid`)
    return { ok: true, data: item }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function updateRAIDItem(
  id: string,
  data: z.infer<typeof updateRAIDItemSchema>
): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const parsed = updateRAIDItemSchema.parse(data)
    const orgId = auth.orgId

    await withTenant(orgId, async (tx) => {
      const existing = await tx.rAIDItem.findUnique({
        where: { id, organizationId: orgId },
        select: { title: true, projectId: true },
      })
      if (!existing) throw new Error('RAID item not found')

      const closedAt =
        (parsed.status as string | undefined) === 'closed' ? new Date() :
        parsed.status ? null :
        undefined

      await tx.rAIDItem.update({
        where: { id },
        data: {
          ...parsed,
          type: parsed.type as RAIDType | undefined,
          severity: parsed.severity as RAIDSeverity | undefined,
          likelihood: parsed.likelihood as RAIDLikelihood | undefined | null,
          status: parsed.status as RAIDStatus | undefined,
          ...(closedAt !== undefined ? { closedAt } : {}),
        },
      })

      await tx.auditEvent.create({
        data: {
          organizationId: orgId,
          projectId: existing.projectId,
          actorName: auth.userName,
          eventType: 'raid.updated',
          description: `Updated RAID item "${existing.title}"`,
          metadata: { raidItemId: id, changes: parsed },
        },
      })

      revalidatePath(`/projects/${existing.projectId}/raid`)
    })

    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteRAIDItem(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    await withTenant(orgId, async (tx) => {
      const existing = await tx.rAIDItem.findUnique({
        where: { id, organizationId: orgId },
        select: { title: true, projectId: true },
      })
      if (!existing) throw new Error('RAID item not found')

      await tx.auditEvent.create({
        data: {
          organizationId: orgId,
          projectId: existing.projectId,
          actorName: auth.userName,
          eventType: 'raid.deleted',
          description: `Deleted RAID item "${existing.title}"`,
          metadata: { raidItemId: id },
        },
      })

      await tx.rAIDItem.delete({ where: { id, organizationId: orgId } })

      revalidatePath(`/projects/${existing.projectId}/raid`)
    })

    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ── Deliverable linking ───────────────────────────────────────────────────────

export async function linkRAIDToDeliverable(
  raidItemId: string,
  deliverableExecutionId: string
): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    await withTenant(orgId, async (tx) => {
      // Verify the RAID item belongs to this org
      const raidItem = await tx.rAIDItem.findUnique({
        where: { id: raidItemId, organizationId: orgId },
        select: { projectId: true, title: true },
      })
      if (!raidItem) throw new Error('RAID item not found')

      await tx.rAIDItemDeliverable.upsert({
        where: {
          raidItemId_deliverableExecutionId: {
            raidItemId,
            deliverableExecutionId,
          },
        },
        create: { raidItemId, deliverableExecutionId },
        update: {},
      })

      await tx.auditEvent.create({
        data: {
          organizationId: orgId,
          projectId: raidItem.projectId,
          deliverableExecutionId,
          actorName: auth.userName,
          eventType: 'raid.linked',
          description: `Linked RAID item "${raidItem.title}" to deliverable`,
          metadata: { raidItemId, deliverableExecutionId },
        },
      })
    })

    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function unlinkRAIDFromDeliverable(
  raidItemId: string,
  deliverableExecutionId: string
): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    await withTenant(orgId, async (tx) => {
      const raidItem = await tx.rAIDItem.findUnique({
        where: { id: raidItemId, organizationId: orgId },
        select: { projectId: true, title: true },
      })
      if (!raidItem) throw new Error('RAID item not found')

      await tx.rAIDItemDeliverable.delete({
        where: {
          raidItemId_deliverableExecutionId: {
            raidItemId,
            deliverableExecutionId,
          },
        },
      })

      await tx.auditEvent.create({
        data: {
          organizationId: orgId,
          projectId: raidItem.projectId,
          deliverableExecutionId,
          actorName: auth.userName,
          eventType: 'raid.unlinked',
          description: `Unlinked RAID item "${raidItem.title}" from deliverable`,
          metadata: { raidItemId, deliverableExecutionId },
        },
      })
    })

    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
