import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import type { UserRole } from '@/lib/security'

type ProjectAccessInput = {
  orgId: string
  userId: string
  role: UserRole
}

type PrismaClientLike = typeof prisma | Prisma.TransactionClient

export function hasUnrestrictedProjectAccess(role: UserRole) {
  return role === 'owner'
}

export function projectAccessWhere({ orgId, userId, role }: ProjectAccessInput): Prisma.ProjectWhereInput {
  const base = { organizationId: orgId }
  if (hasUnrestrictedProjectAccess(role)) return base

  return {
    ...base,
    assignments: {
      some: {
        membership: {
          organizationId: orgId,
          userId,
        },
      },
    },
  }
}

export async function canAccessProject(
  input: ProjectAccessInput & { projectId: string },
  client: PrismaClientLike = prisma,
) {
  if (hasUnrestrictedProjectAccess(input.role)) return true

  const assignment = await client.projectAssignment.findFirst({
    where: {
      organizationId: input.orgId,
      projectId: input.projectId,
      membership: {
        organizationId: input.orgId,
        userId: input.userId,
      },
    },
    select: { id: true },
  })

  return Boolean(assignment)
}

export async function assertProjectAccess(
  input: ProjectAccessInput & { projectId: string },
  client: PrismaClientLike = prisma,
) {
  const allowed = await canAccessProject(input, client)
  if (!allowed) throw new Error('Project access denied')
}
