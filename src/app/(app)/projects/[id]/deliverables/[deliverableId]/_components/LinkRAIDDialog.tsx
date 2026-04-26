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
  Text,
  Spinner,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import { LinkRegular } from '@fluentui/react-icons'
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
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
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

// ── Row component ─────────────────────────────────────────────────────────────

function RAIDRow({
  item,
  deliverableId,
  onLinked,
}: {
  item: RAIDItemSummary
  deliverableId: string
  onLinked: () => void
}) {
  const styles = useStyles()
  const [isPending, startTransition] = useTransition()

  function handleLink() {
    startTransition(async () => {
      await linkRAIDToDeliverable(item.id, deliverableId)
      onLinked()
    })
  }

  return (
    <div className={styles.row}>
      <Badge appearance="tint" color={TYPE_COLORS[item.type]} size="small">
        {TYPE_LABELS[item.type]}
      </Badge>
      <Text className={styles.title}>{item.title}</Text>
      <Badge appearance="tint" color={SEVERITY_COLORS[item.severity]} size="small">
        {SEVERITY_LABELS[item.severity]}
      </Badge>
      <Button
        size="small"
        appearance="primary"
        icon={isPending ? <Spinner size="tiny" /> : <LinkRegular />}
        disabled={isPending}
        onClick={handleLink}
      >
        Link
      </Button>
    </div>
  )
}

// ── Main dialog ───────────────────────────────────────────────────────────────

export function LinkRAIDDialog({ deliverableId, projectRAID, linkedIds }: Props) {
  const styles = useStyles()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const available = projectRAID.filter((item) => !linkedIds.has(item.id))

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
                {available.map((item) => (
                  <RAIDRow
                    key={item.id}
                    item={item}
                    deliverableId={deliverableId}
                    onLinked={handleLinked}
                  />
                ))}
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
