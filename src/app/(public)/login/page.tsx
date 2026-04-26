'use client'

import { useState, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import {
  Card,
  Field,
  Input,
  Button,
  Text,
  MessageBar,
  MessageBarBody,
  Spinner,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import { EyeRegular, EyeOffRegular } from '@fluentui/react-icons'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginValues = z.infer<typeof loginSchema>

const useStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 56px)',
    padding: tokens.spacingHorizontalXXL,
  },
  logo: {
    fontSize: '28px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalXXL,
  },
  card: { width: '100%', maxWidth: '400px' },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalXXL,
  },
  footer: {
    textAlign: 'center',
    marginTop: tokens.spacingVerticalM,
  },
})

export default function LoginPage() {
  const styles = useStyles()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/projects'
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  function onSubmit(values: LoginValues) {
    setServerError(null)
    startTransition(async () => {
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      })

      if (result?.error) {
        setServerError('Incorrect email or password. Please try again.')
        return
      }

      router.push(callbackUrl)
      router.refresh()
    })
  }

  return (
    <div className={styles.page}>
      <Text className={styles.logo}>S-Planned</Text>

      <Card className={styles.card}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
          <Text size={500} weight="semibold">Welcome back</Text>

          {serverError && (
            <MessageBar intent="error">
              <MessageBarBody>{serverError}</MessageBarBody>
            </MessageBar>
          )}

          <Field
            label="Work email"
            required
            validationMessage={form.formState.errors.email?.message}
            validationState={form.formState.errors.email ? 'error' : 'none'}
          >
            <Input
              type="email"
              placeholder="you@company.com"
              {...form.register('email')}
            />
          </Field>

          <Field
            label="Password"
            required
            validationMessage={form.formState.errors.password?.message}
            validationState={form.formState.errors.password ? 'error' : 'none'}
          >
            <Input
              type={showPassword ? 'text' : 'password'}
              contentAfter={
                <Button
                  appearance="transparent"
                  icon={showPassword ? <EyeOffRegular /> : <EyeRegular />}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  size="small"
                />
              }
              {...form.register('password')}
            />
          </Field>

          <Button
            appearance="primary"
            type="submit"
            disabled={isPending}
            icon={isPending ? <Spinner size="tiny" /> : undefined}
          >
            {isPending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Card>

      {/* ── Demo accounts (remove before production) ── */}
      <div style={{
        marginTop: 20, width: '100%', maxWidth: 400,
        border: '1.5px dashed #F7B900',
        borderRadius: 10, padding: '14px 18px',
        backgroundColor: '#FFFBEA',
      }}>
        <Text size={100} weight="semibold" style={{ color: '#856404', display: 'block', marginBottom: 10 }}>
          🧪 Demo accounts (testing only)
        </Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { label: 'Owner', email: 'admin@example.com', password: 'password123', color: '#C4314B' },
            { label: 'Member', email: 'member@example.com', password: 'password123', color: '#1474CB' },
            { label: 'Viewer', email: 'viewer@example.com', password: 'password123', color: '#13A10E' },
          ].map(({ label, email, password, color }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                form.setValue('email', email)
                form.setValue('password', password)
                form.handleSubmit(onSubmit)()
              }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '7px 12px', borderRadius: 6, border: `1px solid ${color}22`,
                backgroundColor: '#fff', cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = `${color}0D`)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color }}>
                {label}
              </span>
              <span style={{ fontSize: 11, color: '#888' }}>{email}</span>
            </button>
          ))}
        </div>
      </div>

      <Text size={200} className={styles.footer} style={{ marginTop: '16px' }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" style={{ color: tokens.colorBrandForeground1 }}>
          Create one
        </Link>
      </Text>
    </div>
  )
}
