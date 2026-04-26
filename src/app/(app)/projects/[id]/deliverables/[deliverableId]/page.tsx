import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/layout/PageHeader'
import { DeliverableDetail } from './_components/DeliverableDetail'

interface Props {
  params: { id: string; deliverableId: string }
}

export default async function DeliverableDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) notFound()

  const orgId = session.currentOrganizationId

  const deliverable = await prisma.deliverableExecution.findUnique({
    where: { id: params.deliverableId },
    include: {
      subSectionExecution: {
        include: {
          focusAreaExecution: {
            include: {
              project: {
                select: { id: true, name: true, organizationId: true },
              },
            },
          },
        },
      },
    },
  })

  if (!deliverable) notFound()

  const project = deliverable.subSectionExecution.focusAreaExecution.project

  // Tenant check
  if (project.organizationId !== orgId) notFound()

  return (
    <>
      <PageHeader
        title={deliverable.name}
        breadcrumb={[
          { label: 'Projects', href: '/projects' },
          { label: project.name, href: `/projects/${project.id}` },
          { label: 'Workspace', href: `/projects/${project.id}/workspace` },
          { label: deliverable.name },
        ]}
      />
      <div style={{ padding: '24px' }}>
        <DeliverableDetail deliverable={deliverable} projectId={project.id} />
      </div>
    </>
  )
}
