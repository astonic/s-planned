import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const orgId = session.currentOrganizationId

  const { searchParams } = req.nextUrl
  const cursor = searchParams.get('cursor') ?? undefined
  const period = parseInt(searchParams.get('period') ?? '30', 10)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50)
  const projectId = searchParams.get('projectId') ?? undefined

  const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000)

  const rows = await prisma.auditEvent.findMany({
    where: {
      organizationId: orgId,
      createdAt: { gte: since },
      ...(projectId ? { projectId } : {}),
      ...(cursor ? { id: { lt: cursor } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    select: {
      id: true,
      actorName: true,
      eventType: true,
      description: true,
      createdAt: true,
      projectId: true,
      project: { select: { name: true } },
    },
  })

  const hasMore = rows.length > limit
  const data = rows.slice(0, limit).map((r) => ({
    id: r.id,
    actorName: r.actorName,
    eventType: r.eventType,
    description: r.description,
    createdAt: r.createdAt,
    projectId: r.projectId ?? '',
    projectName: r.project?.name ?? '',
  }))

  return NextResponse.json({ data, hasMore })
}
