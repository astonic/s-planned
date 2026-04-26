import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/layout/PageHeader'
import { SettingsShell } from './_components/SettingsShell'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) notFound()

  // Only admin and owner can access settings
  const orgId = session.currentOrganizationId
  const membership = await prisma.organizationMembership.findFirst({
    where: { organizationId: orgId, userId: session.user.id, role: { in: ['owner', 'admin'] } },
  })
  if (!membership) redirect('/')

  const [org, members] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      include: { settings: true },
    }),
    prisma.organizationMembership.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  if (!org) notFound()

  const s = org.settings

  return (
    <>
      <PageHeader title="Settings" />
      <div style={{ padding: '24px' }}>
        <SettingsShell
          orgName={org.name}
          description={s?.description}
          timezone={s?.timezone ?? 'UTC'}
          dateFormat={s?.dateFormat ?? 'DD/MM/YYYY'}
          storageProvider={s?.storageProvider ?? 'local'}
          storageEndpoint={s?.storageEndpoint}
          storageAccessKey={s?.storageAccessKey}
          storageBucket={s?.storageBucket}
          smtpHost={s?.smtpHost}
          smtpPort={s?.smtpPort}
          smtpUser={s?.smtpUser}
          smtpFrom={s?.smtpFrom}
          smtpFromName={s?.smtpFromName}
          smtpSecure={s?.smtpSecure ?? true}
          notifyEmail={s?.notifyEmail ?? true}
          notifyReminders={s?.notifyReminders ?? true}
          notifyRaid={s?.notifyRaid ?? true}
          notifyDigest={s?.notifyDigest ?? false}
          members={members.map((m) => ({
            id: m.id,
            userId: m.userId,
            name: m.user.name ?? m.user.email ?? 'Unknown',
            email: m.user.email ?? '',
            role: m.role,
            isCurrentUser: m.userId === session.user.id,
          }))}
        />
      </div>
    </>
  )
}
