'use client'

import { useMemo } from 'react'
import { makeStyles, tokens, Text } from '@fluentui/react-components'
import type { FocusAreaWithAll } from './workspace-types'
import { flatDeliverables, pctForStatus, STATUS_COLORS, STATUS_LABELS } from './workspace-types'
import type { DeliverableStatus } from '@prisma/client'

const useStyles = makeStyles({
  root: {
    padding: '24px',
    display: 'grid',
    gridTemplateColumns: '320px 1fr 1fr',
    gap: '24px',
    alignItems: 'start',
    overflowY: 'auto',
    flex: 1,
    '@media (max-width: 1200px)': { gridTemplateColumns: '1fr 1fr' },
    '@media (max-width: 800px)': { gridTemplateColumns: '1fr' },
  },
  card: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '20px',
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  cardTitle: { fontSize: tokens.fontSizeBase300, fontWeight: tokens.fontWeightSemibold },
  donutWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  donutStats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    width: '100%',
  },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
  statValue: { fontSize: tokens.fontSizeBase500, fontWeight: tokens.fontWeightBold },
  statLabel: { fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3 },
  barList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  barRow: { display: 'flex', flexDirection: 'column', gap: '4px' },
  barMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  barTrack: { height: '10px', backgroundColor: tokens.colorNeutralStroke2, borderRadius: '100px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '100px' },
  legend: { display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '6px' },
  legendDot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
})

function Donut({ pct, closed, total }: { pct: number; closed: number; total: number }) {
  const r = 58
  const cx = 75
  const cy = 75
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)

  return (
    <svg width={150} height={150} viewBox="0 0 150 150" aria-label={`${pct}% complete`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={tokens.colorNeutralStroke2} strokeWidth={14} />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="#0F6CBD"
        strokeWidth={14}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 600ms ease' }}
      />
      <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="middle" fontSize={24} fontWeight={700} fill="currentColor">{pct}%</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize={11} fill={tokens.colorNeutralForeground3}>{closed}/{total} closed</text>
    </svg>
  )
}

const STATUSES: DeliverableStatus[] = ['planned', 'in_progress', 'delayed', 'closed']

export function ChartsView({ focusAreas }: { focusAreas: FocusAreaWithAll[] }) {
  const s = useStyles()

  const allDs = useMemo(() => flatDeliverables(focusAreas), [focusAreas])
  const total = allDs.length
  const closed = allDs.filter((d) => d.status === 'closed').length
  const pct = total === 0 ? 0 : Math.round(allDs.reduce((s, d) => s + d.progress, 0) / total)

  const byStatus = useMemo(
    () => STATUSES.map((st) => ({ status: st, count: allDs.filter((d) => d.status === st).length })),
    [allDs]
  )

  const byFocus = useMemo(
    () =>
      focusAreas.map((fa) => {
        const ds = fa.subSections.flatMap((ss) => ss.deliverables)
        const cl = ds.filter((d) => d.status === 'closed').length
        return { name: fa.name, code: fa.code, total: ds.length, closed: cl, pct: ds.length === 0 ? 0 : Math.round(ds.reduce((s, d) => s + d.progress, 0) / ds.length) }
      }),
    [focusAreas]
  )

  const maxByFocus = Math.max(...byFocus.map((f) => f.total), 1)

  return (
    <div className={s.root}>
      {/* Overall completion */}
      <div className={s.card}>
        <Text className={s.cardTitle}>Overall Completion</Text>
        <div className={s.donutWrap}>
          <Donut pct={pct} closed={closed} total={total} />
          <div className={s.donutStats}>
            {byStatus.map(({ status, count }) => (
              <div key={status} className={s.statItem}>
                <Text className={s.statValue} style={{ color: STATUS_COLORS[status] }}>{count}</Text>
                <Text className={s.statLabel}>{STATUS_LABELS[status]}</Text>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* By focus area */}
      <div className={s.card}>
        <Text className={s.cardTitle}>Progress by Focus Area</Text>
        <div className={s.barList}>
          {byFocus.length === 0 ? (
            <Text style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>No focus areas</Text>
          ) : (
            byFocus.map((fa) => (
              <div key={fa.code} className={s.barRow}>
                <div className={s.barMeta}>
                  <Text size={200} weight="semibold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>{fa.name}</Text>
                  <Text size={100} style={{ color: tokens.colorNeutralForeground3, flexShrink: 0 }}>{fa.pct}% · {fa.closed}/{fa.total}</Text>
                </div>
                <div className={s.barTrack}>
                  <div className={s.barFill} style={{ width: `${fa.pct}%`, backgroundColor: fa.pct === 100 ? '#107C10' : '#0F6CBD' }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* By status */}
      <div className={s.card}>
        <Text className={s.cardTitle}>Distribution by Status</Text>
        <div className={s.barList}>
          {byStatus.map(({ status, count }) => (
            <div key={status} className={s.barRow}>
              <div className={s.barMeta}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: STATUS_COLORS[status], flexShrink: 0, display: 'inline-block' }} />
                  <Text size={200}>{STATUS_LABELS[status]}</Text>
                </div>
                <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>{count} / {total}</Text>
              </div>
              <div className={s.barTrack}>
                <div className={s.barFill} style={{ width: total === 0 ? '0%' : `${(count / total) * 100}%`, backgroundColor: STATUS_COLORS[status] }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
