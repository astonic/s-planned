import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/layout/PageHeader'
import { RAIDLogView } from './_components/RAIDLogView'
import type { RAIDSeverity } from '@prisma/client'
import type { RAIDItemWithCount } from './_components/RAIDLogView'
import { projectAccessWhere } from '@/lib/project-access'

interface Props {
  params: { id: string }
}

export default async function RAIDLogPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) notFound()

  const organizationId = session.currentOrganizationId
  const projectWhere = projectAccessWhere({
    orgId: organizationId,
    userId: session.user.id,
    role: session.role ?? 'viewer',
  })

  const project = await prisma.project.findFirst({
    where: { ...projectWhere, id: params.id },
    select: { id: true, name: true, organizationId: true },
  })

  if (!project) notFound()

  // Fetch all RAID items ordered: critical first, then by createdAt desc
  const rawItems = await prisma.rAIDItem.findMany({
    where: { projectId: params.id, organizationId },
    orderBy: [
      // We'll sort by severity weight then createdAt
      { createdAt: 'desc' },
    ],
    include: {
      _count: { select: { deliverables: true } },
    },
  })

  // Sort: critical > high > medium > low, then by createdAt desc within each
  const SEVERITY_ORDER: Record<RAIDSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }
  const items: RAIDItemWithCount[] = [...rawItems].sort((a, b) => {
    const severityDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    if (severityDiff !== 0) return severityDiff
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  // Compute stats
  const total = items.length
  const byType = {
    risk: items.filter((i) => i.type === 'risk').length,
    assumption: items.filter((i) => i.type === 'assumption').length,
    issue: items.filter((i) => i.type === 'issue').length,
    dependency: items.filter((i) => i.type === 'dependency').length,
  }
  const bySeverity = {
    critical: items.filter((i) => i.severity === 'critical').length,
    high: items.filter((i) => i.severity === 'high').length,
  }
  const openCount = items.filter(
    (i) => i.status === 'open' || i.status === 'in_progress'
  ).length
  const closedCount = items.filter((i) => i.status === 'closed').length

  const stats = { total, byType, bySeverity, openCount, closedCount }

  return (
    <>
      <PageHeader
        title="RAID Log"
        breadcrumb={[
          { label: 'Projects', href: '/projects' },
          { label: project.name, href: `/projects/${project.id}` },
          { label: 'RAID' },
        ]}
      />
      <RAIDLogView
        projectId={project.id}
        items={items}
        stats={stats}
      />
    </>
  )
}
