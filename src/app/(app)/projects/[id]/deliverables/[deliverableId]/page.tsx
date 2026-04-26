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
      owner: true,
      peopleLinks: { include: { person: true } },
      vendorLinks: { include: { vendor: true } },
    },
  })

  if (!deliverable) notFound()

  const project = deliverable.subSectionExecution.focusAreaExecution.project

  // Tenant check
  if (project.organizationId !== orgId) notFound()

  const [linkedRAID, projectRAID, orgPeople, orgVendors] = await Promise.all([
    prisma.rAIDItemDeliverable.findMany({
      where: { deliverableExecutionId: params.deliverableId },
      include: {
        raidItem: {
          select: { id: true, type: true, title: true, severity: true, status: true },
        },
      },
    }),
    prisma.rAIDItem.findMany({
      where: { projectId: project.id },
      select: { id: true, type: true, title: true, severity: true, status: true },
    }),
    prisma.person.findMany({
      where: { organizationId: orgId },
      orderBy: { name: 'asc' },
    }),
    prisma.vendor.findMany({
      where: { organizationId: orgId },
      orderBy: { name: 'asc' },
    }),
  ])

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
        <DeliverableDetail
          deliverable={deliverable}
          projectId={project.id}
          linkedRAID={linkedRAID}
          projectRAID={projectRAID}
          orgPeople={orgPeople}
          orgVendors={orgVendors}
        />
      </div>
    </>
  )
}
