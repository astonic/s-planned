import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/layout/PageHeader'
import { CreateProjectWizard } from './_components/CreateProjectWizard'

export default async function NewProjectPage() {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) redirect('/login')

  const orgId = session.currentOrganizationId

  const templates = await prisma.template.findMany({
    where: { organizationId: orgId, isArchived: false },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { focusAreas: true },
      },
    },
  })

  return (
    <>
      <PageHeader
        title="New Project"
        breadcrumb={[
          { label: 'Projects', href: '/projects' },
          { label: 'New' },
        ]}
      />
      <CreateProjectWizard templates={templates} />
    </>
  )
}
