'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { makeStyles, tokens, Text } from '@fluentui/react-components'
import type { FocusAreaWithAll, DeliverableWithOwner } from './workspace-types'
import { dateMs, fmt, STATUS_COLORS } from './workspace-types'

const PX_PER_DAY = 4
const DAY_MS = 86_400_000
const ROW_H = 36
const NAMES_W = 280
const HEADER_H = 48
const PADDING_DAYS = 14

const useStyles = makeStyles({
  root: { display: 'flex', flex: 1, overflow: 'hidden', flexDirection: 'column' },
  layout: { display: 'flex', flex: 1, overflow: 'hidden' },

  namesCol: {
    width: `${NAMES_W}px`,
    flexShrink: 0,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    overflowY: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  namesHeader: {
    height: `${HEADER_H}px`,
    flexShrink: 0,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  namesBody: { overflowY: 'hidden', flex: 1 },

  chartArea: { flex: 1, overflow: 'auto', position: 'relative' },
  chartInner: { position: 'relative' },

  monthHeader: {
    height: `${HEADER_H}px`,
    position: 'sticky',
    top: 0,
    zIndex: 2,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
  },
  monthLabel: {
    position: 'absolute',
    top: 0,
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    height: '100%',
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  todayLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '2px',
    backgroundColor: '#C4314B',
    zIndex: 1,
    pointerEvents: 'none',
  },

  nameRow: {
    height: `${ROW_H}px`,
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    overflow: 'hidden',
    gap: '6px',
  },
  nameText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  chartRow: {
    height: `${ROW_H}px`,
    position: 'relative',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
  },
  bar: {
    position: 'absolute',
    top: '8px',
    height: '20px',
    borderRadius: '4px',
    minWidth: '4px',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '6px',
    overflow: 'hidden',
    cursor: 'pointer',
  },
  barLabel: {
    color: '#fff',
    fontSize: '11px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  groupNameRow: {
    height: `${ROW_H}px`,
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    fontWeight: tokens.fontWeightSemibold,
    overflow: 'hidden',
    gap: '4px',
  },
  groupChartRow: {
    height: `${ROW_H}px`,
    position: 'relative',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  noData: {
    padding: '48px 24px',
    display: 'flex',
    justifyContent: 'center',
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
  },
})

type TimelineRow =
  | { kind: 'focus'; id: string; name: string; code: string; depth: number }
  | { kind: 'subsection'; id: string; name: string; code: string; depth: number }
  | { kind: 'deliverable'; id: string; name: string; status: string; startMs: number; finishMs: number; depth: number; projectId?: string }

export function TimelineView({
  focusAreas,
  query,
  projectId,
}: {
  focusAreas: FocusAreaWithAll[]
  query: string
  projectId: string
}) {
  const s = useStyles()
  const router = useRouter()

  const { rows, rangeStart, totalDays } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const result: TimelineRow[] = []
    let minMs = Infinity
    let maxMs = -Infinity

    for (const fa of focusAreas) {
      const faMatch = !q || `${fa.name} ${fa.code}`.toLowerCase().includes(q)
      let faHasRows = false

      const faRow: TimelineRow = { kind: 'focus', id: fa.id, name: fa.name, code: fa.code, depth: 0 }
      const faChildren: TimelineRow[] = []

      for (const ss of fa.subSections) {
        const ssMatch = !q || `${ss.name} ${ss.code}`.toLowerCase().includes(q)
        const dRows: TimelineRow[] = []

        for (const d of ss.deliverables) {
          const dMatch = !q || [d.name, d.code, d.owner?.name ?? ''].join(' ').toLowerCase().includes(q)
          if (!faMatch && !ssMatch && !dMatch) continue

          const startMs = dateMs(d.startDate)
          const finishMs = dateMs(d.targetDate)
          if (startMs) minMs = Math.min(minMs, startMs)
          if (finishMs) maxMs = Math.max(maxMs, finishMs)

          dRows.push({ kind: 'deliverable', id: d.id, name: d.name, status: d.status, startMs, finishMs, depth: 2, projectId })
        }

        if (dRows.length > 0 || ssMatch) {
          faChildren.push({ kind: 'subsection', id: ss.id, name: ss.name, code: ss.code, depth: 1 })
          faChildren.push(...dRows)
          faHasRows = true
        }
      }

      if (faHasRows || faMatch) {
        result.push(faRow)
        result.push(...faChildren)
      }
    }

    if (minMs === Infinity) return { rows: result, rangeStart: Date.now(), totalDays: 90 }

    const paddedStart = minMs - PADDING_DAYS * DAY_MS
    const paddedEnd = maxMs + PADDING_DAYS * DAY_MS
    const totalDays = Math.ceil((paddedEnd - paddedStart) / DAY_MS)

    return { rows: result, rangeStart: paddedStart, totalDays }
  }, [focusAreas, query, projectId])

  const totalWidth = Math.max(800, totalDays * PX_PER_DAY)
  const todayPx = ((Date.now() - rangeStart) / DAY_MS) * PX_PER_DAY

  const months = useMemo(() => {
    const result: { label: string; px: number; width: number }[] = []
    const d = new Date(rangeStart)
    d.setDate(1)
    while (dateMs(d) < rangeStart + totalDays * DAY_MS) {
      const startOfMonth = dateMs(d)
      const px = Math.max(0, (startOfMonth - rangeStart) / DAY_MS * PX_PER_DAY)
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      const endOfMonth = Math.min(dateMs(nextMonth), rangeStart + totalDays * DAY_MS)
      const width = (endOfMonth - Math.max(startOfMonth, rangeStart)) / DAY_MS * PX_PER_DAY
      result.push({ label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), px, width })
      d.setMonth(d.getMonth() + 1)
    }
    return result
  }, [rangeStart, totalDays])

  if (rows.length === 0) {
    return <div className={s.noData}>No deliverables match the current filter.</div>
  }

  function barPx(startMs: number, finishMs: number) {
    const left = startMs ? ((startMs - rangeStart) / DAY_MS) * PX_PER_DAY : 0
    const right = finishMs ? ((finishMs - rangeStart) / DAY_MS) * PX_PER_DAY : left + 8
    return { left: Math.max(0, left), width: Math.max(8, right - left) }
  }

  return (
    <div className={s.root}>
      <div className={s.layout}>
        {/* Fixed names column */}
        <div className={s.namesCol}>
          <div className={s.namesHeader}>Name</div>
          <div className={s.namesBody}>
            {rows.map((row, i) => (
              row.kind === 'deliverable' ? (
                <div key={i} className={s.nameRow} style={{ paddingLeft: 8 + row.depth * 16 }}>
                  <Text className={s.nameText} size={200}>{row.name}</Text>
                </div>
              ) : (
                <div key={i} className={s.groupNameRow} style={{ paddingLeft: 8 + row.depth * 16 }}>
                  <Text size={200} weight="semibold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.code} {row.name}
                  </Text>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Scrollable chart area */}
        <div className={s.chartArea}>
          <div className={s.chartInner} style={{ width: totalWidth, minHeight: (rows.length + 1) * ROW_H + HEADER_H }}>
            {/* Month headers */}
            <div className={s.monthHeader} style={{ width: totalWidth }}>
              {months.map((m, i) => (
                <div key={i} className={s.monthLabel} style={{ left: m.px, width: m.width }}>{m.label}</div>
              ))}
            </div>

            {/* Today line */}
            {todayPx > 0 && todayPx < totalWidth && (
              <div className={s.todayLine} style={{ left: todayPx, top: HEADER_H }} />
            )}

            {/* Rows */}
            {rows.map((row, i) => (
              row.kind === 'deliverable' ? (
                <div key={i} className={s.chartRow}>
                  {(row.startMs || row.finishMs) && (() => {
                    const { left, width } = barPx(row.startMs, row.finishMs)
                    const color = STATUS_COLORS[row.status as keyof typeof STATUS_COLORS] ?? '#605E5C'
                    return (
                      <div
                        className={s.bar}
                        style={{ left, width, backgroundColor: color }}
                        onClick={() => row.projectId && router.push(`/projects/${row.projectId}/deliverables/${row.id}`)}
                      >
                        <span className={s.barLabel}>{row.name}</span>
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <div key={i} className={s.groupChartRow} />
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
