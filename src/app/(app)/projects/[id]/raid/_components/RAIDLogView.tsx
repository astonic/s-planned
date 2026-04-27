'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  makeStyles,
  tokens,
  Button,
  Badge,
  Text,
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
  ArrowSortDownRegular,
  ArrowSortUpRegular,
  EditRegular,
  DeleteRegular,
  WarningRegular,
} from '@fluentui/react-icons'
import type { RAIDType, RAIDSeverity, RAIDStatus } from '@prisma/client'
import type { RAIDItem } from '@prisma/client'
import { deleteRAIDItem } from '@/lib/actions/raid'
import { RAIDItemDialog } from './RAIDItemDialog'
import type { RAIDOwnerOption } from './RAIDItemDialog'
import { SpTabBar } from '@/components/ui/SpTabBar'
import { SpGridToolbar } from '@/components/ui/SpGridToolbar'

export type RAIDItemWithCount = RAIDItem & {
  _count: { deliverables: number }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  kpiBar: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalL,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalXXL}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    flexWrap: 'wrap',
  },
  kpiItem: {
    display: 'flex',
    alignItems: 'baseline',
    gap: tokens.spacingHorizontalXS,
  },
  kpiValue: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: 1,
    color: tokens.colorNeutralForeground1,
  },
  kpiValueDanger: {
    color: tokens.colorPaletteRedForeground1,
  },
  kpiLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
  },
  kpiDivider: {
    width: '1px',
    height: '20px',
    backgroundColor: tokens.colorNeutralStroke2,
    flexShrink: 0,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalXXL}`,
    gap: tokens.spacingVerticalM,
  },
  toolbarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  toolbarLeft: { flex: 1 },
  statusPills: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    alignItems: 'center',
    flexShrink: 0,
  },
  gridWrap: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'auto',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  table: { minWidth: '860px', width: '100%' },
  headerRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(240px, 1fr) 110px 100px 110px 140px 110px 68px 76px',
    height: '36px',
    alignItems: 'center',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    position: 'sticky' as const,
    top: 0,
    zIndex: 1,
  },
  hCell: {
    padding: '0 8px',
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sortBtn: {
    justifyContent: 'flex-start',
    minWidth: 'auto',
    padding: '0 4px',
    height: '28px',
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    borderRadius: tokens.borderRadiusSmall,
    gap: '4px',
  },
  sortBtnActive: { color: tokens.colorBrandForeground1 },
  dataRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(240px, 1fr) 110px 100px 110px 140px 110px 68px 76px',
    minHeight: '44px',
    alignItems: 'center',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
    ':last-child': { borderBottom: 'none' },
  },
  cell: {
    padding: '8px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
  },
  titleCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '8px',
    overflow: 'hidden',
    minWidth: 0,
    alignItems: 'flex-start',
  },
  titleText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  },
  descText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase100,
  },
  actionCell: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    padding: '0 4px',
  },
  empty: {
    padding: `${tokens.spacingVerticalXL} ${tokens.spacingHorizontalL}`,
    textAlign: 'center' as const,
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

type TypeFilter = 'all' | RAIDType
type StatusFilter = 'all' | RAIDStatus
type SortKey = 'title' | 'type' | 'severity' | 'status' | 'owner' | 'dueDate'
type SortDir = 'asc' | 'desc'

const SEVERITY_ORDER: Record<RAIDSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 }
const STATUS_ORDER: Record<RAIDStatus, number> = { open: 0, in_progress: 1, closed: 2 }

// ── Stats ─────────────────────────────────────────────────────────────────────

interface StatsProps {
  total: number
  byType: { risk: number; assumption: number; issue: number; dependency: number }
  bySeverity: { critical: number; high: number }
  openCount: number
  closedCount: number
}

function KpiBar({ total, byType, bySeverity, openCount, closedCount }: StatsProps) {
  const styles = useStyles()
  const hasCritical = bySeverity.critical > 0

  return (
    <div className={styles.kpiBar}>
      <div className={styles.kpiItem}>
        <span className={styles.kpiValue}>{total}</span>
        <span className={styles.kpiLabel}>Total</span>
      </div>
      <div className={styles.kpiDivider} />
      <div className={styles.kpiItem}>
        <span className={styles.kpiValue}>{byType.risk}</span>
        <span className={styles.kpiLabel}>Risks</span>
      </div>
      <div className={styles.kpiItem}>
        <span className={styles.kpiValue}>{byType.assumption}</span>
        <span className={styles.kpiLabel}>Assumptions</span>
      </div>
      <div className={styles.kpiItem}>
        <span className={styles.kpiValue}>{byType.issue}</span>
        <span className={styles.kpiLabel}>Issues</span>
      </div>
      <div className={styles.kpiItem}>
        <span className={styles.kpiValue}>{byType.dependency}</span>
        <span className={styles.kpiLabel}>Dependencies</span>
      </div>
      <div className={styles.kpiDivider} />
      <div className={styles.kpiItem}>
        <span className={`${styles.kpiValue} ${hasCritical ? styles.kpiValueDanger : ''}`}>
          {openCount}
        </span>
        <span className={styles.kpiLabel}>Open</span>
        {hasCritical && (
          <Badge appearance="tint" color="danger" size="small" icon={<WarningRegular />}>
            {bySeverity.critical} critical
          </Badge>
        )}
      </div>
      <div className={styles.kpiItem}>
        <span className={styles.kpiValue}>{closedCount}</span>
        <span className={styles.kpiLabel}>Closed</span>
      </div>
    </div>
  )
}

// ── Delete Confirmation Dialog ─────────────────────────────────────────────────

function DeleteConfirmDialog({ item, onDeleted }: { item: RAIDItemWithCount; onDeleted: () => void }) {
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
        <Button appearance="subtle" icon={<DeleteRegular />} size="small" aria-label="Delete RAID item" />
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
              Are you sure you want to delete <strong>&ldquo;{item.title}&rdquo;</strong>? This action cannot be undone.
            </Text>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary" disabled={isPending}>Cancel</Button>
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
  people: RAIDOwnerOption[]
  initialTypeFilter?: TypeFilter
}

export function RAIDLogView({ projectId, items, stats, people, initialTypeFilter = 'all' }: Props) {
  const styles = useStyles()

  const [typeFilter, setTypeFilter] = useState<TypeFilter>(initialTypeFilter)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('severity')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [editingItem, setEditingItem] = useState<RAIDItemWithCount | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  useEffect(() => {
    setTypeFilter(initialTypeFilter)
  }, [initialTypeFilter])

  const dir = sortDir === 'asc' ? 1 : -1
  const sortedItems = [...items].sort((a, b) => {
    if (sortKey === 'title')    return a.title.localeCompare(b.title) * dir
    if (sortKey === 'type')     return a.type.localeCompare(b.type) * dir
    if (sortKey === 'severity') return (SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]) * dir
    if (sortKey === 'status')   return (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) * dir
    if (sortKey === 'owner')    return ((a.owner ?? '').localeCompare(b.owner ?? '')) * dir
    if (sortKey === 'dueDate')  return ((a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0)) * dir
    return 0
  })

  const filteredItems = sortedItems.filter((item) => {
    const q = search.trim().toLowerCase()
    if (deletedIds.has(item.id)) return false
    if (typeFilter !== 'all' && item.type !== typeFilter) return false
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    if (q) {
      const haystack = [item.title, item.description ?? '', item.owner ?? '', item.type, item.severity, item.status]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  const typeTabs = [
    { value: 'all' as const, label: 'All' },
    { value: 'risk' as const, label: `Risks (${items.filter(i => i.type === 'risk').length})` },
    { value: 'assumption' as const, label: `Assumptions (${items.filter(i => i.type === 'assumption').length})` },
    { value: 'issue' as const, label: `Issues (${items.filter(i => i.type === 'issue').length})` },
    { value: 'dependency' as const, label: `Dependencies (${items.filter(i => i.type === 'dependency').length})` },
  ]

  const statusPills: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Open', value: 'open' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Closed', value: 'closed' },
  ]

  return (
    <div className={styles.root}>
      {/* Compact KPI summary bar */}
      <KpiBar {...stats} />

      {/* Type tabs — matching SpTabBar used elsewhere */}
      <SpTabBar
        tabs={typeTabs}
        selectedValue={typeFilter}
        onTabSelect={(_, d) => setTypeFilter(d.value as TypeFilter)}
      />

      {/* Toolbar + grid */}
      <div className={styles.content}>
        <div className={styles.toolbarRow}>
          <div className={styles.toolbarLeft}>
            <SpGridToolbar
              search={search}
              onSearch={setSearch}
              searchPlaceholder="Search RAID items..."
            />
          </div>
          <div className={styles.statusPills}>
            {statusPills.map((pill) => (
              <Button
                key={pill.value}
                size="small"
                appearance={statusFilter === pill.value ? 'primary' : 'subtle'}
                onClick={() => setStatusFilter(pill.value)}
              >
                {pill.label}
              </Button>
            ))}
          </div>
          <Button appearance="primary" icon={<AddRegular />} onClick={() => setCreateOpen(true)}>
            Add Item
          </Button>
        </div>

        <div className={styles.gridWrap}>
          {filteredItems.length === 0 ? (
            <div className={styles.empty}>No RAID items match the current filters.</div>
          ) : (
            <div className={styles.table} role="table" aria-label="RAID Log">
              {/* Header */}
              <div className={styles.headerRow} role="row">
                {([
                  { key: 'title',    label: 'Title' },
                  { key: 'type',     label: 'Type' },
                  { key: 'severity', label: 'Severity' },
                  { key: 'status',   label: 'Status' },
                  { key: 'owner',    label: 'Owner' },
                  { key: 'dueDate',  label: 'Due Date' },
                  { key: null,       label: 'Linked' },
                  { key: null,       label: '' },
                ] as { key: SortKey | null; label: string }[]).map(({ key, label }, i) => (
                  <div key={i} className={styles.hCell} role="columnheader">
                    {key ? (
                      <Button
                        appearance="transparent"
                        className={`${styles.sortBtn} ${sortKey === key ? styles.sortBtnActive : ''}`}
                        onClick={() => toggleSort(key)}
                        icon={sortKey === key ? (sortDir === 'asc' ? <ArrowSortUpRegular /> : <ArrowSortDownRegular />) : undefined}
                        iconPosition="after"
                      >
                        {label}
                      </Button>
                    ) : (
                      <Text size={200} weight="semibold" style={{ color: tokens.colorNeutralForeground3, padding: '0 4px' }}>{label}</Text>
                    )}
                  </div>
                ))}
              </div>

              {/* Body */}
              {filteredItems.map((item) => (
                <div key={item.id} className={styles.dataRow} role="row">
                  <div className={styles.titleCell} role="cell">
                    <Text
                      size={200}
                      weight={item.severity === 'critical' ? 'semibold' : 'regular'}
                      className={styles.titleText}
                    >
                      {item.title}
                    </Text>
                    {item.description && (
                      <span className={styles.descText}>{item.description}</span>
                    )}
                  </div>
                  <div className={styles.cell} role="cell">
                    <Badge appearance="tint" color={TYPE_COLORS[item.type]} size="small">
                      {TYPE_LABELS[item.type]}
                    </Badge>
                  </div>
                  <div className={styles.cell} role="cell">
                    <Badge appearance="tint" color={SEVERITY_COLORS[item.severity]} size="small">
                      {SEVERITY_LABELS[item.severity]}
                    </Badge>
                  </div>
                  <div className={styles.cell} role="cell">
                    <Badge appearance="tint" color={STATUS_COLORS[item.status]} size="small">
                      {STATUS_LABELS[item.status]}
                    </Badge>
                  </div>
                  <div className={styles.cell} role="cell">
                    <Text size={200} style={{ color: item.owner ? undefined : tokens.colorNeutralForeground3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.owner ?? '—'}
                    </Text>
                  </div>
                  <div className={styles.cell} role="cell">
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3, whiteSpace: 'nowrap' }}>
                      {item.dueDate
                        ? new Date(item.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </Text>
                  </div>
                  <div className={styles.cell} role="cell">
                    {item._count.deliverables > 0 ? (
                      <Badge appearance="tint" color="informative" size="small">{item._count.deliverables}</Badge>
                    ) : (
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>—</Text>
                    )}
                  </div>
                  <div className={styles.actionCell} role="cell">
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <RAIDItemDialog
        projectId={projectId}
        mode="create"
        people={people}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      {editingItem && (
        <RAIDItemDialog
          projectId={projectId}
          mode="edit"
          item={editingItem}
          people={people}
          open={!!editingItem}
          onOpenChange={(isOpen: boolean) => { if (!isOpen) setEditingItem(null) }}
        />
      )}
    </div>
  )
}
