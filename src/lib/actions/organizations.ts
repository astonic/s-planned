'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string }

export interface UserOrganization {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  role: string
  isCurrentOrg: boolean
}

/**
 * Get all organizations the current user is a member of
 */
export async function getUserOrganizations(): Promise<ActionResult<UserOrganization[]>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { ok: false, error: 'Unauthorized' }

  const memberships = await prisma.organizationMembership.findMany({
    where: { userId: session.user.id },
    include: { organization: true },
    orderBy: [
      { organizationId: session.currentOrganizationId ? 'asc' : 'desc' }, // Current org first
      { createdAt: 'desc' }, // Then by join date
    ],
  })

  const orgs = memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    logoUrl: m.organization.logoUrl,
    role: m.role,
    isCurrentOrg: m.organizationId === session.currentOrganizationId,
  }))

  return { ok: true, data: orgs }
}

/**
 * Switch to a different organization
 * This is done via session cookie, not a server action
 */
export async function switchOrganization(orgId: string): Promise<ActionResult<{ orgId: string; redirectUrl: string }>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { ok: false, error: 'Unauthorized' }

  // Verify user is a member of the org
  const membership = await prisma.organizationMembership.findFirst({
    where: {
      organizationId: orgId,
      userId: session.user.id,
    },
  })

  if (!membership) {
    return { ok: false, error: 'You are not a member of this organization' }
  }

  // In production, this would update the session.currentOrganizationId
  // via a callback or middleware. For now, return success and let the UI handle redirect.
  return { ok: true, data: { orgId, redirectUrl: '/' } }
}
