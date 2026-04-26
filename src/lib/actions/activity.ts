'use server'

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { withTenant } from '@/lib/tenant-context'

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

const pageSchema = z.object({
  offset: z.number().int().min(0),
  limit: z.number().int().min(1).max(50).default(20),
  query: z.string().optional(),
  eventType: z.string().optional(),
})

async function requireSession() {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) redirect('/login')
  return session
}

function buildSearchWhere(query?: string, eventType?: string) {
  const q = query?.trim()

  return {
    ...(eventType ? { eventType } : {}),
    ...(q
      ? {
          OR: [
            { actorName: { contains: q, mode: 'insensitive' as const } },
            { description: { contains: q, mode: 'insensitive' as const } },
            { eventType: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }
}

export async function getDeliverableActivityPage(
  deliverableExecutionId: string,
  input: z.infer<typeof pageSchema>
): Promise<ActionResult<{ items: Array<{ id: string; actorName: string; eventType: string; description: string; createdAt: Date }>; hasMore: boolean; eventTypes: string[] }>> {
  try {
    const session = await requireSession()
    const orgId = session.currentOrganizationId
    const parsed = pageSchema.parse(input)

    const data = await withTenant(orgId, async (tx) => {
      const baseWhere = {
        organizationId: orgId,
        deliverableExecutionId,
      }

      const where = {
        ...baseWhere,
        ...buildSearchWhere(parsed.query, parsed.eventType),
      }

      const rows = await tx.auditEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: parsed.offset,
        take: parsed.limit + 1,
        select: {
          id: true,
          actorName: true,
          eventType: true,
          description: true,
          createdAt: true,
        },
      })

      const types = await tx.auditEvent.findMany({
        where: baseWhere,
        distinct: ['eventType'],
        select: { eventType: true },
        orderBy: { eventType: 'asc' },
      })

      return {
        items: rows.slice(0, parsed.limit),
        hasMore: rows.length > parsed.limit,
        eventTypes: types.map((t) => t.eventType),
      }
    })

    return { ok: true, data }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function getProjectActivityPage(
  projectId: string,
  input: z.infer<typeof pageSchema>
): Promise<ActionResult<{ items: Array<{ id: string; actorName: string; eventType: string; description: string; createdAt: Date }>; hasMore: boolean; eventTypes: string[] }>> {
  try {
    const session = await requireSession()
    const orgId = session.currentOrganizationId
    const parsed = pageSchema.parse(input)

    const data = await withTenant(orgId, async (tx) => {
      const baseWhere = {
        organizationId: orgId,
        projectId,
      }

      const where = {
        ...baseWhere,
        ...buildSearchWhere(parsed.query, parsed.eventType),
      }

      const rows = await tx.auditEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: parsed.offset,
        take: parsed.limit + 1,
        select: {
          id: true,
          actorName: true,
          eventType: true,
          description: true,
          createdAt: true,
        },
      })

      const types = await tx.auditEvent.findMany({
        where: baseWhere,
        distinct: ['eventType'],
        select: { eventType: true },
        orderBy: { eventType: 'asc' },
      })

      return {
        items: rows.slice(0, parsed.limit),
        hasMore: rows.length > parsed.limit,
        eventTypes: types.map((t) => t.eventType),
      }
    })

    return { ok: true, data }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
