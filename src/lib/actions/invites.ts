'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { randomBytes } from 'crypto'
import { requireAuth, validateEmail } from '@/lib/security'
import { checkPublicActionRateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getAdminOrgId(): Promise<{ orgId: string; actorName: string } | null> {
  try {
    const auth = await requireAuth('admin')
    return { orgId: auth.orgId, actorName: auth.userName }
  } catch {
    return null
  }
}

function generateInviteToken(): string {
  return randomBytes(32).toString('hex')
}

function getInviteExpiryDate(days = 7): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

// ── Create Invite ─────────────────────────────────────────────────────────────

export interface CreateInviteInput {
  email: string
  role: 'admin' | 'member' | 'viewer'
  createPerson?: {
    name: string
    type: 'internal' | 'contractor' | 'consultant'
    role?: string
    company?: string
  }
}

export async function createInvite(input: CreateInviteInput): Promise<ActionResult<{ inviteId: string; token: string }>> {
  const auth = await getAdminOrgId()
  if (!auth) return { ok: false, error: 'Unauthorized' }

  // Validate email
  let email: string
  try {
    email = validateEmail(input.email)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid email'
    return { ok: false, error: msg }
  }

  // Check if user already exists in org
  const existing = await prisma.organizationMembership.findFirst({
    where: { organizationId: auth.orgId, user: { email } },
  })
  if (existing) return { ok: false, error: 'User is already a member of the organization.' }

  // Check if pending invite already exists
  const existingInvite = await prisma.invite.findFirst({
    where: { organizationId: auth.orgId, email, status: 'pending' },
  })
  if (existingInvite) return { ok: false, error: 'Invite already sent to this email.' }

  const token = generateInviteToken()
  const expiresAt = getInviteExpiryDate()

  // Create optional Person record if specified
  let personId: string | undefined
  if (input.createPerson) {
    const person = await prisma.person.create({
      data: {
        organizationId: auth.orgId,
        name: input.createPerson.name,
        type: input.createPerson.type,
        role: (input.createPerson.role ? input.createPerson.role as any : 'team') as any,
        company: input.createPerson.company,
        email,
      },
    })
    personId = person.id
  }

  const invite = await prisma.invite.create({
    data: {
      organizationId: auth.orgId,
      email,
      role: input.role,
      token,
      expiresAt,
      invitedBy: auth.actorName,
    },
  })

  await prisma.auditEvent.create({
    data: {
      organizationId: auth.orgId,
      actorName: auth.actorName,
      eventType: 'invite.created',
      description: `User invited: ${email}`,
    },
  })

  return { ok: true, data: { inviteId: invite.id, token: invite.token } }
}

// ── Revoke Invite ─────────────────────────────────────────────────────────────

export async function revokeInvite(inviteId: string): Promise<ActionResult> {
  const auth = await getAdminOrgId()
  if (!auth) return { ok: false, error: 'Unauthorized' }

  const invite = await prisma.invite.findUnique({ where: { id: inviteId } })
  if (!invite || invite.organizationId !== auth.orgId) return { ok: false, error: 'Not found' }
  if (invite.status !== 'pending') return { ok: false, error: 'Only pending invites can be revoked.' }

  await prisma.invite.update({
    where: { id: inviteId },
    data: { status: 'revoked' },
  })

  await prisma.auditEvent.create({
    data: {
      organizationId: auth.orgId,
      actorName: auth.actorName,
      eventType: 'invite.revoked',
      description: `Invite revoked: ${invite.email}`,
    },
  })

  return { ok: true, data: undefined }
}

// ── Accept Invite (for public use) ─────────────────────────────────────────────

export interface AcceptInviteInput {
  token: string
  userId?: string  // if registering new, this is undefined; if existing account, this is the user id
  userName?: string  // new user name if creating account
  passwordHash?: string  // new user password hash if creating account
}

export async function acceptInvite(input: AcceptInviteInput): Promise<ActionResult<{ redirectUrl: string }>> {
  // Rate limit public action
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  const rateLimit = checkPublicActionRateLimit(ip)
  if (!rateLimit.allowed) {
    return { ok: false, error: 'Too many attempts. Please try again later.' }
  }

  // Public action, no auth required
  const invite = await prisma.invite.findUnique({
    where: { token: input.token },
    include: { organization: true },
  })

  if (!invite) return { ok: false, error: 'Invalid or expired invite token.' }
  if (invite.status !== 'pending') return { ok: false, error: 'This invite has already been processed.' }
  if (new Date() > invite.expiresAt) {
    await prisma.invite.update({ where: { id: invite.id }, data: { status: 'expired' } })
    return { ok: false, error: 'This invite has expired.' }
  }

  let userId: string

  if (input.userId) {
    // Existing user accepting invite
    userId = input.userId
  } else {
    // New user registering
    if (!input.userName || !input.passwordHash) {
      return { ok: false, error: 'Name and password are required for new users.' }
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        email: invite.email,
        name: input.userName,
        passwordHash: input.passwordHash,
      },
    })
    userId = user.id
  }

  // Add user to organization with invited role
  await prisma.organizationMembership.create({
    data: {
      organizationId: invite.organizationId,
      userId,
      role: invite.role,
    },
  })

  // Mark invite as accepted
  await prisma.invite.update({
    where: { id: invite.id },
    data: {
      status: 'accepted',
      acceptedBy: userId,
      acceptedAt: new Date(),
    },
  })

  await prisma.auditEvent.create({
    data: {
      organizationId: invite.organizationId,
      actorName: invite.email,
      eventType: 'invite.accepted',
      description: `User accepted invite and joined organization`,
    },
  })

  return { ok: true, data: { redirectUrl: `/` } }
}

// ── Get Invite Info (public, no auth required) ─────────────────────────────────

export interface InviteInfo {
  email: string
  orgName: string
  role: string
  status: string
}

export async function getInviteInfo(token: string): Promise<ActionResult<InviteInfo>> {
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { organization: true },
  })

  if (!invite) return { ok: false, error: 'Invalid token' }
  if (new Date() > invite.expiresAt) return { ok: false, error: 'Expired' }

  return {
    ok: true,
    data: {
      email: invite.email,
      orgName: invite.organization.name,
      role: invite.role,
      status: invite.status,
    },
  }
}
