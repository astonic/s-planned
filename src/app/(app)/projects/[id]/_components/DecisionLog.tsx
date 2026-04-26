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
  Divider,
} from '@fluentui/react-components'
import type { DecisionStatus } from '@prisma/client'
import { createDecision, updateDecision, deleteDecision } from '@/lib/actions/notes-decisions'

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
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    textAlign: 'left' as const,
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap' as const,
  },
  td: {
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    verticalAlign: 'top' as const,
    fontSize: tokens.fontSizeBase300,
  },
  tdActions: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    verticalAlign: 'middle' as const,
    whiteSpace: 'nowrap' as const,
  },
  description: { fontWeight: tokens.fontWeightSemibold, color: tokens.colorNeutralForeground1 },
  meta: { fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3, marginTop: '2px' },
  empty: { color: tokens.colorNeutralForeground3, fontStyle: 'italic', padding: tokens.spacingVerticalL, textAlign: 'center' as const },
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
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
          <Button size="small" appearance="subtle">Edit</Button>
        ) : (
          <Button appearance="primary" size="small">+ Log Decision</Button>
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
        <Button size="small" appearance="subtle">Delete</Button>
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
      <div className={styles.header}>
        <div>
          <Text size={400} weight="semibold" block>Decision Log</Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {decisions.length} decision{decisions.length !== 1 ? 's' : ''} logged
          </Text>
        </div>
        <DecisionDialog projectId={projectId} onDone={handleCreated} />
      </div>

      <Divider />

      {decisions.length === 0 ? (
        <div className={styles.card}>
          <Text className={styles.empty}>No decisions logged yet.</Text>
        </div>
      ) : (
        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Decision</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Date</th>
                <th className={styles.th}>Logged By</th>
                <th className={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {decisions.map((d) => (
                <tr key={d.id}>
                  <td className={styles.td}>
                    <Text className={styles.description}>{d.description}</Text>
                    {d.impact && <Text className={styles.meta}>Impact: {d.impact}</Text>}
                    {d.comments && <Text className={styles.meta}>{d.comments}</Text>}
                  </td>
                  <td className={styles.td}>
                    <Badge appearance="tint" color={STATUS_COLORS[d.status]} size="small">
                      {STATUS_LABELS[d.status]}
                    </Badge>
                  </td>
                  <td className={styles.td}>
                    <Text size={200}>
                      {new Date(d.loggedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Text>
                  </td>
                  <td className={styles.td}>
                    <Text size={200}>{d.loggedBy}</Text>
                  </td>
                  <td className={styles.tdActions}>
                    <DecisionDialog projectId={projectId} editing={d} onDone={handleUpdated} />
                    <DeleteDecisionDialog decisionId={d.id} onDeleted={() => handleDeleted(d.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
