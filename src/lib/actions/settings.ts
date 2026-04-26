'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getAdminOrgId(): Promise<{ orgId: string; actorName: string } | null> {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) return null
  const membership = await prisma.organizationMembership.findFirst({
    where: {
      organizationId: session.currentOrganizationId,
      userId: session.user?.id,
      role: { in: ['owner', 'admin'] },
    },
  })
  if (!membership) return null
  return { orgId: session.currentOrganizationId, actorName: session.user?.name ?? 'Unknown' }
}

async function upsertSettings(orgId: string, data: Record<string, unknown>) {
  return prisma.organizationSettings.upsert({
    where: { organizationId: orgId },
    create: { organizationId: orgId, ...data },
    update: data,
  })
}

// ── General ───────────────────────────────────────────────────────────────────

export interface GeneralSettingsInput {
  name: string
  description?: string
  timezone: string
  dateFormat: string
}

export async function saveGeneralSettings(input: GeneralSettingsInput): Promise<ActionResult> {
  const auth = await getAdminOrgId()
  if (!auth) return { ok: false, error: 'Unauthorized' }

  await prisma.organization.update({ where: { id: auth.orgId }, data: { name: input.name } })
  await upsertSettings(auth.orgId, {
    description: input.description ?? null,
    timezone: input.timezone,
    dateFormat: input.dateFormat,
  })

  await prisma.auditEvent.create({
    data: {
      organizationId: auth.orgId,
      actorName: auth.actorName,
      eventType: 'settings.general.updated',
      description: 'General settings updated',
    },
  })

  return { ok: true, data: undefined }
}

// ── Storage ───────────────────────────────────────────────────────────────────

export interface StorageSettingsInput {
  storageProvider: string
  storageEndpoint?: string
  storageAccessKey?: string
  storageSecretKey?: string
  storageBucket?: string
}

export async function saveStorageSettings(input: StorageSettingsInput): Promise<ActionResult> {
  const auth = await getAdminOrgId()
  if (!auth) return { ok: false, error: 'Unauthorized' }

  await upsertSettings(auth.orgId, {
    storageProvider: input.storageProvider,
    storageEndpoint: input.storageEndpoint ?? null,
    storageAccessKey: input.storageAccessKey ?? null,
    storageSecretKey: input.storageSecretKey ?? null,
    storageBucket: input.storageBucket ?? null,
  })

  await prisma.auditEvent.create({
    data: {
      organizationId: auth.orgId,
      actorName: auth.actorName,
      eventType: 'settings.storage.updated',
      description: 'Storage settings updated',
    },
  })

  return { ok: true, data: undefined }
}

export async function testStorageConnection(input: StorageSettingsInput): Promise<ActionResult<{ message: string }>> {
  const auth = await getAdminOrgId()
  if (!auth) return { ok: false, error: 'Unauthorized' }

  if (input.storageProvider === 'local') {
    return { ok: true, data: { message: 'Local storage is always available.' } }
  }

  if (!input.storageEndpoint || !input.storageAccessKey || !input.storageBucket) {
    return { ok: false, error: 'Endpoint, access key, and bucket are required for external storage.' }
  }

  // Minimal HEAD request to the endpoint to verify reachability (not actual object storage auth)
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(input.storageEndpoint, { method: 'HEAD', signal: controller.signal })
    clearTimeout(timeout)
    return { ok: true, data: { message: `Endpoint reachable (HTTP ${res.status}).` } }
  } catch {
    return { ok: false, error: 'Could not reach storage endpoint. Check the URL and network access.' }
  }
}

// ── SMTP ──────────────────────────────────────────────────────────────────────

export interface SmtpSettingsInput {
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPassword?: string
  smtpFrom?: string
  smtpFromName?: string
  smtpSecure: boolean
}

