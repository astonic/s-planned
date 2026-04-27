'use client'

import { useState, useTransition } from 'react'
import {
  makeStyles,
  tokens,
  Text,
  Badge,
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
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  createTableColumn,
  type TableColumnDefinition,
} from '@fluentui/react-components'
import type { DecisionStatus } from '@prisma/client'
import { createDecision, updateDecision, deleteDecision } from '@/lib/actions/notes-decisions'
import { EditRegular, DeleteRegular, AddRegular } from '@fluentui/react-icons'
import { SpGridToolbar } from '@/components/ui/SpGridToolbar'
import { SpSectionCard } from '@/components/ui/SpSectionCard'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DecisionItem {
  id: string
  description: string
  impact: string | null
  loggedDate: Date
  status: DecisionStatus
  comments: string | null
  loggedBy: string
  createdAt: Date
}

export interface DecisionLogProps {
  projectId: string
  initialDecisions: DecisionItem[]
}

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  decisionText: { fontWeight: tokens.fontWeightSemibold, color: tokens.colorNeutralForeground1 },
  toolbarWrapper: { padding: `0 ${tokens.spacingHorizontalL}` },
})

const STATUS_COLORS: Record<DecisionStatus, 'warning' | 'success' | 'danger' | 'informative'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  deferred: 'informative',
}
const STATUS_LABELS: Record<DecisionStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  deferred: 'Deferred',
}

// ── Create/Edit Dialog ────────────────────────────────────────────────────────

