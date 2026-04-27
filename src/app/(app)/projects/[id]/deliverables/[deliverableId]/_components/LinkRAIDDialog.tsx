'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Badge,
  Input,
  Text,
  Spinner,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  createTableColumn,
  type TableColumnDefinition,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import { LinkRegular, SearchRegular } from '@fluentui/react-icons'
import type { RAIDType, RAIDSeverity, RAIDStatus } from '@prisma/client'
import { linkRAIDToDeliverable } from '@/lib/actions/raid'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RAIDItemSummary {
  id: string
  type: RAIDType
  title: string
  severity: RAIDSeverity
  status: RAIDStatus
}

interface Props {
  deliverableId: string
  projectRAID: RAIDItemSummary[]
  linkedIds: Set<string>
}

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    maxHeight: '400px',
    overflowY: 'auto',
  },
  search: { marginBottom: tokens.spacingVerticalM },
  title: {
    flex: 1,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
  },
  empty: {
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
    padding: tokens.spacingVerticalM,
  },
})

// ── Badge helpers ─────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<RAIDType, 'brand' | 'danger' | 'warning' | 'informative'> = {
  risk: 'danger',
  assumption: 'informative',
  issue: 'warning',
  dependency: 'brand',
}

const SEVERITY_COLORS: Record<RAIDSeverity, 'subtle' | 'warning' | 'danger' | 'severe'> = {
  low: 'subtle',
  medium: 'warning',
  high: 'severe',
  critical: 'danger',
}

const TYPE_LABELS: Record<RAIDType, string> = {
  risk: 'Risk',
  assumption: 'Assumption',
  issue: 'Issue',
  dependency: 'Dependency',
}

const SEVERITY_LABELS: Record<RAIDSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

const STATUS_LABELS: Record<RAIDStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  closed: 'Closed',
}

// ── Row component ─────────────────────────────────────────────────────────────

function LinkButton({
  item,
  deliverableId,
  onLinked,
}: {
  item: RAIDItemSummary
  deliverableId: string
  onLinked: () => void
}) {
  const [isPending, startTransition] = useTransition()

  function handleLink() {
    startTransition(async () => {
      await linkRAIDToDeliverable(item.id, deliverableId)
      onLinked()
    })
  }

  return (
    <Button
      size="small"
      appearance="primary"
      icon={isPending ? <Spinner size="tiny" /> : <LinkRegular />}
      disabled={isPending}
      onClick={handleLink}
    >
      Link
    </Button>
  )
}

// ── Main dialog ───────────────────────────────────────────────────────────────

export function LinkRAIDDialog({ deliverableId, projectRAID, linkedIds }: Props) {
  const styles = useStyles()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const available = projectRAID.filter((item) => !linkedIds.has(item.id))
  const filtered = available.filter((item) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return [item.title, item.type, item.severity, item.status].join(' ').toLowerCase().includes(q)
  })
  const columns: TableColumnDefinition<RAIDItemSummary>[] = [
    createTableColumn({
      columnId: 'type',
      compare: (a, b) => a.type.localeCompare(b.type),
      renderHeaderCell: () => 'Type',
      renderCell: (item) => (
        <Badge appearance="tint" color={TYPE_COLORS[item.type]} size="small">
          {TYPE_LABELS[item.type]}
        </Badge>
      ),
    }),
    createTableColumn({
      columnId: 'title',
      compare: (a, b) => a.title.localeCompare(b.title),
      renderHeaderCell: () => 'Title',
      renderCell: (item) => <Text className={styles.title}>{item.title}</Text>,
    }),
    createTableColumn({
      columnId: 'severity',
      compare: (a, b) => a.severity.localeCompare(b.severity),
      renderHeaderCell: () => 'Severity',
      renderCell: (item) => (
        <Badge appearance="tint" color={SEVERITY_COLORS[item.severity]} size="small">
          {SEVERITY_LABELS[item.severity]}
        </Badge>
      ),
    }),
    createTableColumn({
      columnId: 'status',
      compare: (a, b) => a.status.localeCompare(b.status),
      renderHeaderCell: () => 'Status',
      renderCell: (item) => <Text size={200}>{STATUS_LABELS[item.status]}</Text>,
    }),
    createTableColumn({
      columnId: 'action',
      compare: () => 0,
      renderHeaderCell: () => '',
      renderCell: (item) => (
        <LinkButton item={item} deliverableId={deliverableId} onLinked={handleLinked} />
      ),
    }),
  ]

  function handleLinked() {
    router.refresh()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(_, d) => setOpen(d.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="primary" icon={<LinkRegular />} size="small">
          Link RAID Item
        </Button>
      </DialogTrigger>

      <DialogSurface>
        <DialogBody>
          <DialogTitle>Link a RAID Item</DialogTitle>
          <DialogContent>
            {available.length === 0 ? (
              <Text className={styles.empty}>
                All project RAID items are already linked to this deliverable.
              </Text>
            ) : (
              <div className={styles.list}>
                <Input
                  className={styles.search}
                  placeholder="Search RAID items..."
                  contentBefore={<SearchRegular />}
                  value={query}
                  onChange={(_, d) => setQuery(d.value)}
                />
                {filtered.length === 0 ? (
                  <Text className={styles.empty}>No RAID items match your search.</Text>
                ) : (
                  <DataGrid items={filtered} columns={columns} sortable size="small" getRowId={(item) => item.id}>
                    <DataGridHeader>
                      <DataGridRow>
                        {({ renderHeaderCell }) => (
                          <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                        )}
                      </DataGridRow>
                    </DataGridHeader>
                    <DataGridBody<RAIDItemSummary>>
                      {({ item, rowId }) => (
                        <DataGridRow key={rowId}>
                          {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                        </DataGridRow>
                      )}
                    </DataGridBody>
                  </DataGrid>
                )}
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
