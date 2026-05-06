import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/layout/PageHeader'
import { ReportEditor } from '../_components/ReportEditor'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ReportDetailPage({ params }: Props) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) notFound()
  const orgId = session.currentOrganizationId

  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      project: { select: { name: true } },
      sections: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!report || report.organizationId !== orgId) notFound()

  return (
    <>
      <PageHeader title={report.title} />
      <div style={{ padding: '24px' }}>
        <ReportEditor
          id={report.id}
          title={report.title}
          reportType={report.reportType}
          status={report.status}
          shareToken={report.shareToken}
          projectName={report.project.name}
          createdBy={report.createdBy}
          createdAt={report.createdAt}
          sections={report.sections.map((s) => ({
            id: s.id,
            type: s.type,
            title: s.title,
            content: s.content,
            comment: s.comment,
            sortOrder: s.sortOrder,
          }))}
        />
      </div>
    </>
  )
}
