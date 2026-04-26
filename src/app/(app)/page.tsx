import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/layout/PageHeader'
import { DashboardFeed } from './_components/DashboardFeed'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) return null
  const orgId = session.currentOrganizationId

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [projects, activityRows, eventTypeRows] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.auditEvent.findMany({
      where: { organizationId: orgId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 21,
      select: {
        id: true, actorName: true, eventType: true, description: true, createdAt: true,
        projectId: true, project: { select: { name: true } },
      },
    }),
    prisma.auditEvent.findMany({
      where: { organizationId: orgId, createdAt: { gte: since } },
      distinct: ['eventType'],
      select: { eventType: true },
      orderBy: { eventType: 'asc' },
    }),
  ])

  const initialHasMore = activityRows.length > 20
  const initialActivity = activityRows.slice(0, 20).map((r) => ({
    id: r.id,
    actorName: r.actorName,
    eventType: r.eventType,
    description: r.description,
    createdAt: r.createdAt,
    projectId: r.projectId ?? '',
    projectName: r.project?.name ?? '',
  }))

  return (
    <>
      <PageHeader title="Dashboard" />
      <div style={{ padding: '24px' }}>
        <DashboardFeed
          userName={session.user.name ?? 'User'}
          projects={projects}
          initialActivity={initialActivity}
          initialHasMore={initialHasMore}
          eventTypes={eventTypeRows.map((r) => r.eventType)}
        />
      </div>
    </>
  )
}
