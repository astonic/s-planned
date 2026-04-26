'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  makeStyles,
  tokens,
  Text,
  Badge,
  Select,
  Input,
  Textarea,
  Tab,
  TabList,
  Spinner,
  Card,
  CardHeader,
  Divider,
  Field,
} from '@fluentui/react-components'
import type {
  DeliverableExecution,
  DeliverableStatus,
  ProjectPhase,
} from '@prisma/client'
import { updateDeliverableStatus, updateDeliverableField } from '@/lib/actions/projects'

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  layout: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: tokens.spacingHorizontalXL,
    alignItems: 'start',
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
  },
  statusLabel: {
    fontWeight: tokens.fontWeightSemibold,
    marginRight: tokens.spacingHorizontalS,
  },
  lastUpdated: {
    marginLeft: 'auto',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  tabContent: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  inlineEditWrap: {
    position: 'relative',
  },
  successBorder: {
    outline: `2px solid ${tokens.colorStatusSuccessBorderActive}`,
    borderRadius: tokens.borderRadiusSmall,
  },
  sidebarCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  sidebarRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  sidebarLabel: {
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
  },
  idText: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground4,
    wordBreak: 'break-all',
  },
  datesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
  },
  activityPlaceholder: {
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
    padding: tokens.spacingVerticalM,
  },
})

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: DeliverableStatus; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'closed', label: 'Closed' },
]

const STATUS_BADGE_COLORS: Record<DeliverableStatus, 'informative' | 'brand' | 'warning' | 'success'> = {
  planned: 'informative',
  in_progress: 'brand',
  delayed: 'warning',
  closed: 'success',
}

const PHASE_COLORS: Record<ProjectPhase, 'informative' | 'warning' | 'success' | 'severe'> = {
  pre_commissioning: 'informative',
  commissioning: 'warning',
  ramp_up: 'success',
  handover: 'severe',
}

const PHASE_LABELS: Record<ProjectPhase, string> = {
  pre_commissioning: 'Pre-Commissioning',
  commissioning: 'Commissioning',
  ramp_up: 'Ramp Up',
  handover: 'Handover',
}

// ── Inline editable field ─────────────────────────────────────────────────────

type EditableFieldName = 'description' | 'notes' | 'startDate' | 'targetDate'

interface UseInlineEditProps {
  id: string
  field: EditableFieldName
  initialValue: string
}

function useInlineEdit({ id, field, initialValue }: UseInlineEditProps) {
  const router = useRouter()
  const [value, setValue] = useState(initialValue)
  const [isPending, startTransition] = useTransition()
  const [showSuccess, setShowSuccess] = useState(false)

  function save(newValue: string) {
    if (newValue === initialValue) return
    startTransition(async () => {
      await updateDeliverableField(id, field, newValue || null)
      setShowSuccess(true)
      router.refresh()
      setTimeout(() => setShowSuccess(false), 1500)
    })
  }

  return { value, setValue, isPending, showSuccess, save }
}

// ── Component ─────────────────────────────────────────────────────────────────

type DeliverableWithRelations = DeliverableExecution & {
  subSectionExecution: {
    id: string
    name: string
    code: string
    focusAreaExecution: {
      id: string
      name: string
      code: string
      project: {
        id: string
        name: string
        organizationId: string
      }
    }
  }
}

interface Props {
  deliverable: DeliverableWithRelations
  projectId: string
}

