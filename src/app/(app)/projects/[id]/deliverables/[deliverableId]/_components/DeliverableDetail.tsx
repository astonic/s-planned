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
  Divider,
  Field,
  Button,
  Avatar,
  Combobox,
  Option,
} from '@fluentui/react-components'
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
import { unlinkRAIDFromDeliverable } from '@/lib/actions/raid'
import { LinkRAIDDialog } from './LinkRAIDDialog'
import type { RAIDItemSummary } from './LinkRAIDDialog'

// Styles
const useStyles = makeStyles({
  layout: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: tokens.spacingHorizontalXL, alignItems: 'start' },
  leftPanel: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  rightPanel: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
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
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalL,
    display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL,
  },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS },
  inlineEditWrap: { position: 'relative' },
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
  datesGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacingHorizontalM },
  activityPlaceholder: { color: tokens.colorNeutralForeground3, fontStyle: 'italic', padding: tokens.spacingVerticalM },
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
  teamRow: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS },
  teamName: { flex: 1, fontSize: tokens.fontSizeBase200 },
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

type EditableFieldName = 'description' | 'notes' | 'startDate' | 'targetDate'
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
}

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

export function DeliverableDetail({ deliverable, projectId: _projectId, linkedRAID, projectRAID, orgPeople, orgVendors }: Props) {
  const styles = useStyles()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'raid'>('details')
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
      await updateDeliverableField(deliverable.id, 'description', nameValue.trim())
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

  return (
    <div className={styles.layout}>
      <div className={styles.leftPanel}>
        <div className={styles.statusBar}>
          <Text className={styles.statusLabel}>Status:</Text>
          {statusPending ? <Spinner size="tiny" /> : (
            <Select value={currentStatus} onChange={(_, d) => handleStatusChange(d.value as DeliverableStatus)}>
              {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </Select>
          )}
          <Text className={styles.lastUpdated}>
            Last updated:{' '}
            {new Date(deliverable.updatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </div>
        <TabList selectedValue={activeTab} onTabSelect={(_, d) => setActiveTab(d.value as 'details' | 'activity' | 'raid')}>
          <Tab value="details">Details</Tab>
          <Tab value="activity">Activity</Tab>
          <Tab value="raid">
            RAID
            {linkedRAID.length > 0 && <Badge appearance="filled" color="brand" size="small" style={{ marginLeft: '6px' }}>{linkedRAID.length}</Badge>}
          </Tab>
        </TabList>
        {activeTab === 'details' && (
          <div className={styles.tabContent}>
            <div className={styles.fieldGroup}>
              <Field label="Name">
                <div className={styles.inlineEditWrap}>
                  <Input value={nameValue} onChange={(_, d) => setNameValue(d.value)} onBlur={saveName}
                    contentAfter={namePending ? <Spinner size="tiny" /> : undefined}
                    className={nameSuccess ? styles.successBorder : undefined} />
                </div>
              </Field>
            </div>
            <div className={styles.fieldGroup}>
              <Field label="Description">
                <div className={styles.inlineEditWrap}>
                  <Textarea value={desc.value} onChange={(_, d) => desc.setValue(d.value)} onBlur={(e) => desc.save(e.target.value)}
                    placeholder="Add a description..." rows={4} className={desc.showSuccess ? styles.successBorder : undefined} />
                  {desc.isPending && <Spinner size="tiny" style={{ position: 'absolute', top: 8, right: 8 }} />}
                </div>
              </Field>
            </div>
            <div className={styles.fieldGroup}>
              <Field label="Internal Notes">
                <div className={styles.inlineEditWrap}>
                  <Textarea value={notes.value} onChange={(_, d) => notes.setValue(d.value)} onBlur={(e) => notes.save(e.target.value)}
                    placeholder="Internal notes..." rows={4} className={notes.showSuccess ? styles.successBorder : undefined} />
                  {notes.isPending && <Spinner size="tiny" style={{ position: 'absolute', top: 8, right: 8 }} />}
                </div>
              </Field>
            </div>
            <Divider />
            <div>
              <Text size={300} weight="semibold" block style={{ marginBottom: tokens.spacingVerticalS }}>Dates</Text>
              <div className={styles.datesGrid}>
                <Field label="Start Date">
                  <Input type="date" value={startDateEdit.value} onChange={(_, d) => startDateEdit.setValue(d.value)}
                    onBlur={(e) => startDateEdit.save(e.target.value)}
                    contentAfter={startDateEdit.isPending ? <Spinner size="tiny" /> : undefined}
                    className={startDateEdit.showSuccess ? styles.successBorder : undefined} />
                </Field>
                <Field label="Target Date">
                  <Input type="date" value={targetDateEdit.value} onChange={(_, d) => targetDateEdit.setValue(d.value)}
                    onBlur={(e) => targetDateEdit.save(e.target.value)}
                    contentAfter={targetDateEdit.isPending ? <Spinner size="tiny" /> : undefined}
                    className={targetDateEdit.showSuccess ? styles.successBorder : undefined} />
                </Field>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'activity' && (
          <div className={styles.tabContent}>
            <Text className={styles.activityPlaceholder}>Audit log coming in Phase 6.</Text>
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
      </div>
      <div className={styles.rightPanel}>
        <div className={styles.sidebarCard}>
          <Text size={300} weight="semibold" block>Details</Text>
          <Divider />
          <div className={styles.sidebarRow}>
            <Text className={styles.sidebarLabel}>Status</Text>
            <Badge appearance="tint" color={STATUS_BADGE_COLORS[currentStatus]}>
              {STATUS_OPTIONS.find((o) => o.value === currentStatus)?.label ?? currentStatus}
            </Badge>
          </div>
          <div className={styles.sidebarRow}>
            <Text className={styles.sidebarLabel}>Phase</Text>
            {deliverable.phase ? (
              <Badge appearance="tint" color={PHASE_COLORS[deliverable.phase]}>{PHASE_LABELS[deliverable.phase]}</Badge>
            ) : (
              <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>—</Text>
            )}
          </div>
          <div className={styles.sidebarRow}>
            <Text className={styles.sidebarLabel}>Code</Text>
            <span className={styles.codeText}>{deliverable.code}</span>
          </div>
          <div className={styles.sidebarRow}>
            <Text className={styles.sidebarLabel}>Domain</Text>
            <Text size={300}>{deliverable.domain ?? <span style={{ color: tokens.colorNeutralForeground3 }}>—</span>}</Text>
          </div>
          <Divider />
          <div className={styles.sidebarRow}>
            <Text className={styles.sidebarLabel}>Deliverable ID</Text>
            <span className={styles.idText}>{deliverable.id}</span>
          </div>
          <div className={styles.sidebarRow}>
            <Text className={styles.sidebarLabel}>Created</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              {new Date(deliverable.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
          </div>
          <div className={styles.sidebarRow}>
            <Text className={styles.sidebarLabel}>Last Updated</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              {new Date(deliverable.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
          </div>
        </div>
        <div className={styles.sidebarCard}>
          <Text size={300} weight="semibold" block>Team &amp; Stakeholders</Text>
          <Divider />
          <div className={styles.sidebarRow}>
            <Text className={styles.sidebarLabel}>Owner</Text>
            {ownerPending ? <Spinner size="tiny" /> : deliverable.owner ? (
              <div className={styles.teamRow}>
                <Avatar name={deliverable.owner.name} size={24} />
                <Text className={styles.teamName}>{deliverable.owner.name}</Text>
                <Button size="small" appearance="subtle" onClick={() => handleOwnerChange(null)}>x</Button>
              </div>
            ) : (
              <Combobox placeholder="Set owner..." onOptionSelect={(_, d) => { if (d.optionValue) handleOwnerChange(d.optionValue) }}>
                {orgPeople.map((p) => <Option key={p.id} value={p.id}>{p.name}</Option>)}
              </Combobox>
            )}
          </div>
          <Divider />
          <div className={styles.sidebarRow}>
            <Text className={styles.sidebarLabel}>People</Text>
            <div className={styles.teamSection}>
              {deliverable.peopleLinks.map((link) => (
                <div key={link.personId} className={styles.teamRow}>
                  <Avatar name={link.person.name} size={24} />
                  <Text className={styles.teamName}>{link.person.name}</Text>
                  <Button size="small" appearance="subtle" disabled={linkPersonPending} onClick={() => handleUnlinkPerson(link.personId)}>x</Button>
                </div>
              ))}
              {availablePeople.length > 0 && (
                <Combobox placeholder="Add person..." onOptionSelect={(_, d) => { if (d.optionValue) handleLinkPerson(d.optionValue) }}>
                  {availablePeople.map((p) => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                </Combobox>
              )}
            </div>
          </div>
          <Divider />
          <div className={styles.sidebarRow}>
            <Text className={styles.sidebarLabel}>Vendors</Text>
            <div className={styles.teamSection}>
              {deliverable.vendorLinks.map((link) => (
                <div key={link.vendorId} className={styles.teamRow}>
                  <Avatar name={link.vendor.name} size={24} shape="square" />
                  <Text className={styles.teamName}>{link.vendor.name}</Text>
                  <Button size="small" appearance="subtle" disabled={linkVendorPending} onClick={() => handleUnlinkVendor(link.vendorId)}>x</Button>
                </div>
              ))}
              {availableVendors.length > 0 && (
                <Combobox placeholder="Add vendor..." onOptionSelect={(_, d) => { if (d.optionValue) handleLinkVendor(d.optionValue) }}>
                  {availableVendors.map((v) => <Option key={v.id} value={v.id}>{v.name}</Option>)}
                </Combobox>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
