'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Badge,
  Button,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Field,
  Input,
  Textarea,
  Select,
  Spinner,
  MessageBar,
  MessageBarBody,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import {
  DismissRegular,
  LinkRegular,
  SearchRegular,
} from '@fluentui/react-icons'
import { createRAIDItem, updateRAIDItem, getRAIDLinkedDeliverables, linkRAIDToDeliverable, unlinkRAIDFromDeliverable } from '@/lib/actions/raid'
import { searchDeliverables } from '@/lib/actions/projects'
import { SpTabBar } from '@/components/ui/SpTabBar'
import type { RAIDItemWithCount } from './RAIDLogView'

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    minWidth: '560px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
  },
  delivTabWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    minWidth: '560px',
    minHeight: '300px',
  },
  searchRow: { display: 'flex', gap: tokens.spacingHorizontalS },
  delivList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    maxHeight: '340px',
    overflowY: 'auto',
  },
  delivRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  delivName: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 },
  empty: { color: tokens.colorNeutralForeground3, fontStyle: 'italic', padding: tokens.spacingVerticalM, textAlign: 'center' as const },
  sectionLabel: { color: tokens.colorNeutralForeground3, fontWeight: tokens.fontWeightSemibold, fontSize: tokens.fontSizeBase100, padding: `${tokens.spacingVerticalXS} 0` },
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

const STATUS_COLORS: Record<string, 'informative' | 'brand' | 'success'> = {
  planned: 'informative',
  in_progress: 'brand',
  delayed: 'informative',
  closed: 'success',
}

// ── Linked Deliverables tab ───────────────────────────────────────────────────

interface LinkedDeliverable { id: string; code: string; name: string; status: string }

