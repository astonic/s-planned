'use client'

import { useState, useTransition } from 'react'
import {
  makeStyles,
  tokens,
  Button,
  Badge,
  Text,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableCellLayout,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Spinner,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components'
import {
  AddRegular,
  EditRegular,
  DeleteRegular,
  WarningRegular,
} from '@fluentui/react-icons'
import type { RAIDType, RAIDSeverity, RAIDStatus } from '@prisma/client'
import type { RAIDItemWithCount } from '../page'
import { deleteRAIDItem } from '@/lib/actions/raid'
import { RAIDItemDialog } from './RAIDItemDialog'

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  container: {
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalXXL}`,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: tokens.spacingHorizontalM,
  },
  statCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  statLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: 1,
  },
  statSub: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterBar: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
  },
  tableContainer: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
  actionCell: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
  },
  addButton: {
    marginLeft: 'auto',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyState: {
    padding: `${tokens.spacingVerticalXL} ${tokens.spacingHorizontalL}`,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
  },
})

// ── Badge colour maps ─────────────────────────────────────────────────────────

const TYPE_COLORS: Record<RAIDType, 'danger' | 'informative' | 'warning' | 'important'> = {
  risk: 'danger',
  assumption: 'informative',
  issue: 'warning',
  dependency: 'important',
}

const TYPE_LABELS: Record<RAIDType, string> = {
  risk: 'Risk',
  assumption: 'Assumption',
  issue: 'Issue',
  dependency: 'Dependency',
}

const SEVERITY_COLORS: Record<RAIDSeverity, 'danger' | 'severe' | 'warning' | 'subtle'> = {
  critical: 'danger',
  high: 'severe',
  medium: 'warning',
  low: 'subtle',
}

const SEVERITY_LABELS: Record<RAIDSeverity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const STATUS_COLORS: Record<RAIDStatus, 'informative' | 'brand' | 'success'> = {
  open: 'informative',
  in_progress: 'brand',
  closed: 'success',
}

const STATUS_LABELS: Record<RAIDStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  closed: 'Closed',
}

// ── Filter types ──────────────────────────────────────────────────────────────

type TypeFilter = 'all' | RAIDType
type StatusFilter = 'all' | RAIDStatus

// ── Stats Card ────────────────────────────────────────────────────────────────

interface StatsProps {
  total: number
  byType: { risk: number; assumption: number; issue: number; dependency: number }
  bySeverity: { critical: number; high: number }
  openCount: number
  closedCount: number
}

function StatCards({ total, byType, bySeverity, openCount, closedCount }: StatsProps) {
  const styles = useStyles()
  const hasCritical = bySeverity.critical > 0

  return (
    <div className={styles.statsRow}>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>Total Items</span>
        <span className={styles.statValue}>{total}</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>Risks</span>
        <span className={styles.statValue}>{byType.risk}</span>
        <span className={styles.statSub}>
          {byType.assumption} assumption{byType.assumption !== 1 ? 's' : ''},
          {' '}{byType.issue} issue{byType.issue !== 1 ? 's' : ''},
          {' '}{byType.dependency} dependenc{byType.dependency !== 1 ? 'ies' : 'y'}
        </span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>Open</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
          <span className={styles.statValue} style={{ color: hasCritical ? tokens.colorPaletteRedForeground1 : undefined }}>
            {openCount}
          </span>
          {hasCritical && (
            <Badge appearance="tint" color="danger" size="small" icon={<WarningRegular />}>
              {bySeverity.critical} critical
            </Badge>
          )}
        </div>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>Closed</span>
        <span className={styles.statValue}>{closedCount}</span>
      </div>
    </div>
  )
}

// ── Delete Confirmation Dialog ─────────────────────────────────────────────────

interface DeleteDialogProps {
  item: RAIDItemWithCount
  onDeleted: () => void
}

function DeleteConfirmDialog({ item, onDeleted }: DeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteRAIDItem(item.id)
      if (result.ok) {
        setOpen(false)
        onDeleted()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button
          appearance="subtle"
          icon={<DeleteRegular />}
          size="small"
          aria-label="Delete RAID item"
        />
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Delete RAID Item</DialogTitle>
          <DialogContent>
            {error && (
              <MessageBar intent="error" style={{ marginBottom: tokens.spacingVerticalS }}>
                <MessageBarBody>{error}</MessageBarBody>
              </MessageBar>
            )}
            <Text>
              Are you sure you want to delete <strong>&ldquo;{item.title}&rdquo;</strong>? This action cannot
              be undone.
            </Text>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary" disabled={isPending}>
                Cancel
              </Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              onClick={handleDelete}
              disabled={isPending}
              icon={isPending ? <Spinner size="tiny" /> : undefined}
            >
              {isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  projectId: string
  items: RAIDItemWithCount[]
  stats: StatsProps
}

export function RAIDLogView({ projectId, items, stats }: Props) {
  const styles = useStyles()

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [editingItem, setEditingItem] = useState<RAIDItemWithCount | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  // Track deleted ids locally until revalidation
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())

  const filteredItems = items.filter((item) => {
    if (deletedIds.has(item.id)) return false
    if (typeFilter !== 'all' && item.type !== typeFilter) return false
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    return true
  })

  const typeButtons: { label: string; value: TypeFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Risk', value: 'risk' },
    { label: 'Assumption', value: 'assumption' },
    { label: 'Issue', value: 'issue' },
    { label: 'Dependency', value: 'dependency' },
  ]

  const statusButtons: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Open', value: 'open' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Closed', value: 'closed' },
  ]

  return (
    <div className={styles.container}>
      <StatCards {...stats} />

      {/* Filter bar + Add button */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Type:</span>
          {typeButtons.map((btn) => (
            <Button
              key={btn.value}
              size="small"
              appearance={typeFilter === btn.value ? 'primary' : 'subtle'}
              onClick={() => setTypeFilter(btn.value)}
            >
              {btn.label}
            </Button>
          ))}
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Status:</span>
          {statusButtons.map((btn) => (
            <Button
              key={btn.value}
              size="small"
              appearance={statusFilter === btn.value ? 'primary' : 'subtle'}
              onClick={() => setStatusFilter(btn.value)}
            >
              {btn.label}
            </Button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <Button
            appearance="primary"
            icon={<AddRegular />}
            onClick={() => setCreateOpen(true)}
          >
            Add RAID Item
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <Table aria-label="RAID Log table" size="small">
          <TableHeader>
            <TableRow>
              <TableHeaderCell style={{ width: '110px' }}>Type</TableHeaderCell>
              <TableHeaderCell>Title</TableHeaderCell>
              <TableHeaderCell style={{ width: '100px' }}>Severity</TableHeaderCell>
              <TableHeaderCell style={{ width: '110px' }}>Status</TableHeaderCell>
              <TableHeaderCell style={{ width: '130px' }}>Owner</TableHeaderCell>
              <TableHeaderCell style={{ width: '110px' }}>Due Date</TableHeaderCell>
              <TableHeaderCell style={{ width: '90px' }}>Linked</TableHeaderCell>
              <TableHeaderCell style={{ width: '90px' }}>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <div className={styles.emptyState}>
                    No RAID items match the current filters.
                  </div>
                </TableCell>
              </TableRow>
            )}
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <TableCellLayout>
                    <Badge appearance="tint" color={TYPE_COLORS[item.type]} size="small">
                      {TYPE_LABELS[item.type]}
                    </Badge>
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    <Text size={300} weight={item.severity === 'critical' ? 'semibold' : 'regular'}>
                      {item.title}
                    </Text>
                    {item.description && (
                      <Text
                        size={200}
                        style={{
                          color: tokens.colorNeutralForeground3,
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '360px',
                        }}
                      >
                        {item.description}
                      </Text>
                    )}
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    <Badge
                      appearance="tint"
                      color={SEVERITY_COLORS[item.severity]}
                      size="small"
                    >
                      {SEVERITY_LABELS[item.severity]}
                    </Badge>
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    <Badge
                      appearance="tint"
                      color={STATUS_COLORS[item.status]}
                      size="small"
                    >
                      {STATUS_LABELS[item.status]}
                    </Badge>
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    <Text size={200} style={{ color: item.owner ? undefined : tokens.colorNeutralForeground3 }}>
                      {item.owner ?? '—'}
                    </Text>
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      {item.dueDate
                        ? new Date(item.dueDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </Text>
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    {item._count.deliverables > 0 ? (
                      <Badge appearance="tint" color="informative" size="small">
                        {item._count.deliverables}
                      </Badge>
                    ) : (
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>—</Text>
                    )}
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    <div className={styles.actionCell}>
                      <Button
                        appearance="subtle"
                        icon={<EditRegular />}
                        size="small"
                        aria-label="Edit RAID item"
                        onClick={() => setEditingItem(item)}
                      />
                      <DeleteConfirmDialog
                        item={item}
                        onDeleted={() => setDeletedIds((prev) => new Set(Array.from(prev).concat(item.id)))}
                      />
                    </div>
                  </TableCellLayout>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create dialog */}
      <RAIDItemDialog
        projectId={projectId}
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {/* Edit dialog */}
      {editingItem && (
        <RAIDItemDialog
          projectId={projectId}
          mode="edit"
          item={editingItem}
          open={!!editingItem}
          onOpenChange={(isOpen: boolean) => { if (!isOpen) setEditingItem(null) }}
        />
      )}
    </div>
  )
}
