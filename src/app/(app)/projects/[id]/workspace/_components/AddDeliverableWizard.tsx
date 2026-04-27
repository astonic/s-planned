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
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import { AddRegular, DeleteRegular } from '@fluentui/react-icons'
import { createProjectDeliverable } from '@/lib/actions/projects'
import type { FocusAreaWithAll } from './workspace-types'

type ChecklistDraft = { description: string; verificationMethod: string }
type EvidenceDraft = { name: string; type: string; required: boolean; description: string }

const PHASES = [
  { value: '', label: 'No phase' },
  { value: 'pre_commissioning', label: 'Pre-commissioning' },
  { value: 'commissioning', label: 'Commissioning' },
  { value: 'ramp_up', label: 'Ramp-up' },
  { value: 'handover', label: 'Handover' },
]

const EVIDENCE_TYPES = [
  { value: 'document', label: 'Document' },
  { value: 'image', label: 'Image' },
  { value: 'link', label: 'Link' },
  { value: 'sign_off', label: 'Sign-off' },
]

const useStyles = makeStyles({
  stack: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM },
  stepBar: { display: 'flex', gap: tokens.spacingHorizontalS, flexWrap: 'wrap', marginBottom: tokens.spacingVerticalM },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacingHorizontalM },
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
})

function blankChecklist(): ChecklistDraft {
  return { description: '', verificationMethod: '' }
}

function blankEvidence(): EvidenceDraft {
  return { name: '', type: 'document', required: true, description: '' }
}

export function AddDeliverableWizard({
  projectId,
  focusAreas,
}: {
  projectId: string
  focusAreas: FocusAreaWithAll[]
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

  const sections = useMemo(() => focusAreas.flatMap((fa) =>
    fa.subSections.map((ss) => ({
      id: ss.id,
      label: `${fa.code} / ${ss.code} - ${ss.name}`,
    })),
  ), [focusAreas])

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
        phase: (phase || null) as 'pre_commissioning' | 'commissioning' | 'ramp_up' | 'handover' | null,
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
              <div className={styles.stepBar}>
                {['Details', 'Checklist', 'Evidence', 'Review'].map((label, index) => (
                  <Button
                    key={label}
                    size="small"
                    appearance={step === index ? 'primary' : 'secondary'}
                    onClick={() => setStep(index)}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              <div className={styles.stack}>
                {error && <Text size={200} className={styles.error}>{error}</Text>}

                {step === 0 && (
                  <div className={styles.grid}>
                    <Field label="Section" required>
                      <Select value={subSectionId} onChange={(_, data) => setSubSectionId(data.value)}>
                        <option value="">Choose section</option>
                        {sections.map((section) => (
                          <option key={section.id} value={section.id}>{section.label}</option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Code" required>
                      <Input value={code} onChange={(_, data) => setCode(data.value)} placeholder="GOV-NEW-01" />
                    </Field>
                    <Field label="Name" required className={styles.full}>
                      <Input value={name} onChange={(_, data) => setName(data.value)} placeholder="Readiness deliverable name" />
                    </Field>
                    <Field label="Phase">
                      <Select value={phase} onChange={(_, data) => setPhase(data.value)}>
                        {PHASES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </Select>
                    </Field>
                    <Field label="Domain">
                      <Input value={domain} onChange={(_, data) => setDomain(data.value)} placeholder="Safety, Mining, Technology..." />
                    </Field>
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