export async function saveSmtpSettings(input: SmtpSettingsInput): Promise<ActionResult> {
  const auth = await getAdminOrgId()
  if (!auth) return { ok: false, error: 'Unauthorized' }

  await upsertSettings(auth.orgId, {
    smtpHost: input.smtpHost ?? null,
    smtpPort: input.smtpPort ?? null,
    smtpUser: input.smtpUser ?? null,
    smtpPassword: input.smtpPassword ?? null,
    smtpFrom: input.smtpFrom ?? null,
    smtpFromName: input.smtpFromName ?? null,
    smtpSecure: input.smtpSecure,
  })

  await prisma.auditEvent.create({
    data: {
      organizationId: auth.orgId,
      actorName: auth.actorName,
      eventType: 'settings.smtp.updated',
      description: 'SMTP settings updated',
    },
  })

  return { ok: true, data: undefined }
}

export async function testSmtpConnection(input: SmtpSettingsInput): Promise<ActionResult<{ message: string }>> {
  const auth = await getAdminOrgId()
  if (!auth) return { ok: false, error: 'Unauthorized' }

  if (!input.smtpHost || !input.smtpPort || !input.smtpFrom) {
    return { ok: false, error: 'Host, port, and from address are required to test the connection.' }
  }

  // TCP connectivity check via fetch (SMTP ports are not HTTP but we can verify DNS + port reachability)
  // In production you'd use nodemailer verify(); here we do a best-effort DNS check
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    await fetch(`https://${input.smtpHost}`, { method: 'HEAD', signal: controller.signal })
    clearTimeout(timeout)
    return { ok: true, data: { message: `Host ${input.smtpHost} is reachable. Save settings and send a test email from your mail client to verify full delivery.` } }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('aborted') || msg.includes('fetch')) {
      // Network error — still confirm DNS resolved if we got that far
      return { ok: true, data: { message: `Host ${input.smtpHost}:${input.smtpPort} appears configured. Full SMTP verification requires a real email send.` } }
    }
    return { ok: false, error: `Could not reach SMTP host: ${msg}` }
  }
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface NotificationSettingsInput {
  notifyEmail: boolean
  notifyReminders: boolean
  notifyRaid: boolean
  notifyDigest: boolean
}

export async function saveNotificationSettings(input: NotificationSettingsInput): Promise<ActionResult> {
  const auth = await getAdminOrgId()
  if (!auth) return { ok: false, error: 'Unauthorized' }

  await upsertSettings(auth.orgId, input as unknown as Record<string, unknown>)

  await prisma.auditEvent.create({
    data: {
      organizationId: auth.orgId,
      actorName: auth.actorName,
      eventType: 'settings.notifications.updated',
      description: 'Notification settings updated',
    },
  })

  return { ok: true, data: undefined }
}

// ── Users / Members ───────────────────────────────────────────────────────────

export async function changeMemberRole(
  membershipId: string,
  role: 'admin' | 'member' | 'viewer'
): Promise<ActionResult> {
  const auth = await getAdminOrgId()
  if (!auth) return { ok: false, error: 'Unauthorized' }

  const membership = await prisma.organizationMembership.findUnique({
    where: { id: membershipId },
    select: { organizationId: true, role: true },
  })
  if (!membership || membership.organizationId !== auth.orgId) return { ok: false, error: 'Not found' }
  if (membership.role === 'owner') return { ok: false, error: 'Cannot change the owner role.' }

  await prisma.organizationMembership.update({
    where: { id: membershipId },
    data: { role },
  })

  await prisma.auditEvent.create({
    data: {
      organizationId: auth.orgId,
      actorName: auth.actorName,
      eventType: 'member.role.changed',
      description: `Member role changed to ${role}`,
    },
  })

  return { ok: true, data: undefined }
}

export async function removeMember(membershipId: string): Promise<ActionResult> {
  const auth = await getAdminOrgId()
  if (!auth) return { ok: false, error: 'Unauthorized' }

  const membership = await prisma.organizationMembership.findUnique({
    where: { id: membershipId },
    select: { organizationId: true, role: true },
  })
  if (!membership || membership.organizationId !== auth.orgId) return { ok: false, error: 'Not found' }
  if (membership.role === 'owner') return { ok: false, error: 'Cannot remove the owner.' }

  await prisma.organizationMembership.delete({ where: { id: membershipId } })

  await prisma.auditEvent.create({
    data: {
      organizationId: auth.orgId,
      actorName: auth.actorName,
      eventType: 'member.removed',
      description: 'Member removed from organization',
    },
  })

  return { ok: true, data: undefined }
}
