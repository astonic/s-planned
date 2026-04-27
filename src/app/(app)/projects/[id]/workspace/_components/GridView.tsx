'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  makeStyles,
  tokens,
  Avatar,
  Badge,
  Button,
  Text,
} from '@fluentui/react-components'
import {
  CheckmarkCircleFilled,
  ChevronDownRegular,
  ChevronRightRegular,
  CircleRegular,
  ErrorCircleFilled,
  RecordRegular,
} from '@fluentui/react-icons'
import type { DeliverableStatus } from '@prisma/client'
import type { FocusAreaWithAll, DeliverableWithOwner } from './workspace-types'
import { dateMs, fmt, pctForStatus } from './workspace-types'

type SortKey = 'name' | 'owner' | 'pct' | 'priority' | 'start' | 'finish'
type SortDir = 'asc' | 'desc'

type Row = {
  id: string
  kind: 'focus' | 'subsection' | 'deliverable'
  depth: number
  number: string
  name: string
  code: string
  ownerName: string | null
  pct: number
  priority: 'Important' | 'Medium' | 'Low'
  status?: DeliverableStatus
  startDate: Date | string | null
  finishDate: Date | string | null
  deliverableId?: string
  total?: number
  closed?: number
  raidCount?: number
  ancestorIds: string[]
}

const COL = '48px minmax(300px, 1.8fr) 160px 156px 120px 64px 128px 128px'

