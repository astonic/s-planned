import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PageHeader } from '@/components/layout/PageHeader'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  return (
    <>
      <PageHeader title="Dashboard" />
      <div style={{ padding: '24px' }}>
        <p style={{ fontSize: 14, color: '#616161' }}>
          Welcome back, {session?.user.name}. Dashboard coming in Phase 7.
        </p>
      </div>
    </>
  )
}
