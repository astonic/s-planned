'use client'

import { useEffect, useState, useTransition } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  makeStyles, tokens, Text, Input, Button, Field, Dialog,
  DialogSurface, DialogBody, DialogTitle, DialogContent,
  DialogActions, Spinner,
} from '@fluentui/react-components'
import { CheckmarkCircleRegular, DismissCircleRegular } from '@fluentui/react-icons'
import { acceptInvite } from '@/lib/actions/invites'

const useStyles = makeStyles({
  root: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  card: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingHorizontalXXL,
    maxWidth: '400px', width: '100%',
  },
  form: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM },
  button: { marginTop: tokens.spacingVerticalL },
  errorBox: {
    backgroundColor: tokens.colorStatusDangerBackground2,
    border: `1px solid ${tokens.colorStatusDangerBorder1}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: tokens.spacingVerticalM,
    display: 'flex', gap: tokens.spacingHorizontalM, alignItems: 'flex-start',
  },
  successBox: {
    backgroundColor: tokens.colorStatusSuccessBackground2,
    border: `1px solid ${tokens.colorStatusSuccessBorder1}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: tokens.spacingVerticalM,
    display: 'flex', gap: tokens.spacingHorizontalM, alignItems: 'flex-start',
  },
  divider: { borderTop: `1px solid ${tokens.colorNeutralStroke2}`, margin: `${tokens.spacingVerticalL} 0` },
})

type Mode = 'login' | 'register' | 'auto-accept' | 'login-required'

interface Props {
  mode: Mode
  inviteEmail: string
  orgName: string
  inviteToken: string
  currentUserEmail?: string
  currentUserId?: string
}

export function InviteAcceptanceClient({
  mode, inviteEmail, orgName, inviteToken, currentUserEmail, currentUserId,
}: Props) {
  const styles = useStyles()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [, startAcceptTransition] = useTransition()
  const [accepting, setAccepting] = useState(false)

  // Auto-accept on mount in auto-accept mode
  useEffect(() => {
    if (mode === 'auto-accept' && currentUserId) {
      setAccepting(true)
      startAcceptTransition(async () => {
        const res = await acceptInvite({
          token: inviteToken,
          userId: currentUserId,
        })
        if (!res.ok) { setError(res.error); setAccepting(false); return }
        router.push('/')
      })
    }
  }, [mode, currentUserId, inviteToken, startAcceptTransition, router])

  function handleRegister() {
    setError(null)
    if (!password.trim()) { setError('Password is required'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }

    startTransition(async () => {
      const res = await acceptInvite({
        token: inviteToken,
        userName: inviteEmail.split('@')[0],
        passwordHash: password,
      })
      if (!res.ok) { setError(res.error); return }
      router.push('/')
    })
  }

  if (mode === 'login') {
    return (
      <div className={styles.root}>
        <div className={styles.card}>
          <Text size={500} weight="bold" block style={{ marginBottom: tokens.spacingVerticalL }}>
            Invitation to join {orgName}
          </Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalL }}>
            You have been invited to join <strong>{orgName}</strong> as a member.
          </Text>
          <div className={styles.divider} />
          <Text size={200} weight="semibold" style={{ marginTop: tokens.spacingVerticalL, marginBottom: tokens.spacingVerticalS }}>
            Sign in with your account
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalL }}>
            Email: <strong>{inviteEmail}</strong>
          </Text>
          <Button
            appearance="primary"
            style={{ width: '100%' }}
            onClick={() => signIn('credentials', {
              email: inviteEmail,
              redirect: false,
              callbackUrl: inviteToken ? `/invite/${inviteToken}` : '/',
            })}
          >
            Sign In
          </Button>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginTop: tokens.spacingVerticalM, textAlign: 'center' }}>
            Continue to the login page with your password.
          </Text>
        </div>
      </div>
    )
  }

  if (mode === 'register') {
    return (
      <div className={styles.root}>
        <div className={styles.card}>
          <Text size={500} weight="bold" block style={{ marginBottom: tokens.spacingVerticalL }}>
            Create your account
          </Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalL }}>
            You have been invited to join <strong>{orgName}</strong>.
          </Text>
          <div className={styles.form}>
            <Field label="Email">
              <Input value={inviteEmail} disabled />
            </Field>
            <Field label="Password" required>
              <Input
                type="password"
                value={password}
                onChange={(_, d) => setPassword(d.value)}
                placeholder="At least 8 characters"
              />
            </Field>
            <Field label="Confirm Password" required>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(_, d) => setConfirmPassword(d.value)}
                placeholder="Confirm your password"
              />
            </Field>
            {error && (
              <div className={styles.errorBox}>
                <DismissCircleRegular style={{ color: tokens.colorStatusDangerForeground1, flexShrink: 0 }} />
                <Text size={200} style={{ color: tokens.colorStatusDangerForeground1 }}>{error}</Text>
              </div>
            )}
            <Button
              appearance="primary"
              className={styles.button}
              onClick={handleRegister}
            >
              Create Account & Join
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'auto-accept') {
    return (
      <div className={styles.root}>
        <div className={styles.card}>
          <div className={styles.successBox} style={{ marginBottom: tokens.spacingVerticalL }}>
            <CheckmarkCircleRegular style={{ color: tokens.colorStatusSuccessForeground1 }} />
            <div>
              <Text size={200} weight="semibold" style={{ color: tokens.colorStatusSuccessForeground1 }}>
                Accepting invitation...
              </Text>
              <Text size={200} style={{ color: tokens.colorStatusSuccessForeground1 }}>
                Welcome to {orgName}. Redirecting to dashboard.
              </Text>
            </div>
          </div>
          {accepting && <Spinner label="Accepting invitation..." />}
        </div>
      </div>
    )
  }

  if (mode === 'login-required') {
    return (
      <div className={styles.root}>
        <div className={styles.card}>
          <div className={styles.errorBox} style={{ marginBottom: tokens.spacingVerticalL }}>
            <DismissCircleRegular style={{ color: tokens.colorStatusDangerForeground1 }} />
            <Text size={200} style={{ color: tokens.colorStatusDangerForeground1 }}>
              You are signed in as <strong>{currentUserEmail}</strong>, but this invitation is for <strong>{inviteEmail}</strong>. Please sign out and try again.
            </Text>
          </div>
          <Button
            appearance="primary"
            style={{ width: '100%' }}
            onClick={() => signIn('credentials', { redirect: true, callbackUrl: '/' })}
          >
            Sign Out &amp; Try Again
          </Button>
        </div>
      </div>
    )
  }

  return null
}
