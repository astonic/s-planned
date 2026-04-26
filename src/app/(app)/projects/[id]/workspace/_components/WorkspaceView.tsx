'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  makeStyles,
  tokens,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Button,
  Text,
  Badge,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableCellLayout,
} from '@fluentui/react-components'
import { AppsListRegular, TableRegular } from '@fluentui/react-icons'
import type {
  Project,
  FocusAreaExecution,
  SubSectionExecution,
  DeliverableExecution,
  DeliverableStatus,
  ProjectPhase,
} from '@prisma/client'
import { DeliverableRow } from './DeliverableRow'

// ── Types ─────────────────────────────────────────────────────────────────────

type DeliverableWithAll = DeliverableExecution

type SubSectionWithDeliverables = SubSectionExecution & {
  deliverables: DeliverableWithAll[]
}

type FocusAreaWithAll = FocusAreaExecution & {
  subSections: SubSectionWithDeliverables[]
}

type ProjectWithAll = Project & {
  focusAreaExecutions: FocusAreaWithAll[]
}

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  viewToggle: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    marginBottom: tokens.spacingVerticalL,
  },
  accordionContainer: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
  faHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flex: 1,
  },
  faCode: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  faName: {
    fontWeight: tokens.fontWeightSemibold,
  },
  faSummary: {
    marginLeft: 'auto',
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    alignItems: 'center',
  },
  subsectionLabel: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    marginTop: tokens.spacingVerticalS,
  },
  subsectionGroup: {
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    ':first-child': {
      borderTop: 'none',
    },
  },
  emptyState: {
    padding: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
    fontSize: tokens.fontSizeBase200,
  },
  tableContainer: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
  tableRow: {
    cursor: 'pointer',
  },
  codeCell: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
})

// ── Status badge colours ──────────────────────────────────────────────────────

const STATUS_BADGE_COLORS: Record<DeliverableStatus, 'informative' | 'brand' | 'warning' | 'success'> = {
  planned: 'informative',
  in_progress: 'brand',
  delayed: 'warning',
  closed: 'success',
}

const STATUS_LABELS: Record<DeliverableStatus, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  delayed: 'Delayed',
  closed: 'Closed',
}

const PHASE_COLORS: Record<ProjectPhase, 'informative' | 'warning' | 'success' | 'severe'> = {
  pre_commissioning: 'informative',
  commissioning: 'warning',
  ramp_up: 'success',
  handover: 'severe',
}

