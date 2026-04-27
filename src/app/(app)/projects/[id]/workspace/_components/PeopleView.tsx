'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { makeStyles, tokens, Avatar, Badge, Text } from '@fluentui/react-components'
import {
  CheckmarkCircleFilled,
  ChevronDownRegular,
  ChevronRightRegular,
  CircleRegular,
  ErrorCircleFilled,
  PersonRegular,
  RecordRegular,
} from '@fluentui/react-icons'
import type { DeliverableStatus } from '@prisma/client'
import type { FocusAreaWithAll, DeliverableWithOwner } from './workspace-types'
import { flatDeliverables, fmt, pctForStatus, STATUS_COLORS, STATUS_LABELS } from './workspace-types'

type PersonGroup = {
  id: string
  name: string
  deliverables: (DeliverableWithOwner & { projectId: string })[]
}

const useStyles = makeStyles({
  root: { padding: '24px', overflowY: 'auto', flex: 1 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
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
    gap: '12px',
    padding: '14px 16px',
    cursor: 'pointer',
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
  },
  cardHeaderInfo: { flex: 1, minWidth: 0 },
  personName: { fontWeight: tokens.fontWeightSemibold, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  progressRow: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' },
  progressTrack: { flex: 1, height: '6px', backgroundColor: tokens.colorNeutralStroke2, borderRadius: '100px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '100px', backgroundColor: '#0F6CBD' },
  progressFillDone: { backgroundColor: '#107C10' },
  statusPips: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' },
  deliverableList: {
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
  },
  deliverableItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
    ':last-child': { borderBottom: 'none' },
  },
  deliverableName: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  deliverableDate: { flexShrink: 0, color: tokens.colorNeutralForeground3 },
})

function StatusIcon({ status }: { status: DeliverableStatus }) {
  if (status === 'closed') return <CheckmarkCircleFilled style={{ color: '#6264A7', fontSize: 15, flexShrink: 0 }} />
  if (status === 'delayed') return <ErrorCircleFilled style={{ color: '#C4314B', fontSize: 15, flexShrink: 0 }} />
  if (status === 'in_progress') return <RecordRegular style={{ color: '#0F6CBD', fontSize: 15, flexShrink: 0 }} />
  return <CircleRegular style={{ color: tokens.colorNeutralForeground3, fontSize: 15, flexShrink: 0 }} />
}

export function PeopleView({
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const groups = useMemo((): PersonGroup[] => {
    const q = query.trim().toLowerCase()
    const allDs = flatDeliverables(focusAreas)
    const map = new Map<string, PersonGroup>()

    for (const d of allDs) {
      if (q && ![d.name, d.code, d.owner?.name ?? ''].join(' ').toLowerCase().includes(q)) continue
      const key = d.owner?.id ?? '__unassigned__'
      const name = d.owner?.name ?? 'Unassigned'
      if (!map.has(key)) map.set(key, { id: key, name, deliverables: [] })
      map.get(key)!.deliverables.push({ ...d, projectId })
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.id === '__unassigned__') return 1
      if (b.id === '__unassigned__') return -1
      return a.name.localeCompare(b.name)
    })
  }, [focusAreas, projectId, query])

  function toggleExpand(id: string) {
    setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  return (
    <div className={s.root}>
      <div className={s.grid}>
        {groups.map((g) => {
          const total = g.deliverables.length
          const closed = g.deliverables.filter((d) => d.status === 'closed').length
          const pct = total === 0 ? 0 : Math.round(g.deliverables.reduce((s, d) => s + d.progress, 0) / total)
          const isExpanded = expanded.has(g.id)

          const byStatus = (['planned', 'in_progress', 'delayed', 'closed'] as DeliverableStatus[])
            .map((st) => ({ st, count: g.deliverables.filter((d) => d.status === st).length }))
            .filter((x) => x.count > 0)

          return (
            <div key={g.id} className={s.card}>
              <div className={s.cardHeader} onClick={() => toggleExpand(g.id)}>
                {g.id === '__unassigned__' ? (
                  <Avatar icon={<PersonRegular />} size={40} />
                ) : (
                  <Avatar name={g.name} size={40} />
                )}
                <div className={s.cardHeaderInfo}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text className={s.personName}>{g.name}</Text>
                    <Badge appearance="tint" size="small">{total}</Badge>
                    {isExpanded ? <ChevronDownRegular style={{ marginLeft: 'auto', color: tokens.colorNeutralForeground3 }} /> : <ChevronRightRegular style={{ marginLeft: 'auto', color: tokens.colorNeutralForeground3 }} />}
                  </div>
                  <div className={s.progressRow}>
                    <div className={s.progressTrack}>
                      <div className={`${s.progressFill} ${pct === 100 ? s.progressFillDone : ''}`} style={{ width: `${pct}%` }} />
                    </div>
                    <Text size={100} style={{ flexShrink: 0, color: tokens.colorNeutralForeground3 }}>{pct}%</Text>
                  </div>
                  <div className={s.statusPips}>
                    {byStatus.map(({ st, count }) => (
                      <Badge key={st} size="small" appearance="tint" style={{ backgroundColor: `${STATUS_COLORS[st]}22`, color: STATUS_COLORS[st] }}>
                        {count} {STATUS_LABELS[st]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className={s.deliverableList}>
                  {g.deliverables.map((d) => (
                    <div
                      key={d.id}
                      className={s.deliverableItem}
                      onClick={() => router.push(`/projects/${d.projectId}/deliverables/${d.id}`)}
                    >
                      <StatusIcon status={d.status} />
                      <Text className={s.deliverableName} size={200}>{d.name}</Text>
                      {d.targetDate && <Text className={s.deliverableDate} size={100}>{fmt(d.targetDate)}</Text>}
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
