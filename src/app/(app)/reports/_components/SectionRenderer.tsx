'use client'

import {
  makeStyles,
  tokens,
  Text,
  Badge,
  Divider,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  createTableColumn,
  type TableColumnDefinition,
} from '@fluentui/react-components'

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  kpiRow: { display: 'flex', gap: tokens.spacingHorizontalL, flexWrap: 'wrap' as const },
  kpiCard: {
    flex: 1,
    minWidth: '140px',
    backgroundColor: 'var(--sp-surface-2)',
    border: '1px solid var(--sp-gray-200)',
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center',
  },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    textAlign: 'left' as const,
    backgroundColor: 'var(--sp-surface-2)',
    borderBottom: '1px solid var(--sp-gray-200)',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap' as const,
  },
  td: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderBottom: '1px solid var(--sp-gray-200)',
    fontSize: tokens.fontSizeBase300,
    verticalAlign: 'top' as const,
  },
  progressBar: {
    height: '8px', borderRadius: 'var(--sp-radius-pill)',
    backgroundColor: 'var(--sp-gray-100)', overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 'var(--sp-radius-pill)',
    background: 'var(--sp-grad-primary)',
    boxShadow: 'var(--sp-glow-blue)',
  },
  faBlock: {
    border: '1px solid var(--sp-gray-200)',
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    marginBottom: tokens.spacingVerticalM,
  },
  faHeader: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: 'var(--sp-surface-2)',
    display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM,
  },
})

const STATUS_COLORS: Record<string, 'warning' | 'success' | 'danger' | 'informative'> = {
  planned: 'informative', in_progress: 'warning', delayed: 'danger', closed: 'success',
}
const RAID_SEV_COLORS: Record<string, 'warning' | 'success' | 'danger' | 'informative' | 'important'> = {
  critical: 'danger', high: 'important', medium: 'warning', low: 'informative',
}
const RAID_STATUS_COLORS: Record<string, 'warning' | 'success' | 'danger' | 'informative'> = {
  open: 'danger', in_progress: 'warning', closed: 'success',
}
const DECISION_STATUS_COLORS: Record<string, 'warning' | 'success' | 'danger' | 'informative'> = {
  pending: 'warning', approved: 'success', rejected: 'danger', deferred: 'informative',
}

