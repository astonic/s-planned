'use client'

import {
  makeStyles,
  tokens,
  Tab,
  TabList,
  Text,
  Badge,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Card,
  CardHeader,
} from '@fluentui/react-components'
import {
  DocumentRegular,
  FolderRegular,
  GridRegular,
  CheckmarkCircleRegular,
  DocumentCheckmarkRegular,
} from '@fluentui/react-icons'
import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type AcceptanceCriterion = {
  id: string
  description: string
  verificationMethod: string | null
}

type EvidenceRequirement = {
  id: string
  name: string
  type: string | null
  required: boolean
}

type Deliverable = {
  id: string
  code: string
  name: string
  phase: string | null
  domain: string | null
  acceptanceCriteria: AcceptanceCriterion[]
  evidenceRequirements: EvidenceRequirement[]
}

type SubSection = {
  id: string
  code: string
  name: string
  order: number
  deliverables: Deliverable[]
}

type FocusArea = {
  id: string
  code: string
  name: string
  order: number
  subSections: SubSection[]
}

export type TemplateViewerData = {
  id: string
  name: string
  description: string | null
  industry: string | null
  version: string
  createdAt: Date
  focusAreas: FocusArea[]
}

// ── Phase badge colours ───────────────────────────────────────────────────────

type BadgeColor = 'brand' | 'warning' | 'success' | 'informative' | 'subtle'

const PHASE_META: Record<string, { label: string; color: BadgeColor }> = {
  pre_commissioning: { label: 'Pre-commissioning', color: 'brand' },
  commissioning:     { label: 'Commissioning',     color: 'warning' },
  ramp_up:           { label: 'Ramp-up',           color: 'success' },
  handover:          { label: 'Handover',          color: 'informative' },
}

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  tabContent: {
    paddingTop: tokens.spacingVerticalL,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  statCard: {
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: tokens.colorBrandForeground1,
    lineHeight: 1,
  },
  statLabel: {
    color: tokens.colorNeutralForeground3,
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM,
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  focusAreaHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  subSectionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    marginBottom: tokens.spacingVerticalS,
    color: tokens.colorNeutralForeground2,
  },
  deliverableRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    marginBottom: tokens.spacingVerticalXS,
    flexWrap: 'wrap',
  },
  deliverableCode: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    minWidth: '80px',
  },
  deliverableName: {
    flex: 1,
    minWidth: '140px',
  },
  deliverableMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    flexWrap: 'wrap',
  },
  subSectionBlock: {
    marginLeft: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalM,
  },
  divider: {
    height: '1px',
    backgroundColor: tokens.colorNeutralStroke2,
    margin: `${tokens.spacingVerticalM} 0`,
  },
})

// ── Sub-components ────────────────────────────────────────────────────────────

function PhaseBadge({ phase }: { phase: string | null }) {
  if (!phase) return null
  const meta = PHASE_META[phase] ?? { label: phase, color: 'subtle' as BadgeColor }
  return (
    <Badge color={meta.color} appearance="filled" size="small">
      {meta.label}
    </Badge>
  )
}

function DeliverableRow({ d }: { d: Deliverable }) {
  const styles = useStyles()
  return (
    <div className={styles.deliverableRow}>
      <span className={styles.deliverableCode}>{d.code}</span>
      <Text className={styles.deliverableName} size={300} weight="medium">{d.name}</Text>
      <div className={styles.deliverableMeta}>
        <PhaseBadge phase={d.phase} />
        {d.domain && (
          <Badge appearance="outline" size="small" color="subtle">{d.domain}</Badge>
        )}
        {d.acceptanceCriteria.length > 0 && (
          <Badge appearance="tint" size="small" color="success" icon={<CheckmarkCircleRegular />}>
            {d.acceptanceCriteria.length} criteria
          </Badge>
        )}
        {d.evidenceRequirements.length > 0 && (
          <Badge appearance="tint" size="small" color="informative" icon={<DocumentCheckmarkRegular />}>
            {d.evidenceRequirements.length} evidence
          </Badge>
        )}
      </div>
    </div>
  )
}

// ── Totals helper ─────────────────────────────────────────────────────────────

