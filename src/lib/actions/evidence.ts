'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { withTenant } from '@/lib/tenant-context'
import type { EvidenceType } from '@prisma/client'

type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string }

// ── Add link-type evidence ────────────────────────────────────────────────────

export async function addEvidenceLink(
  deliverableId: string,
  input: {
    name: string
    url: string
    evidenceRequirementId?: string
  }
): Promise<ActionResult<{ id: string }>> {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) return { ok: false, error: 'Unauthorized' }
  const orgId = session.currentOrganizationId
  const actorName = session.user?.name ?? session.user?.email ?? 'Unknown'

  // Tenant ownership check
  const deliverable = await prisma.deliverableExecution.findFirst({
    where: { id: deliverableId, organizationId: orgId },
  })
  if (!deliverable) return { ok: false, error: 'Deliverable not found' }

  const evidence = await withTenant(orgId, () =>
    prisma.evidence.create({
      data: {
        organizationId: orgId,
        deliverableExecutionId: deliverableId,
        evidenceRequirementId: input.evidenceRequirementId ?? null,
        name: input.name.trim(),
        type: 'link' as EvidenceType,
        url: input.url.trim(),
        uploadedBy: actorName,
      },
    })
  )

  await withTenant(orgId, () =>
    prisma.auditEvent.create({
      data: {
        organizationId: orgId,
        deliverableExecutionId: deliverableId,
        actorName,
        eventType: 'evidence.added',
        description: `Evidence link added: ${input.name}`,
        metadata: { evidenceId: evidence.id, type: 'link' },
      },
    })
  )

  return { ok: true, data: { id: evidence.id } }
}

// ── Add file-type evidence (after upload API completes) ───────────────────────

export async function addEvidenceFile(
  deliverableId: string,
  input: {
    name: string
    url: string
    type: EvidenceType
    fileSize: number
    evidenceRequirementId?: string
  }
): Promise<ActionResult<{ id: string }>> {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) return { ok: false, error: 'Unauthorized' }
  const orgId = session.currentOrganizationId
  const actorName = session.user?.name ?? session.user?.email ?? 'Unknown'

  const deliverable = await prisma.deliverableExecution.findFirst({
    where: { id: deliverableId, organizationId: orgId },
  })
  if (!deliverable) return { ok: false, error: 'Deliverable not found' }

  const evidence = await withTenant(orgId, () =>
    prisma.evidence.create({
      data: {
        organizationId: orgId,
        deliverableExecutionId: deliverableId,
        evidenceRequirementId: input.evidenceRequirementId ?? null,
        name: input.name.trim(),
        type: input.type,
        url: input.url,
        fileSize: input.fileSize,
        uploadedBy: actorName,
      },
    })
  )

  await withTenant(orgId, () =>
    prisma.auditEvent.create({
      data: {
        organizationId: orgId,
        deliverableExecutionId: deliverableId,
        actorName,
        eventType: 'evidence.added',
        description: `Evidence file uploaded: ${input.name}`,
        metadata: { evidenceId: evidence.id, type: input.type },
      },
    })
  )

  return { ok: true, data: { id: evidence.id } }
}

// ── Delete evidence ───────────────────────────────────────────────────────────

export async function deleteEvidence(evidenceId: string): Promise<ActionResult> {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) return { ok: false, error: 'Unauthorized' }
  const orgId = session.currentOrganizationId
  const actorName = session.user?.name ?? session.user?.email ?? 'Unknown'

  const evidence = await prisma.evidence.findFirst({
    where: { id: evidenceId, organizationId: orgId },
  })
  if (!evidence) return { ok: false, error: 'Evidence not found' }

  // Delete file from storage if it's a local path
  if (evidence.url.startsWith('/api/files/')) {
    const { storageService } = await import('@/lib/storage')
    const storagePath = evidence.url.replace('/api/files/', '')
    await storageService.delete(storagePath).catch(() => {/* ignore */})
  }

  await withTenant(orgId, () =>
    prisma.evidence.delete({ where: { id: evidenceId } })
  )

  await withTenant(orgId, () =>
    prisma.auditEvent.create({
      data: {
        organizationId: orgId,
        deliverableExecutionId: evidence.deliverableExecutionId,
        actorName,
        eventType: 'evidence.deleted',
        description: `Evidence removed: ${evidence.name}`,
        metadata: { evidenceId },
      },
    })
  )

  return { ok: true, data: undefined }
}

// ── Set evidence verified ─────────────────────────────────────────────────────

export async function setEvidenceVerified(
  evidenceId: string,
  verified: boolean
): Promise<ActionResult> {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) return { ok: false, error: 'Unauthorized' }
  const orgId = session.currentOrganizationId
  const actorName = session.user?.name ?? session.user?.email ?? 'Unknown'

  const evidence = await prisma.evidence.findFirst({
    where: { id: evidenceId, organizationId: orgId },
  })
  if (!evidence) return { ok: false, error: 'Evidence not found' }

  await withTenant(orgId, () =>
    prisma.evidence.update({
      where: { id: evidenceId },
      data: {
        verified,
        verifiedAt: verified ? new Date() : null,
        verifiedBy: verified ? actorName : null,
      },
    })
  )

  await withTenant(orgId, () =>
    prisma.auditEvent.create({
      data: {
        organizationId: orgId,
        deliverableExecutionId: evidence.deliverableExecutionId,
        actorName,
        eventType: verified ? 'evidence.verified' : 'evidence.unverified',
        description: `Evidence ${verified ? 'verified' : 'unverified'}: ${evidence.name}`,
        metadata: { evidenceId },
      },
    })
  )

  return { ok: true, data: undefined }
}

// ── Toggle criteria completion ────────────────────────────────────────────────

export async function toggleCriteriaCompletion(
  deliverableId: string,
  criteriaId: string,
  completed: boolean
): Promise<ActionResult> {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) return { ok: false, error: 'Unauthorized' }
  const orgId = session.currentOrganizationId
  const actorName = session.user?.name ?? session.user?.email ?? 'Unknown'

  const deliverable = await prisma.deliverableExecution.findFirst({
    where: { id: deliverableId, organizationId: orgId },
  })
  if (!deliverable) return { ok: false, error: 'Deliverable not found' }

  await withTenant(orgId, () =>
    prisma.criteriaCompletion.upsert({
      where: {
        deliverableExecutionId_acceptanceCriteriaId: {
          deliverableExecutionId: deliverableId,
          acceptanceCriteriaId: criteriaId,
        },
      },
      create: {
        organizationId: orgId,
        deliverableExecutionId: deliverableId,
        acceptanceCriteriaId: criteriaId,
        completed,
        completedAt: completed ? new Date() : null,
        completedBy: completed ? actorName : null,
      },
      update: {
        completed,
        completedAt: completed ? new Date() : null,
        completedBy: completed ? actorName : null,
      },
    })
  )

  await withTenant(orgId, () =>
    prisma.auditEvent.create({
      data: {
        organizationId: orgId,
        deliverableExecutionId: deliverableId,
        actorName,
        eventType: completed ? 'criteria.completed' : 'criteria.uncompleted',
        description: `Acceptance criterion ${completed ? 'marked complete' : 'unchecked'}`,
        metadata: { criteriaId },
      },
    })
  )

  return { ok: true, data: undefined }
}