function fmtDate(d: unknown) {
  if (!d) return '—'
  return new Date(d as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtPct(n: number) { return `${n}%` }

function ReportDataGrid<T>({ items, columns }: { items: T[]; columns: TableColumnDefinition<T>[] }) {
  return (
    <DataGrid items={items} columns={columns} sortable size="small">
      <DataGridHeader>
        <DataGridRow>
          {({ renderHeaderCell }) => (
            <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
          )}
        </DataGridRow>
      </DataGridHeader>
      <DataGridBody<T>>
        {({ item, rowId }) => (
          <DataGridRow key={rowId}>
            {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
          </DataGridRow>
        )}
      </DataGridBody>
    </DataGrid>
  )
}

// ── Section renderers ─────────────────────────────────────────────────────────

export function SectionRenderer({ type, content }: { type: string; content: unknown }) {
  const styles = useStyles()
  const data = content as Record<string, unknown>

  if (type === 'executive_overview' || type === 'project_status') {
    const readinessPct = data.readinessPct as number
    return (
      <div className={styles.root}>
        <div className={styles.kpiRow}>
          {([
            { label: 'Readiness', value: `${readinessPct}%`, color: readinessPct >= 80 ? 'var(--sp-success)' : readinessPct >= 50 ? 'var(--sp-warning)' : 'var(--sp-danger)' },
            { label: 'Total Deliverables', value: String(data.totalDeliverables ?? 0) },
            { label: 'Closed', value: String(data.closedDeliverables ?? 0), color: 'var(--sp-success)' },
            { label: 'Open Risks', value: String(data.openRisks ?? 0), color: (data.openRisks as number) > 0 ? 'var(--sp-danger)' : undefined },
          ] as { label: string; value: string; color?: string }[]).map(({ label, value, color }) => (
            <div key={label} className={styles.kpiCard}>
              <Text style={{ fontSize: tokens.fontSizeBase600, fontWeight: tokens.fontWeightSemibold, lineHeight: 1, color }}>{value}</Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{label}</Text>
            </div>
          ))}
        </div>
        <div>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Period: {fmtDate(data.periodStart)} — {fmtDate(data.periodEnd)}
          </Text>
        </div>
        {!!data.projectStatus && (
          <div>
            <Badge appearance="tint" color="informative">{String(data.projectStatus).replace('_', ' ')}</Badge>
            {!!data.templateName && <Text size={200} style={{ marginLeft: 8, color: tokens.colorNeutralForeground3 }}>Template: {String(data.templateName)}</Text>}
          </div>
        )}
      </div>
    )
  }

  if (type === 'readiness_summary') {
    const byFA = (data.byFocusArea as Array<{ name: string; pct: number; closed: number; total: number }>) ?? []
    return (
      <div className={styles.root}>
        <Text size={300} weight="semibold">Overall: {fmtPct(data.overallPct as number)}</Text>
        {byFA.map((fa) => (
          <div key={fa.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Text size={200} style={{ width: 180, flexShrink: 0 }}>{fa.name}</Text>
            <div className={styles.progressBar} style={{ flex: 1 }}>
              <div className={styles.progressFill} style={{ width: `${fa.pct}%` }} />
            </div>
            <Text size={200} style={{ width: 36, textAlign: 'right', flexShrink: 0, fontWeight: tokens.fontWeightSemibold }}>{fmtPct(fa.pct)}</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3, flexShrink: 0 }}>{fa.closed}/{fa.total}</Text>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'key_risks' || type === 'raid_detail') {
    const items = (data.items as Array<Record<string, unknown>>) ?? []
    const columns: TableColumnDefinition<Record<string, unknown>>[] = [
      createTableColumn({
        columnId: 'type',
        compare: (a, b) => String(a.type ?? '').localeCompare(String(b.type ?? '')),
        renderHeaderCell: () => 'Type',
        renderCell: (r) => <Text size={200}>{String(r.type ?? '').toUpperCase().slice(0, 4)}</Text>,
      }),
      createTableColumn({
        columnId: 'title',
        compare: (a, b) => String(a.title ?? '').localeCompare(String(b.title ?? '')),
        renderHeaderCell: () => 'Title',
        renderCell: (r) => <Text size={200}>{String(r.title ?? '')}</Text>,
      }),
      createTableColumn({
        columnId: 'severity',
        compare: (a, b) => String(a.severity ?? '').localeCompare(String(b.severity ?? '')),
        renderHeaderCell: () => 'Severity',
        renderCell: (r) => <Badge appearance="tint" color={RAID_SEV_COLORS[String(r.severity)] ?? 'informative'} size="small">{String(r.severity ?? '')}</Badge>,
      }),
      createTableColumn({
        columnId: 'status',
        compare: (a, b) => String(a.status ?? '').localeCompare(String(b.status ?? '')),
        renderHeaderCell: () => 'Status',
        renderCell: (r) => <Badge appearance="tint" color={RAID_STATUS_COLORS[String(r.status)] ?? 'informative'} size="small">{String(r.status ?? '').replace('_', ' ')}</Badge>,
      }),
      createTableColumn({
        columnId: 'owner',
        compare: (a, b) => String(a.owner ?? '').localeCompare(String(b.owner ?? '')),
        renderHeaderCell: () => 'Owner',
        renderCell: (r) => <Text size={200}>{String(r.owner ?? '—')}</Text>,
      }),
      createTableColumn({
        columnId: 'dueDate',
        compare: (a, b) => new Date(a.dueDate as string).getTime() - new Date(b.dueDate as string).getTime(),
        renderHeaderCell: () => 'Due',
        renderCell: (r) => <Text size={200}>{fmtDate(r.dueDate)}</Text>,
      }),
    ]
    return (
      <div>
        {items.length === 0 && <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>No items.</Text>}
        {items.length > 0 && <ReportDataGrid items={items} columns={columns} />}
      </div>
    )
  }

  if (type === 'decisions' || type === 'decisions_detail') {
    const decisions = (data.decisions as Array<Record<string, unknown>>) ?? []
    const columns: TableColumnDefinition<Record<string, unknown>>[] = [
      createTableColumn({
        columnId: 'description',
        compare: (a, b) => String(a.description ?? '').localeCompare(String(b.description ?? '')),
        renderHeaderCell: () => 'Decision',
        renderCell: (d) => (
          <div>
            <Text size={200} weight="semibold" block>{String(d.description ?? '')}</Text>
            {!!d.impact && <Text size={200} style={{ color: tokens.colorNeutralForeground3 }} block>Impact: {String(d.impact)}</Text>}
          </div>
        ),
      }),
      createTableColumn({
        columnId: 'status',
        compare: (a, b) => String(a.status ?? '').localeCompare(String(b.status ?? '')),
        renderHeaderCell: () => 'Status',
        renderCell: (d) => <Badge appearance="tint" color={DECISION_STATUS_COLORS[String(d.status)] ?? 'informative'} size="small">{String(d.status ?? '')}</Badge>,
      }),
      createTableColumn({
        columnId: 'loggedDate',
        compare: (a, b) => new Date(a.loggedDate as string).getTime() - new Date(b.loggedDate as string).getTime(),
        renderHeaderCell: () => 'Date',
        renderCell: (d) => <Text size={200}>{fmtDate(d.loggedDate)}</Text>,
      }),
      createTableColumn({
        columnId: 'loggedBy',
        compare: (a, b) => String(a.loggedBy ?? '').localeCompare(String(b.loggedBy ?? '')),
        renderHeaderCell: () => 'Logged By',
        renderCell: (d) => <Text size={200}>{String(d.loggedBy ?? '—')}</Text>,
      }),
    ]
    return (
      <div>
        {decisions.length === 0 && <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>No decisions recorded.</Text>}
        {decisions.length > 0 && <ReportDataGrid items={decisions} columns={columns} />}
      </div>
    )
  }

  if (type === 'evidence_summary') {
    const recent = (data.recentItems as Array<Record<string, unknown>>) ?? []
    return (
      <div className={styles.root}>
        <div className={styles.kpiRow}>
          <div className={styles.kpiCard}>
            <Text style={{ fontSize: tokens.fontSizeBase500, fontWeight: tokens.fontWeightSemibold, lineHeight: 1 }}>{String(data.totalEvidence ?? 0)}</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Total Evidence</Text>
          </div>
          <div className={styles.kpiCard}>
            <Text style={{ fontSize: tokens.fontSizeBase500, fontWeight: tokens.fontWeightSemibold, lineHeight: 1, color: '#107C10' }}>{String(data.verifiedEvidence ?? 0)}</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Verified</Text>
          </div>
        </div>
        {recent.length > 0 && (
          <>
            <Divider />
            <Text size={200} weight="semibold">Recent Evidence</Text>
            {recent.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--sp-gray-200)' }}>
                <Badge appearance="outline" size="small">{String(e.type ?? '')}</Badge>
                <Text size={200}>{String(e.name ?? '')}</Text>
                {!!e.verified && <Badge appearance="tint" color="success" size="extra-small">Verified</Badge>}
                <Text size={200} style={{ marginLeft: 'auto', color: tokens.colorNeutralForeground3 }}>{fmtDate(e.uploadedAt)}</Text>
              </div>
            ))}
          </>
        )}
      </div>
    )
  }

  if (type === 'evidence_detail') {
    const items = (data.items as Array<Record<string, unknown>>) ?? []
    const columns: TableColumnDefinition<Record<string, unknown>>[] = [
      createTableColumn({
        columnId: 'name',
        compare: (a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')),
        renderHeaderCell: () => 'Name',
        renderCell: (e) => <Text size={200}>{String(e.name ?? '')}</Text>,
      }),
      createTableColumn({
        columnId: 'type',
        compare: (a, b) => String(a.type ?? '').localeCompare(String(b.type ?? '')),
        renderHeaderCell: () => 'Type',
        renderCell: (e) => <Badge appearance="outline" size="small">{String(e.type ?? '')}</Badge>,
      }),
      createTableColumn({
        columnId: 'uploadedBy',
        compare: (a, b) => String(a.uploadedBy ?? '').localeCompare(String(b.uploadedBy ?? '')),
        renderHeaderCell: () => 'Uploaded By',
        renderCell: (e) => <Text size={200}>{String(e.uploadedBy ?? '—')}</Text>,
      }),
      createTableColumn({
        columnId: 'uploadedAt',
        compare: (a, b) => new Date(a.uploadedAt as string).getTime() - new Date(b.uploadedAt as string).getTime(),
        renderHeaderCell: () => 'Date',
        renderCell: (e) => <Text size={200}>{fmtDate(e.uploadedAt)}</Text>,
      }),
      createTableColumn({
        columnId: 'verified',
        compare: (a, b) => Number(!!a.verified) - Number(!!b.verified),
        renderHeaderCell: () => 'Verified',
        renderCell: (e) => (!!e.verified ? <Badge appearance="tint" color="success" size="small">Yes</Badge> : <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>No</Text>),
      }),
    ]
    return (
      <div>
        {items.length === 0 && <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>No evidence items.</Text>}
        {items.length > 0 && <ReportDataGrid items={items} columns={columns} />}
      </div>
    )
  }

  if (type === 'deliverables_detail') {
    const byFA = (data.byFocusArea as Array<{ name: string; code: string; subSections: Array<{ name: string; deliverables: Array<Record<string, unknown>> }> }>) ?? []
    return (
      <div className={styles.root}>
        {byFA.map((fa) => (
          <div key={fa.code} className={styles.faBlock}>
            <div className={styles.faHeader}>
              <Badge appearance="tint" color="brand" size="small">{fa.code}</Badge>
              <Text size={300} weight="semibold">{fa.name}</Text>
            </div>
            {fa.subSections.map((ss) => (
              <div key={ss.name}>
                <div style={{ padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`, backgroundColor: 'var(--sp-surface)' }}>
                  <Text size={200} weight="semibold" style={{ color: tokens.colorNeutralForeground2 }}>{ss.name}</Text>
                </div>
                <ReportDataGrid
                  items={ss.deliverables}
                  columns={[
                    createTableColumn<Record<string, unknown>>({
                      columnId: 'code',
                      compare: (a, b) => String(a.code ?? '').localeCompare(String(b.code ?? '')),
                      renderHeaderCell: () => 'Code',
                      renderCell: (d) => <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontFamily: 'monospace' }}>{String(d.code ?? '')}</Text>,
                    }),
                    createTableColumn<Record<string, unknown>>({
                      columnId: 'name',
                      compare: (a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')),
                      renderHeaderCell: () => 'Name',
                      renderCell: (d) => <Text size={200}>{String(d.name ?? '')}</Text>,
                    }),
                    createTableColumn<Record<string, unknown>>({
                      columnId: 'phase',
                      compare: (a, b) => String(a.phase ?? '').localeCompare(String(b.phase ?? '')),
                      renderHeaderCell: () => 'Phase',
                      renderCell: (d) => <Text size={200}>{String(d.phase ?? '—').replace('_', ' ')}</Text>,
                    }),
                    createTableColumn<Record<string, unknown>>({
                      columnId: 'status',
                      compare: (a, b) => String(a.status ?? '').localeCompare(String(b.status ?? '')),
                      renderHeaderCell: () => 'Status',
                      renderCell: (d) => <Badge appearance="tint" color={STATUS_COLORS[String(d.status)] ?? 'informative'} size="small">{String(d.status ?? '').replace('_', ' ')}</Badge>,
                    }),
                    createTableColumn<Record<string, unknown>>({
                      columnId: 'targetDate',
                      compare: (a, b) => new Date(a.targetDate as string).getTime() - new Date(b.targetDate as string).getTime(),
                      renderHeaderCell: () => 'Target',
                      renderCell: (d) => <Text size={200}>{fmtDate(d.targetDate)}</Text>,
                    }),
                  ]}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (type === 'activity_log') {
    const events = (data.events as Array<Record<string, unknown>>) ?? []
    const columns: TableColumnDefinition<Record<string, unknown>>[] = [
      createTableColumn({
        columnId: 'actorName',
        compare: (a, b) => String(a.actorName ?? '').localeCompare(String(b.actorName ?? '')),
        renderHeaderCell: () => 'Actor',
        renderCell: (e) => <Text size={200}>{String(e.actorName ?? '')}</Text>,
      }),
      createTableColumn({
        columnId: 'eventType',
        compare: (a, b) => String(a.eventType ?? '').localeCompare(String(b.eventType ?? '')),
        renderHeaderCell: () => 'Event',
        renderCell: (e) => <Badge appearance="outline" size="small">{String(e.eventType ?? '')}</Badge>,
      }),
      createTableColumn({
        columnId: 'description',
        compare: (a, b) => String(a.description ?? '').localeCompare(String(b.description ?? '')),
        renderHeaderCell: () => 'Description',
        renderCell: (e) => <Text size={200}>{String(e.description ?? '')}</Text>,
      }),
      createTableColumn({
        columnId: 'createdAt',
        compare: (a, b) => new Date(a.createdAt as string).getTime() - new Date(b.createdAt as string).getTime(),
        renderHeaderCell: () => 'Date',
        renderCell: (e) => <Text size={200}>{fmtDate(e.createdAt)}</Text>,
      }),
    ]
    return (
      <div>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalM }} block>
          Period: {fmtDate(data.periodStart)} — {fmtDate(data.periodEnd)} · {events.length} events
        </Text>
        {events.length === 0 && <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>No activity in period.</Text>}
        {events.length > 0 && <ReportDataGrid items={events} columns={columns} />}
      </div>
    )
  }

  // Fallback
  return <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>Section: {type}</Text>
}
