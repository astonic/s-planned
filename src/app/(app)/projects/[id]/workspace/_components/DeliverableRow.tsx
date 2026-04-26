'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  makeStyles,
  tokens,
  Text,
  Badge,
  Select,
  Spinner,
} from '@fluentui/react-components'
import type { DeliverableExecution, DeliverableStatus } from '@prisma/client'
import { updateDeliverableStatus } from '@/lib/actions/projects'

const useStyles = makeStyles({
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  code: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    minWidth: '80px',
    flexShrink: 0,
  },
  name: {
    flex: 1,
    color: tokens.colorBrandForeground1,
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline',
    },
  },
  phaseBadge: {
    flexShrink: 0,
  },
  statusSelect: {
    flexShrink: 0,
  },
  targetDate: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    minWidth: '90px',
    flexShrink: 0,
    textAlign: 'right',
  },
  spinnerWrap: {
    display: 'flex',
    alignItems: 'center',
  },
})

// Phase badge colour rotates through a palette — phases are free-text strings
const PHASE_PALETTE: Array<'brand' | 'informative' | 'success' | 'warning' | 'severe' | 'danger'> =
  ['informative', 'warning', 'success', 'severe', 'brand', 'danger']

function phaseColor(phase: string): 'brand' | 'informative' | 'success' | 'warning' | 'severe' | 'danger' {
  let hash = 0
  for (let i = 0; i < phase.length; i++) hash = (hash * 31 + phase.charCodeAt(i)) >>> 0
  return PHASE_PALETTE[hash % PHASE_PALETTE.length]
}

const STATUS_OPTIONS: { value: DeliverableStatus; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'closed', label: 'Closed' },
]

interface Props {
  deliverable: DeliverableExecution
  projectId: string
}

export function DeliverableRow({ deliverable, projectId }: Props) {
  const styles = useStyles()
  const [isPending, startTransition] = useTransition()
  const [currentStatus, setCurrentStatus] = useState<DeliverableStatus>(deliverable.status)

  function handleStatusChange(newStatus: DeliverableStatus) {
    setCurrentStatus(newStatus)
    startTransition(async () => {
      await updateDeliverableStatus(deliverable.id, newStatus)
    })
  }

  return (
    <div className={styles.row}>
      <span className={styles.code}>{deliverable.code}</span>

      <Link
        href={`/projects/${projectId}/deliverables/${deliverable.id}`}
        className={styles.name}
      >
        <Text size={300}>{deliverable.name}</Text>
      </Link>

      {deliverable.phase && (
        <Badge
          className={styles.phaseBadge}
          appearance="tint"
          color={phaseColor(deliverable.phase)}
          size="small"
        >
          {deliverable.phase}
        </Badge>
      )}

      <div className={styles.statusSelect}>
        {isPending ? (
          <div className={styles.spinnerWrap}>
            <Spinner size="tiny" />
          </div>
        ) : (
          <Select
            size="small"
            value={currentStatus}
            onChange={(_, d) => handleStatusChange(d.value as DeliverableStatus)}
            style={{ minWidth: '120px' }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        )}
      </div>

      <span className={styles.targetDate}>
        {deliverable.targetDate
          ? new Date(deliverable.targetDate).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : '—'}
      </span>
    </div>
  )
}
