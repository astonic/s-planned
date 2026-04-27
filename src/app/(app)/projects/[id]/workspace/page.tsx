import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/layout/PageHeader'
import { WorkspaceView } from './_components/WorkspaceView'
import { WorkspaceViewToggle } from './_components/WorkspaceViewToggle'

interface Props {
  params: { id: string }
}

export default async function ProjectWorkspacePage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) notFound()

  const orgId = session.currentOrganizationId

  const project = await prisma.project.findUnique({
    where: { id: params.id, organizationId: orgId },
    include: {
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

  if (!project) notFound()

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
        <WorkspaceView project={project} />
      </div>
    </>
  )
}
