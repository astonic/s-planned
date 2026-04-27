import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/layout/PageHeader'
import { WorkspaceView } from './_components/WorkspaceView'
import { WorkspaceViewToggle } from './_components/WorkspaceViewToggle'
import { projectAccessWhere } from '@/lib/project-access'

interface Props {
  params: { id: string }
}

export default async function ProjectWorkspacePage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) notFound()

  const orgId = session.currentOrganizationId
  const projectWhere = projectAccessWhere({
    orgId,
    userId: session.user.id,
    role: session.role ?? 'viewer',
  })

  const project = await prisma.project.findFirst({
    where: { ...projectWhere, id: params.id },
    include: {
      template: {
        include: {
          focusAreas: {
            orderBy: { order: 'asc' },
            include: {
              subSections: {
                orderBy: { order: 'asc' },
                include: {
                  deliverables: {
                    orderBy: { code: 'asc' },
                    select: { phase: true },
                  },
                },
              },
            },
          },
        },
      },
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
                  _count: { select: { raidLinks: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!project) notFound()

  const templatePhases = project.template?.focusAreas.flatMap((fa) =>
    fa.subSections.flatMap((ss) => ss.deliverables.map((d) => d.phase).filter(Boolean))
  ) ?? []
  const executionPhases = project.focusAreaExecutions.flatMap((fa) =>
    fa.subSections.flatMap((ss) => ss.deliverables.map((d) => d.phase).filter(Boolean))
  )
  const phaseOptions = Array.from(new Set(templatePhases.length > 0 ? templatePhases : executionPhases)) as string[]

  return (
    <>
      <PageHeader
        title="Workspace"
        breadcrumb={[
          { label: 'Projects', href: '/projects' },
          { label: project.name, href: `/projects/${project.id}` },
          { label: 'Workspace' },
        ]}
        actions={<WorkspaceViewToggle projectId={project.id} />}
      />
      <div style={{ padding: '24px' }}>
        <WorkspaceView project={project} phaseOptions={phaseOptions} />
      </div>
    </>
  )
}