const PHASE_LABELS: Record<ProjectPhase, string> = {
  pre_commissioning: 'Pre-Comm',
  commissioning: 'Commissioning',
  ramp_up: 'Ramp Up',
  handover: 'Handover',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeReadiness(focusArea: FocusAreaWithAll): { total: number; closed: number; pct: number } {
  let total = 0
  let closed = 0
  for (const ss of focusArea.subSections) {
    for (const d of ss.deliverables) {
      total++
      if (d.status === 'closed') closed++
    }
  }
  return { total, closed, pct: total === 0 ? 0 : Math.round((closed / total) * 100) }
}

function flatDeliverables(focusAreas: FocusAreaWithAll[]): Array<DeliverableWithAll & { focusAreaName: string; focusAreaCode: string; subSectionName: string }> {
  const rows: Array<DeliverableWithAll & { focusAreaName: string; focusAreaCode: string; subSectionName: string }> = []
  for (const fa of focusAreas) {
    for (const ss of fa.subSections) {
      for (const d of ss.deliverables) {
        rows.push({ ...d, focusAreaName: fa.name, focusAreaCode: fa.code, subSectionName: ss.name })
      }
    }
  }
  return rows
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  project: ProjectWithAll
}

export function WorkspaceView({ project }: Props) {
  const styles = useStyles()
  const router = useRouter()
  const [view, setView] = useState<'accordion' | 'table'>('accordion')

  const allDeliverables = flatDeliverables(project.focusAreaExecutions)

  return (
    <div>
      {/* View toggle */}
      <div className={styles.viewToggle}>
        <Button
          appearance={view === 'accordion' ? 'primary' : 'subtle'}
          icon={<AppsListRegular />}
          onClick={() => setView('accordion')}
        >
          Accordion
        </Button>
        <Button
          appearance={view === 'table' ? 'primary' : 'subtle'}
          icon={<TableRegular />}
          onClick={() => setView('table')}
        >
          Table
        </Button>
      </div>

      {/* Accordion view */}
      {view === 'accordion' && (
        <div className={styles.accordionContainer}>
          {project.focusAreaExecutions.length === 0 && (
            <div className={styles.emptyState}>No focus areas found for this project.</div>
          )}
          <Accordion multiple collapsible>
            {project.focusAreaExecutions.map((fa) => {
              const { total, closed, pct } = computeReadiness(fa)
              return (
                <AccordionItem key={fa.id} value={fa.id}>
                  <AccordionHeader>
                    <div className={styles.faHeader}>
                      <span className={styles.faCode}>{fa.code}</span>
                      <span className={styles.faName}>{fa.name}</span>
                      <div className={styles.faSummary}>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                          {total} deliverable{total !== 1 ? 's' : ''}, {closed} closed
                        </Text>
                        <Badge
                          appearance="tint"
                          color={pct === 100 ? 'success' : pct >= 50 ? 'warning' : 'informative'}
                          size="small"
                        >
                          {pct}%
                        </Badge>
                      </div>
                    </div>
                  </AccordionHeader>
                  <AccordionPanel>
                    {fa.subSections.length === 0 && (
                      <div className={styles.emptyState}>No sub-sections.</div>
                    )}
                    {fa.subSections.map((ss) => (
                      <div key={ss.id} className={styles.subsectionGroup}>
                        <div className={styles.subsectionLabel}>
                          {ss.code} — {ss.name}
                        </div>
                        {ss.deliverables.length === 0 && (
                          <div className={styles.emptyState}>No deliverables.</div>
                        )}
                        {ss.deliverables.map((d) => (
                          <DeliverableRow
                            key={d.id}
                            deliverable={d}
                            projectId={project.id}
                          />
                        ))}
                      </div>
                    ))}
                  </AccordionPanel>
                </AccordionItem>
              )
            })}
          </Accordion>
        </div>
      )}

      {/* Table view */}
      {view === 'table' && (
        <div className={styles.tableContainer}>
          <Table aria-label="Deliverables table" size="small">
            <TableHeader>
              <TableRow>
                <TableHeaderCell style={{ width: '90px' }}>Code</TableHeaderCell>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell style={{ width: '160px' }}>Focus Area</TableHeaderCell>
                <TableHeaderCell style={{ width: '160px' }}>Sub-Section</TableHeaderCell>
                <TableHeaderCell style={{ width: '110px' }}>Status</TableHeaderCell>
                <TableHeaderCell style={{ width: '110px' }}>Phase</TableHeaderCell>
                <TableHeaderCell style={{ width: '110px' }}>Target Date</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allDeliverables.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} style={{ textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                    No deliverables found.
                  </TableCell>
                </TableRow>
              )}
              {allDeliverables.map((d) => (
                <TableRow
                  key={d.id}
                  className={styles.tableRow}
                  onClick={() => router.push(`/projects/${project.id}/deliverables/${d.id}`)}
                >
                  <TableCell>
                    <TableCellLayout>
                      <span className={styles.codeCell}>{d.code}</span>
                    </TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <TableCellLayout>{d.name}</TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <TableCellLayout>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        {d.focusAreaCode}
                      </Text>{' '}
                      {d.focusAreaName}
                    </TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <TableCellLayout>{d.subSectionName}</TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <TableCellLayout>
                      <Badge
                        appearance="tint"
                        color={STATUS_BADGE_COLORS[d.status]}
                        size="small"
                      >
                        {STATUS_LABELS[d.status]}
                      </Badge>
                    </TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <TableCellLayout>
                      {d.phase ? (
                        <Badge
                          appearance="tint"
                          color={PHASE_COLORS[d.phase]}
                          size="small"
                        >
                          {PHASE_LABELS[d.phase]}
                        </Badge>
                      ) : (
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>—</Text>
                      )}
                    </TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <TableCellLayout>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        {d.targetDate
                          ? new Date(d.targetDate).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </Text>
                    </TableCellLayout>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
