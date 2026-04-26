'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  makeStyles,
  tokens,
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  DrawerFooter,
  Button,
  Input,
  Textarea,
  Select,
  Field,
  Spinner,
  Text,
  Divider,
  Checkbox,
} from '@fluentui/react-components'
import {
  DismissRegular,
  AddRegular,
  DeleteRegular,
  SaveRegular,
} from '@fluentui/react-icons'
import {
  updateDeliverableTemplate,
  addAcceptanceCriteria,
  deleteAcceptanceCriteria,
  addEvidenceRequirement,
  deleteEvidenceRequirement,
} from '@/lib/actions/templates'
import type { DeliverableTemplate } from '@/types/templates'

const useStyles = makeStyles({
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    overflowY: 'auto',
    flex: 1,
  },
  fieldsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
  },
  sectionTitle: {
    marginTop: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalXS,
  },
  listItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalXS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  listItemText: {
    flex: 1,
    minWidth: 0,
  },
  addItemRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    alignItems: 'flex-end',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  errorText: {
    color: tokens.colorStatusDangerForeground1,
    fontSize: tokens.fontSizeBase200,
  },
  itemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    marginBottom: tokens.spacingVerticalXS,
  },
})


interface Props {
  deliverable: DeliverableTemplate
  templateId: string
  open: boolean
  onClose: () => void
}

