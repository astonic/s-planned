import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/layout/PageHeader'
import { TemplateViewer } from './_components/TemplateViewer'
import { TemplateActions } from './_components/TemplateActions'

interface Props {
  params: { id: string }
}

export default async function TemplateDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) notFound()

  const template = await prisma.template.findFirst({
    where: { id: params.id, organizationId: session.currentOrganizationId, isArchived: false },
    include: {
      focusAreas: {
        orderBy: { order: 'asc' },
        include: {
          subSections: {
            orderBy: { order: 'asc' },
            include: {
              deliverables: {
                include: { acceptanceCriteria: true, evidenceRequirements: true },
              },
            },
          },
        },
      },
    },
  })

  if (!template) notFound()

  return (
    <>
      <PageHeader
        title={template.name}
        breadcrumb={[
          { label: 'Templates', href: '/templates' },
          { label: template.name },
        ]}
        actions={<TemplateActions templateId={template.id} />}
      />
      <div style={{ padding: '24px' }}>
        <TemplateViewer template={template} />
      </div>
    </>
  )
}
