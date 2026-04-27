'use client'

import { useMemo, useState } from 'react'
import { makeStyles, tokens, Avatar, Text } from '@fluentui/react-components'
import { PersonRegular } from '@fluentui/react-icons'
import type { DeliverableStatus } from '@prisma/client'
import type { FocusAreaWithAll } from './workspace-types'
import { flatDeliverables, STATUS_COLORS, STATUS_LABELS } from './workspace-types'

type SortKey = 'name' | 'total' | 'planned' | 'in_progress' | 'delayed' | 'closed' | 'pct'

const useStyles = makeStyles({
  root: { padding: '24px', overflowY: 'auto', flex: 1 },
  tableWrap: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
  headerRow: {
    display: 'grid',
    gridTemplateColumns: '240px 80px 100px 110px 90px 90px 1fr',
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    height: '38px',
    alignItems: 'center',
  },
  dataRow: {
    display: 'grid',
    gridTemplateColumns: '240px 80px 100px 110px 90px 90px 1fr',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    minHeight: '44px',
    alignItems: 'center',
    ':last-child': { borderBottom: 'none' },
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
  },
  hCell: {
    padding: '0 12px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
  },
  sortBtn: {
    justifyContent: 'flex-start',
    minWidth: 'auto',
    padding: '0 4px',
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    height: '28px',
    borderRadius: tokens.borderRadiusSmall,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  sortBtnActive: { color: tokens.colorBrandForeground1 },
  cell: { padding: '0 12px', overflow: 'hidden', display: 'flex', alignItems: 'center' },
  personCell: { display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' },
  personName: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  numCell: { justifyContent: 'center', fontWeight: tokens.fontWeightSemibold },
  progressCell: { display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '16px' },
  progressTrack: { flex: 1, height: '8px', backgroundColor: tokens.colorNeutralStroke2, borderRadius: '100px', overflow: 'hidden', minWidth: '40px' },
  progressFill: { height: '100%', borderRadius: '100px', backgroundColor: '#5B0E91' },
  progressFillDone: { backgroundColor: '#107C10' },
  progressLabel: { flexShrink: 0, width: '32px', textAlign: 'right', fontWeight: tokens.fontWeightSemibold, color: tokens.colorNeutralForeground2 },
  total: {
    borderTop: `2px solid ${tokens.colorNeutralStroke2}`,
    display: 'grid',
    gridTemplateColumns: '240px 80px 100px 110px 90px 90px 1fr',
    minHeight: '44px',
    alignItems: 'center',
    backgroundColor: tokens.colorNeutralBackground2,
    fontWeight: tokens.fontWeightSemibold,
  },
})

const STATUSES: DeliverableStatus[] = ['planned', 'in_progress', 'delayed', 'closed']

type PersonRow = {
  id: string
  name: string
  total: number
  planned: number
  in_progress: number
  delayed: number
  closed: number
  pct: number
}

export function AssignmentsView({ focusAreas }: { focusAreas: FocusAreaWithAll[] }) {
  const s = useStyles()
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const rows = useMemo((): PersonRow[] => {
    const allDs = flatDeliverables(focusAreas)
    const acc: Record<string, PersonRow> = {}

    for (const d of allDs) {
      const key = d.owner?.id ?? '__unassigned__'
      const name = d.owner?.name ?? 'Unassigned'
      if (!acc[key]) acc[key] = { id: key, name, total: 0, planned: 0, in_progress: 0, delayed: 0, closed: 0, pct: 0 }
      acc[key].total++
      acc[key][d.status]++
    }

    const arr = Object.values(acc)
    for (const row of arr) {
      row.pct = row.total === 0 ? 0 : Math.round((row.closed / row.total) * 100)
    }

    const dir = sortDir === 'asc' ? 1 : -1
    return arr.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name) * dir
      return (a[sortKey] - b[sortKey]) * dir
    })
  }, [focusAreas, sortKey, sortDir])

  const totals = useMemo(() => ({
    total: rows.reduce((s, r) => s + r.total, 0),
    planned: rows.reduce((s, r) => s + r.planned, 0),
    in_progress: rows.reduce((s, r) => s + r.in_progress, 0),
    delayed: rows.reduce((s, r) => s + r.delayed, 0),
    closed: rows.reduce((s, r) => s + r.closed, 0),
  }), [rows])

  const totalPct = totals.total === 0 ? 0 : Math.round((totals.closed / totals.total) * 100)

  function toggleSort(key: SortKey) {
    if (sortKey === key) { setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')); return }
    setSortKey(key); setSortDir('asc')
  }

  function si(key: SortKey) { return sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '' }

  const headers: { key: SortKey; label: string }[] = [
    { key: 'name', label: 'Person' },
    { key: 'total', label: 'Total' },
    { key: 'planned', label: STATUS_LABELS.planned },
    { key: 'in_progress', label: STATUS_LABELS.in_progress },
    { key: 'delayed', label: STATUS_LABELS.delayed },
    { key: 'closed', label: STATUS_LABELS.closed },
    { key: 'pct', label: 'Progress' },
  ]

  return (
    <div className={s.root}>
      <div className={s.tableWrap}>
        <div className={s.headerRow}>
          {headers.map((h) => (
            <div key={h.key} className={s.hCell}>
              <button
                className={`${s.sortBtn} ${sortKey === h.key ? s.sortBtnActive : ''}`}
                onClick={() => toggleSort(h.key)}
              >
                {h.label}{si(h.key)}
              </button>
            </div>
          ))}
        </div>

        {rows.map((row) => (
          <div key={row.id} className={s.dataRow}>
            <div className={`${s.cell} ${s.personCell}`}>
              {row.id === '__unassigned__' ? (
                <Avatar icon={<PersonRegular />} size={28} />
              ) : (
                <Avatar name={row.name} size={28} />
              )}
              <Text className={s.personName} size={200} weight="semibold">{row.name}</Text>
            </div>
            <div className={`${s.cell} ${s.numCell}`}>
              <Text size={200}>{row.total}</Text>
            </div>
            {STATUSES.map((st) => (
              <div key={st} className={`${s.cell} ${s.numCell}`}>
                <Text size={200} style={{ color: row[st] > 0 ? STATUS_COLORS[st] : tokens.colorNeutralForeground3 }}>
                  {row[st] > 0 ? row[st] : '—'}
                </Text>
              </div>
            ))}
            <div className={`${s.cell} ${s.progressCell}`}>
              <div className={s.progressTrack}>
                <div className={`${s.progressFill} ${row.pct === 100 ? s.progressFillDone : ''}`} style={{ width: `${row.pct}%` }} />
              </div>
              <Text className={s.progressLabel} size={200}>{row.pct}%</Text>
            </div>
          </div>
        ))}

        {/* Totals row */}
        <div className={s.total}>
          <div className={`${s.cell}`}>
            <Text size={200} weight="semibold">Total</Text>
          </div>
          <div className={`${s.cell} ${s.numCell}`}><Text size={200}>{totals.total}</Text></div>
          {STATUSES.map((st) => (
            <div key={st} className={`${s.cell} ${s.numCell}`}>
              <Text size={200} style={{ color: STATUS_COLORS[st] }}>{totals[st]}</Text>
            </div>
          ))}
          <div className={`${s.cell} ${s.progressCell}`}>
            <div className={s.progressTrack}>
              <div className={`${s.progressFill} ${totalPct === 100 ? s.progressFillDone : ''}`} style={{ width: `${totalPct}%` }} />
            </div>
            <Text className={s.progressLabel} size={200}>{totalPct}%</Text>
          </div>
        </div>
      </div>
    </div>
  )
}
