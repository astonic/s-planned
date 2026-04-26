import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { InviteAcceptanceClient } from './_components/InviteAcceptanceClient'

interface Props {
  params: { token: string }
}

export default async function InviteAcceptancePage({ params }: Props) {
  const invite = await prisma.invite.findUnique({
    where: { token: params.token },
    include: { organization: true },
  })

  if (!invite) notFound()
  if (invite.status !== 'pending') {
    // Already accepted or revoked
    notFound()
  }
  if (new Date() > invite.expiresAt) {
    // Expired
    notFound()
  }

  const session = await getServerSession(authOptions)

  // If user is logged in
  if (session?.user?.id) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      // Logged in but wrong email
      return (
        <InviteAcceptanceClient
          mode="login-required"
          inviteEmail={invite.email}
          orgName={invite.organization.name}
          inviteToken={invite.token}
          currentUserEmail={session.user.email ?? ''}
        />
      )
    }

    // Logged in with correct email — auto-accept
    return (
      <InviteAcceptanceClient
        mode="auto-accept"
        inviteEmail={invite.email}
        orgName={invite.organization.name}
        inviteToken={invite.token}
        currentUserEmail={session.user.email ?? ''}
        currentUserId={session.user.id}
      />
    )
  }

  // Not logged in
  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: invite.email, mode: 'insensitive' } },
  })

  if (existingUser) {
    // User exists, need to log in
    return (
      <InviteAcceptanceClient
        mode="login"
        inviteEmail={invite.email}
        orgName={invite.organization.name}
        inviteToken={invite.token}
      />
    )
  }

  // New user, show registration form
  return (
    <InviteAcceptanceClient
      mode="register"
      inviteEmail={invite.email}
      orgName={invite.organization.name}
      inviteToken={invite.token}
    />
  )
}
