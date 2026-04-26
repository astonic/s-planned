import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { withTenant } from '@/lib/tenant-context'
import { PageHeader } from '@/components/layout/PageHeader'
import { StakeholdersView } from './_components/StakeholdersView'

const PAGE_SIZE = 50

export default async function StakeholdersPage({
  searchParams,
}: {
  searchParams: { page?: string; tab?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) redirect('/login')

  const orgId = session.currentOrganizationId
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)
  const skip = (page - 1) * PAGE_SIZE

  const [people, vendors] = await withTenant(orgId, async (tx) => {
    return Promise.all([
      tx.person.findMany({
        where: { organizationId: orgId },
        orderBy: { name: 'asc' },
        skip,
        take: PAGE_SIZE,
      }),
      tx.vendor.findMany({
        where: { organizationId: orgId },
        orderBy: { name: 'asc' },
        skip,
        take: PAGE_SIZE,
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