const useStyles = makeStyles({
  scroller: { overflow: 'auto', flex: 1, maxHeight: 'calc(100vh - 300px)' },
  grid: { minWidth: '1000px' },
  headerRow: {
    display: 'grid',
    gridTemplateColumns: COL,
    height: '36px',
    alignItems: 'center',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  hCell: { padding: '0 6px', overflow: 'hidden', display: 'flex', alignItems: 'center' },
  sortBtn: {
    justifyContent: 'flex-start',
    minWidth: 'auto',
    padding: '0 4px',
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    height: '28px',
    borderRadius: tokens.borderRadiusSmall,
  },
  sortBtnActive: { color: tokens.colorBrandForeground1 },
  row: {
    display: 'grid',
    gridTemplateColumns: COL,
    minHeight: '36px',
    alignItems: 'stretch',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    fontSize: tokens.fontSizeBase200,
  },
  focusRow: {
    backgroundColor: tokens.colorNeutralBackground3,
    fontWeight: tokens.fontWeightSemibold,
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
  },
  subsectionRow: {
    backgroundColor: tokens.colorNeutralBackground2,
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
  },
  deliverableRow: {
    cursor: 'pointer',
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
  },
  cell: { minWidth: 0, padding: '0 8px', overflow: 'hidden', display: 'flex', alignItems: 'center' },
  numCell: { color: tokens.colorNeutralForeground3, justifyContent: 'flex-end', paddingRight: '6px', fontSize: tokens.fontSizeBase100 },
  nameCell: { display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', paddingRight: '8px' },
  expandBtn: { flexShrink: 0, minWidth: '20px', width: '20px', height: '20px', padding: 0, borderRadius: '4px', color: tokens.colorNeutralForeground3 },
  expandBtnSpacer: { width: '20px', flexShrink: 0 },
  statusIconWrap: { flexShrink: 0, display: 'flex', alignItems: 'center', fontSize: '16px' },
  nameText: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 },
  strikethrough: { textDecoration: 'line-through', color: tokens.colorNeutralForeground3 },
  ownerCell: { display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' },
  ownerName: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  progressCell: { display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '10px' },
  progressTrack: { flex: 1, height: '8px', backgroundColor: tokens.colorNeutralStroke2, borderRadius: '100px', overflow: 'hidden', minWidth: '40px' },
  progressFill: { height: '100%', backgroundColor: 'var(--sp-success)' },
  progressFillComplete: { backgroundColor: 'var(--sp-success-dark)' },
  progressLabel: { flexShrink: 0, width: '30px', textAlign: 'right', fontWeight: tokens.fontWeightSemibold, color: tokens.colorNeutralForeground2 },
  priorityCell: { display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' },
  pipImportant: { flexShrink: 0, width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#C4314B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700 },
  pipMedium: { flexShrink: 0, width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--sp-success)' },
  pipLow: { flexShrink: 0, color: '#0F6CBD', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center' },
  startCell: { backgroundColor: '#DDEEC8', color: '#256029', fontWeight: tokens.fontWeightSemibold, display: 'flex', alignItems: 'center', padding: '0 8px' },
  finishCell: { display: 'flex', alignItems: 'center', padding: '0 8px', color: tokens.colorNeutralForeground2, fontWeight: tokens.fontWeightSemibold },
  finishOverdue: { backgroundColor: '#FDE7E9', color: '#C4314B' },
  empty: { padding: '48px 24px', display: 'flex', justifyContent: 'center', color: tokens.colorNeutralForeground3, fontStyle: 'italic' },
})

function priorityFor(d: DeliverableWithOwner): Row['priority'] {
  if (d.status === 'delayed') return 'Important'
  if (d.status === 'closed') return 'Medium'
  if (d.targetDate && dateMs(d.targetDate) < Date.now()) return 'Important'
  if (!d.targetDate) return 'Low'
  return 'Medium'
}

function buildRows(focusAreas: FocusAreaWithAll[], query: string, sortKey: SortKey, sortDir: SortDir): Row[] {
  const q = query.trim().toLowerCase()
  const dir = sortDir === 'asc' ? 1 : -1

  function matches(d: DeliverableWithOwner, fa: FocusAreaWithAll, ss: { name: string; code: string }) {
    if (!q) return true
    return [d.name, d.code, d.domain ?? '', d.owner?.name ?? '', fa.name, fa.code, ss.name, ss.code]
      .join(' ').toLowerCase().includes(q)
  }

  function priRank(d: DeliverableWithOwner) {
    const p = priorityFor(d)
    return p === 'Important' ? 0 : p === 'Medium' ? 1 : 2
  }

  function cmp(a: DeliverableWithOwner, b: DeliverableWithOwner) {
    if (sortKey === 'owner') return ((a.owner?.name ?? '').localeCompare(b.owner?.name ?? '') || a.name.localeCompare(b.name)) * dir
    if (sortKey === 'pct') return (pctForStatus(a.status) - pctForStatus(b.status)) * dir
    if (sortKey === 'priority') return (priRank(a) - priRank(b)) * dir
    if (sortKey === 'start') return (dateMs(a.startDate) - dateMs(b.startDate)) * dir
    if (sortKey === 'finish') return (dateMs(a.targetDate) - dateMs(b.targetDate)) * dir
    return a.name.localeCompare(b.name) * dir
  }

  const rows: Row[] = []
  let n = 1

  for (const fa of focusAreas) {
    const faDs = fa.subSections.flatMap((ss) => ss.deliverables)
    const faClosed = faDs.filter((d) => d.status === 'closed').length
    const faPct = faDs.length === 0 ? 0 : Math.round((faClosed / faDs.length) * 100)
    const faStart = faDs.reduce<Date | string | null>((m, d) => (!m || (d.startDate && dateMs(d.startDate) < dateMs(m)) ? d.startDate : m), null)
    const faFinish = faDs.reduce<Date | string | null>((m, d) => (!m || (d.targetDate && dateMs(d.targetDate) > dateMs(m)) ? d.targetDate : m), null)
    const faMatch = !q || `${fa.name} ${fa.code}`.toLowerCase().includes(q)
    const faChildren: Row[] = []

    for (const ss of fa.subSections) {
      const ssMatch = !q || `${ss.name} ${ss.code}`.toLowerCase().includes(q)
      const toShow = (ssMatch && !faMatch ? ss.deliverables.slice() : ss.deliverables.filter((d) => faMatch || matches(d, fa, ss))).sort(cmp)
      if (!faMatch && !ssMatch && toShow.length === 0) continue

      const ssClosed = ss.deliverables.filter((d) => d.status === 'closed').length
      const ssPct = ss.deliverables.length === 0 ? 0 : Math.round((ssClosed / ss.deliverables.length) * 100)
      const ssStart = ss.deliverables.reduce<Date | string | null>((m, d) => (!m || (d.startDate && dateMs(d.startDate) < dateMs(m)) ? d.startDate : m), null)
      const ssFinish = ss.deliverables.reduce<Date | string | null>((m, d) => (!m || (d.targetDate && dateMs(d.targetDate) > dateMs(m)) ? d.targetDate : m), null)

      faChildren.push({ id: ss.id, kind: 'subsection', depth: 1, number: String(n++), name: ss.name, code: ss.code, ownerName: null, pct: ssPct, priority: 'Medium', startDate: ssStart, finishDate: ssFinish, total: ss.deliverables.length, closed: ssClosed, ancestorIds: [fa.id] })

      for (const d of toShow) {
        faChildren.push({ id: d.id, kind: 'deliverable', depth: 2, number: String(n++), name: d.name, code: d.code, ownerName: d.owner?.name ?? null, pct: pctForStatus(d.status), priority: priorityFor(d), status: d.status, startDate: d.startDate, finishDate: d.targetDate, deliverableId: d.id, raidCount: d._count?.raidLinks ?? 0, ancestorIds: [fa.id, ss.id] })
      }
    }

    if (!faMatch && faChildren.length === 0) continue

    rows.push({ id: fa.id, kind: 'focus', depth: 0, number: String(n++), name: fa.name, code: fa.code, ownerName: null, pct: faPct, priority: 'Medium', startDate: faStart, finishDate: faFinish, total: faDs.length, closed: faClosed, ancestorIds: [] })
    rows.push(...faChildren)
  }

  return rows
}

function StatusIcon({ status, kind }: { status?: DeliverableStatus; kind: Row['kind'] }) {
  if (kind !== 'deliverable') return <CircleRegular style={{ color: tokens.colorNeutralForeground3, fontSize: 16 }} />
  if (status === 'closed') return <CheckmarkCircleFilled style={{ color: 'var(--sp-success-dark)', fontSize: 16 }} />
  if (status === 'delayed') return <ErrorCircleFilled style={{ color: '#C4314B', fontSize: 16 }} />
  if (status === 'in_progress') return <RecordRegular style={{ color: 'var(--sp-success)', fontSize: 16 }} />
  return <CircleRegular style={{ color: tokens.colorNeutralForeground3, fontSize: 16 }} />
}

export function GridView({
  focusAreas,
  projectId,
  query,
}: {
  focusAreas: FocusAreaWithAll[]
  projectId: string
  query: string
}) {
  const s = useStyles()
  const router = useRouter()
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const rows = useMemo(() => buildRows(focusAreas, query, sortKey, sortDir), [focusAreas, query, sortKey, sortDir])
  const visible = useMemo(() => rows.filter((r) => r.ancestorIds.every((id) => !collapsed.has(id))), [rows, collapsed])

  function toggleSort(key: SortKey) {
    if (sortKey === key) { setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')); return }
    setSortKey(key); setSortDir('asc')
  }

  function toggleCollapse(id: string) {
    setCollapsed((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  function si(key: SortKey) { return sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '' }

  const now = Date.now()

  return (
    <div className={s.scroller}>
      <div className={s.grid} role="table" aria-label="Deliverables grid">
        <div className={s.headerRow} role="row">
          <div className={`${s.hCell} ${s.numCell}`} role="columnheader">#</div>
          {(['name', 'owner', 'pct', 'priority'] as SortKey[]).map((key, i) => (
            <div key={key} className={s.hCell} role="columnheader">
              <Button appearance="transparent" className={`${s.sortBtn} ${sortKey === key ? s.sortBtnActive : ''}`} onClick={() => toggleSort(key)}>
                {(['Name', 'Assigned to', '% complete', 'Priority'])[i]}{si(key)}
              </Button>
            </div>
          ))}
          <div className={s.hCell} role="columnheader">
            <Text size={100} style={{ color: tokens.colorNeutralForeground3, fontWeight: tokens.fontWeightSemibold, padding: '0 4px' }}>RAID</Text>
          </div>
          {(['start', 'finish'] as SortKey[]).map((key, i) => (
            <div key={key} className={s.hCell} role="columnheader">
              <Button appearance="transparent" className={`${s.sortBtn} ${sortKey === key ? s.sortBtnActive : ''}`} onClick={() => toggleSort(key)}>
                {(['Start', 'Finish'])[i]}{si(key)}
              </Button>
            </div>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className={s.empty}>No deliverables match the current filter.</div>
        ) : (
          visible.map((row) => {
            const isGroup = row.kind !== 'deliverable'
            const isOverdue = !!(row.finishDate && dateMs(row.finishDate) < now && row.status !== 'closed')
            return (
              <div
                key={`${row.kind}-${row.id}`}
                role="row"
                className={`${s.row} ${row.kind === 'focus' ? s.focusRow : row.kind === 'subsection' ? s.subsectionRow : s.deliverableRow}`}
                onClick={() => row.deliverableId && router.push(`/projects/${projectId}/deliverables/${row.deliverableId}`)}
              >
                <div className={`${s.cell} ${s.numCell}`} role="cell">{row.number}</div>
                <div className={`${s.cell} ${s.nameCell}`} role="cell" style={{ paddingLeft: 8 + row.depth * 20 }}>
                  {isGroup ? (
                    <Button appearance="subtle" className={s.expandBtn}
                      icon={collapsed.has(row.id) ? <ChevronRightRegular /> : <ChevronDownRegular />}
                      onClick={(e) => { e.stopPropagation(); toggleCollapse(row.id) }}
                    />
                  ) : (
                    <span className={s.expandBtnSpacer} />
                  )}
                  <span className={s.statusIconWrap}><StatusIcon status={row.status} kind={row.kind} /></span>
                  <Text className={`${s.nameText} ${row.status === 'closed' ? s.strikethrough : ''}`} weight={isGroup ? 'semibold' : 'regular'} size={200}>
                    {isGroup ? `${row.code} ${row.name}` : row.name}
                  </Text>
                  {isGroup && row.total !== undefined && (
                    <Text size={100} style={{ color: tokens.colorNeutralForeground3, flexShrink: 0 }}>{row.closed}/{row.total}</Text>
                  )}
                </div>
                <div className={`${s.cell} ${s.ownerCell}`} role="cell">
                  {row.ownerName ? (
                    <><Avatar name={row.ownerName} size={24} /><Text className={s.ownerName} size={200}>{row.ownerName}</Text></>
                  ) : (
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>—</Text>
                  )}
                </div>
                <div className={`${s.cell} ${s.progressCell}`} role="cell">
                  <div className={s.progressTrack}>
                    <div className={`${s.progressFill} ${row.pct === 100 ? s.progressFillComplete : ''}`} style={{ width: `${row.pct}%` }} />
                  </div>
                  <Text className={s.progressLabel} size={200}>{row.pct}%</Text>
                </div>
                <div className={`${s.cell} ${s.priorityCell}`} role="cell">
                  {row.priority === 'Important' ? <span className={s.pipImportant}>!</span> : row.priority === 'Low' ? <span className={s.pipLow}>↓</span> : <span className={s.pipMedium} />}
                  <Text size={200}>{row.priority}</Text>
                </div>
                <div className={s.cell} role="cell">
                  {row.raidCount ? (
                    <Badge appearance="tint" color="danger" size="small">{row.raidCount}</Badge>
                  ) : (
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>—</Text>
                  )}
                </div>
                <div className={row.startDate ? s.startCell : `${s.cell} ${s.finishCell}`} role="cell">
                  <Text size={200}>{fmt(row.startDate)}</Text>
                </div>
                <div className={`${s.finishCell} ${isOverdue ? s.finishOverdue : ''}`} role="cell">
                  <Text size={200}>{fmt(row.finishDate)}</Text>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
