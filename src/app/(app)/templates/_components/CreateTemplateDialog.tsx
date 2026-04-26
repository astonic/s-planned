'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Button,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Field,
  Input,
  Textarea,
  Select,
  Spinner,
  Text,
  tokens,
} from '@fluentui/react-components'
import { AddRegular } from '@fluentui/react-icons'
import { createTemplate } from '@/lib/actions/templates'

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  industry: z.string().optional(),
  version: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const INDUSTRY_OPTIONS = [
  'Mining & Resources',
  'Construction & Engineering',
  'Healthcare',
  'Manufacturing',
  'Aviation',
  'Legal & Fiduciary',
]

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateTemplateDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', industry: '', version: '1.0' },
  })

  function onOpenChange(_: unknown, data: { open: boolean }) {
    if (!isPending) {
      setOpen(data.open)
      if (!data.open) {
        reset()
        setServerError(null)
      }
    }
  }

  function onSubmit(values: FormValues) {
    setServerError(null)
    startTransition(async () => {
      const result = await createTemplate(values)
      if (result.ok) {
        setOpen(false)
        reset()
        router.refresh()
      } else {
        setServerError(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="primary" icon={<AddRegular />}>
          New Template
        </Button>
      </DialogTrigger>

      <DialogSurface style={{ maxWidth: '520px', width: '100%' }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody>
            <DialogTitle>New Template</DialogTitle>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM, marginTop: tokens.spacingVerticalM }}>
                {/* Name */}
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Field
                      label="Name"
                      required
                      validationState={errors.name ? 'error' : 'none'}
                      validationMessage={errors.name?.message}
                    >
                      <Input {...field} placeholder="e.g. Oil & Gas Commissioning v1" autoFocus />
                    </Field>
                  )}
                />

                {/* Description */}
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Field label="Description">
                      <Textarea
                        {...field}
                        placeholder="What operational readiness activities does this template cover?"
                        rows={3}
                      />
                    </Field>
                  )}
                />

                {/* Industry + Version side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacingHorizontalM }}>
                  <Controller
                    name="industry"
                    control={control}
                    render={({ field }) => (
                      <Field label="Industry">
                        <Select {...field}>
                          <option value="">Select industry…</option>
                          {INDUSTRY_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    )}
                  />

                  <Controller
                    name="version"
                    control={control}
                    render={({ field }) => (
                      <Field label="Version">
                        <Input {...field} placeholder="1.0" />
                      </Field>
                    )}
                  />
                </div>

                {/* Server error */}
                {serverError && (
                  <Text size={200} style={{ color: tokens.colorStatusDangerForeground1 }}>
                    {serverError}
                  </Text>
                )}
              </div>
            </DialogContent>

            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary" disabled={isPending}>
                  Cancel
                </Button>
              </DialogTrigger>
              <Button
                type="submit"
                appearance="primary"
                disabled={isPending}
                icon={isPending ? <Spinner size="tiny" /> : undefined}
              >
                Create Template
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  )
}
