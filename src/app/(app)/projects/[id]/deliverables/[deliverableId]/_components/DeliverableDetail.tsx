'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
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
  Divider,
  Field,
  Button,
  Avatar,
  Combobox,
  Option,
  Checkbox,
} from '@fluentui/react-components'
import { DismissCircleRegular } from '@fluentui/react-icons'
import type {
  DeliverableExecution,
  DeliverableStatus,
  ProjectPhase,
  RAIDType,
  RAIDSeverity,
  RAIDStatus,
  Person,
  Vendor,
} from '@prisma/client'
import { updateDeliverableStatus, updateDeliverableField } from '@/lib/actions/projects'
import {
  setDeliverableOwner,
  linkPersonToDeliverable,
  unlinkPersonFromDeliverable,
  linkVendorToDeliverable,
  unlinkVendorFromDeliverable,
} from '@/lib/actions/stakeholders'
import { getDeliverableActivityPage } from '@/lib/actions/activity'
import { unlinkRAIDFromDeliverable } from '@/lib/actions/raid'
import { toggleCriteriaCompletion } from '@/lib/actions/evidence'
import { LinkRAIDDialog } from './LinkRAIDDialog'
import type { RAIDItemSummary } from './LinkRAIDDialog'
import { EvidenceTab } from './EvidenceTab'
import type { EvidenceItem, EvidenceRequirementItem, CriteriaItem } from './EvidenceTab'
import { NotesTab } from './NotesTab'
import type { NoteItem } from './NotesTab'

