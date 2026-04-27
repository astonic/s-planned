'use client'

import { useMemo, useState } from 'react'
import { makeStyles, tokens, Badge, Text } from '@fluentui/react-components'
import { ChevronDownRegular, ChevronRightRegular } from '@fluentui/react-icons'
import type { FocusAreaWithAll } from './workspace-types'
import { STATUS_COLORS, STATUS_LABELS } from './workspace-types'
import type { DeliverableStatus } from '@prisma/client'

const useStyles = makeStyles({
  root: { padding: '24px', overflowY: 'auto', flex: 1 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '16px',
  },
  card: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
  },
  ringWrap: { flexShrink: 0 },
  headerInfo: { flex: 1, minWidth: 0 },
  cardName: { fontWeight: tokens.fontWeightSemibold, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardCode: { color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200, marginTop: '2px' },
  statusRow: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' },
  subsectionList: {
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  ssRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    cursor: 'pointer',
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
    ':last-child': { borderBottom: 'none' },
  },
  ssName: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  ssProgress: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
  ssTrack: { width: '64px', height: '6px', backgroundColor: tokens.colorNeutralStroke2, borderRadius: '100px', overflow: 'hidden' },
  ssFill: { height: '100%', borderRadius: '100px', backgroundColor: '#0F6CBD' },
  ssFillDone: { backgroundColor: '#107C10' },
})

function Ring({ pct, size = 72 }: { pct: number; size?: number }) {
  const r = (size - 12) / 2
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  const color = pct === 100 ? '#107C10' : '#0F6CBD'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`${pct}%`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={tokens.colorNeutralStroke2} strokeWidth={10} />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={13} fontWeight={700} fill={color}>{pct}%</text>
    </svg>
  )
}

const STATUSES: DeliverableStatus[] = ['planned', 'in_progress', 'delayed', 'closed']

export function GoalsView({ focusAreas }: { focusAreas: FocusAreaWithAll[] }) {
  const s = useStyles()
  const [expanded, setExpanded] = useState<Set<string>>(new Set(focusAreas.map((fa) => fa.id)))

  function toggle(id: string) {
    setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const faStats = useMemo(
    () =>
      focusAreas.map((fa) => {
        const ds = fa.subSections.flatMap((ss) => ss.deliverables)
        const total = ds.length
        const closed = ds.filter((d) => d.status === 'closed').length
        const pct = total === 0 ? 0 : Math.round((closed / total) * 100)
        const byStatus = STATUSES.map((st) => ({ st, count: ds.filter((d) => d.status === st).length }))
        const ssStats = fa.subSections.map((ss) => {
          const ssClosed = ss.deliverables.filter((d) => d.status === 'closed').length
          const ssPct = ss.deliverables.length === 0 ? 0 : Math.round((ssClosed / ss.deliverables.length) * 100)
          return { id: ss.id, name: ss.name, code: ss.code, total: ss.deliverables.length, closed: ssClosed, pct: ssPct }
        })
        return { fa, total, closed, pct, byStatus, ssStats }
      }),
    [focusAreas]
  )

  return (
    <div className={s.root}>
      <div className={s.grid}>
        {faStats.map(({ fa, total, closed, pct, byStatus, ssStats }) => {
          const isExpanded = expanded.has(fa.id)
          return (
            <div key={fa.id} className={s.card}>
              <div className={s.cardHeader}>
                <div className={s.ringWrap}>
                  <Ring pct={pct} />
                </div>
                <div className={s.headerInfo}>
                  <Text className={s.cardName}>{fa.name}</Text>
                  <Text className={s.cardCode}>{fa.code} · {closed}/{total} closed</Text>
                  <div className={s.statusRow}>
                    {byStatus.filter((x) => x.count > 0).map(({ st, count }) => (
                      <Badge key={st} size="small" appearance="tint" style={{ backgroundColor: `${STATUS_COLORS[st]}22`, color: STATUS_COLORS[st] }}>
                        {count} {STATUS_LABELS[st]}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div style={{ cursor: 'pointer' }} onClick={() => toggle(fa.id)}>
                  {isExpanded ? <ChevronDownRegular style={{ color: tokens.colorNeutralForeground3 }} /> : <ChevronRightRegular style={{ color: tokens.colorNeutralForeground3 }} />}
                </div>
              </div>

              {isExpanded && ssStats.length > 0 && (
                <div className={s.subsectionList}>
                  {ssStats.map((ss) => (
                    <div key={ss.id} className={s.ssRow}>
                      <Text className={s.ssName} size={200}>{ss.name}</Text>
                      <div className={s.ssProgress}>
                        <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>{ss.closed}/{ss.total}</Text>
                        <div className={s.ssTrack}>
                          <div className={`${s.ssFill} ${ss.pct === 100 ? s.ssFillDone : ''}`} style={{ width: `${ss.pct}%` }} />
                        </div>
                        <Text size={100} style={{ width: 28, textAlign: 'right', color: tokens.colorNeutralForeground3 }}>{ss.pct}%</Text>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