function computeTotals(focusAreas: FocusArea[]) {
  let deliverables = 0
  let subSections = 0
  for (const fa of focusAreas) {
    subSections += fa.subSections.length
    for (const ss of fa.subSections) {
      deliverables += ss.deliverables.length
    }
  }
  return { focusAreas: focusAreas.length, subSections, deliverables }
}

// ── Main component ────────────────────────────────────────────────────────────

export function TemplateViewer({ template }: { template: TemplateViewerData }) {
  const styles = useStyles()
  const [selectedTab, setSelectedTab] = useState<string>('overview')
  const totals = computeTotals(template.focusAreas)

  return (
    <div className={styles.root}>
      <TabList
        selectedValue={selectedTab}
        onTabSelect={(_, data) => setSelectedTab(data.value as string)}
      >
        <Tab value="overview">Overview</Tab>
        <Tab value="structure">Structure</Tab>
      </TabList>

      {/* ── Overview tab ── */}
      {selectedTab === 'overview' && (
        <div className={styles.tabContent}>
          {/* Stat cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{totals.focusAreas}</span>
              <Text size={200} className={styles.statLabel}>Focus Areas</Text>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{totals.subSections}</span>
              <Text size={200} className={styles.statLabel}>Sub-sections</Text>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{totals.deliverables}</span>
              <Text size={200} className={styles.statLabel}>Deliverables</Text>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{template.version}</span>
              <Text size={200} className={styles.statLabel}>Version</Text>
            </div>
          </div>

          {/* Meta details */}
          <div className={styles.metaGrid}>
            {template.description && (
              <div className={styles.metaItem} style={{ gridColumn: '1 / -1' }}>
                <Text size={200} weight="semibold" style={{ color: tokens.colorNeutralForeground3 }}>
                  Description
                </Text>
                <Text size={300}>{template.description}</Text>
              </div>
            )}
            <div className={styles.metaItem}>
              <Text size={200} weight="semibold" style={{ color: tokens.colorNeutralForeground3 }}>Industry</Text>
              <Text size={300}>{template.industry ?? '—'}</Text>
            </div>
            <div className={styles.metaItem}>
              <Text size={200} weight="semibold" style={{ color: tokens.colorNeutralForeground3 }}>Created</Text>
              <Text size={300}>{new Date(template.createdAt).toLocaleDateString('en-AU', { dateStyle: 'medium' })}</Text>
            </div>
          </div>
        </div>
      )}

      {/* ── Structure tab ── */}
      {selectedTab === 'structure' && (
        <div className={styles.tabContent}>
          {template.focusAreas.length === 0 ? (
            <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
              No focus areas defined yet.
            </Text>
          ) : (
            <Accordion multiple collapsible defaultOpenItems={template.focusAreas.map((fa) => fa.id)}>
              {template.focusAreas
                .sort((a, b) => a.order - b.order)
                .map((fa) => (
                  <AccordionItem key={fa.id} value={fa.id}>
                    <AccordionHeader icon={<FolderRegular />} expandIconPosition="end">
                      <div className={styles.focusAreaHeader}>
                        <Text weight="semibold" size={300}>{fa.code}</Text>
                        <Text size={300}>{fa.name}</Text>
                        <Badge appearance="outline" size="small" color="subtle">
                          {fa.subSections.length} sub-sections
                        </Badge>
                      </div>
                    </AccordionHeader>
                    <AccordionPanel>
                      {fa.subSections
                        .sort((a, b) => a.order - b.order)
                        .map((ss) => (
                          <div key={ss.id} className={styles.subSectionBlock}>
                            <div className={styles.subSectionLabel}>
                              <GridRegular fontSize={14} />
                              <Text size={200} weight="semibold">{ss.code} — {ss.name}</Text>
                              <Badge appearance="tint" size="small" color="subtle">
                                {ss.deliverables.length}
                              </Badge>
                            </div>
                            {ss.deliverables.map((d) => (
                              <DeliverableRow key={d.id} d={d} />
                            ))}
                          </div>
                        ))}
                    </AccordionPanel>
                  </AccordionItem>
                ))}
            </Accordion>
          )}
        </div>
      )}
    </div>
  )
}