function DeliverableLinkerTab({ raidItemId, projectId }: { raidItemId: string; projectId: string }) {
  const s = useStyles()
  const [linked, setLinked] = useState<LinkedDeliverable[]>([])
  const [results, setResults] = useState<LinkedDeliverable[]>([])
  const [query, setQuery] = useState('')
  const [loadingLinked, setLoadingLinked] = useState(true)
  const [searching, setSearching] = useState(false)
  const [linkPending, startLinkTransition] = useTransition()
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    getRAIDLinkedDeliverables(raidItemId).then((res) => {
      if (res.ok) setLinked(res.data)
      setLoadingLinked(false)
    })
  }, [raidItemId])

  function handleSearch() {
    if (!query.trim()) return
    setSearching(true)
    searchDeliverables(projectId, query.trim()).then((res) => {
      if (res.ok) setResults(res.data)
      setSearched(true)
      setSearching(false)
    })
  }

  function handleLink(d: LinkedDeliverable) {
    startLinkTransition(async () => {
      const res = await linkRAIDToDeliverable(raidItemId, d.id)
      if (res.ok) {
        setLinked((prev) => (prev.some((x) => x.id === d.id) ? prev : [...prev, d]))
        setResults((prev) => prev.filter((x) => x.id !== d.id))
      }
    })
  }

  function handleUnlink(id: string) {
    startLinkTransition(async () => {
      const res = await unlinkRAIDFromDeliverable(raidItemId, id)
      if (res.ok) setLinked((prev) => prev.filter((x) => x.id !== id))
    })
  }

  const linkedIds = new Set(linked.map((d) => d.id))
  const filteredResults = results.filter((d) => !linkedIds.has(d.id))

  return (
    <div className={s.delivTabWrap}>
      {/* Search */}
      <div className={s.searchRow}>
        <Input
          style={{ flex: 1 }}
          contentBefore={<SearchRegular />}
          placeholder="Search deliverables by name or code…"
          value={query}
          onChange={(_, data) => setQuery(data.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button appearance="primary" onClick={handleSearch} disabled={searching || !query.trim()}>
          {searching ? <Spinner size="tiny" /> : 'Search'}
        </Button>
      </div>

      <div className={s.delivList}>
        {/* Search results */}
        {searched && filteredResults.length > 0 && (
          <>
            <Text className={s.sectionLabel}>SEARCH RESULTS</Text>
            {filteredResults.map((d) => (
              <div key={d.id} className={s.delivRow}>
                <Text size={100} style={{ color: tokens.colorNeutralForeground3, flexShrink: 0 }}>{d.code}</Text>
                <Text size={200} className={s.delivName}>{d.name}</Text>
                <Badge appearance="tint" color={STATUS_COLORS[d.status] ?? 'informative'} size="small" style={{ flexShrink: 0 }}>{d.status.replace('_', ' ')}</Badge>
                <Button
                  size="small"
                  appearance="primary"
                  icon={linkPending ? <Spinner size="tiny" /> : <LinkRegular />}
                  disabled={linkPending}
                  onClick={() => handleLink(d)}
                >
                  Link
                </Button>
              </div>
            ))}
          </>
        )}
        {searched && filteredResults.length === 0 && (
          <Text className={s.empty}>No unlinked deliverables match your search.</Text>
        )}

        {/* Currently linked */}
        {loadingLinked ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: tokens.spacingVerticalM }}>
            <Spinner size="small" label="Loading linked deliverables…" />
          </div>
        ) : (
          <>
            <Text className={s.sectionLabel}>LINKED DELIVERABLES ({linked.length})</Text>
            {linked.length === 0 ? (
              <Text className={s.empty}>No deliverables linked yet. Search above to link one.</Text>
            ) : (
              linked.map((d) => (
                <div key={d.id} className={s.delivRow}>
                  <Text size={100} style={{ color: tokens.colorNeutralForeground3, flexShrink: 0 }}>{d.code}</Text>
                  <Text size={200} className={s.delivName}>{d.name}</Text>
                  <Badge appearance="tint" color={STATUS_COLORS[d.status] ?? 'informative'} size="small" style={{ flexShrink: 0 }}>{d.status.replace('_', ' ')}</Badge>
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={linkPending ? <Spinner size="tiny" /> : <DismissRegular />}
                    disabled={linkPending}
                    onClick={() => handleUnlink(d.id)}
                    aria-label="Unlink deliverable"
                  />
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
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
  const s = useStyles()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'details' | 'deliverables'>('details')

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
        dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '',
        mitigationPlan: item.mitigationPlan ?? '',
      })
    } else if (open && mode === 'create') {
      reset(DEFAULT_VALUES)
    }
    if (open) setActiveTab('details')
  }, [open, mode, item, reset])

  const typeValue = watch('type')
  const showLikelihood = typeValue === 'risk'
  const showMitigationPlan = typeValue === 'risk' || typeValue === 'issue'

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = mode === 'create'
        ? await createRAIDItem({
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
        : await updateRAIDItem(item!.id, {
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

      if (result.ok) {
        onOpenChange(false)
      } else {
        setError('root', { message: result.error })
      }
    })
  }

  const tabs = [
    { value: 'details' as const, label: 'Details' },
    { value: 'deliverables' as const, label: `Deliverables${item?._count.deliverables ? ` (${item._count.deliverables})` : ''}` },
  ]

  return (
    <Dialog open={open} onOpenChange={(_, data) => { if (!isPending) onOpenChange(data.open) }}>
      <DialogSurface style={{ maxWidth: 640, width: '100%' }}>
        <DialogBody>
          <DialogTitle>{mode === 'create' ? 'Add RAID Item' : 'Edit RAID Item'}</DialogTitle>

          <DialogContent>
            {mode === 'edit' && (
              <div style={{ marginBottom: '12px' }}>
                <SpTabBar
                  tabs={tabs}
                  selectedValue={activeTab}
                  onTabSelect={(_, d) => setActiveTab(d.value as 'details' | 'deliverables')}
                />
              </div>
            )}
            {activeTab === 'details' ? (
              <form id="raid-form" onSubmit={handleSubmit(onSubmit)}>
                <div className={s.form}>
                  {errors.root && (
                    <MessageBar intent="error">
                      <MessageBarBody>{errors.root.message}</MessageBarBody>
                    </MessageBar>
                  )}

                  <div className={s.row}>
                    <Controller name="type" control={control} render={({ field }) => (
                      <Field label="Type" required validationMessage={errors.type?.message} validationState={errors.type ? 'error' : 'none'}>
                        <Select {...field}>
                          <option value="risk">Risk</option>
                          <option value="assumption">Assumption</option>
                          <option value="issue">Issue</option>
                          <option value="dependency">Dependency</option>
                        </Select>
                      </Field>
                    )} />
                    <Controller name="severity" control={control} render={({ field }) => (
                      <Field label="Severity" required validationMessage={errors.severity?.message} validationState={errors.severity ? 'error' : 'none'}>
                        <Select {...field}>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </Select>
                      </Field>
                    )} />
                  </div>

                  <Controller name="title" control={control} render={({ field }) => (
                    <Field label="Title" required validationMessage={errors.title?.message} validationState={errors.title ? 'error' : 'none'}>
                      <Input {...field} placeholder="Describe the risk, assumption, issue, or dependency…" />
                    </Field>
                  )} />

                  <Controller name="description" control={control} render={({ field }) => (
                    <Field label="Description">
                      <Textarea {...field} rows={3} placeholder="Additional context or details…" resize="vertical" />
                    </Field>
                  )} />

                  {showLikelihood && (
                    <Controller name="likelihood" control={control} render={({ field }) => (
                      <Field label="Likelihood">
                        <Select value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || undefined)}>
                          <option value="">— Select —</option>
                          <option value="rare">Rare</option>
                          <option value="unlikely">Unlikely</option>
                          <option value="possible">Possible</option>
                          <option value="likely">Likely</option>
                          <option value="almost_certain">Almost Certain</option>
                        </Select>
                      </Field>
                    )} />
                  )}

                  {mode === 'edit' && (
                    <Controller name="status" control={control} render={({ field }) => (
                      <Field label="Status">
                        <Select {...field}>
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="closed">Closed</option>
                        </Select>
                      </Field>
                    )} />
                  )}

                  <div className={s.row}>
                    <Controller name="owner" control={control} render={({ field }) => (
                      <Field label="Owner">
                        <Input {...field} placeholder="Name or team…" />
                      </Field>
                    )} />
                    <Controller name="dueDate" control={control} render={({ field }) => (
                      <Field label="Due Date">
                        <Input {...field} type="date" />
                      </Field>
                    )} />
                  </div>

                  {showMitigationPlan && (
                    <Controller name="mitigationPlan" control={control} render={({ field }) => (
                      <Field label="Mitigation Plan">
                        <Textarea {...field} rows={3} placeholder="How will this be mitigated or resolved…" resize="vertical" />
                      </Field>
                    )} />
                  )}
                </div>
              </form>
            ) : (
              item && <DeliverableLinkerTab raidItemId={item.id} projectId={projectId} />
            )}
          </DialogContent>

          <DialogActions>
            <Button appearance="secondary" onClick={() => onOpenChange(false)} disabled={isPending}>
              {activeTab === 'deliverables' ? 'Close' : 'Cancel'}
            </Button>
            {activeTab === 'details' && (
              <Button type="submit" form="raid-form" appearance="primary" disabled={isPending} icon={isPending ? <Spinner size="tiny" /> : undefined}>
                {isPending
                  ? mode === 'create' ? 'Creating…' : 'Saving…'
                  : mode === 'create' ? 'Create' : 'Save'}
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
