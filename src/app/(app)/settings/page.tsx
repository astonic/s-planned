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

  const [org, members, invites, projects] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      include: { settings: true },
    }),
    prisma.organizationMembership.findMany({
      where: { organizationId: orgId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        projectAssignments: { select: { projectId: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.invite.findMany({
      where: { organizationId: orgId, status: 'pending' },
      orderBy: { sentAt: 'desc' },
    }),
    prisma.project.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
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
          logoUrl={org.logoUrl}
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
          whatsappEnabled={s?.whatsappEnabled ?? false}
          whatsappProvider={s?.whatsappProvider}
          whatsappPhoneNumberId={s?.whatsappPhoneNumberId}
          whatsappBusinessAccountId={s?.whatsappBusinessAccountId}
          whatsappFromNumber={s?.whatsappFromNumber}
          members={members.map((m) => ({
            id: m.id,
            userId: m.userId,
            name: m.user.name ?? m.user.email ?? 'Unknown',
            email: m.user.email ?? '',
            role: m.role,
            isCurrentUser: m.userId === session.user.id,
            assignedProjectIds: m.projectAssignments.map((assignment) => assignment.projectId),
          }))}
          projectOptions={projects}
          pendingInvites={invites.map((inv) => ({
            id: inv.id,
            email: inv.email,
            role: inv.role,
            sentAt: inv.sentAt,
            expiresAt: inv.expiresAt,
          }))}
          ssoEnabled={s?.ssoEnabled}
          ssoProtocol={s?.ssoProtocol}
          samlEnabled={s?.samlEnabled}
          samlEntryPoint={s?.samlEntryPoint}
          samlIssuer={s?.samlIssuer}
          oidcEnabled={s?.oidcEnabled}
          oidcClientId={s?.oidcClientId}
          oidcDiscoveryUrl={s?.oidcDiscoveryUrl}
          ssoAutoProvision={s?.ssoAutoProvision}
          ssoDefaultRole={s?.ssoDefaultRole}
          ai={{
            aiEnabled: s?.aiEnabled ?? false,
            aiProvider: s?.aiProvider ?? 'anthropic',
            aiModel: s?.aiModel ?? 'claude-sonnet-4-6',
            aiDailyRefreshLimit: s?.aiDailyRefreshLimit ?? 10,
            aiAnalyzeActivity: s?.aiAnalyzeActivity ?? true,
            aiAnalyzeDeliverables: s?.aiAnalyzeDeliverables ?? true,
            aiAnalyzeRaid: s?.aiAnalyzeRaid ?? true,
            aiAnalyzeDecisions: s?.aiAnalyzeDecisions ?? true,
            aiAnalyzeNotes: s?.aiAnalyzeNotes ?? true,
          }}
        />
      </div>
    </>
  )
}
