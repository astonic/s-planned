'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { withTenant } from '@/lib/tenant-context'
import type { DecisionStatus } from '@prisma/client'

type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string }

// ── Deliverable Notes ─────────────────────────────────────────────────────────

export async function addDeliverableNote(
  deliverableId: string,
  text: string
): Promise<ActionResult<{ id: string; text: string; authorName: string; createdAt: Date }>> {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) return { ok: false, error: 'Unauthorized' }
  const orgId = session.currentOrganizationId
  const actorName = session.user?.name ?? session.user?.email ?? 'Unknown'

  const deliverable = await prisma.deliverableExecution.findFirst({
    where: { id: deliverableId, organizationId: orgId },
  })
  if (!deliverable) return { ok: false, error: 'Deliverable not found' }
  if (!text.trim()) return { ok: false, error: 'Note text is required' }

  const note = await withTenant(orgId, () =>
    prisma.deliverableNote.create({
      data: {
        organizationId: orgId,
        deliverableExecutionId: deliverableId,
        text: text.trim(),
        authorName: actorName,
      },
    })
  )

  await withTenant(orgId, () =>
    prisma.auditEvent.create({
      data: {
        organizationId: orgId,
        deliverableExecutionId: deliverableId,
        actorName,
        eventType: 'note.added',
        description: 'Note added',
        metadata: { noteId: note.id },
      },
    })
  )

  return { ok: true, data: { id: note.id, text: note.text, authorName: note.authorName, createdAt: note.createdAt } }
}

export async function deleteDeliverableNote(noteId: string): Promise<ActionResult> {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) return { ok: false, error: 'Unauthorized' }
  const orgId = session.currentOrganizationId
  const actorName = session.user?.name ?? session.user?.email ?? 'Unknown'

  const note = await prisma.deliverableNote.findFirst({
    where: { id: noteId, organizationId: orgId },
  })
  if (!note) return { ok: false, error: 'Note not found' }

  await withTenant(orgId, () => prisma.deliverableNote.delete({ where: { id: noteId } }))

  await withTenant(orgId, () =>
    prisma.auditEvent.create({
      data: {
        organizationId: orgId,
        deliverableExecutionId: note.deliverableExecutionId,
        actorName,
        eventType: 'note.deleted',
        description: 'Note deleted',
        metadata: { noteId },
      },
    })
  )

  return { ok: true, data: undefined }
}

// ── Decisions ─────────────────────────────────────────────────────────────────

export async function createDecision(
  projectId: string,
  input: {
    description: string
    impact?: string
    loggedDate?: Date
    status?: DecisionStatus
    comments?: string
  }
): Promise<ActionResult<{ id: string }>> {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) return { ok: false, error: 'Unauthorized' }
  const orgId = session.currentOrganizationId
  const actorName = session.user?.name ?? session.user?.email ?? 'Unknown'

  const project = await prisma.project.findFirst({ where: { id: projectId, organizationId: orgId } })
  if (!project) return { ok: false, error: 'Project not found' }
  if (!input.description.trim()) return { ok: false, error: 'Description is required' }

  const decision = await withTenant(orgId, () =>
    prisma.decision.create({
      data: {
        organizationId: orgId,
        projectId,
        description: input.description.trim(),
        impact: input.impact?.trim() || null,
        loggedDate: input.loggedDate ?? new Date(),
        status: input.status ?? 'pending',
        comments: input.comments?.trim() || null,
        loggedBy: actorName,
      },
    })
  )

  await withTenant(orgId, () =>
    prisma.auditEvent.create({
      data: {
        organizationId: orgId,
        projectId,
        actorName,
        eventType: 'decision.created',
        description: `Decision logged: ${input.description.slice(0, 80)}`,
        metadata: { decisionId: decision.id },
      },
    })
  )

  return { ok: true, data: { id: decision.id } }
}

export async function updateDecision(
  decisionId: string,
  input: {
    description?: string
    impact?: string | null
    loggedDate?: Date
    status?: DecisionStatus
    comments?: string | null
  }
): Promise<ActionResult> {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) return { ok: false, error: 'Unauthorized' }
  const orgId = session.currentOrganizationId
  const actorName = session.user?.name ?? session.user?.email ?? 'Unknown'

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, organizationId: orgId } })
  if (!decision) return { ok: false, error: 'Decision not found' }

  await withTenant(orgId, () =>
    prisma.decision.update({
      where: { id: decisionId },
      data: {
        description: input.description?.trim() ?? decision.description,
        impact: 'impact' in input ? (input.impact?.trim() || null) : decision.impact,
        loggedDate: input.loggedDate ?? decision.loggedDate,
        status: input.status ?? decision.status,
        comments: 'comments' in input ? (input.comments?.trim() || null) : decision.comments,
      },
    })
  )

  await withTenant(orgId, () =>
    prisma.auditEvent.create({
      data: {
        organizationId: orgId,
        projectId: decision.projectId,
        actorName,
        eventType: 'decision.updated',
        description: `Decision updated`,
        metadata: { decisionId },
      },
    })
  )

  return { ok: true, data: undefined }
}

export async function deleteDecision(decisionId: string): Promise<ActionResult> {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) return { ok: false, error: 'Unauthorized' }
  const orgId = session.currentOrganizationId
  const actorName = session.user?.name ?? session.user?.email ?? 'Unknown'

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, organizationId: orgId } })
  if (!decision) return { ok: false, error: 'Decision not found' }

  await withTenant(orgId, () => prisma.decision.delete({ where: { id: decisionId } }))

  await withTenant(orgId, () =>
    prisma.auditEvent.create({
      data: {
        organizationId: orgId,
        projectId: decision.projectId,
        actorName,
        eventType: 'decision.deleted',
        description: `Decision deleted`,
        metadata: { decisionId },
      },
    })
  )

  return { ok: true, data: undefined }
}
