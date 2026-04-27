import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/layout/PageHeader'
import { AnalyticsTabs } from './_components/AnalyticsTabs'
import { buildAnalytics } from '@/lib/analytics'
import { projectAccessWhere } from '@/lib/project-access'
import type { UserRole } from '@/lib/security'

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId || !session.user?.id) notFound()
  const orgId = session.currentOrganizationId
  const role = (session.role ?? 'viewer') as UserRole

  const projects = await prisma.project.findMany({
    where: projectAccessWhere({ orgId, userId: session.user.id, role }),
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const initialData = await buildAnalytics(orgId, 'all', projects.map((project) => project.id))

  return (
    <>
      <PageHeader title="Analytics" />
      <AnalyticsTabs
        projects={projects}
        initialProjectId="all"
        initialData={initialData}
      />
    </>
  )
}