export function DeliverableTemplateDrawer({ deliverable, templateId, open, onClose }: Props) {
  const styles = useStyles()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Core fields
  const [code, setCode] = useState(deliverable.code)
  const [name, setName] = useState(deliverable.name)
  const [description, setDescription] = useState(deliverable.description ?? '')
  const [phase, setPhase] = useState<string>(deliverable.phase ?? '')
  const [domain, setDomain] = useState(deliverable.domain ?? '')
  const [estimatedDuration, setEstimatedDuration] = useState(
    deliverable.estimatedDuration?.toString() ?? ''
  )
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Acceptance criteria add-form
  const [newACDesc, setNewACDesc] = useState('')
  const [newACMethod, setNewACMethod] = useState('')
  const [acError, setACError] = useState<string | null>(null)

  // Evidence requirement add-form
  const [newERName, setNewERName] = useState('')
  const [newERType, setNewERType] = useState('')
  const [newERRequired, setNewERRequired] = useState(true)
  const [erError, setERError] = useState<string | null>(null)

  function handleSave() {
    if (!code.trim() || !name.trim()) return
    setSaveError(null)
    setSaveSuccess(false)
    startTransition(async () => {
      const result = await updateDeliverableTemplate(deliverable.id, {
        code: code.trim(),
        name: name.trim(),
        description: description || undefined,
        domain: domain || undefined,
        estimatedDuration: estimatedDuration ? Number(estimatedDuration) : undefined,
      })
      if (result.ok) {
        setSaveSuccess(true)
        router.refresh()
        setTimeout(() => setSaveSuccess(false), 2000)
      } else {
        setSaveError(result.error)
      }
    })
  }

  function handleAddAC() {
    if (!newACDesc.trim()) return
    setACError(null)
    startTransition(async () => {
      const result = await addAcceptanceCriteria(deliverable.id, {
        description: newACDesc.trim(),
        verificationMethod: newACMethod.trim() || undefined,
      })
      if (result.ok) {
        setNewACDesc('')
        setNewACMethod('')
        router.refresh()
      } else {
        setACError(result.error)
      }
    })
  }

  function handleDeleteAC(acId: string) {
    startTransition(async () => {
      await deleteAcceptanceCriteria(acId)
      router.refresh()
    })
  }

  function handleAddER() {
    if (!newERName.trim()) return
    setERError(null)
    startTransition(async () => {
      const result = await addEvidenceRequirement(deliverable.id, {
        name: newERName.trim(),
        type: newERType.trim() || undefined,
        required: newERRequired,
      })
      if (result.ok) {
        setNewERName('')
        setNewERType('')
        setNewERRequired(true)
        router.refresh()
      } else {
        setERError(result.error)
      }
    })
  }

  function handleDeleteER(erId: string) {
    startTransition(async () => {
      await deleteEvidenceRequirement(erId)
      router.refresh()
    })
  }

  return (
    <OverlayDrawer
      open={open}
      onOpenChange={(_, { open: isOpen }) => !isOpen && onClose()}
      position="end"
      size="medium"
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Close"
              icon={<DismissRegular />}
              onClick={onClose}
            />
          }
        >
          Edit Deliverable Template
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody>
        <div className={styles.body}>
          {/* Core fields */}
          <div className={styles.fieldsGrid}>
            <Field label="Code" required>
              <Input value={code} onChange={(_, d) => setCode(d.value)} />
            </Field>
            <Field label="Phase" hint="e.g. Pre-Commissioning, Commissioning, Ramp-Up">
              <Input
                value={phase}
                onChange={(_, d) => setPhase(d.value)}
                placeholder="Enter phase name"
              />
            </Field>
          </div>

          <Field label="Name" required>
            <Input value={name} onChange={(_, d) => setName(d.value)} />
          </Field>

          <div className={styles.fieldsGrid}>
            <Field label="Domain">
              <Input
                value={domain}
                onChange={(_, d) => setDomain(d.value)}
                placeholder="e.g. Electrical"
              />
            </Field>
            <Field label="Estimated Duration (days)">
              <Input
                type="number"
                value={estimatedDuration}
                onChange={(_, d) => setEstimatedDuration(d.value)}
                placeholder="e.g. 5"
                min={0}
              />
            </Field>
          </div>

          <Field label="Description">
            <Textarea
              value={description}
              onChange={(_, d) => setDescription(d.value)}
              placeholder="Describe this deliverable..."
              rows={3}
            />
          </Field>

          <Divider />

          {/* Acceptance Criteria */}
          <Text size={300} weight="semibold" className={styles.sectionTitle} block>
            Acceptance Criteria
          </Text>
          <div className={styles.itemList}>
            {deliverable.acceptanceCriteria.map((ac) => (
              <div key={ac.id} className={styles.listItem}>
                <div className={styles.listItemText}>
                  <Text size={200} block>{ac.description}</Text>
                  {ac.verificationMethod && (
                    <Text size={100} style={{ color: tokens.colorNeutralForeground3 }} block>
                      Method: {ac.verificationMethod}
                    </Text>
                  )}
                </div>
                <Button
                  appearance="subtle"
                  size="small"
                  icon={isPending ? <Spinner size="tiny" /> : <DeleteRegular />}
                  onClick={() => handleDeleteAC(ac.id)}
                  disabled={isPending}
                  aria-label="Delete criterion"
                />
              </div>
            ))}
          </div>
          <div className={styles.addItemRow}>
            <Field label="Description" style={{ flex: 2 }}>
              <Input
                value={newACDesc}
                onChange={(_, d) => setNewACDesc(d.value)}
                placeholder="Add acceptance criterion..."
                size="small"
                onKeyDown={(e) => e.key === 'Enter' && handleAddAC()}
              />
            </Field>
            <Field label="Verification method" style={{ flex: 1 }}>
              <Input
                value={newACMethod}
                onChange={(_, d) => setNewACMethod(d.value)}
                placeholder="e.g. Inspection"
                size="small"
              />
            </Field>
            <Button
              appearance="primary"
              size="small"
              icon={isPending ? <Spinner size="tiny" /> : <AddRegular />}
              onClick={handleAddAC}
              disabled={isPending || !newACDesc.trim()}
              style={{ alignSelf: 'flex-end' }}
            >
              Add
            </Button>
          </div>
          {acError && <span className={styles.errorText}>{acError}</span>}

          <Divider />

          {/* Evidence Requirements */}
          <Text size={300} weight="semibold" className={styles.sectionTitle} block>
            Evidence Requirements
          </Text>
          <div className={styles.itemList}>
            {deliverable.evidenceRequirements.map((er) => (
              <div key={er.id} className={styles.listItem}>
                <div className={styles.listItemText}>
                  <Text size={200} block>
                    {er.name}
                    {er.required && (
                      <Text size={100} style={{ color: tokens.colorStatusDangerForeground1, marginLeft: tokens.spacingHorizontalXS }}>
                        *required
                      </Text>
                    )}
                  </Text>
                  {er.type && (
                    <Text size={100} style={{ color: tokens.colorNeutralForeground3 }} block>
                      Type: {er.type}
                    </Text>
                  )}
                  {er.description && (
                    <Text size={100} style={{ color: tokens.colorNeutralForeground3 }} block>
                      {er.description}
                    </Text>
                  )}
                </div>
                <Button
                  appearance="subtle"
                  size="small"
                  icon={isPending ? <Spinner size="tiny" /> : <DeleteRegular />}
                  onClick={() => handleDeleteER(er.id)}
                  disabled={isPending}
                  aria-label="Delete requirement"
                />
              </div>
            ))}
          </div>
          <div className={styles.addItemRow}>
            <Field label="Name" style={{ flex: 2 }}>
              <Input
                value={newERName}
                onChange={(_, d) => setNewERName(d.value)}
                placeholder="Evidence name..."
                size="small"
                onKeyDown={(e) => e.key === 'Enter' && handleAddER()}
              />
            </Field>
            <Field label="Type" style={{ flex: 1 }}>
              <Input
                value={newERType}
                onChange={(_, d) => setNewERType(d.value)}
                placeholder="e.g. Document"
                size="small"
              />
            </Field>
            <Field label="Required" style={{ alignSelf: 'flex-end' }}>
              <Checkbox
                checked={newERRequired}
                onChange={(_, d) => setNewERRequired(d.checked === true)}
                label="Required"
              />
            </Field>
            <Button
              appearance="primary"
              size="small"
              icon={isPending ? <Spinner size="tiny" /> : <AddRegular />}
              onClick={handleAddER}
              disabled={isPending || !newERName.trim()}
              style={{ alignSelf: 'flex-end' }}
            >
              Add
            </Button>
          </div>
          {erError && <span className={styles.errorText}>{erError}</span>}
        </div>
      </DrawerBody>

      <DrawerFooter>
        <div className={styles.footer}>
          {saveError && <span className={styles.errorText}>{saveError}</span>}
          {saveSuccess && (
            <Text size={200} style={{ color: tokens.colorStatusSuccessForeground1 }}>
              Saved
            </Text>
          )}
          <Button appearance="subtle" onClick={onClose}>
            Close
          </Button>
          <Button
            appearance="primary"
            icon={isPending ? <Spinner size="tiny" /> : <SaveRegular />}
            onClick={handleSave}
            disabled={isPending || !code.trim() || !name.trim()}
          >
            Save Changes
          </Button>
        </div>
      </DrawerFooter>
    </OverlayDrawer>
  )
}
