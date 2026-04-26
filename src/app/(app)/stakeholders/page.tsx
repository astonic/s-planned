import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { withTenant } from '@/lib/tenant-context'
import { PageHeader } from '@/components/layout/PageHeader'
import { StakeholdersView } from './_components/StakeholdersView'

export default async function StakeholdersPage() {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) redirect('/login')

  const orgId = session.currentOrganizationId

  const [people, vendors] = await withTenant(orgId, async (tx) => {
    return Promise.all([
      tx.person.findMany({
        where: { organizationId: orgId },
        orderBy: { name: 'asc' },
      }),
      tx.vendor.findMany({
        where: { organizationId: orgId },
        orderBy: { name: 'asc' },
      }),
    ])
  })

  return (
    <>
      <PageHeader title="Stakeholders" />
      <StakeholdersView people={people} vendors={vendors} />
    </>
  )
}