export function DeliverableDetail({ deliverable, projectId: _projectId }: Props) {
  const styles = useStyles()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details')

  // Status
  const [currentStatus, setCurrentStatus] = useState<DeliverableStatus>(deliverable.status)
  const [statusPending, startStatusTransition] = useTransition()

  function handleStatusChange(newStatus: DeliverableStatus) {
    setCurrentStatus(newStatus)
    startStatusTransition(async () => {
      await updateDeliverableStatus(deliverable.id, newStatus)
      router.refresh()
    })
  }

  // Name inline edit
  const [nameValue, setNameValue] = useState(deliverable.name)
  const [namePending, startNameTransition] = useTransition()
  const [nameSuccess, setNameSuccess] = useState(false)

  function saveName() {
    if (!nameValue.trim() || nameValue === deliverable.name) return
    startNameTransition(async () => {
      await updateDeliverableField(deliverable.id, 'description', nameValue.trim())
      setNameSuccess(true)
      router.refresh()
      setTimeout(() => setNameSuccess(false), 1500)
    })
  }

  // Description
  const desc = useInlineEdit({
    id: deliverable.id,
    field: 'description',
    initialValue: deliverable.description ?? '',
  })

  // Notes
  const notes = useInlineEdit({
    id: deliverable.id,
    field: 'notes',
    initialValue: deliverable.notes ?? '',
  })

  // Start date
  const startDateEdit = useInlineEdit({
    id: deliverable.id,
    field: 'startDate',
    initialValue: deliverable.startDate
      ? new Date(deliverable.startDate).toISOString().split('T')[0]
      : '',
  })

  // Target date
  const targetDateEdit = useInlineEdit({
    id: deliverable.id,
    field: 'targetDate',
    initialValue: deliverable.targetDate
      ? new Date(deliverable.targetDate).toISOString().split('T')[0]
      : '',
  })

  return (
    <div className={styles.layout}>
      {/* Left panel */}
      <div className={styles.leftPanel}>
        {/* Status bar */}
        <div className={styles.statusBar}>
          <Text className={styles.statusLabel}>Status:</Text>
          {statusPending ? (
            <Spinner size="tiny" />
          ) : (
            <Select
              value={currentStatus}
              onChange={(_, d) => handleStatusChange(d.value as DeliverableStatus)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          )}
          <Text className={styles.lastUpdated}>
            Last updated:{' '}
            {new Date(deliverable.updatedAt).toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </div>

        {/* Tabs */}
        <TabList
          selectedValue={activeTab}
          onTabSelect={(_, d) => setActiveTab(d.value as 'details' | 'activity')}
        >
          <Tab value="details">Details</Tab>
          <Tab value="activity">Activity</Tab>
        </TabList>

        {/* Details tab */}
        {activeTab === 'details' && (
          <div className={styles.tabContent}>
            {/* Name */}
            <div className={styles.fieldGroup}>
              <Field label="Name">
                <div className={styles.inlineEditWrap}>
                  <Input
                    value={nameValue}
                    onChange={(_, d) => setNameValue(d.value)}
                    onBlur={saveName}
                    contentAfter={namePending ? <Spinner size="tiny" /> : undefined}
                    className={nameSuccess ? styles.successBorder : undefined}
                  />
                </div>
              </Field>
            </div>

            {/* Description */}
            <div className={styles.fieldGroup}>
              <Field label="Description">
                <div className={styles.inlineEditWrap}>
                  <Textarea
                    value={desc.value}
                    onChange={(_, d) => desc.setValue(d.value)}
                    onBlur={(e) => desc.save(e.target.value)}
                    placeholder="Add a description..."
                    rows={4}
                    className={desc.showSuccess ? styles.successBorder : undefined}
                  />
                  {desc.isPending && (
                    <Spinner size="tiny" style={{ position: 'absolute', top: 8, right: 8 }} />
                  )}
                </div>
              </Field>
            </div>

            {/* Notes */}
            <div className={styles.fieldGroup}>
              <Field label="Internal Notes">
                <div className={styles.inlineEditWrap}>
                  <Textarea
                    value={notes.value}
                    onChange={(_, d) => notes.setValue(d.value)}
                    onBlur={(e) => notes.save(e.target.value)}
                    placeholder="Internal notes..."
                    rows={4}
                    className={notes.showSuccess ? styles.successBorder : undefined}
                  />
                  {notes.isPending && (
                    <Spinner size="tiny" style={{ position: 'absolute', top: 8, right: 8 }} />
                  )}
                </div>
              </Field>
            </div>

            <Divider />

            {/* Dates */}
            <div>
              <Text size={300} weight="semibold" block style={{ marginBottom: tokens.spacingVerticalS }}>
                Dates
              </Text>
              <div className={styles.datesGrid}>
                <Field label="Start Date">
                  <Input
                    type="date"
                    value={startDateEdit.value}
                    onChange={(_, d) => startDateEdit.setValue(d.value)}
                    onBlur={(e) => startDateEdit.save(e.target.value)}
                    contentAfter={startDateEdit.isPending ? <Spinner size="tiny" /> : undefined}
                    className={startDateEdit.showSuccess ? styles.successBorder : undefined}
                  />
                </Field>
                <Field label="Target Date">
                  <Input
                    type="date"
                    value={targetDateEdit.value}
                    onChange={(_, d) => targetDateEdit.setValue(d.value)}
                    onBlur={(e) => targetDateEdit.save(e.target.value)}
                    contentAfter={targetDateEdit.isPending ? <Spinner size="tiny" /> : undefined}
                    className={targetDateEdit.showSuccess ? styles.successBorder : undefined}
                  />
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* Activity tab */}
        {activeTab === 'activity' && (
          <div className={styles.tabContent}>
            <Text className={styles.activityPlaceholder}>
              Audit log coming in Phase 6.
            </Text>
          </div>
        )}
      </div>

      {/* Right panel — sidebar */}
      <div className={styles.sidebarCard}>
        <Text size={300} weight="semibold" block>
          Details
        </Text>

        <Divider />

        {/* Status */}
        <div className={styles.sidebarRow}>
          <Text className={styles.sidebarLabel}>Status</Text>
          <Badge
            appearance="tint"
            color={STATUS_BADGE_COLORS[currentStatus]}
          >
            {STATUS_OPTIONS.find((o) => o.value === currentStatus)?.label ?? currentStatus}
          </Badge>
        </div>

        {/* Phase */}
        <div className={styles.sidebarRow}>
          <Text className={styles.sidebarLabel}>Phase</Text>
          {deliverable.phase ? (
            <Badge appearance="tint" color={PHASE_COLORS[deliverable.phase]}>
              {PHASE_LABELS[deliverable.phase]}
            </Badge>
          ) : (
            <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>—</Text>
          )}
        </div>

        {/* Code */}
        <div className={styles.sidebarRow}>
          <Text className={styles.sidebarLabel}>Code</Text>
          <span className={styles.codeText}>{deliverable.code}</span>
        </div>

        {/* Domain */}
        <div className={styles.sidebarRow}>
          <Text className={styles.sidebarLabel}>Domain</Text>
          <Text size={300}>
            {deliverable.domain ?? <span style={{ color: tokens.colorNeutralForeground3 }}>—</span>}
          </Text>
        </div>

        <Divider />

        {/* Deliverable ID */}
        <div className={styles.sidebarRow}>
          <Text className={styles.sidebarLabel}>Deliverable ID</Text>
          <span className={styles.idText}>{deliverable.id}</span>
        </div>

        {/* Created */}
        <div className={styles.sidebarRow}>
          <Text className={styles.sidebarLabel}>Created</Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {new Date(deliverable.createdAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </div>

        {/* Last updated */}
        <div className={styles.sidebarRow}>
          <Text className={styles.sidebarLabel}>Last Updated</Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {new Date(deliverable.updatedAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </div>
      </div>
    </div>
  )
}
