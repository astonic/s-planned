import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/layout/PageHeader'
import { ReportListClient } from './_components/ReportListClient'

export default async function ReportsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) notFound()
  const orgId = session.currentOrganizationId

  const [reports, projects] = await Promise.all([
    prisma.report.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, reportType: true, status: true,
        createdBy: true, publishedAt: true, createdAt: true,
        projectId: true,
        project: { select: { name: true } },
        _count: { select: { accessLog: true } },
      },
    }),
    prisma.project.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const reportCards = reports.map((r) => ({
    id: r.id,
    title: r.title,
    reportType: r.reportType,
    status: r.status,
    projectName: r.project.name,
    projectId: r.projectId,
    createdBy: r.createdBy,
    publishedAt: r.publishedAt,
    createdAt: r.createdAt,
    viewCount: r._count.accessLog,
  }))

  return (
    <>
      <PageHeader title="Reports" />
      <div style={{ padding: '24px' }}>
        <ReportListClient reports={reportCards} projects={projects} />
      </div>
    </>
  )
}
