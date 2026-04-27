'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { makeStyles, tokens, Avatar, Badge, Text } from '@fluentui/react-components'
import {
  CheckmarkCircleFilled,
  CircleRegular,
  ErrorCircleFilled,
  RecordRegular,
} from '@fluentui/react-icons'
import type { DeliverableStatus } from '@prisma/client'
import type { FocusAreaWithAll, DeliverableWithOwner } from './workspace-types'
import { flatDeliverables, fmt, STATUS_LABELS } from './workspace-types'

const COLS: { status: DeliverableStatus; label: string; accent: string; bg: string }[] = [
  { status: 'planned',     label: 'Planned',     accent: '#605E5C', bg: '#F3F2F1' },
  { status: 'in_progress', label: 'In Progress',  accent: '#5B0E91', bg: '#F0E8FF' },
  { status: 'delayed',     label: 'Delayed',      accent: '#C4314B', bg: '#FDE7E9' },
  { status: 'closed',      label: 'Closed',       accent: '#107C10', bg: '#DFF6DD' },
]

const useStyles = makeStyles({
  root: {
    display: 'flex',
    gap: '16px',
    padding: '16px',
    overflowX: 'auto',
    flex: 1,
    alignItems: 'flex-start',
  },
  col: {
    flexShrink: 0,
    width: '280px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  colHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 8px',
    borderRadius: tokens.borderRadiusMedium,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
  },
  colDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  colCount: { marginLeft: 'auto' },
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    cursor: 'pointer',
    ':hover': { boxShadow: tokens.shadow4 },
    transition: 'box-shadow 120ms',
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '6px',
  },
  cardName: { flex: 1, lineHeight: '1.4' },
  cardMeta: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  cardFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  empty: {
    padding: '12px',
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    textAlign: 'center',
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  focusLabel: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
})

function CardIcon({ status }: { status: DeliverableStatus }) {
  if (status === 'closed') return <CheckmarkCircleFilled style={{ color: '#6264A7', fontSize: 16, flexShrink: 0 }} />
  if (status === 'delayed') return <ErrorCircleFilled style={{ color: '#C4314B', fontSize: 16, flexShrink: 0 }} />
  if (status === 'in_progress') return <RecordRegular style={{ color: '#5B0E91', fontSize: 16, flexShrink: 0 }} />
  return <CircleRegular style={{ color: tokens.colorNeutralForeground3, fontSize: 16, flexShrink: 0 }} />
}

type CardData = DeliverableWithOwner & { focusAreaName: string }

export function BoardView({
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

  const cards: CardData[] = useMemo(() => {
    const q = query.trim().toLowerCase()
    return focusAreas.flatMap((fa) =>
      fa.subSections.flatMap((ss) =>
        ss.deliverables
          .filter((d) => !q || [d.name, d.code, d.owner?.name ?? '', fa.name].join(' ').toLowerCase().includes(q))
          .map((d) => ({ ...d, focusAreaName: fa.name }))
      )
    )
  }, [focusAreas, query])

  return (
    <div className={s.root}>
      {COLS.map(({ status, label, accent, bg }) => {
        const col = cards.filter((d) => d.status === status)
        return (
          <div key={status} className={s.col}>
            <div className={s.colHeader} style={{ backgroundColor: bg }}>
              <span className={s.colDot} style={{ backgroundColor: accent }} />
              <span style={{ color: accent }}>{label}</span>
              <Badge className={s.colCount} appearance="tint" size="small">{col.length}</Badge>
            </div>

            {col.length === 0 ? (
              <div className={s.empty}>No deliverables</div>
            ) : (
              col.map((d) => (
                <div
                  key={d.id}
                  className={s.card}
                  onClick={() => router.push(`/projects/${projectId}/deliverables/${d.id}`)}
                >
                  <div className={s.cardTitle}>
                    <CardIcon status={d.status} />
                    <Text className={s.cardName} size={200} weight="semibold">{d.name}</Text>
                  </div>

                  <div className={s.focusLabel}>{d.focusAreaName}</div>

                  <div className={s.cardFooter}>
                    {d.owner ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Avatar name={d.owner.name} size={20} />
                        <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>{d.owner.name}</Text>
                      </div>
                    ) : (
                      <span />
                    )}
                    {d.targetDate && (
                      <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>{fmt(d.targetDate)}</Text>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )
      })}
    </div>
  )
}
