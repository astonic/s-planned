'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  Select,
  Spinner,
  Text,
  Textarea,
  Tooltip,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import { AddRegular, DeleteRegular } from '@fluentui/react-icons'
import { createProjectDeliverable, createSubSectionExecution } from '@/lib/actions/projects'
import { SpTabBar } from '@/components/ui/SpTabBar'
import type { FocusAreaWithAll } from './workspace-types'

type ChecklistDraft = { description: string; verificationMethod: string }
type EvidenceDraft = { name: string; type: string; required: boolean; description: string }

const EVIDENCE_TYPES = [
  { value: 'document', label: 'Document' },
  { value: 'image', label: 'Image' },
  { value: 'link', label: 'Link' },
  { value: 'sign_off', label: 'Sign-off' },
]

const useStyles = makeStyles({
  stack: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM },
  tabsWrap: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    marginBottom: tokens.spacingVerticalM,
  },
  grid: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: tokens.spacingHorizontalM },
  sectionCodeRow: {
    gridColumn: '1 / -1',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 32px minmax(160px, 220px)',
    gap: tokens.spacingHorizontalXS,
    alignItems: 'end',
    minWidth: 0,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 150px 32px',
    gap: tokens.spacingHorizontalS,
    alignItems: 'start',
  },
  evidenceRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 140px 96px 32px',
    gap: tokens.spacingHorizontalS,
    alignItems: 'start',
  },
  full: { gridColumn: '1 / -1' },
  fieldWithAction: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 32px',
    gap: tokens.spacingHorizontalXS,
    alignItems: 'end',
    minWidth: 0,
  },
  fieldRoot: {
    minWidth: 0,
  },
  control: {
    width: '100%',
    minWidth: 0,
  },
  iconButton: {
    minWidth: '32px',
    width: '32px',
  },
  reviewBox: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  error: { color: tokens.colorStatusDangerForeground1 },
  newSectionPanel: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground3,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    boxShadow: tokens.shadow4,
  },
  newSectionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
    alignItems: 'end',
  },
  newSectionActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
})

function blankChecklist(): ChecklistDraft {
  return { description: '', verificationMethod: '' }
}

function blankEvidence(): EvidenceDraft {
  return { name: '', type: 'document', required: true, description: '' }
}

function deriveSectionCode(focusAreaCode: string, sectionName: string): string {
  const words = sectionName.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, '').split(/\s+/).filter(Boolean)
  const abbrev = words.length <= 1
    ? (words[0] ?? '').slice(0, 4)
    : words.map((w) => w[0]).join('').slice(0, 6)
  return `${focusAreaCode}-${abbrev || 'NEW'}`
}

function deriveDeliverableCode(sectionCode: string, existingCount: number): string {
  return `${sectionCode}-${String(existingCount + 1).padStart(3, '0')}`
}

type SectionOption = { id: string; label: string; code: string; deliverableCount: number }

const WIZARD_TABS = [
  { value: '0', label: 'Details' },
  { value: '1', label: 'Checklist' },
  { value: '2', label: 'Evidence' },
  { value: '3', label: 'Review' },
]

function phaseLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export function AddDeliverableWizard({
  projectId,
  focusAreas,
  phaseOptions,
}: {
  projectId: string
  focusAreas: FocusAreaWithAll[]
  phaseOptions: string[]
}) {
  const styles = useStyles()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [subSectionId, setSubSectionId] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [phase, setPhase] = useState('')
  const [domain, setDomain] = useState('')
  const [startDate, setStartDate] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [checklist, setChecklist] = useState<ChecklistDraft[]>([blankChecklist()])
  const [evidence, setEvidence] = useState<EvidenceDraft[]>([blankEvidence()])
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Local sections created in this session (merged with prop sections)
  const [localSections, setLocalSections] = useState<SectionOption[]>([])
  const [localPhases, setLocalPhases] = useState<string[]>([])

  // New section form state
  const [showNewSection, setShowNewSection] = useState(false)
  const [newSectionFocusAreaId, setNewSectionFocusAreaId] = useState('')
  const [newSectionName, setNewSectionName] = useState('')
  const [newSectionCode, setNewSectionCode] = useState('')
  const [newSectionError, setNewSectionError] = useState<string | null>(null)
  const [sectionPending, startSectionTransition] = useTransition()
  const [showNewPhase, setShowNewPhase] = useState(false)
  const [newPhase, setNewPhase] = useState('')
  const [newPhaseError, setNewPhaseError] = useState<string | null>(null)

  const sections = useMemo<SectionOption[]>(() => [
    ...focusAreas.flatMap((fa) =>
      fa.subSections.map((ss) => ({
        id: ss.id,
        label: `${fa.code} / ${ss.code} - ${ss.name}`,
        code: ss.code,
        deliverableCount: ss.deliverables.length,
      })),
    ),
    ...localSections,
  ], [focusAreas, localSections])

  const focusAreaOptions = useMemo(() =>
    focusAreas.map((fa) => ({ id: fa.id, code: fa.code, label: `${fa.code} — ${fa.name}` })),
  [focusAreas])

  const phases = useMemo(() => {
    const seen = new Set<string>()
    return [...phaseOptions, ...localPhases].filter((item) => {
      const trimmed = item.trim()
      const key = trimmed.toLowerCase()
      if (!trimmed || seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [phaseOptions, localPhases])

  function handleSectionChange(id: string) {
    setSubSectionId(id)
    const section = sections.find((s) => s.id === id)
    if (section) {
      setCode(deriveDeliverableCode(section.code, section.deliverableCount))
    }
  }

  function handleNewSectionFocusAreaChange(faId: string) {
    setNewSectionFocusAreaId(faId)
    const fa = focusAreaOptions.find((f) => f.id === faId)
    if (fa && newSectionName.trim()) {
      setNewSectionCode(deriveSectionCode(fa.code, newSectionName))
    }
  }

  function handleNewSectionNameChange(value: string) {
    setNewSectionName(value)
    const fa = focusAreaOptions.find((f) => f.id === newSectionFocusAreaId)
    if (fa) {
      setNewSectionCode(deriveSectionCode(fa.code, value))
    }
  }

  function handleCreateSection() {
    if (!newSectionFocusAreaId || !newSectionName.trim() || !newSectionCode.trim()) return
    setNewSectionError(null)
    startSectionTransition(async () => {
      const res = await createSubSectionExecution(newSectionFocusAreaId, {
        code: newSectionCode.trim(),
        name: newSectionName.trim(),
      })
      if (!res.ok) {
        setNewSectionError(res.error)
        return
      }
      const fa = focusAreaOptions.find((f) => f.id === newSectionFocusAreaId)
      const created: SectionOption = {
        id: res.data.id,
        label: `${fa?.code ?? ''} / ${newSectionCode.trim()} — ${newSectionName.trim()}`,
        code: newSectionCode.trim(),
        deliverableCount: 0,
      }
      setLocalSections((prev) => [...prev, created])
      setSubSectionId(res.data.id)
      setCode(deriveDeliverableCode(newSectionCode.trim(), 0))
      setShowNewSection(false)
      setNewSectionFocusAreaId('')
      setNewSectionName('')
      setNewSectionCode('')
    })
  }

  function handleCreatePhase() {
    const trimmed = newPhase.trim()
    if (!trimmed) return

    const existing = phases.find((item) => item.toLowerCase() === trimmed.toLowerCase())
    if (existing) {
      setPhase(existing)
      setShowNewPhase(false)
      setNewPhase('')
      setNewPhaseError(null)
      return
    }

    if (trimmed.length > 100) {
      setNewPhaseError('Phase must be 100 characters or fewer.')
      return
    }

    setLocalPhases((current) => [...current, trimmed])
    setPhase(trimmed)
    setShowNewPhase(false)
    setNewPhase('')
    setNewPhaseError(null)
  }

  function reset() {
    setStep(0)
    setSubSectionId('')
    setCode('')
    setName('')
    setDescription('')
    setPhase('')
    setDomain('')
    setStartDate('')
    setTargetDate('')
    setChecklist([blankChecklist()])
    setEvidence([blankEvidence()])
    setError(null)
    setLocalSections([])
    setLocalPhases([])
    setShowNewSection(false)
    setNewSectionFocusAreaId('')
    setNewSectionName('')
    setNewSectionCode('')
    setNewSectionError(null)
    setShowNewPhase(false)
    setNewPhase('')
    setNewPhaseError(null)
  }

  function closeDialog() {
    if (pending) return
    setOpen(false)
    reset()
  }

  function canContinue() {
    if (step === 0) return Boolean(subSectionId && code.trim() && name.trim())
    return true
  }

  function createDeliverable() {
    if (!canContinue()) {
      setError('Section, code, and name are required.')
      setStep(0)
      return
    }

    setError(null)
    startTransition(async () => {
      const res = await createProjectDeliverable(projectId, {
        subSectionExecutionId: subSectionId,
        code,
        name,
        description,
        phase: phase || null,
        domain,
        startDate: startDate ? new Date(startDate) : null,
        targetDate: targetDate ? new Date(targetDate) : null,
        checklistItems: checklist
          .map((item) => ({ description: item.description.trim(), verificationMethod: item.verificationMethod.trim() }))
          .filter((item) => item.description),
        evidenceRequirements: evidence
          .map((item) => ({
            name: item.name.trim(),
            type: item.type as 'document' | 'image' | 'link' | 'sign_off',
            required: item.required,
            description: item.description.trim(),
          }))
          .filter((item) => item.name),
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setOpen(false)
      reset()
      router.refresh()
    })
  }

  return (
    <>
      <Button appearance="primary" icon={<AddRegular />} onClick={() => setOpen(true)}>
        New Deliverable
      </Button>
      <Dialog open={open} onOpenChange={(_, data) => (data.open ? setOpen(true) : closeDialog())}>
        <DialogSurface style={{ maxWidth: 820, width: '100%' }}>
          <DialogBody>
            <DialogTitle>Add Deliverable</DialogTitle>
            <DialogContent>
              <div className={styles.tabsWrap}>
                <SpTabBar
                  tabs={WIZARD_TABS}
                  selectedValue={String(step)}
                  onTabSelect={(_, data) => setStep(Number(data.value))}
                />
              </div>

              <div className={styles.stack}>
                {error && <Text size={200} className={styles.error}>{error}</Text>}

                {step === 0 && (
                  <div className={styles.grid}>
                    <div className={styles.sectionCodeRow}>
                      <Field label="Section" required className={styles.fieldRoot}>
                        <Select
                          value={subSectionId}
                          onChange={(_, data) => handleSectionChange(data.value)}
                          className={styles.control}
                        >
                          <option value="">Choose section</option>
                          {sections.map((section) => (
                            <option key={section.id} value={section.id}>{section.label}</option>
                          ))}
                        </Select>
                      </Field>
                      <Tooltip content={showNewSection ? 'Close new section form' : 'New section'} relationship="label">
                        <Button
                          appearance={showNewSection ? 'primary' : 'secondary'}
                          size="small"
                          className={styles.iconButton}
                          icon={<AddRegular />}
                          aria-label={showNewSection ? 'Close new section form' : 'New section'}
                          onClick={() => setShowNewSection((v) => !v)}
                        />
                      </Tooltip>

                      <Field label="Code" required className={styles.fieldRoot}>
                      <Input
                        value={code}
                        onChange={(_, data) => setCode(data.value)}
                        placeholder="e.g. GOV-NEW-001"
                        className={styles.control}
                      />
                      </Field>
                    </div>

                    {/* Inline new section form */}
                    {showNewSection && (
                      <div className={`${styles.full} ${styles.newSectionPanel}`}>
                        <Text size={200} weight="semibold">New Section</Text>
                        <div className={styles.newSectionGrid}>
                          <Field label="Focus area" required>
                            <Select
                              value={newSectionFocusAreaId}
                              onChange={(_, d) => handleNewSectionFocusAreaChange(d.value)}
                            >
                              <option value="">Choose focus area</option>
                              {focusAreaOptions.map((fa) => (
                                <option key={fa.id} value={fa.id}>{fa.label}</option>
                              ))}
                            </Select>
                          </Field>
                          <Field label="Section name" required>
                            <Input
                              value={newSectionName}
                              onChange={(_, d) => handleNewSectionNameChange(d.value)}
                              placeholder="e.g. Safety Management"
                            />
                          </Field>
                          <Field label="Section code (auto-generated, editable)">
                            <Input
                              value={newSectionCode}
                              onChange={(_, d) => setNewSectionCode(d.value)}
                              placeholder="e.g. GOV-SAFE"
                            />
                          </Field>
                          <div className={styles.newSectionActions}>
                            <Button
                              appearance="primary"
                              size="small"
                              onClick={handleCreateSection}
                              disabled={sectionPending || !newSectionFocusAreaId || !newSectionName.trim() || !newSectionCode.trim()}
                              icon={sectionPending ? <Spinner size="tiny" /> : undefined}
                            >
                              Create section
                            </Button>
                          </div>
                        </div>
                        {newSectionError && (
                          <Text size={200} className={styles.error}>{newSectionError}</Text>
                        )}
                      </div>
                    )}

                    <Field label="Name" required className={styles.full}>
                      <Input value={name} onChange={(_, data) => setName(data.value)} placeholder="Readiness deliverable name" />
                    </Field>
                    <div className={styles.fieldWithAction}>
                      <Field label="Phase">
                        <Select value={phase} onChange={(_, data) => setPhase(data.value)}>
                          <option value="">No phase</option>
                          {phases.map((item) => <option key={item} value={item}>{phaseLabel(item)}</option>)}
                        </Select>
                      </Field>
                      <Tooltip content={showNewPhase ? 'Close new phase form' : 'New phase'} relationship="label">
                        <Button
                          appearance={showNewPhase ? 'primary' : 'subtle'}
                          size="small"
                          className={styles.iconButton}
                          icon={<AddRegular />}
                          aria-label={showNewPhase ? 'Close new phase form' : 'New phase'}
                          onClick={() => setShowNewPhase((v) => !v)}
                        />
                      </Tooltip>
                    </div>
                    <Field label="Domain">
                      <Input value={domain} onChange={(_, data) => setDomain(data.value)} placeholder="Safety, Mining, Technology..." />
                    </Field>
                    {showNewPhase && (
                      <div className={`${styles.full} ${styles.newSectionPanel}`}>
                        <Text size={200} weight="semibold">New Phase</Text>
                        <div className={styles.newSectionGrid}>
                          <Field label="Phase name" required>
                            <Input
                              value={newPhase}
                              onChange={(_, d) => setNewPhase(d.value)}
                              placeholder="e.g. Closeout"
                              onKeyDown={(event) => event.key === 'Enter' && handleCreatePhase()}
                            />
                          </Field>
                          <div className={styles.newSectionActions}>
                            <Button
                              appearance="primary"
                              size="small"
                              onClick={handleCreatePhase}
                              disabled={!newPhase.trim()}
                            >
                              Create phase
                            </Button>
                          </div>
                        </div>
                        {newPhaseError && (
                          <Text size={200} className={styles.error}>{newPhaseError}</Text>
                        )}
                      </div>
                    )}
                    <Field label="Start date">
                      <Input type="date" value={startDate} onChange={(_, data) => setStartDate(data.value)} />
                    </Field>
                    <Field label="Target date">
                      <Input type="date" value={targetDate} onChange={(_, data) => setTargetDate(data.value)} />
                    </Field>
                    <Field label="Description" className={styles.full}>
                      <Textarea rows={4} value={description} onChange={(_, data) => setDescription(data.value)} />
                    </Field>
                  </div>
                )}

                {step === 1 && (
                  <>
                    {checklist.map((item, index) => (
                      <div key={index} className={styles.row}>
                        <Field label={index === 0 ? 'Checklist item' : undefined}>
                          <Input
                            value={item.description}
                            onChange={(_, data) => setChecklist((current) => current.map((entry, i) => i === index ? { ...entry, description: data.value } : entry))}
                            placeholder="Criterion to complete"
                          />
                        </Field>
                        <Field label={index === 0 ? 'Verification' : undefined}>
                          <Input
                            value={item.verificationMethod}
                            onChange={(_, data) => setChecklist((current) => current.map((entry, i) => i === index ? { ...entry, verificationMethod: data.value } : entry))}
                            placeholder="Review, sign-off..."
                          />
                        </Field>
                        <Button
                          appearance="subtle"
                          icon={<DeleteRegular />}
                          aria-label="Remove checklist item"
                          onClick={() => setChecklist((current) => current.filter((_, i) => i !== index))}
                          disabled={checklist.length === 1}
                          style={{ marginTop: index === 0 ? 29 : 0 }}
                        />
                      </div>
                    ))}
                    <Button appearance="secondary" icon={<AddRegular />} onClick={() => setChecklist((current) => [...current, blankChecklist()])}>
                      Add Checklist Item
                    </Button>
                  </>
                )}

                {step === 2 && (
                  <>
                    {evidence.map((item, index) => (
                      <div key={index} className={styles.evidenceRow}>
                        <Field label={index === 0 ? 'Evidence requirement' : undefined}>
                          <Input
                            value={item.name}
                            onChange={(_, data) => setEvidence((current) => current.map((entry, i) => i === index ? { ...entry, name: data.value } : entry))}
                            placeholder="Evidence name"
                          />
                        </Field>
                        <Field label={index === 0 ? 'Type' : undefined}>
                          <Select
                            value={item.type}
                            onChange={(_, data) => setEvidence((current) => current.map((entry, i) => i === index ? { ...entry, type: data.value } : entry))}
                          >
                            {EVIDENCE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                          </Select>
                        </Field>
                        <Field label={index === 0 ? 'Required' : undefined}>
                          <Checkbox
                            checked={item.required}
                            label="Required"
                            onChange={(_, data) => setEvidence((current) => current.map((entry, i) => i === index ? { ...entry, required: Boolean(data.checked) } : entry))}
                          />
                        </Field>
                        <Button
                          appearance="subtle"
                          icon={<DeleteRegular />}
                          aria-label="Remove evidence requirement"
                          onClick={() => setEvidence((current) => current.filter((_, i) => i !== index))}
                          disabled={evidence.length === 1}
                          style={{ marginTop: index === 0 ? 29 : 0 }}
                        />
                        <Field label="Description" className={styles.full}>
                          <Input
                            value={item.description}
                            onChange={(_, data) => setEvidence((current) => current.map((entry, i) => i === index ? { ...entry, description: data.value } : entry))}
                            placeholder="Optional note for this evidence requirement"
                          />
                        </Field>
                      </div>
                    ))}
                    <Button appearance="secondary" icon={<AddRegular />} onClick={() => setEvidence((current) => [...current, blankEvidence()])}>
                      Add Evidence Requirement
                    </Button>
                  </>
                )}

                {step === 3 && (
                  <div className={styles.reviewBox}>
                    <Text weight="semibold">{code || 'No code'} - {name || 'Untitled deliverable'}</Text>
                    <Text size={200}>Checklist items: {checklist.filter((item) => item.description.trim()).length}</Text>
                    <Text size={200}>Evidence requirements: {evidence.filter((item) => item.name.trim()).length}</Text>
                    <Text size={200}>Section: {sections.find((section) => section.id === subSectionId)?.label ?? 'Not selected'}</Text>
                  </div>
                )}
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={closeDialog} disabled={pending}>Cancel</Button>
              {step > 0 && <Button appearance="secondary" onClick={() => setStep((current) => current - 1)} disabled={pending}>Back</Button>}
              {step < 3 ? (
                <Button appearance="primary" onClick={() => canContinue() ? setStep((current) => current + 1) : setError('Section, code, and name are required.')}>
                  Next
                </Button>
              ) : (
                <Button appearance="primary" onClick={createDeliverable} disabled={pending}>
                  {pending ? <Spinner size="tiny" /> : 'Create Deliverable'}
                </Button>
              )}
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  )
}
