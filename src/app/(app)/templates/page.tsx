import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/layout/PageHeader'
import { TemplateCard } from './_components/TemplateCard'
import { CreateTemplateDialog } from './_components/CreateTemplateDialog'

export default async function TemplatesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) redirect('/login')

  const orgId = session.currentOrganizationId

  const templates = await prisma.template.findMany({
    where: { organizationId: orgId, isArchived: false },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { focusAreas: true } },
    },
  })

  return (
    <>
      <PageHeader
        title="Templates"
        actions={<CreateTemplateDialog />}
      />

      <div style={{ padding: '24px' }}>
        {templates.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 24px',
              color: 'var(--colorNeutralForeground3)',
            }}
          >
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No templates yet.</p>
            <p style={{ fontSize: '14px', color: 'inherit' }}>
              Create your first template to define the operational readiness structure for your projects.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
