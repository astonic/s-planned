import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withTenant } from '@/lib/tenant-context'
import { PageHeader } from '@/components/layout/PageHeader'
import { TemplateEditor } from './_components/TemplateEditor'
import type { TemplateWithHierarchy } from '@/types/templates'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TemplateEditPage({ params }: Props) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) redirect('/login')

  const orgId = session.currentOrganizationId

  const template = await withTenant(orgId, async (tx) => {
    return tx.template.findUnique({
      where: { id, organizationId: orgId },
      include: {
        focusAreas: {
          orderBy: { order: 'asc' },
          include: {
            subSections: {
              orderBy: { order: 'asc' },
              include: {
                deliverables: {
                  orderBy: [{ order: 'asc' }, { code: 'asc' }],
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
  })

  if (!template) notFound()

  const templateData: TemplateWithHierarchy = {
    id: template.id,
    name: template.name,
    description: template.description ?? null,
    industry: template.industry ?? null,
    version: template.version,
    organizationId: template.organizationId,
    focusAreas: template.focusAreas.map((fa) => ({
      id: fa.id,
      code: fa.code,
      name: fa.name,
      order: fa.order,
      subSections: fa.subSections.map((ss) => ({
        id: ss.id,
        code: ss.code,
        name: ss.name,
        order: ss.order,
        deliverables: ss.deliverables.map((dt) => ({
          id: dt.id,
          code: dt.code,
          name: dt.name,
          description: dt.description ?? null,
          phase: dt.phase ?? null,
          domain: dt.domain ?? null,
          estimatedDuration: dt.estimatedDuration ?? null,
          order: dt.order,
          acceptanceCriteria: dt.acceptanceCriteria.map((ac) => ({
            id: ac.id,
            description: ac.description,
            verificationMethod: ac.verificationMethod ?? null,
          })),
          evidenceRequirements: dt.evidenceRequirements.map((er) => ({
            id: er.id,
            name: er.name,
            type: er.type ?? null,
            description: er.description ?? null,
            required: er.required,
          })),
        })),
      })),
    })),
  }

  return (
    <>
      <PageHeader
        title={`${template.name} — Edit`}
        breadcrumb={[
          { label: 'Templates', href: '/templates' },
          { label: template.name },
        ]}
      />
      <TemplateEditor template={templateData} />
    </>
  )
}
