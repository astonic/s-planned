'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  makeStyles,
  tokens,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Button,
  Input,
  Textarea,
  Select,
  Field,
  Spinner,
  Text,
  Badge,
  Divider,
} from '@fluentui/react-components'
import { AddRegular, SaveRegular } from '@fluentui/react-icons'
import { updateTemplate, addFocusArea } from '@/lib/actions/templates'
import type { TemplateWithHierarchy } from '@/types/templates'
import { FocusAreaPanel } from './FocusAreaPanel'

const useStyles = makeStyles({
  root: {
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalXXL}`,
    maxWidth: '960px',
  },
  section: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalL,
  },
  fieldsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalM,
  },
  fieldsFull: {
    marginBottom: tokens.spacingVerticalM,
  },
  saveRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: tokens.spacingVerticalM,
    gap: tokens.spacingHorizontalS,
  },
  accordionContainer: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    marginBottom: tokens.spacingVerticalM,
  },
  addFocusAreaRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'flex-end',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  focusAreasHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalM,
  },
  errorText: {
    color: tokens.colorStatusDangerForeground1,
    fontSize: tokens.fontSizeBase200,
  },
  successText: {
    color: tokens.colorStatusSuccessForeground1,
    fontSize: tokens.fontSizeBase200,
  },
})

const INDUSTRY_OPTIONS = [
  'Construction',
  'Engineering',
  'Healthcare',
  'Finance',
  'Technology',
  'Manufacturing',
  'Energy',
  'Education',
  'Other',
]

interface Props {
  template: TemplateWithHierarchy
}

export function TemplateEditor({ template }: Props) {
  const styles = useStyles()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Template-level fields
  const [name, setName] = useState(template.name)
  const [description, setDescription] = useState(template.description ?? '')
  const [industry, setIndustry] = useState(template.industry ?? '')
  const [version, setVersion] = useState(template.version)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Add focus area form
  const [showAddFA, setShowAddFA] = useState(false)
  const [newFACode, setNewFACode] = useState('')
  const [newFAName, setNewFAName] = useState('')
  const [addFAError, setAddFAError] = useState<string | null>(null)

  function handleSave() {
    if (!name.trim()) return
    setSaveError(null)
    setSaveSuccess(false)
    startTransition(async () => {
      const result = await updateTemplate(template.id, {
        name: name.trim(),
        description: description || undefined,
        industry: industry || undefined,
        version: version || undefined,
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

  function handleAddFocusArea() {
    if (!newFACode.trim() || !newFAName.trim()) return
    setAddFAError(null)
    startTransition(async () => {
      const result = await addFocusArea(template.id, {
        code: newFACode.trim(),
        name: newFAName.trim(),
      })
      if (result.ok) {
        setNewFACode('')
        setNewFAName('')
        setShowAddFA(false)
        router.refresh()
      } else {
        setAddFAError(result.error)
      }
    })
  }

  return (
    <div className={styles.root}>
      {/* Template-level fields */}
      <div className={styles.section}>
        <Text size={400} weight="semibold" block style={{ marginBottom: tokens.spacingVerticalM }}>
          Template Details
        </Text>
        <div className={styles.fieldsGrid}>
          <Field label="Name" required>
            <Input
              value={name}
              onChange={(_, d) => setName(d.value)}
              placeholder="Template name"
            />
          </Field>
          <Field label="Version">
            <Input
              value={version}
              onChange={(_, d) => setVersion(d.value)}
              placeholder="e.g. 1.0"
            />
          </Field>
        </div>
        <div className={styles.fieldsFull}>
          <Field label="Description">
            <Textarea
              value={description}
              onChange={(_, d) => setDescription(d.value)}
              placeholder="Describe what this template covers..."
              rows={3}
            />
          </Field>
        </div>
        <div className={styles.fieldsGrid}>
          <Field label="Industry">
            <Select value={industry} onChange={(_, d) => setIndustry(d.value)}>
              <option value="">Select industry...</option>
              {INDUSTRY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Divider style={{ margin: `${tokens.spacingVerticalM} 0` }} />
        <div className={styles.saveRow}>
          {saveError && <span className={styles.errorText}>{saveError}</span>}
          {saveSuccess && <span className={styles.successText}>Saved successfully</span>}
          <Button
            appearance="primary"
            icon={isPending ? <Spinner size="tiny" /> : <SaveRegular />}
            onClick={handleSave}
            disabled={isPending || !name.trim()}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Focus Areas section */}
      <div className={styles.focusAreasHeader}>
        <Text size={400} weight="semibold">Focus Areas</Text>
        <Badge appearance="filled" color="informative">
          {template.focusAreas.length}
        </Badge>
      </div>

      {template.focusAreas.length > 0 && (
        <div className={styles.accordionContainer}>
          <Accordion multiple collapsible>
            {template.focusAreas.map((fa) => (
              <AccordionItem key={fa.id} value={fa.id}>
                <AccordionHeader>
                  <Text weight="semibold">{fa.code}</Text>
                  <Text
                    style={{
                      marginLeft: tokens.spacingHorizontalS,
                      color: tokens.colorNeutralForeground2,
                    }}
                  >
                    — {fa.name}
                  </Text>
                </AccordionHeader>
                <AccordionPanel>
                  <FocusAreaPanel focusArea={fa} templateId={template.id} />
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {template.focusAreas.length === 0 && (
        <Text
          size={200}
          style={{
            color: tokens.colorNeutralForeground3,
            display: 'block',
            marginBottom: tokens.spacingVerticalM,
          }}
        >
          No focus areas yet. Add one below to get started.
        </Text>
      )}

      {/* Add Focus Area */}
      {showAddFA ? (
        <div className={styles.addFocusAreaRow}>
          <Field label="Code" style={{ flex: '0 0 130px' }}>
            <Input
              value={newFACode}
              onChange={(_, d) => setNewFACode(d.value)}
              placeholder="e.g. FA-01"
              autoFocus
            />
          </Field>
          <Field label="Name" style={{ flex: 1 }}>
            <Input
              value={newFAName}
              onChange={(_, d) => setNewFAName(d.value)}
              placeholder="Focus area name"
              onKeyDown={(e) => e.key === 'Enter' && handleAddFocusArea()}
            />
          </Field>
          <Button
            appearance="primary"
            onClick={handleAddFocusArea}
            disabled={isPending || !newFACode.trim() || !newFAName.trim()}
            icon={isPending ? <Spinner size="tiny" /> : undefined}
          >
            Add
          </Button>
          <Button
            appearance="subtle"
            onClick={() => {
              setShowAddFA(false)
              setAddFAError(null)
            }}
          >
            Cancel
          </Button>
          {addFAError && <span className={styles.errorText}>{addFAError}</span>}
        </div>
      ) : (
        <Button
          appearance="outline"
          icon={<AddRegular />}
          onClick={() => setShowAddFA(true)}
        >
          Add Focus Area
        </Button>
      )}
    </div>
  )
}
