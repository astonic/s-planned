'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type RegisterValues = z.infer<typeof registerSchema>

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
  card: { width: '100%', maxWidth: '420px' },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalXXL,
  },
})

export default function RegisterPage() {
  const styles = useStyles()
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  function onSubmit(values: RegisterValues) {
    setServerError(null)
    startTransition(async () => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: values.name, email: values.email, password: values.password }),
      })

      if (res.status === 409) {
        form.setError('email', { message: 'This email is already registered' })
        return
      }

      if (!res.ok) {
        setServerError('Registration failed. Please try again.')
        return
      }

      await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      })

      router.push('/')
      router.refresh()
    })
  }

  return (
    <div className={styles.page}>
      <Text className={styles.logo}>S-Planned</Text>

      <Card className={styles.card}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
          <Text size={500} weight="semibold">Create your account</Text>

          {serverError && (
            <MessageBar intent="error">
              <MessageBarBody>{serverError}</MessageBarBody>
            </MessageBar>
          )}

          <Field
            label="Full name"
            required
            validationMessage={form.formState.errors.name?.message}
            validationState={form.formState.errors.name ? 'error' : 'none'}
          >
            <Input placeholder="Jane Smith" {...form.register('name')} />
          </Field>

          <Field
            label="Work email"
            required
            validationMessage={form.formState.errors.email?.message}
            validationState={form.formState.errors.email ? 'error' : 'none'}
          >
            <Input type="email" placeholder="you@company.com" {...form.register('email')} />
          </Field>

          <Field
            label="Password"
            required
            validationMessage={form.formState.errors.password?.message}
            validationState={form.formState.errors.password ? 'error' : 'none'}
          >
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 8 characters"
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

          <Field
            label="Confirm password"
            required
            validationMessage={form.formState.errors.confirmPassword?.message}
            validationState={form.formState.errors.confirmPassword ? 'error' : 'none'}
          >
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Repeat your password"
              {...form.register('confirmPassword')}
            />
          </Field>

          <Button
            appearance="primary"
            type="submit"
            disabled={isPending}
            icon={isPending ? <Spinner size="tiny" /> : undefined}
          >
            {isPending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      </Card>

      <Text size={200} style={{ marginTop: '16px' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: tokens.colorBrandForeground1 }}>
          Sign in
        </Link>
      </Text>
    </div>
  )
}
