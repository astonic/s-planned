import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProjectCard } from './_components/ProjectCard'
import { NewProjectButton } from './_components/NewProjectButton'
import type { ProjectCardData } from './_components/ProjectCard'

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) redirect('/login')

  const orgId = session.currentOrganizationId

  const rawProjects = await prisma.project.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
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
  })

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
      <PageHeader title="Projects" actions={<NewProjectButton />} />
      <div style={{ padding: '24px' }}>
        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#111' }}>No projects yet</p>
            <p style={{ fontSize: 14, color: '#616161', marginBottom: 24 }}>
              Create your first project to start tracking operational readiness.
            </p>
            <Link href="/projects/new" style={{
              display: 'inline-block', padding: '8px 20px', borderRadius: 6,
              backgroundColor: '#1474CB', color: '#fff', fontWeight: 600,
              fontSize: 14, textDecoration: 'none',
            }}>
              Create your first project
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
