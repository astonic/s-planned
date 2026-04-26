import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { Button } from '@fluentui/react-components'
import { EditRegular, CopyRegular } from '@fluentui/react-icons'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/layout/PageHeader'
import { TemplateViewer } from './_components/TemplateViewer'

interface Props {
  params: { id: string }
}

export default async function TemplateDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) notFound()

  const template = await prisma.template.findFirst({
    where: {
      id: params.id,
      organizationId: session.currentOrganizationId,
      isArchived: false,
    },
    include: {
      focusAreas: {
        orderBy: { order: 'asc' },
        include: {
          subSections: {
            orderBy: { order: 'asc' },
            include: {
              deliverables: {
                include: {
                  acceptanceCriteria: true,
                  evidenceRequirements: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!template) notFound()

  const actions = (
    <>
      <Link href={`/templates/${template.id}/edit`} style={{ textDecoration: 'none' }}>
        <Button appearance="secondary" icon={<EditRegular />}>Edit</Button>
      </Link>
      <Link href={`/templates/${template.id}/clone`} style={{ textDecoration: 'none' }}>
        <Button appearance="secondary" icon={<CopyRegular />}>Clone</Button>
      </Link>
      <Link href="/templates" style={{ textDecoration: 'none' }}>
        <Button appearance="subtle">Back</Button>
      </Link>
    </>
  )

  return (
    <>
      <PageHeader
        title={template.name}
        breadcrumb={[
          { label: 'Templates', href: '/templates' },
          { label: template.name },
        ]}
        actions={actions}
      />
      <div style={{ padding: '24px' }}>
        <TemplateViewer template={template} />
      </div>
    </>
  )
}
