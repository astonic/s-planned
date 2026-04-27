'use client'

import { useEffect, useTransition } from 'react'
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
import { createRAIDItem, updateRAIDItem } from '@/lib/actions/raid'
import type { RAIDItemWithCount } from './RAIDLogView'

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    minWidth: '520px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
  },
})

// ── Zod schema ────────────────────────────────────────────────────────────────

const formSchema = z.object({
  type: z.enum(['risk', 'assumption', 'issue', 'dependency']),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  likelihood: z.enum(['rare', 'unlikely', 'possible', 'likely', 'almost_certain']).optional(),
  status: z.enum(['open', 'in_progress', 'closed']),
  owner: z.string().optional(),
  dueDate: z.string().optional(),
  mitigationPlan: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// ── Default values ────────────────────────────────────────────────────────────

const DEFAULT_VALUES: FormValues = {
  type: 'risk',
  title: '',
  description: '',
  severity: 'medium',
  likelihood: undefined,
  status: 'open',
  owner: '',
  dueDate: '',
  mitigationPlan: '',
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  projectId: string
  mode: 'create' | 'edit'
  item?: RAIDItemWithCount
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RAIDItemDialog({ projectId, mode, item, open, onOpenChange }: Props) {
  const styles = useStyles()
  const [isPending, startTransition] = useTransition()

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
  })

  // Populate form when opening in edit mode
  useEffect(() => {
    if (open && mode === 'edit' && item) {
      reset({
        type: item.type,
        title: item.title,
        description: item.description ?? '',
        severity: item.severity,
        likelihood: item.likelihood ?? undefined,
        status: item.status,
        owner: item.owner ?? '',
        dueDate: item.dueDate
          ? new Date(item.dueDate).toISOString().split('T')[0]
          : '',
        mitigationPlan: item.mitigationPlan ?? '',
      })
    } else if (open && mode === 'create') {
      reset(DEFAULT_VALUES)
    }
  }, [open, mode, item, reset])

  const typeValue = watch('type')
  const showLikelihood = typeValue === 'risk'
  const showMitigationPlan = typeValue === 'risk' || typeValue === 'issue'

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      let result

      if (mode === 'create') {
        result = await createRAIDItem({
          projectId,
          type: values.type,
          title: values.title,
          description: values.description || undefined,
          severity: values.severity,
          likelihood: showLikelihood ? values.likelihood : undefined,
          owner: values.owner || undefined,
          dueDate: values.dueDate ? new Date(values.dueDate) : undefined,
          mitigationPlan: showMitigationPlan ? (values.mitigationPlan || undefined) : undefined,
        })
      } else {
        result = await updateRAIDItem(item!.id, {
          type: values.type,
          title: values.title,
          description: values.description || undefined,
          severity: values.severity,
          likelihood: showLikelihood ? values.likelihood : undefined,
          status: values.status,
          owner: values.owner || undefined,
          dueDate: values.dueDate ? new Date(values.dueDate) : null,
          mitigationPlan: showMitigationPlan ? (values.mitigationPlan || undefined) : undefined,
        })
      }

      if (result.ok) {
        onOpenChange(false)
      } else {
        setError('root', { message: result.error })
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(_, data) => {
        if (!isPending) onOpenChange(data.open)
      }}
    >
      <DialogSurface>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody>
            <DialogTitle>
              {mode === 'create' ? 'Add RAID Item' : 'Edit RAID Item'}
            </DialogTitle>

            <DialogContent>
              <div className={styles.form}>
                {errors.root && (
                  <MessageBar intent="error">
                    <MessageBarBody>{errors.root.message}</MessageBarBody>
                  </MessageBar>
                )}

                {/* Type + Severity row */}
                <div className={styles.row}>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Field
                        label="Type"
                        required
                        validationMessage={errors.type?.message}
                        validationState={errors.type ? 'error' : 'none'}
                      >
                        <Select {...field}>
                          <option value="risk">Risk</option>
                          <option value="assumption">Assumption</option>
                          <option value="issue">Issue</option>
                          <option value="dependency">Dependency</option>
                        </Select>
                      </Field>
                    )}
                  />

                  <Controller
                    name="severity"
                    control={control}
                    render={({ field }) => (
                      <Field
                        label="Severity"
                        required
                        validationMessage={errors.severity?.message}
                        validationState={errors.severity ? 'error' : 'none'}
                      >
                        <Select {...field}>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </Select>
                      </Field>
                    )}
                  />
                </div>

                {/* Title */}
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <Field
                      label="Title"
                      required
                      validationMessage={errors.title?.message}
                      validationState={errors.title ? 'error' : 'none'}
                    >
                      <Input {...field} placeholder="Describe the risk, assumption, issue, or dependency…" />
                    </Field>
                  )}
                />

                {/* Description */}
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Field
                      label="Description"
                      validationMessage={errors.description?.message}
                      validationState={errors.description ? 'error' : 'none'}
                    >
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Additional context or details…"
                        resize="vertical"
                      />
                    </Field>
                  )}
                />

                {/* Likelihood — only for risks */}
                {showLikelihood && (
                  <Controller
                    name="likelihood"
                    control={control}
                    render={({ field }) => (
                      <Field
                        label="Likelihood"
                        validationMessage={errors.likelihood?.message}
                        validationState={errors.likelihood ? 'error' : 'none'}
                      >
                        <Select
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value || undefined)}
                        >
                          <option value="">— Select —</option>
                          <option value="rare">Rare</option>
                          <option value="unlikely">Unlikely</option>
                          <option value="possible">Possible</option>
                          <option value="likely">Likely</option>
                          <option value="almost_certain">Almost Certain</option>
                        </Select>
                      </Field>
                    )}
                  />
                )}

                {/* Status (only in edit mode) */}
                {mode === 'edit' && (
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Field
                        label="Status"
                        validationMessage={errors.status?.message}
                        validationState={errors.status ? 'error' : 'none'}
                      >
                        <Select {...field}>
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="closed">Closed</option>
                        </Select>
                      </Field>
                    )}
                  />
                )}

                {/* Owner + Due Date row */}
                <div className={styles.row}>
                  <Controller
                    name="owner"
                    control={control}
                    render={({ field }) => (
                      <Field
                        label="Owner"
                        validationMessage={errors.owner?.message}
                        validationState={errors.owner ? 'error' : 'none'}
                      >
                        <Input {...field} placeholder="Name or team…" />
                      </Field>
                    )}
                  />

                  <Controller
                    name="dueDate"
                    control={control}
                    render={({ field }) => (
                      <Field
                        label="Due Date"
                        validationMessage={errors.dueDate?.message}
                        validationState={errors.dueDate ? 'error' : 'none'}
                      >
                        <Input {...field} type="date" />
                      </Field>
                    )}
                  />
                </div>

                {/* Mitigation Plan — only for risks and issues */}
                {showMitigationPlan && (
                  <Controller
                    name="mitigationPlan"
                    control={control}
                    render={({ field }) => (
                      <Field
                        label="Mitigation Plan"
                        validationMessage={errors.mitigationPlan?.message}
                        validationState={errors.mitigationPlan ? 'error' : 'none'}
                      >
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder="How will this be mitigated or resolved…"
                          resize="vertical"
                        />
                      </Field>
                    )}
                  />
                )}
              </div>
            </DialogContent>

            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                appearance="primary"
                disabled={isPending}
                icon={isPending ? <Spinner size="tiny" /> : undefined}
              >
                {isPending
                  ? mode === 'create' ? 'Creating…' : 'Saving…'
                  : mode === 'create' ? 'Create' : 'Save'}
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  )
}
