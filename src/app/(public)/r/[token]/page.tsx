import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { logReportAccess } from '@/lib/actions/reports'
import { PublicReportView } from './_components/PublicReportView'

interface Props {
  params: { token: string }
}

export default async function PublicReportPage({ params }: Props) {
  const report = await prisma.report.findUnique({
    where: { shareToken: params.token },
    include: {
      project: { select: { name: true } },
      sections: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!report || report.status !== 'published') notFound()

  // Log access (best-effort, don't block render)
  const headersList = headers()
  const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? headersList.get('x-real-ip') ?? undefined
  const userAgent = headersList.get('user-agent') ?? undefined

  logReportAccess(report.id, { ipAddress, userAgent }).catch(() => { /* silent */ })

  return (
    <PublicReportView
      title={report.title}
      reportType={report.reportType}
      projectName={report.project.name}
      createdBy={report.createdBy}
      publishedAt={report.publishedAt}
      sections={report.sections.map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        content: s.content,
        comment: s.comment,
        sortOrder: s.sortOrder,
      }))}
    />
  )
}