// Styles
const useStyles = makeStyles({
  layout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(860px, 1fr) 360px',
    gap: 0,
    alignItems: 'stretch',
    maxWidth: '1480px',
    margin: '0 auto',
    minHeight: 'calc(100vh - 180px)',
    '@media (max-width: 1280px)': {
      gridTemplateColumns: '1fr',
      gap: tokens.spacingVerticalL,
    },
  },
  leftPanel: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  rightPanel: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  taskSurface: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRight: 'none',
    boxShadow: tokens.shadow16,
    minHeight: '100%',
    padding: '40px 48px',
    '@media (max-width: 1280px)': {
      borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    },
    '@media (max-width: 720px)': {
      padding: tokens.spacingHorizontalL,
    },
  },
  taskHeader: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS, marginBottom: tokens.spacingVerticalL },
  taskKicker: { color: tokens.colorBrandForeground1, fontSize: tokens.fontSizeBase200, fontWeight: tokens.fontWeightSemibold },
  titleRow: { display: 'grid', gridTemplateColumns: '24px minmax(0, 1fr)', gap: tokens.spacingHorizontalS, alignItems: 'center' },
  statusDot: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    border: `2px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  statusDotClosed: { border: `2px solid ${tokens.colorStatusSuccessBorderActive}`, backgroundColor: tokens.colorStatusSuccessBackground3 },
  titleInput: {
    width: '100%',
    '& input': {
      fontSize: tokens.fontSizeBase500,
      fontWeight: tokens.fontWeightSemibold,
    },
  },
  headerMeta: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS, flexWrap: 'wrap', paddingLeft: '30px' },
  compactAvatarRow: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS },
  plannerGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 360px',
    gap: tokens.spacingHorizontalXXL,
    alignItems: 'start',
    '@media (max-width: 1020px)': {
      gridTemplateColumns: '1fr',
    },
  },
  detailsColumn: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL, minWidth: 0 },
  sideColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    minWidth: 0,
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingLeft: tokens.spacingHorizontalXL,
    '@media (max-width: 1020px)': {
      borderLeft: 'none',
      paddingLeft: 0,
    },
  },
  descriptionBox: {
    width: '100%',
    '& textarea': {
      minHeight: '108px',
      lineHeight: 1.35,
    },
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    '@media (max-width: 720px)': {
      gridTemplateColumns: '1fr',
    },
  },
  sectionBlock: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  sectionHeaderLine: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS, justifyContent: 'space-between' },
  progressTrack: { height: '3px', backgroundColor: tokens.colorNeutralStroke2, flex: 1, minWidth: '140px' },
  progressFill: { height: '100%', backgroundColor: 'var(--sp-success)' },
  checklistList: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS },
  checklistRow: { display: 'grid', gridTemplateColumns: '24px minmax(0, 1fr)', gap: tokens.spacingHorizontalS, alignItems: 'start' },
  checklistTextDone: { color: tokens.colorNeutralForeground3, textDecoration: 'line-through' },
  subtleText: { color: tokens.colorNeutralForeground3 },
  dependencyCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  attachmentCard: {
    display: 'grid',
    gridTemplateColumns: '32px minmax(0, 1fr)',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  attachmentIcon: {
    width: '28px',
    height: '28px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: tokens.fontWeightSemibold,
  },
  conversationBox: {
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
  changesRail: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalM}`,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    minHeight: '100%',
    overflow: 'hidden',
    '@media (max-width: 1280px)': {
      minHeight: 'auto',
    },
  },
  changesHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  changeList: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS, overflowY: 'auto', maxHeight: 'calc(100vh - 260px)', paddingRight: tokens.spacingHorizontalXS },
  changeCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  changeMeta: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS, justifyContent: 'space-between' },
  statusBar: {
    display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
  },
  statusLabel: { fontWeight: tokens.fontWeightSemibold, marginRight: tokens.spacingHorizontalS },
  lastUpdated: { marginLeft: 'auto', fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 },
  tabContent: {
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL,
  },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS, width: '100%' },
  inlineEditWrap: { position: 'relative', width: '100%' },
  wideControl: { width: '100%' },
  successBorder: { outline: `2px solid ${tokens.colorStatusSuccessBorderActive}`, borderRadius: tokens.borderRadiusSmall },
  sidebarCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalL,
    display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM,
  },
  sidebarRow: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS },
  sidebarLabel: {
    fontSize: tokens.fontSizeBase100, fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3, textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  codeText: { fontFamily: 'monospace', fontSize: tokens.fontSizeBase300, fontWeight: tokens.fontWeightSemibold },
  idText: { fontFamily: 'monospace', fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground4, wordBreak: 'break-all' },
  datesGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(240px, 1fr))', gap: tokens.spacingHorizontalM },
  activityList: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  activityRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  activityMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  activityFilters: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  activitySearch: {
    width: '320px',
  },
  activityLoadMore: {
    display: 'flex',
    justifyContent: 'center',
  },
  activityPlaceholder: { color: tokens.colorNeutralForeground3, fontStyle: 'italic', padding: tokens.spacingVerticalM },
  activityError: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorStatusDangerBorderActive}`,
    backgroundColor: tokens.colorStatusDangerBackground1,
    color: tokens.colorStatusDangerForeground1,
    fontSize: tokens.fontSizeBase200,
  },
  raidHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  raidList: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  raidRow: {
    display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium, border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  raidTitle: { flex: 1, fontWeight: tokens.fontWeightSemibold, fontSize: tokens.fontSizeBase300, color: tokens.colorNeutralForeground1 },
  raidEmpty: { color: tokens.colorNeutralForeground3, fontStyle: 'italic', padding: tokens.spacingVerticalM },
  teamSection: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  teamRow: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS, minWidth: 0 },
  teamName: { flex: 1, minWidth: 0, fontSize: tokens.fontSizeBase200, overflowWrap: 'anywhere' },
})

const STATUS_OPTIONS: { value: DeliverableStatus; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'closed', label: 'Closed' },
]
const STATUS_BADGE_COLORS: Record<DeliverableStatus, 'informative' | 'brand' | 'warning' | 'success'> = {
  planned: 'informative', in_progress: 'brand', delayed: 'warning', closed: 'success',
}
const PHASE_COLORS: Record<ProjectPhase, 'informative' | 'warning' | 'success' | 'severe'> = {
  pre_commissioning: 'informative', commissioning: 'warning', ramp_up: 'success', handover: 'severe',
}
const PHASE_LABELS: Record<ProjectPhase, string> = {
  pre_commissioning: 'Pre-Commissioning', commissioning: 'Commissioning', ramp_up: 'Ramp Up', handover: 'Handover',
}
const RAID_TYPE_COLORS: Record<RAIDType, 'brand' | 'danger' | 'warning' | 'informative'> = {
  risk: 'danger', assumption: 'informative', issue: 'warning', dependency: 'brand',
}
const RAID_SEVERITY_COLORS: Record<RAIDSeverity, 'subtle' | 'warning' | 'danger' | 'severe'> = {
  low: 'subtle', medium: 'warning', high: 'severe', critical: 'danger',
}
const RAID_STATUS_COLORS: Record<RAIDStatus, 'informative' | 'brand' | 'success'> = {
  open: 'informative', in_progress: 'brand', closed: 'success',
}
const RAID_TYPE_LABELS: Record<RAIDType, string> = {
  risk: 'Risk', assumption: 'Assumption', issue: 'Issue', dependency: 'Dependency',
}
const RAID_SEVERITY_LABELS: Record<RAIDSeverity, string> = {
  low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical',
}
const RAID_STATUS_LABELS: Record<RAIDStatus, string> = {
  open: 'Open', in_progress: 'In Progress', closed: 'Closed',
}

type EditableFieldName = 'name' | 'description' | 'notes' | 'startDate' | 'targetDate'
interface UseInlineEditProps { id: string; field: EditableFieldName; initialValue: string }

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

type PersonLink = { personId: string; deliverableExecutionId: string; person: Person }
type VendorLink = { vendorId: string; deliverableExecutionId: string; vendor: Vendor }
type DeliverableWithRelations = DeliverableExecution & {
  owner: Person | null
  peopleLinks: PersonLink[]
  vendorLinks: VendorLink[]
  subSectionExecution: {
    id: string; name: string; code: string
    focusAreaExecution: {
      id: string; name: string; code: string
      project: { id: string; name: string; organizationId: string }
    }
  }
}

export interface LinkedRAIDItem {
  raidItemId: string; deliverableExecutionId: string
  raidItem: { id: string; type: RAIDType; title: string; severity: RAIDSeverity; status: RAIDStatus }
}

interface Props {
  deliverable: DeliverableWithRelations
  projectId: string
  linkedRAID: LinkedRAIDItem[]
  projectRAID: RAIDItemSummary[]
  orgPeople: Person[]
  orgVendors: Vendor[]
  auditEvents: {
    id: string
    actorName: string
    eventType: string
    description: string
    createdAt: Date
  }[]
  auditEventsHasMore: boolean
  auditEventTypes: string[]
  evidenceItems: EvidenceItem[]
  evidenceRequirements: EvidenceRequirementItem[]
  criteria: CriteriaItem[]
  deliverableNotes: NoteItem[]
}

type DetailTab = 'details' | 'checklist' | 'evidence' | 'notes' | 'activity' | 'raid'

function UnlinkButton({ raidItemId, deliverableId }: { raidItemId: string; deliverableId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  function handleUnlink() {
    startTransition(async () => { await unlinkRAIDFromDeliverable(raidItemId, deliverableId); router.refresh() })
  }
  return (
    <Button size="small" appearance="subtle" disabled={isPending} icon={isPending ? <Spinner size="tiny" /> : undefined} onClick={handleUnlink}>
      Unlink
    </Button>
  )
}

export function DeliverableDetail({ deliverable, projectId: _projectId, linkedRAID, projectRAID, orgPeople, orgVendors, auditEvents, auditEventsHasMore, auditEventTypes, evidenceItems, evidenceRequirements, criteria, deliverableNotes }: Props) {
  const styles = useStyles()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<DetailTab>('details')
  const [currentStatus, setCurrentStatus] = useState<DeliverableStatus>(deliverable.status)
  const [statusPending, startStatusTransition] = useTransition()
  function handleStatusChange(newStatus: DeliverableStatus) {
    setCurrentStatus(newStatus)
    startStatusTransition(async () => { await updateDeliverableStatus(deliverable.id, newStatus); router.refresh() })
  }
  const [nameValue, setNameValue] = useState(deliverable.name)
  const [namePending, startNameTransition] = useTransition()
  const [nameSuccess, setNameSuccess] = useState(false)
  function saveName() {
    if (!nameValue.trim() || nameValue === deliverable.name) return
    startNameTransition(async () => {
      await updateDeliverableField(deliverable.id, 'name', nameValue.trim())
      setNameSuccess(true); router.refresh(); setTimeout(() => setNameSuccess(false), 1500)
    })
  }
  const desc = useInlineEdit({ id: deliverable.id, field: 'description', initialValue: deliverable.description ?? '' })
  const notes = useInlineEdit({ id: deliverable.id, field: 'notes', initialValue: deliverable.notes ?? '' })
  const startDateEdit = useInlineEdit({
    id: deliverable.id, field: 'startDate',
    initialValue: deliverable.startDate ? new Date(deliverable.startDate).toISOString().split('T')[0] : '',
  })
  const targetDateEdit = useInlineEdit({
    id: deliverable.id, field: 'targetDate',
    initialValue: deliverable.targetDate ? new Date(deliverable.targetDate).toISOString().split('T')[0] : '',
  })
  const [ownerPending, startOwnerTransition] = useTransition()
  function handleOwnerChange(personId: string | null) {
    startOwnerTransition(async () => { await setDeliverableOwner(deliverable.id, personId); router.refresh() })
  }
  const [linkPersonPending, startLinkPersonTransition] = useTransition()
  function handleLinkPerson(personId: string) {
    startLinkPersonTransition(async () => { await linkPersonToDeliverable(deliverable.id, personId); router.refresh() })
  }
  function handleUnlinkPerson(personId: string) {
    startLinkPersonTransition(async () => { await unlinkPersonFromDeliverable(deliverable.id, personId); router.refresh() })
  }
  const [linkVendorPending, startLinkVendorTransition] = useTransition()
  function handleLinkVendor(vendorId: string) {
    startLinkVendorTransition(async () => { await linkVendorToDeliverable(deliverable.id, vendorId); router.refresh() })
  }
  function handleUnlinkVendor(vendorId: string) {
    startLinkVendorTransition(async () => { await unlinkVendorFromDeliverable(deliverable.id, vendorId); router.refresh() })
  }
  const linkedPersonIds = new Set(deliverable.peopleLinks.map((l) => l.personId))
  const linkedVendorIds = new Set(deliverable.vendorLinks.map((l) => l.vendorId))
  const availablePeople = orgPeople.filter((p) => !linkedPersonIds.has(p.id))
  const availableVendors = orgVendors.filter((v) => !linkedVendorIds.has(v.id))
  const [detailCriteria, setDetailCriteria] = useState(criteria)
  const [criteriaPending, startCriteriaTransition] = useTransition()
  const completedCriteria = detailCriteria.filter((c) => c.completion?.completed).length
  const criteriaPct = detailCriteria.length === 0 ? 0 : Math.round((completedCriteria / detailCriteria.length) * 100)
  const recentEvidence = evidenceItems.slice(0, 3)

  function handleCriteriaToggle(criteriaId: string, completed: boolean) {
    startCriteriaTransition(async () => {
      await toggleCriteriaCompletion(deliverable.id, criteriaId, completed)
      setDetailCriteria((prev) =>
        prev.map((c) =>
          c.id === criteriaId
            ? { ...c, completion: completed ? { completed: true, completedAt: new Date(), completedBy: 'You' } : null }
            : c
        )
      )
      router.refresh()
    })
  }

  const [activityQuery, setActivityQuery] = useState('')
  const [activityType, setActivityType] = useState('all')
  const [activityItems, setActivityItems] = useState(auditEvents)
  const [activityHasMore, setActivityHasMore] = useState(auditEventsHasMore)
  const [activityOffset, setActivityOffset] = useState(auditEvents.length)
  const [activityTypes, setActivityTypes] = useState(auditEventTypes)
  const [activityPending, startActivityTransition] = useTransition()
  const [activityError, setActivityError] = useState<string | null>(null)

  async function refreshActivity(reset: boolean) {
    const offset = reset ? 0 : activityOffset
    try {
      const result = await getDeliverableActivityPage(deliverable.id, {
        offset,
        limit: 20,
        query: activityQuery.trim() || undefined,
        eventType: activityType === 'all' ? undefined : activityType,
      })

      if (!result.ok) {
        setActivityError(result.error ?? 'Failed to load activity.')
        return
      }

      setActivityError(null)
      if (reset) {
        setActivityItems(result.data.items)
        setActivityOffset(result.data.items.length)
        setActivityHasMore(result.data.hasMore)
        setActivityTypes(result.data.eventTypes)
      } else {
        setActivityItems((prev) => [...prev, ...result.data.items])
        setActivityOffset((prev) => prev + result.data.items.length)
        setActivityHasMore(result.data.hasMore)
      }
    } catch (e) {
      setActivityError((e as Error).message ?? 'An unexpected error occurred.')
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      startActivityTransition(async () => {
        await refreshActivity(true)
      })
    }, 250)

    return () => clearTimeout(timer)
  }, [activityQuery, activityType])

  return (
    <div className={styles.layout}>
      <main className={styles.taskSurface}>
        <div className={styles.taskHeader}>
          <Text className={styles.taskKicker}>{deliverable.subSectionExecution.focusAreaExecution.name}</Text>
          <div className={styles.titleRow}>
            <span className={`${styles.statusDot} ${currentStatus === 'closed' ? styles.statusDotClosed : ''}`} />
            <Input
              value={nameValue}
              onChange={(_, d) => setNameValue(d.value)}
              onBlur={saveName}
              contentAfter={namePending ? <Spinner size="tiny" /> : undefined}
              className={`${styles.titleInput} ${nameSuccess ? styles.successBorder : ''}`}
            />
          </div>
          <div className={styles.headerMeta}>
            <Badge appearance="tint" color={STATUS_BADGE_COLORS[currentStatus]}>
              {STATUS_OPTIONS.find((o) => o.value === currentStatus)?.label ?? currentStatus}
            </Badge>
            {deliverable.phase && (
              <Badge appearance="tint" color={PHASE_COLORS[deliverable.phase]}>
                {PHASE_LABELS[deliverable.phase]}
              </Badge>
            )}
            <Badge appearance="outline">{deliverable.code}</Badge>
            {deliverable.owner && (
              <div className={styles.compactAvatarRow}>
                <Avatar name={deliverable.owner.name} size={24} />
                <Text size={200}>{deliverable.owner.name}</Text>
              </div>
            )}
            {deliverable.peopleLinks.slice(0, 3).map((link) => (
              <Avatar key={link.personId} name={link.person.name} size={24} />
            ))}
          </div>
        </div>

        <TabList selectedValue={activeTab} onTabSelect={(_, d) => setActiveTab(d.value as DetailTab)}>
          <Tab value="details">Details</Tab>
          <Tab value="checklist">
            Checklist
            {detailCriteria.length > 0 && (
              <Badge appearance="filled" color="informative" size="small" style={{ marginLeft: '6px' }}>
                {completedCriteria}/{detailCriteria.length}
              </Badge>
            )}
          </Tab>
          <Tab value="evidence">Evidence</Tab>
          <Tab value="notes">
            Notes
            {deliverableNotes.length > 0 && <Badge appearance="filled" color="informative" size="small" style={{ marginLeft: '6px' }}>{deliverableNotes.length}</Badge>}
          </Tab>
          <Tab value="activity">
            Activity
            {activityItems.length > 0 && <Badge appearance="filled" color="informative" size="small" style={{ marginLeft: '6px' }}>{activityItems.length}</Badge>}
          </Tab>
          <Tab value="raid">
            RAID
            {linkedRAID.length > 0 && <Badge appearance="filled" color="brand" size="small" style={{ marginLeft: '6px' }}>{linkedRAID.length}</Badge>}
          </Tab>
        </TabList>

        {activeTab === 'details' && (
          <div className={styles.plannerGrid}>
            <div className={styles.detailsColumn}>
              <Field label="Description">
                <div className={styles.inlineEditWrap}>
                  <Textarea
                    value={desc.value}
                    onChange={(_, d) => desc.setValue(d.value)}
                    onBlur={(e) => desc.save(e.target.value)}
                    placeholder="Add a description..."
                    rows={5}
                    className={`${styles.descriptionBox} ${desc.showSuccess ? styles.successBorder : ''}`}
                  />
                  {desc.isPending && <Spinner size="tiny" style={{ position: 'absolute', top: 8, right: 8 }} />}
                </div>
              </Field>

              <div className={styles.formGrid}>
                <Field label="Status">
                  {statusPending ? <Spinner size="tiny" /> : (
                    <Select value={currentStatus} onChange={(_, d) => handleStatusChange(d.value as DeliverableStatus)}>
                      {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </Select>
                  )}
                </Field>
                <Field label="Owner">
                  {ownerPending ? <Spinner size="tiny" /> : deliverable.owner ? (
                    <div className={styles.teamRow}>
                      <Avatar name={deliverable.owner.name} size={24} />
                      <Text className={styles.teamName}>{deliverable.owner.name}</Text>
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={<DismissCircleRegular />}
                        aria-label="Remove owner"
                        onClick={() => handleOwnerChange(null)}
                      />
                    </div>
                  ) : (
                    <Combobox placeholder="Set owner..." onOptionSelect={(_, d) => { if (d.optionValue) handleOwnerChange(d.optionValue) }}>
                      {orgPeople.map((p) => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                    </Combobox>
                  )}
                </Field>
                <Field label="Start Date">
                  <Input
                    type="date"
                    value={startDateEdit.value}
                    onChange={(_, d) => startDateEdit.setValue(d.value)}
                    onBlur={(e) => startDateEdit.save(e.target.value)}
                    contentAfter={startDateEdit.isPending ? <Spinner size="tiny" /> : undefined}
                    className={`${styles.wideControl} ${startDateEdit.showSuccess ? styles.successBorder : ''}`}
                  />
                </Field>
                <Field label="Target Date">
                  <Input
                    type="date"
                    value={targetDateEdit.value}
                    onChange={(_, d) => targetDateEdit.setValue(d.value)}
                    onBlur={(e) => targetDateEdit.save(e.target.value)}
                    contentAfter={targetDateEdit.isPending ? <Spinner size="tiny" /> : undefined}
                    className={`${styles.wideControl} ${targetDateEdit.showSuccess ? styles.successBorder : ''}`}
                  />
                </Field>
                <Field label="Domain">
                  <Input value={deliverable.domain ?? ''} readOnly className={styles.wideControl} />
                </Field>
                <Field label="Phase">
                  <Input value={deliverable.phase ? PHASE_LABELS[deliverable.phase] : ''} readOnly className={styles.wideControl} />
                </Field>
              </div>

              <section className={styles.sectionBlock}>
                <div className={styles.sectionHeaderLine}>
                  <Text size={300} weight="semibold">Deliverable Note</Text>
                  <Badge appearance="tint" color="informative">{deliverableNotes.length} notes</Badge>
                </div>
                <div className={styles.inlineEditWrap}>
                  <Textarea
                    value={notes.value}
                    onChange={(_, d) => notes.setValue(d.value)}
                    onBlur={(e) => notes.save(e.target.value)}
                    placeholder="Add a deliverable note..."
                    rows={4}
                    className={`${styles.wideControl} ${notes.showSuccess ? styles.successBorder : ''}`}
                  />
                  {notes.isPending && <Spinner size="tiny" style={{ position: 'absolute', top: 8, right: 8 }} />}
                </div>
              </section>
            </div>

            <aside className={styles.sideColumn}>
              <section className={styles.sectionBlock}>
                <div className={styles.sectionHeaderLine}>
                  <Text size={300} weight="semibold">RAID Links</Text>
                  <LinkRAIDDialog deliverableId={deliverable.id} projectRAID={projectRAID} linkedIds={new Set(linkedRAID.map((l) => l.raidItem.id))} />
                </div>
                {linkedRAID.length === 0 ? (
                  <Text className={styles.subtleText}>No linked risks, assumptions, issues, or dependencies.</Text>
                ) : (
                  linkedRAID.slice(0, 4).map((link) => {
                    const item = link.raidItem
                    return (
                      <div key={item.id} className={styles.dependencyCard}>
                        <div className={styles.sectionHeaderLine}>
                          <Badge appearance="tint" color={RAID_TYPE_COLORS[item.type]} size="small">{RAID_TYPE_LABELS[item.type]}</Badge>
                          <Badge appearance="tint" color={RAID_STATUS_COLORS[item.status]} size="small">{RAID_STATUS_LABELS[item.status]}</Badge>
                        </div>
                        <Text size={200} weight="semibold">{item.title}</Text>
                        <div className={styles.sectionHeaderLine}>
                          <Badge appearance="tint" color={RAID_SEVERITY_COLORS[item.severity]} size="small">{RAID_SEVERITY_LABELS[item.severity]}</Badge>
                          <UnlinkButton raidItemId={item.id} deliverableId={deliverable.id} />
                        </div>
                      </div>
                    )
                  })
                )}
              </section>

              <section className={styles.sectionBlock}>
                <div className={styles.sectionHeaderLine}>
                  <Text size={300} weight="semibold">Attachments</Text>
                  <Button size="small" appearance="subtle" onClick={() => setActiveTab('evidence')}>Manage</Button>
                </div>
                {recentEvidence.length === 0 ? (
                  <Text className={styles.subtleText}>No evidence attached yet.</Text>
                ) : (
                  recentEvidence.map((item) => (
                    <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className={styles.attachmentCard}>
                      <span className={styles.attachmentIcon}>{item.type.slice(0, 1).toUpperCase()}</span>
                      <span>
                        <Text block size={200} weight="semibold">{item.name}</Text>
                        <Text block size={100} className={styles.subtleText}>
                          {item.uploadedBy} · {new Date(item.uploadedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Text>
                      </span>
                    </a>
                  ))
                )}
              </section>

              <section className={styles.sectionBlock}>
                <Text size={300} weight="semibold">People</Text>
                <div className={styles.teamSection}>
                  {deliverable.peopleLinks.map((link) => (
                    <div key={link.personId} className={styles.teamRow}>
                      <Avatar name={link.person.name} size={24} />
                      <Text className={styles.teamName}>{link.person.name}</Text>
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={<DismissCircleRegular />}
                        aria-label={`Remove ${link.person.name}`}
                        disabled={linkPersonPending}
                        onClick={() => handleUnlinkPerson(link.personId)}
                      />
                    </div>
                  ))}
                  {availablePeople.length > 0 && (
                    <Combobox placeholder="Add person..." onOptionSelect={(_, d) => { if (d.optionValue) handleLinkPerson(d.optionValue) }}>
                      {availablePeople.map((p) => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                    </Combobox>
                  )}
                </div>
              </section>

              <section className={styles.sectionBlock}>
                <Text size={300} weight="semibold">Vendors</Text>
                <div className={styles.teamSection}>
                  {deliverable.vendorLinks.map((link) => (
                    <div key={link.vendorId} className={styles.teamRow}>
                      <Avatar name={link.vendor.name} size={24} shape="square" />
                      <Text className={styles.teamName}>{link.vendor.name}</Text>
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={<DismissCircleRegular />}
                        aria-label={`Remove ${link.vendor.name}`}
                        disabled={linkVendorPending}
                        onClick={() => handleUnlinkVendor(link.vendorId)}
                      />
                    </div>
                  ))}
                  {availableVendors.length > 0 && (
                    <Combobox placeholder="Add vendor..." onOptionSelect={(_, d) => { if (d.optionValue) handleLinkVendor(d.optionValue) }}>
                      {availableVendors.map((v) => <Option key={v.id} value={v.id}>{v.name}</Option>)}
                    </Combobox>
                  )}
                </div>
              </section>
            </aside>
          </div>
        )}
        {activeTab === 'checklist' && (
          <div className={styles.tabContent}>
            <section className={styles.sectionBlock}>
              <div className={styles.sectionHeaderLine}>
                <Text size={300} weight="semibold">Checklist</Text>
                <div className={styles.progressTrack} aria-hidden="true">
                  <div className={styles.progressFill} style={{ width: `${criteriaPct}%` }} />
                </div>
                <Text size={200} className={styles.subtleText}>{completedCriteria}/{detailCriteria.length}</Text>
              </div>
              {detailCriteria.length === 0 ? (
                <Text className={styles.subtleText}>No acceptance criteria configured.</Text>
              ) : (
                <div className={styles.checklistList}>
                  {detailCriteria.map((item) => (
                    <div key={item.id} className={styles.checklistRow}>
                      <Checkbox
                        checked={Boolean(item.completion?.completed)}
                        disabled={criteriaPending}
                        onChange={(_, data) => handleCriteriaToggle(item.id, Boolean(data.checked))}
                        aria-label={`Mark ${item.description} as complete`}
                      />
                      <div>
                        <Text className={item.completion?.completed ? styles.checklistTextDone : undefined}>
                          {item.description}
                        </Text>
                        {item.verificationMethod && (
                          <Text block size={200} className={styles.subtleText}>{item.verificationMethod}</Text>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
        {activeTab === 'evidence' && (
          <div className={styles.tabContent}>
            <EvidenceTab
              deliverableId={deliverable.id}
              evidenceRequirements={evidenceRequirements}
              evidenceItems={evidenceItems}
              criteria={detailCriteria}
            />
          </div>
        )}
        {activeTab === 'notes' && (
          <div className={styles.tabContent}>
            <NotesTab deliverableId={deliverable.id} initialNotes={deliverableNotes} />
          </div>
        )}
        {activeTab === 'activity' && (
          <div className={styles.tabContent}>
            {activityItems.length === 0 && !activityPending ? (
              <Text className={styles.activityPlaceholder}>No audit events yet for this deliverable.</Text>
            ) : (
              <>
                <div className={styles.activityFilters}>
                  <Input
                    className={styles.activitySearch}
                    placeholder="Search activity"
                    value={activityQuery}
                    onChange={(_, data) => setActivityQuery(data.value)}
                  />
                  <Select
                    value={activityType}
                    onChange={(_, data) => setActivityType(data.value)}
                  >
                    <option value="all">All Event Types</option>
                    {activityTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </div>

                {activityError && (
                  <div className={styles.activityError}>
                    <Text size={200}>{activityError}</Text>
                    <Button
                      size="small"
                      appearance="subtle"
                      onClick={() => {
                        startActivityTransition(async () => {
                          await refreshActivity(true)
                        })
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                )}

                {activityPending && (
                  <Text className={styles.activityPlaceholder}>Loading activity…</Text>
                )}

                {!activityPending && !activityError && !activityError && activityItems.length === 0 ? (
                  <Text className={styles.activityPlaceholder}>No activity matches the current filters.</Text>
                ) : (
                  <div className={styles.activityList}>
                    {activityItems.map((event) => (
                      <div key={event.id} className={styles.activityRow}>
                        <div className={styles.activityMeta}>
                          <Text size={200}>{event.actorName}</Text>
                          <Text size={200}>
                            {new Date(event.createdAt).toLocaleString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </div>
                        <Text weight="semibold">{event.description}</Text>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                          {event.eventType}
                        </Text>
                      </div>
                    ))}
                    {activityHasMore && !activityPending && (
                      <div className={styles.activityLoadMore}>
                        <Button
                          appearance="subtle"
                          onClick={() => {
                            startActivityTransition(async () => {
                              await refreshActivity(false)
                            })
                          }}
                        >
                          Load more
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {activeTab === 'raid' && (
          <div className={styles.tabContent}>
            <div className={styles.raidHeader}>
              <Text size={300} weight="semibold">Linked RAID Items</Text>
              <LinkRAIDDialog deliverableId={deliverable.id} projectRAID={projectRAID} linkedIds={new Set(linkedRAID.map((l) => l.raidItem.id))} />
            </div>
            {linkedRAID.length === 0 ? (
              <Text className={styles.raidEmpty}>No RAID items linked. Use &quot;Link RAID Item&quot; to associate risks, assumptions, issues, or dependencies.</Text>
            ) : (
              <div className={styles.raidList}>
                {linkedRAID.map((link) => {
                  const item = link.raidItem
                  return (
                    <div key={item.id} className={styles.raidRow}>
                      <Badge appearance="tint" color={RAID_TYPE_COLORS[item.type]} size="small">{RAID_TYPE_LABELS[item.type]}</Badge>
                      <Badge appearance="tint" color={RAID_SEVERITY_COLORS[item.severity]} size="small">{RAID_SEVERITY_LABELS[item.severity]}</Badge>
                      <Text className={styles.raidTitle}>{item.title}</Text>
                      <Badge appearance="tint" color={RAID_STATUS_COLORS[item.status]} size="small">{RAID_STATUS_LABELS[item.status]}</Badge>
                      <UnlinkButton raidItemId={item.id} deliverableId={deliverable.id} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <aside className={styles.changesRail}>
        <div className={styles.changesHeader}>
          <Text size={300} weight="semibold">Changes</Text>
          {activityPending && <Spinner size="tiny" />}
        </div>
        {activityError && (
          <div className={styles.activityError}>
            <Text size={200}>{activityError}</Text>
            <Button
              size="small"
              appearance="subtle"
              onClick={() => {
                startActivityTransition(async () => {
                  await refreshActivity(true)
                })
              }}
            >
              Retry
            </Button>
          </div>
        )}
        <div className={styles.changeList}>
          {activityItems.slice(0, 10).length === 0 && !activityPending ? (
            <Text className={styles.activityPlaceholder}>No changes yet.</Text>
          ) : (
            activityItems.slice(0, 10).map((event) => (
              <div key={event.id} className={styles.changeCard}>
                <div className={styles.changeMeta}>
                  <div className={styles.compactAvatarRow}>
                    <Avatar name={event.actorName} size={24} />
                    <Text size={200}>{event.actorName}</Text>
                  </div>
                  <Text size={100} className={styles.subtleText}>
                    {new Date(event.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </Text>
                </div>
                <Text size={200} weight="semibold">{event.description}</Text>
                <Text size={100} className={styles.subtleText}>{event.eventType}</Text>
              </div>
            ))
          )}
          {activityHasMore && !activityPending && (
            <Button
              appearance="subtle"
              onClick={() => {
                startActivityTransition(async () => {
                  await refreshActivity(false)
                })
              }}
            >
              Load more
            </Button>
          )}
        </div>
      </aside>
    </div>
  )
}
