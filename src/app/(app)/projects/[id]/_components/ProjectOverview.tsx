'use client'

import Link from 'next/link'
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Text,
  Badge,
  ProgressBar,
} from '@fluentui/react-components'
import type { ProjectStatus, ProjectPhase } from '@prisma/client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FocusAreaStat {
  name: string
  code: string
  total: number
  closed: number
  pct: number
}

export interface PhaseCounts {
  pre_commissioning: number
  commissioning: number
  ramp_up: number
  handover: number
}

export interface RAIDSummary {
  total: number
  openRisks: number
  criticalCount: number
  byType: {
    risk: number
    assumption: number
    issue: number
    dependency: number
  }
}

export interface ProjectOverviewProps {
  projectName: string
  projectStatus: ProjectStatus
  description: string | null
  templateName: string | null
  startDate: Date | null
  targetDate: Date | null
  createdAt: Date
  totalDeliverables: number
  closedDeliverables: number
  readinessPct: number
  byStatus: { planned: number; in_progress: number; delayed: number; closed: number }
  byFocusArea: FocusAreaStat[]
  byPhase: PhaseCounts
  projectId: string
  raidSummary: RAIDSummary
}

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXL,
    padding: `${tokens.spacingVerticalXL} ${tokens.spacingHorizontalXXL}`,
    maxWidth: '1200px',
  },

  // Stat cards
  statRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: tokens.spacingHorizontalM,
  },
  statCard: {
    padding: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  statLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  statValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: '1',
    color: tokens.colorNeutralForeground1,
  },
  statSubtext: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },

  // Focus area table
  sectionTitle: {
    marginBottom: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground1,
  },
  tableCard: {
    padding: `0`,
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    textAlign: 'left' as const,
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap' as const,
  },
  thRight: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    textAlign: 'right' as const,
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap' as const,
  },
  td: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    verticalAlign: 'middle' as const,
  },
  tdRight: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    verticalAlign: 'middle' as const,
    textAlign: 'right' as const,
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
  },
  tdProgress: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    verticalAlign: 'middle' as const,
    width: '200px',
    minWidth: '160px',
  },
  focusAreaName: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  focusAreaCode: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },

  // Phase cards
  phaseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: tokens.spacingHorizontalM,
  },
  phaseCard: {
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    borderLeft: `3px solid ${tokens.colorBrandBackground}`,
  },
  phaseLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  phaseCount: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    lineHeight: '1',
  },
  phaseSubtext: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },

  // RAID summary
  raidRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: tokens.spacingHorizontalM,
  },
  raidCard: {
    padding: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  raidLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  raidValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: '1',
    color: tokens.colorNeutralForeground1,
  },
  raidSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalM,
  },
  raidViewAll: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorBrandForeground1,
    textDecoration: 'none',
    fontWeight: tokens.fontWeightSemibold,
  },
  raidAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorStatusDangerBackground1,
    border: `1px solid ${tokens.colorStatusDangerBorderActive}`,
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorStatusDangerForeground1,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
  },
  raidAlertLink: {
    color: tokens.colorStatusDangerForeground1,
    fontWeight: tokens.fontWeightSemibold,
    marginLeft: tokens.spacingHorizontalXS,
  },

  // Metadata section
  metaCard: {
    padding: tokens.spacingVerticalL,
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalXXL}`,
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  metaLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  metaValue: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
  },
  metaEmpty: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground4,
    fontStyle: 'italic',
  },
  descriptionFull: {
    gridColumn: '1 / -1',
  },
})

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; color: 'brand' | 'danger' | 'success' | 'informative' }
> = {
  active: { label: 'Active', color: 'brand' },
  blocked: { label: 'Blocked', color: 'danger' },
  completed: { label: 'Completed', color: 'success' },
  archived: { label: 'Archived', color: 'informative' },
}

function readinessColor(pct: number): 'brand' | 'warning' | 'error' {
  if (pct >= 70) return 'brand'
  if (pct >= 40) return 'warning'
  return 'error'
}

function focusAreaBarColor(pct: number): string {
  if (pct >= 100) return tokens.colorStatusSuccessForeground1
  if (pct >= 50) return tokens.colorBrandForeground1
  return tokens.colorStatusWarningForeground1
}

function formatDate(date: Date | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const PHASE_LABELS: Record<keyof PhaseCounts, string> = {
  pre_commissioning: 'Pre-Commissioning',
  commissioning: 'Commissioning',
  ramp_up: 'Ramp-Up',
  handover: 'Handover',
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  subtext,
  children,
}: {
  label: string
  value: string | number
  subtext?: string
  children?: React.ReactNode
}) {
  const styles = useStyles()
  return (
    <Card>
      <div className={styles.statCard}>
        <Text className={styles.statLabel}>{label}</Text>
        <Text className={styles.statValue}>{value}</Text>
        {subtext && <Text className={styles.statSubtext}>{subtext}</Text>}
        {children}
      </div>
    </Card>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ProjectOverview({
  projectStatus,
  description,
  templateName,
  startDate,
  targetDate,
  createdAt,
  totalDeliverables,
  closedDeliverables,
  readinessPct,
  byStatus,
  byFocusArea,
  byPhase,
  projectId,
  raidSummary,
}: ProjectOverviewProps) {
  const styles = useStyles()
  const statusCfg = STATUS_CONFIG[projectStatus]
  const openItems = byStatus.planned + byStatus.in_progress + byStatus.delayed
  const readColor = readinessColor(readinessPct)

  return (
    <div className={styles.root}>
      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className={styles.statRow}>
        {/* Overall readiness */}
        <Card>
          <div className={styles.statCard}>
            <Text className={styles.statLabel}>Overall Readiness</Text>
            <Text className={styles.statValue}>{readinessPct}%</Text>
            <ProgressBar
              value={readinessPct / 100}
              color={readColor}
              thickness="large"
              style={{ marginTop: '4px' }}
            />
          </div>
        </Card>

        {/* Total deliverables */}
        <StatCard
          label="Total Deliverables"
          value={totalDeliverables}
          subtext={`${closedDeliverables} closed`}
        />

        {/* Open items */}
        <StatCard
          label="Open Items"
          value={openItems}
          subtext={`${byStatus.planned} planned · ${byStatus.in_progress} in progress`}
        />

        {/* Delayed */}
        <Card>
          <div className={styles.statCard}>
            <Text className={styles.statLabel}>Delayed</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
              <Text className={styles.statValue}>{byStatus.delayed}</Text>
              {byStatus.delayed > 0 && (
                <Badge appearance="filled" color="danger" size="medium">
                  {byStatus.delayed}
                </Badge>
              )}
            </div>
            <Text className={styles.statSubtext}>
              {statusCfg && (
                <Badge appearance="tint" color={statusCfg.color} size="small">
                  {statusCfg.label}
                </Badge>
              )}
            </Text>
          </div>
        </Card>
      </div>

      {/* ── Focus area progress table ────────────────────────────────────────── */}
      {byFocusArea.length > 0 && (
        <div>
          <Text size={400} weight="semibold" className={styles.sectionTitle} block>
            Focus Area Progress
          </Text>
          <Card className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Focus Area</th>
                  <th className={styles.thRight}>Deliverables</th>
                  <th className={styles.thRight}>Closed</th>
                  <th className={styles.th} style={{ width: '220px' }}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {byFocusArea.map((fa) => {
                  const barColor = focusAreaBarColor(fa.pct)
                  return (
                    <tr key={fa.code}>
                      <td className={styles.td}>
                        <Text className={styles.focusAreaName} block>
                          {fa.name}
                        </Text>
                        <Text className={styles.focusAreaCode}>{fa.code}</Text>
                      </td>
                      <td className={styles.tdRight}>{fa.total}</td>
                      <td className={styles.tdRight}>{fa.closed}</td>
                      <td className={styles.tdProgress}>
                        <div className={styles.progressLabel}>
                          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                            {fa.pct}%
                          </Text>
                        </div>
                        <ProgressBar
                          value={fa.total === 0 ? 0 : fa.closed / fa.total}
                          style={{ '--fui-ProgressBar-bar-color': barColor } as React.CSSProperties}
                          thickness="medium"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* ── Phase progress ───────────────────────────────────────────────────── */}
      <div>
        <Text size={400} weight="semibold" className={styles.sectionTitle} block>
          Phase Breakdown
        </Text>
        <div className={styles.phaseGrid}>
          {(Object.keys(PHASE_LABELS) as (keyof PhaseCounts)[]).map((phase) => (
            <Card key={phase}>
              <div className={styles.phaseCard}>
                <Text className={styles.phaseLabel}>{PHASE_LABELS[phase]}</Text>
                <Text className={styles.phaseCount}>{byPhase[phase]}</Text>
                <Text className={styles.phaseSubtext}>deliverables</Text>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── RAID Summary ─────────────────────────────────────────────────────── */}
      <div>
        <div className={styles.raidSectionHeader}>
          <Text size={400} weight="semibold" className={styles.sectionTitle}>
            RAID Summary
          </Text>
          <Link href={`/projects/${projectId}/raid`} className={styles.raidViewAll}>
            View all →
          </Link>
        </div>

        {raidSummary.criticalCount > 0 && (
          <div className={styles.raidAlert} style={{ marginBottom: tokens.spacingVerticalM }}>
            ⚠ {raidSummary.criticalCount} critical open RAID item{raidSummary.criticalCount !== 1 ? 's' : ''} require attention —{' '}
            <Link href={`/projects/${projectId}/raid`} className={styles.raidAlertLink}>
              View RAID log
            </Link>
          </div>
        )}

        <div className={styles.raidRow}>
          <Card>
            <div className={styles.raidCard}>
              <Text className={styles.raidLabel}>Open Risks</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                <Text className={styles.raidValue}>{raidSummary.openRisks}</Text>
                {raidSummary.openRisks > 0 && (
                  <Badge appearance="filled" color="danger" size="medium">
                    {raidSummary.openRisks}
                  </Badge>
                )}
              </div>
            </div>
          </Card>
          <Card>
            <div className={styles.raidCard}>
              <Text className={styles.raidLabel}>Assumptions</Text>
              <Text className={styles.raidValue}>{raidSummary.byType.assumption}</Text>
            </div>
          </Card>
          <Card>
            <div className={styles.raidCard}>
              <Text className={styles.raidLabel}>Issues</Text>
              <Text className={styles.raidValue}>{raidSummary.byType.issue}</Text>
            </div>
          </Card>
          <Card>
            <div className={styles.raidCard}>
              <Text className={styles.raidLabel}>Dependencies</Text>
              <Text className={styles.raidValue}>{raidSummary.byType.dependency}</Text>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Project metadata ─────────────────────────────────────────────────── */}
      <div>
        <Text size={400} weight="semibold" className={styles.sectionTitle} block>
          Project Details
        </Text>
        <Card className={styles.metaCard}>
          <div className={styles.metaGrid}>
            {description && (
              <div className={`${styles.metaItem} ${styles.descriptionFull}`}>
                <Text className={styles.metaLabel}>Description</Text>
                <Text className={styles.metaValue}>{description}</Text>
              </div>
            )}
            <div className={styles.metaItem}>
              <Text className={styles.metaLabel}>Template</Text>
              {templateName ? (
                <Text className={styles.metaValue}>{templateName}</Text>
              ) : (
                <Text className={styles.metaEmpty}>No template</Text>
              )}
            </div>
            <div className={styles.metaItem}>
              <Text className={styles.metaLabel}>Status</Text>
              {statusCfg && (
                <Badge appearance="tint" color={statusCfg.color}>
                  {statusCfg.label}
                </Badge>
              )}
            </div>
            <div className={styles.metaItem}>
              <Text className={styles.metaLabel}>Start Date</Text>
              <Text className={styles.metaValue}>{formatDate(startDate)}</Text>
            </div>
            <div className={styles.metaItem}>
              <Text className={styles.metaLabel}>Target Date</Text>
              <Text className={styles.metaValue}>{formatDate(targetDate)}</Text>
            </div>
            <div className={styles.metaItem}>
              <Text className={styles.metaLabel}>Created</Text>
              <Text className={styles.metaValue}>{formatDate(createdAt)}</Text>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
