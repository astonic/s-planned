'use client'

import { useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Field,
  Input,
  Textarea,
  Select,
  Spinner,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import { createPerson, updatePerson, deletePerson } from '@/lib/actions/stakeholders'
import type { Person } from '@prisma/client'

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    minWidth: '480px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
  },
})

// ── Schema ────────────────────────────────────────────────────────────────────

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['internal', 'contractor', 'consultant']),
  company: z.string().optional(),
  role: z.enum(['owner', 'team', 'end_user']),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone is required'),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// ── Props ─────────────────────────────────────────────────────────────────────

interface PersonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  person?: Person
  mode: 'create' | 'edit' | 'delete'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PersonDialog({ open, onOpenChange, person, mode }: PersonDialogProps) {
  const styles = useStyles()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: person?.name ?? '',
      type: (person?.type as FormValues['type']) ?? 'internal',
      company: person?.company ?? '',
      role: (person?.role as FormValues['role']) ?? 'team',
      email: person?.email ?? '',
      phone: person?.phone ?? '',
      notes: person?.notes ?? '',
    },
  })

  useEffect(() => {
    reset({
      name: person?.name ?? '',
      type: (person?.type as FormValues['type']) ?? 'internal',
      company: person?.company ?? '',
      role: (person?.role as FormValues['role']) ?? 'team',
      email: person?.email ?? '',
      phone: person?.phone ?? '',
      notes: person?.notes ?? '',
    })
  }, [mode, open, person, reset])

  function handleClose() {
    reset()
    onOpenChange(false)
  }

  // Delete mode
  if (mode === 'delete' && person) {
    return (
      <Dialog open={open} onOpenChange={(_, d) => onOpenChange(d.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Delete Person</DialogTitle>
            <DialogContent>
              Are you sure you want to delete <strong>{person.name}</strong>? This will also remove
              them from any deliverables they are linked to.
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
              <Button
                appearance="primary"
                style={{ backgroundColor: tokens.colorPaletteRedBackground3 }}
                disabled={isPending}
                icon={isPending ? <Spinner size="tiny" /> : undefined}
                onClick={() => {
                  startTransition(async () => {
                    await deletePerson(person.id)
                    router.refresh()
                    handleClose()
                  })
                }}
              >
                {isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    )
  }

  // Create / Edit mode
  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createPerson(values)
          : await updatePerson(person!.id, values)
      if (result.ok) {
        router.refresh()
        handleClose()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(_, d) => onOpenChange(d.open)}>
      <DialogSurface>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody>
            <DialogTitle>{mode === 'create' ? 'Add Person' : 'Edit Person'}</DialogTitle>
            <DialogContent>
              <div className={styles.form}>
                {/* Name */}
                <Field
                  label="Full name"
                  required
                  validationState={errors.name ? 'error' : 'none'}
                  validationMessage={errors.name?.message}
                >
                  <Input {...register('name')} placeholder="Jane Smith" />
                </Field>

                {/* Type + Role */}
                <div className={styles.row}>
                  <Field
                    label="Type"
                    validationState={errors.type ? 'error' : 'none'}
                    validationMessage={errors.type?.message}
                  >
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <Select {...field}>
                          <option value="internal">Internal</option>
                          <option value="contractor">Contractor</option>
                          <option value="consultant">Consultant</option>
                        </Select>
                      )}
                    />
                  </Field>

                  <Field
                    label="Role"
                    validationState={errors.role ? 'error' : 'none'}
                    validationMessage={errors.role?.message}
                  >
                    <Controller
                      name="role"
                      control={control}
                      render={({ field }) => (
                        <Select {...field}>
                          <option value="owner">Owner</option>
                          <option value="team">Team</option>
                          <option value="end_user">End User</option>
                        </Select>
                      )}
                    />
                  </Field>
                </div>

                {/* Company */}
                <Field label="Company">
                  <Input {...register('company')} placeholder="Acme Mining Co" />
                </Field>

                {/* Email + Phone */}
                <div className={styles.row}>
                  <Field
                    label="Email"
                    validationState={errors.email ? 'error' : 'none'}
                    validationMessage={errors.email?.message}
                  >
                    <Input {...register('email')} type="email" placeholder="jane@example.com" />
                  </Field>

                  <Field
                    label="Phone"
                    required
                    validationState={errors.phone ? 'error' : 'none'}
                    validationMessage={errors.phone?.message}
                  >
                    <Input {...register('phone')} placeholder="+1 555 000 0000" />
                  </Field>
                </div>

                {/* Notes */}
                <Field label="Notes">
                  <Textarea {...register('notes')} rows={3} placeholder="Any additional notes…" />
                </Field>
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
              <Button
                type="submit"
                appearance="primary"
                disabled={isPending}
                icon={isPending ? <Spinner size="tiny" /> : undefined}
              >
                {isPending
                  ? mode === 'create'
                    ? 'Adding…'
                    : 'Saving…'
                  : mode === 'create'
                    ? 'Add Person'
                    : 'Save Changes'}
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  )
}
