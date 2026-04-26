import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/layout/PageHeader'
import { AnalyticsTabs } from './_components/AnalyticsTabs'
import { buildAnalytics } from '@/app/api/analytics/route'

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) notFound()
  const orgId = session.currentOrganizationId

  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const initialData = await buildAnalytics(orgId, 'all')

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
