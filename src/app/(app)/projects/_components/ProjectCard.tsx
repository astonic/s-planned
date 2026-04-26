'use client'

import Link from 'next/link'
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  CardFooter,
  Button,
  Badge,
  Text,
  ProgressBar,
} from '@fluentui/react-components'
import { ArrowRightRegular } from '@fluentui/react-icons'
import type { ProjectStatus } from '@prisma/client'

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  card: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: '220px',
    transition: 'box-shadow 0.15s ease, transform 0.15s ease',
    ':hover': {
      boxShadow: tokens.shadow8,
      transform: 'translateY(-2px)',
    },
  },
  body: {
    flex: 1,
    padding: `0 ${tokens.spacingHorizontalM} ${tokens.spacingVerticalM}`,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  metaRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  progressSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
})

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProjectCardData {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  startDate: Date | null
  targetDate: Date | null
  template: { name: string } | null
  deliverableCounts: {
    planned: number
    in_progress: number
    delayed: number
    closed: number
    total: number
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(status: ProjectStatus) {
  const map: Record<ProjectStatus, { label: string; color: 'brand' | 'danger' | 'success' | 'subtle' }> = {
    active: { label: 'Active', color: 'brand' },
    blocked: { label: 'Blocked', color: 'danger' },
    completed: { label: 'Completed', color: 'success' },
    archived: { label: 'Archived', color: 'subtle' },
  }
  const { label, color } = map[status]
  return (
    <Badge appearance="tint" color={color} size="small">
      {label}
    </Badge>
  )
}

function formatDate(d: Date | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const styles = useStyles()
  const { deliverableCounts } = project
  const total = deliverableCounts.total
  const readiness = total > 0 ? Math.round((deliverableCounts.closed / total) * 100) : 0

  return (
    <Card className={`${styles.card} card-lift`}>
      <CardHeader
        header={
          <Text size={400} weight="semibold">
            {project.name}
          </Text>
        }
        description={
          <div className={styles.metaRow} style={{ marginTop: '4px' }}>
            {statusBadge(project.status)}
            {project.template && (
              <Badge appearance="outline" color="informative" size="small">
                {project.template.name}
              </Badge>
            )}
          </div>
        }
      />

      <div className={styles.body}>
        {/* Dates */}
        {(project.startDate || project.targetDate) && (
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {project.startDate && `Start: ${formatDate(project.startDate)}`}
            {project.startDate && project.targetDate && '  ·  '}
            {project.targetDate && `Target: ${formatDate(project.targetDate)}`}
          </Text>
        )}

        {/* Readiness progress */}
        <div className={styles.progressSection}>
          <div className={styles.progressLabel}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Readiness
            </Text>
            <Text size={200} weight="semibold">
              {readiness}%
            </Text>
          </div>
          <ProgressBar
            value={readiness / 100}
            thickness="medium"
            color={readiness === 100 ? 'success' : 'brand'}
          />
        </div>

        {/* Deliverable count breakdown */}
        <div className={styles.countRow}>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {deliverableCounts.planned} planned
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>·</Text>
          <Text size={200} style={{ color: tokens.colorBrandForeground1 }}>
            {deliverableCounts.in_progress} in-progress
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>·</Text>
          <Text size={200} style={{ color: tokens.colorStatusDangerForeground1 }}>
            {deliverableCounts.delayed} delayed
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>·</Text>
          <Text size={200} style={{ color: tokens.colorStatusSuccessForeground1 }}>
            {deliverableCounts.closed} closed
          </Text>
        </div>
      </div>

      <CardFooter className={styles.footer}>
        <Link href={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
          <Button appearance="primary" icon={<ArrowRightRegular />} iconPosition="after" size="small">
            Open
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
