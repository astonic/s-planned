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
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'
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

      <Text size={200} className={styles.footer} style={{ marginTop: '16px' }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" style={{ color: tokens.colorBrandForeground1 }}>
          Create one
        </Link>
      </Text>
    </div>
  )
}