function DecisionDialog({
  projectId,
  editing,
  onDone,
}: {
  projectId: string
  editing?: DecisionItem
  onDone: (decision: DecisionItem) => void
}) {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState(editing?.description ?? '')
  const [impact, setImpact] = useState(editing?.impact ?? '')
  const [status, setStatus] = useState<DecisionStatus>(editing?.status ?? 'pending')
  const [comments, setComments] = useState(editing?.comments ?? '')
  const [loggedDate, setLoggedDate] = useState(
    editing ? new Date(editing.loggedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  )
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function reset() {
    if (!editing) {
      setDescription(''); setImpact(''); setStatus('pending'); setComments(''); setError(null)
      setLoggedDate(new Date().toISOString().split('T')[0])
    }
  }

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      if (editing) {
        const result = await updateDecision(editing.id, {
          description, impact: impact || null, status,
          comments: comments || null,
          loggedDate: new Date(loggedDate),
        })
        if (!result.ok) { setError(result.error); return }
        onDone({ ...editing, description, impact: impact || null, status, comments: comments || null, loggedDate: new Date(loggedDate) })
      } else {
        const result = await createDecision(projectId, {
          description, impact: impact || undefined, status,
          comments: comments || undefined, loggedDate: new Date(loggedDate),
        })
        if (!result.ok) { setError(result.error); return }
        onDone({
          id: result.data.id,
          description, impact: impact || null, status,
          comments: comments || null,
          loggedDate: new Date(loggedDate),
          loggedBy: 'You',
          createdAt: new Date(),
        })
      }
      setOpen(false)
      reset()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(_, d) => { setOpen(d.open); if (!d.open) reset() }}>
      <DialogTrigger disableButtonEnhancement>
        {editing ? (
          <Button size="small" appearance="subtle" icon={<EditRegular />} aria-label="Edit decision" />
        ) : (
          <Button appearance="primary" size="small" icon={<AddRegular />}>Log Decision</Button>
        )}
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{editing ? 'Edit Decision' : 'Log Decision'}</DialogTitle>
          <DialogContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
              <Field label="Decision" required>
                <Textarea
                  value={description}
                  onChange={(_, d) => setDescription(d.value)}
                  placeholder="What was decided?"
                  rows={3}
                />
              </Field>
              <Field label="Impact">
                <Textarea
                  value={impact}
                  onChange={(_, d) => setImpact(d.value)}
                  placeholder="What are the consequences?"
                  rows={2}
                />
              </Field>
              <Field label="Status">
                <Select value={status} onChange={(_, d) => setStatus(d.value as DecisionStatus)}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="deferred">Deferred</option>
                </Select>
              </Field>
              <Field label="Date Logged">
                <Input type="date" value={loggedDate} onChange={(_, d) => setLoggedDate(d.value)} />
              </Field>
              <Field label="Comments">
                <Textarea
                  value={comments}
                  onChange={(_, d) => setComments(d.value)}
                  placeholder="Additional notes…"
                  rows={2}
                />
              </Field>
              {error && <Text style={{ color: tokens.colorStatusDangerForeground1 }} size={200}>{error}</Text>}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="subtle" onClick={() => { setOpen(false); reset() }}>Cancel</Button>
            <Button appearance="primary" onClick={handleSubmit} disabled={pending || !description.trim()}>
              {pending ? <Spinner size="tiny" /> : (editing ? 'Save' : 'Log Decision')}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

// ── Delete Dialog ─────────────────────────────────────────────────────────────

function DeleteDecisionDialog({ decisionId, onDeleted }: { decisionId: string; onDeleted: () => void }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteDecision(decisionId)
      setOpen(false)
      onDeleted()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(_, d) => setOpen(d.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button size="small" appearance="subtle" icon={<DeleteRegular />} aria-label="Delete decision" />
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Delete Decision?</DialogTitle>
          <DialogContent>
            <Text>This action cannot be undone.</Text>
          </DialogContent>
          <DialogActions>
            <Button appearance="subtle" onClick={() => setOpen(false)}>Cancel</Button>
            <Button appearance="primary" onClick={handleDelete} disabled={pending}>
              {pending ? <Spinner size="tiny" /> : 'Delete'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function DecisionLog({ projectId, initialDecisions }: DecisionLogProps) {
  const styles = useStyles()
  const [decisions, setDecisions] = useState<DecisionItem[]>(initialDecisions)
  const [search, setSearch] = useState('')

  const columns: TableColumnDefinition<DecisionItem>[] = [
    createTableColumn({
      columnId: 'decision',
      compare: (a, b) => a.description.localeCompare(b.description),
      renderHeaderCell: () => 'Decision',
      renderCell: (d) => <Text className={styles.decisionText}>{d.description}</Text>,
    }),
    createTableColumn({
      columnId: 'status',
      compare: (a, b) => a.status.localeCompare(b.status),
      renderHeaderCell: () => 'Status',
      renderCell: (d) => (
        <Badge appearance="tint" color={STATUS_COLORS[d.status]} size="small">
          {STATUS_LABELS[d.status]}
        </Badge>
      ),
    }),
    createTableColumn({
      columnId: 'loggedDate',
      compare: (a, b) => new Date(a.loggedDate).getTime() - new Date(b.loggedDate).getTime(),
      renderHeaderCell: () => 'Date',
      renderCell: (d) => (
        <Text size={200}>
          {new Date(d.loggedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </Text>
      ),
    }),
    createTableColumn({
      columnId: 'loggedBy',
      compare: (a, b) => a.loggedBy.localeCompare(b.loggedBy),
      renderHeaderCell: () => 'Logged By',
      renderCell: (d) => <Text size={200}>{d.loggedBy}</Text>,
    }),
    createTableColumn({
      columnId: 'actions',
      compare: () => 0,
      renderHeaderCell: () => '',
      renderCell: (d) => (
        <div style={{ display: 'flex', gap: tokens.spacingHorizontalXS }}>
          <DecisionDialog projectId={projectId} editing={d} onDone={handleUpdated} />
          <DeleteDecisionDialog decisionId={d.id} onDeleted={() => handleDeleted(d.id)} />
        </div>
      ),
    }),
  ]

  const filtered = decisions.filter((d) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [d.description, d.impact ?? '', d.comments ?? '', d.loggedBy, d.status]
      .join(' ')
      .toLowerCase()
      .includes(q)
  })

  function handleCreated(decision: DecisionItem) {
    setDecisions((prev) => [decision, ...prev])
  }

  function handleUpdated(updated: DecisionItem) {
    setDecisions((prev) => prev.map((d) => d.id === updated.id ? updated : d))
  }

  function handleDeleted(id: string) {
    setDecisions((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div className={styles.root}>
      <SpSectionCard
        title="Decision Log"
        count={filtered.length}
        countLabel="decision"
        actions={<DecisionDialog projectId={projectId} onDone={handleCreated} />}
        isEmpty={decisions.length === 0}
        emptyMessage="No decisions logged yet."
      >
        <div className={styles.toolbarWrapper}>
          <SpGridToolbar search={search} onSearch={setSearch} searchPlaceholder="Search decisions..." />
        </div>
        <DataGrid items={filtered} columns={columns} sortable getRowId={(d) => d.id}>
          <DataGridHeader>
            <DataGridRow>
              {({ renderHeaderCell }) => (
                <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
              )}
            </DataGridRow>
          </DataGridHeader>
          <DataGridBody<DecisionItem>>
            {({ item, rowId }) => (
              <DataGridRow key={rowId}>
                {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
              </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
      </SpSectionCard>
    </div>
  )
}
