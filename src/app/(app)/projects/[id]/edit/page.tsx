import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProjectEditForm } from '../_components/ProjectEditForm'
import { projectAccessWhere } from '@/lib/project-access'

interface Props {
  params: { id: string }
}

export default async function ProjectEditPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) notFound()

  const projectWhere = projectAccessWhere({
    orgId: session.currentOrganizationId,
    userId: session.user.id,
    role: session.role ?? 'viewer',
  })

  const project = await prisma.project.findFirst({
    where: { ...projectWhere, id: params.id },
    select: {
      id: true,
      organizationId: true,
      name: true,
      description: true,
      status: true,
      startDate: true,
      targetDate: true,
    },
  })

  if (!project) notFound()

  return (
    <>
      <PageHeader
        title="Edit project"
        breadcrumb={[
          { label: 'Projects', href: '/projects' },
          { label: project.name, href: `/projects/${project.id}` },
          { label: 'Edit' },
        ]}
      />
      <ProjectEditForm project={project} />
    </>
  )
}
