import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/layout/PageHeader'
import { ReportListClient } from './_components/ReportListClient'
import { PaginationBar } from '@/components/ui/PaginationBar'

const PAGE_SIZE = 25

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) notFound()
  const orgId = session.currentOrganizationId

  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)
  const skip = (page - 1) * PAGE_SIZE

  const [reports, total, projects] = await Promise.all([
    prisma.report.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true, title: true, reportType: true, status: true,
        createdBy: true, publishedAt: true, createdAt: true,
        projectId: true,
        project: { select: { name: true } },
        _count: { select: { accessLog: true } },
      },
    }),
    prisma.report.count({ where: { organizationId: orgId } }),
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
        <PaginationBar page={page} pageSize={PAGE_SIZE} total={total} />
      </div>
    </>
  )
}
