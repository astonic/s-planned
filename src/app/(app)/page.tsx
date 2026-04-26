import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Text } from '@fluentui/react-components'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  return (
    <>
      <PageHeader title="Dashboard" />
      <div style={{ padding: '24px' }}>
        <Text size={300}>
          Welcome back, {session?.user.name}. Dashboard coming in Phase 7.
        </Text>
      </div>
    </>
  )
}
