import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProjectTabs } from './_components/ProjectTabs'
import { ProjectActions } from './_components/ProjectActions'
import type { FocusAreaStat, PhaseCounts, RAIDSummary } from './_components/ProjectOverview'
import type { ProjectPhase, RAIDSeverity } from '@prisma/client'
import type { RAIDItemWithCount } from './raid/_components/RAIDLogView'

interface Props {
  params: { id: string }
}

export default async function ProjectDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) notFound()

  const organizationId = session.currentOrganizationId

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      template: { select: { name: true } },
      focusAreaExecutions: {
        orderBy: { order: 'asc' },
        include: {
          subSections: {
            orderBy: { order: 'asc' },
            include: {
              deliverables: {
                orderBy: { code: 'asc' },
                include: {
                  owner: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!project || project.organizationId !== organizationId) notFound()

  // ── Compute stats ────────────────────────────────────────────────────────────

  const allDeliverables = project.focusAreaExecutions.flatMap((fa) =>
    fa.subSections.flatMap((ss) => ss.deliverables)
  )

  const totalDeliverables = allDeliverables.length
  const closedDeliverables = allDeliverables.filter((d) => d.status === 'closed').length
  const readinessPct =
    totalDeliverables === 0 ? 0 : Math.round((closedDeliverables / totalDeliverables) * 100)

  const byStatus = {
    planned: allDeliverables.filter((d) => d.status === 'planned').length,
    in_progress: allDeliverables.filter((d) => d.status === 'in_progress').length,
    delayed: allDeliverables.filter((d) => d.status === 'delayed').length,
    closed: closedDeliverables,
  }

  const byFocusArea: FocusAreaStat[] = project.focusAreaExecutions.map((fa) => {
    const deliverables = fa.subSections.flatMap((ss) => ss.deliverables)
    const total = deliverables.length
    const closed = deliverables.filter((d) => d.status === 'closed').length
    const pct = total === 0 ? 0 : Math.round((closed / total) * 100)
    return { name: fa.name, code: fa.code, total, closed, pct }
  })

  const PHASES: ProjectPhase[] = ['pre_commissioning', 'commissioning', 'ramp_up', 'handover']
  const byPhase: PhaseCounts = {
    pre_commissioning: 0,
    commissioning: 0,
    ramp_up: 0,
    handover: 0,
  }
  for (const d of allDeliverables) {
    if (d.phase && PHASES.includes(d.phase)) {
      byPhase[d.phase]++
    }
  }

  // ── RAID summary ─────────────────────────────────────────────────────────────
  const rawRaidItems = await prisma.rAIDItem.findMany({
    where: { projectId: params.id, organizationId },
    orderBy: [{ createdAt: 'desc' }],
    include: {
      _count: { select: { deliverables: true } },
    },
  })

  const SEVERITY_ORDER: Record<RAIDSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }
  const raidItems: RAIDItemWithCount[] = [...rawRaidItems].sort((a, b) => {
    const severityDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    if (severityDiff !== 0) return severityDiff
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  const raidSummary: RAIDSummary = {
    total: raidItems.length,
    openRisks: raidItems.filter((r) => r.type === 'risk' && r.status !== 'closed').length,
    criticalCount: raidItems.filter((r) => r.severity === 'critical' && r.status !== 'closed').length,
    byType: {
      risk: raidItems.filter((r) => r.type === 'risk').length,
      assumption: raidItems.filter((r) => r.type === 'assumption').length,
      issue: raidItems.filter((r) => r.type === 'issue').length,
      dependency: raidItems.filter((r) => r.type === 'dependency').length,
    },
  }
  const raidStats = {
    total: raidItems.length,
    byType: raidSummary.byType,
    bySeverity: {
      critical: raidItems.filter((i) => i.severity === 'critical').length,
      high: raidItems.filter((i) => i.severity === 'high').length,
    },
    openCount: raidItems.filter((i) => i.status === 'open' || i.status === 'in_progress').length,
    closedCount: raidItems.filter((i) => i.status === 'closed').length,
  }

  const [recentActivityRows, recentActivityTypes, decisionRows] = await Promise.all([
    prisma.auditEvent.findMany({
      where: { organizationId, projectId: params.id },
      orderBy: { createdAt: 'desc' },
      take: 21,
      select: { id: true, actorName: true, eventType: true, description: true, createdAt: true },
    }),
    prisma.auditEvent.findMany({
      where: { organizationId, projectId: params.id },
      distinct: ['eventType'],
      select: { eventType: true },
      orderBy: { eventType: 'asc' },
    }),
    prisma.decision.findMany({
      where: { projectId: params.id, organizationId },
      orderBy: { loggedDate: 'desc' },
      select: {
        id: true, description: true, impact: true, loggedDate: true,
        status: true, comments: true, loggedBy: true, createdAt: true,
      },
    }),
  ])

  const recentActivity = recentActivityRows.slice(0, 20)
  const recentActivityHasMore = recentActivityRows.length > 20

  return (
    <>
      <PageHeader
        title={project.name}
        breadcrumb={[
          { label: 'Projects', href: '/projects' },
          { label: project.name },
        ]}
        actions={<ProjectActions projectId={params.id} />}
      />
      <ProjectTabs
        projectId={params.id}
        decisions={decisionRows}
        deliverablesProject={project}
        raid={{ items: raidItems, stats: raidStats }}
        overview={{
          projectId: params.id,
          projectName: project.name,
          projectStatus: project.status,
          description: project.description,
          templateName: project.template?.name ?? null,
          startDate: project.startDate,
          targetDate: project.targetDate,
          createdAt: project.createdAt,
          totalDeliverables,
          closedDeliverables,
          readinessPct,
          byStatus,
          byFocusArea,
          byPhase,
          raidSummary,
          recentActivity,
          recentActivityHasMore,
          activityEventTypes: recentActivityTypes.map((t) => t.eventType),
        }}
      />
    </>
  )
}
