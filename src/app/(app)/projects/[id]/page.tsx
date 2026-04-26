import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProjectOverview } from './_components/ProjectOverview'
import { ProjectActions } from './_components/ProjectActions'
import type { FocusAreaStat, PhaseCounts, RAIDSummary } from './_components/ProjectOverview'
import type { ProjectPhase } from '@prisma/client'

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
                select: { status: true, phase: true, targetDate: true },
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
  const raidItems = await prisma.rAIDItem.findMany({
    where: { projectId: params.id },
    select: { type: true, status: true, severity: true },
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
      <ProjectOverview
        projectId={params.id}
        projectName={project.name}
        projectStatus={project.status}
        description={project.description}
        templateName={project.template?.name ?? null}
        startDate={project.startDate}
        targetDate={project.targetDate}
        createdAt={project.createdAt}
        totalDeliverables={totalDeliverables}
        closedDeliverables={closedDeliverables}
        readinessPct={readinessPct}
        byStatus={byStatus}
        byFocusArea={byFocusArea}
        byPhase={byPhase}
        raidSummary={raidSummary}
      />
    </>
  )
}
