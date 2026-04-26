import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { FluentWrapper } from '@/components/layout/FluentWrapper'
import { AppShell } from '@/components/layout/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const org = session.currentOrganizationId
    ? await prisma.organization.findUnique({
        where: { id: session.currentOrganizationId },
        select: { name: true, slug: true, logoUrl: true },
      })
    : null

  const orgName = org?.name ?? 'My Organization'
  const orgSlug = org?.slug ?? 'org'
  const orgLogoUrl = org?.logoUrl ?? null

  return (
    <FluentWrapper>
      <AppShell session={session} orgName={orgName} orgSlug={orgSlug} orgLogoUrl={orgLogoUrl}>
        <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {children}
        </main>
      </AppShell>
    </FluentWrapper>
  )
}
