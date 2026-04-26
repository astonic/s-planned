'use client'

import { useTransition } from 'react'
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
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import { createVendor, updateVendor, deleteVendor } from '@/lib/actions/stakeholders'
import type { Vendor } from '@prisma/client'

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
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  type: z.enum(['supplier', 'service_provider']),
  contactName: z.string().optional(),
  contactRole: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// ── Props ─────────────────────────────────────────────────────────────────────

interface VendorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendor?: Vendor
  mode: 'create' | 'edit' | 'delete'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function VendorDialog({ open, onOpenChange, vendor, mode }: VendorDialogProps) {
  const styles = useStyles()
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: vendor?.name ?? '',
      type: (vendor?.type as FormValues['type']) ?? 'supplier',
      contactName: vendor?.contactName ?? '',
      contactRole: vendor?.contactRole ?? '',
      email: vendor?.email ?? '',
      phone: vendor?.phone ?? '',
      address: vendor?.address ?? '',
      website: vendor?.website ?? '',
      notes: vendor?.notes ?? '',
    },
  })

  function handleClose() {
    reset()
    onOpenChange(false)
  }

  // Delete mode
  if (mode === 'delete' && vendor) {
    return (
      <Dialog open={open} onOpenChange={(_, d) => onOpenChange(d.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Delete Vendor</DialogTitle>
            <DialogContent>
              Are you sure you want to delete <strong>{vendor.name}</strong>? This will also remove
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
                    await deleteVendor(vendor.id)
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
          ? await createVendor(values)
          : await updateVendor(vendor!.id, values)
      if (result.ok) handleClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(_, d) => onOpenChange(d.open)}>
      <DialogSurface>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody>
            <DialogTitle>{mode === 'create' ? 'Add Vendor' : 'Edit Vendor'}</DialogTitle>
            <DialogContent>
              <div className={styles.form}>
                {/* Company name + type */}
                <div className={styles.row}>
                  <Field
                    label="Company name"
                    required
                    validationState={errors.name ? 'error' : 'none'}
                    validationMessage={errors.name?.message}
                  >
                    <Input {...register('name')} placeholder="Acme Supplies Ltd" />
                  </Field>

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
                          <option value="supplier">Supplier</option>
                          <option value="service_provider">Service Provider</option>
                        </Select>
                      )}
                    />
                  </Field>
                </div>

                {/* Contact name + role */}
                <div className={styles.row}>
                  <Field label="Contact name">
                    <Input {...register('contactName')} placeholder="John Doe" />
                  </Field>
                  <Field label="Contact role">
                    <Input {...register('contactRole')} placeholder="Account Manager" />
                  </Field>
                </div>

                {/* Email + Phone */}
                <div className={styles.row}>
                  <Field
                    label="Email"
                    validationState={errors.email ? 'error' : 'none'}
                    validationMessage={errors.email?.message}
                  >
                    <Input {...register('email')} type="email" placeholder="contact@acme.com" />
                  </Field>
                  <Field label="Phone">
                    <Input {...register('phone')} placeholder="+1 555 000 0000" />
                  </Field>
                </div>

                {/* Address */}
                <Field label="Address">
                  <Input {...register('address')} placeholder="123 Main St, City" />
                </Field>

                {/* Website */}
                <Field
                  label="Website"
                  validationState={errors.website ? 'error' : 'none'}
                  validationMessage={errors.website?.message}
                >
                  <Input {...register('website')} placeholder="https://acme.com" />
                </Field>

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
                    ? 'Add Vendor'
                    : 'Save Changes'}
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  )
}
