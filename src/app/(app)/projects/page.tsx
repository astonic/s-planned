import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProjectsView } from './_components/ProjectsView'
import { PaginationBar } from '@/components/ui/PaginationBar'
import type { ProjectCardData } from './_components/ProjectCard'
import { projectAccessWhere } from '@/lib/project-access'

const PAGE_SIZE = 20

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) redirect('/login')

  const orgId = session.currentOrganizationId
  const projectWhere = projectAccessWhere({
    orgId,
    userId: session.user.id,
    role: session.role ?? 'viewer',
  })
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const skip = (page - 1) * PAGE_SIZE

  const [rawProjects, total] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere,
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      include: {
        template: { select: { name: true } },
        focusAreaExecutions: {
          include: {
            subSections: {
              include: {
                deliverables: { select: { status: true } },
              },
            },
          },
        },
      },
    }),
    prisma.project.count({ where: projectWhere }),
  ])

  const projects: ProjectCardData[] = rawProjects.map((p) => {
    const allDeliverables = p.focusAreaExecutions.flatMap((fa) =>
      fa.subSections.flatMap((ss) => ss.deliverables),
    )
    const counts = { planned: 0, in_progress: 0, delayed: 0, closed: 0, total: allDeliverables.length }
    for (const d of allDeliverables) {
      if (d.status === 'planned') counts.planned++
      else if (d.status === 'in_progress') counts.in_progress++
      else if (d.status === 'delayed') counts.delayed++
      else if (d.status === 'closed') counts.closed++
    }
    return {
      id: p.id, name: p.name, description: p.description, status: p.status,
      startDate: p.startDate, targetDate: p.targetDate,
      template: p.template, deliverableCounts: counts,
    }
  })

  return (
    <>
      <PageHeader title="Projects" />
      <div style={{ padding: 'var(--sp-space-6)' }}>
        <ProjectsView projects={projects} />
        {total > PAGE_SIZE && <PaginationBar page={page} pageSize={PAGE_SIZE} total={total} />}
      </div>
    </>
  )
}
