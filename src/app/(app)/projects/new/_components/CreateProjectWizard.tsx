'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Button,
  Field,
  Input,
  Textarea,
  Spinner,
  Badge,
  Text,
  tokens,
  makeStyles,
} from '@fluentui/react-components'
import { CheckmarkCircleRegular } from '@fluentui/react-icons'
import { createProject } from '@/lib/actions/projects'

// ── Types ─────────────────────────────────────────────────────────────────────

interface TemplateOption {
  id: string
  name: string
  description: string | null
  industry: string | null
  _count: { focusAreas: number }
}

interface CreateProjectWizardProps {
  templates: TemplateOption[]
}

// ── Schema ────────────────────────────────────────────────────────────────────

const detailsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
})

type DetailsFormValues = z.infer<typeof detailsSchema>

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  container: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalXXL}`,
  },
  stepIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalXXL,
  },
  stepDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: tokens.colorNeutralStroke1,
    transition: 'background-color 0.2s ease',
  },
  stepDotActive: {
    backgroundColor: tokens.colorBrandBackground,
  },
  stepDotDone: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  stepLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginBottom: tokens.spacingVerticalL,
    display: 'block',
  },
  sectionTitle: {
    marginBottom: tokens.spacingVerticalL,
  },
  // Template grid
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalXL,
  },
  templateCard: {
    border: `2px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    cursor: 'pointer',
    backgroundColor: tokens.colorNeutralBackground1,
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    ':hover': {
      boxShadow: tokens.shadow4,
    },
  },
  templateCardSelected: {
    border: `2px solid ${tokens.colorBrandBackground}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    cursor: 'pointer',
    backgroundColor: tokens.colorBrandBackground2Hover,
    boxShadow: tokens.shadow4,
  },
  blankCard: {
    border: `2px dashed ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    cursor: 'pointer',
    backgroundColor: tokens.colorNeutralBackground1,
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    textAlign: 'center',
    ':hover': {
      boxShadow: tokens.shadow4,
    },
  },
  blankCardSelected: {
    border: `2px solid ${tokens.colorBrandBackground}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    cursor: 'pointer',
    backgroundColor: tokens.colorBrandBackground2Hover,
    boxShadow: tokens.shadow4,
    textAlign: 'center',
  },
  cardName: {
    fontWeight: tokens.fontWeightSemibold,
    display: 'block',
    marginBottom: tokens.spacingVerticalXS,
  },
  cardMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXS,
  },
  // Details form
  formStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalXL,
  },
  dateRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
  },
  // Confirm step
  summaryCard: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalL}`,
    backgroundColor: tokens.colorNeutralBackground2,
    marginBottom: tokens.spacingVerticalXL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  summaryRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  summaryLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  // Navigation
  navRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  errorText: {
    color: tokens.colorStatusDangerForeground1,
    fontSize: tokens.fontSizeBase200,
    marginBottom: tokens.spacingVerticalM,
    display: 'block',
  },
})

// ── Step Indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  const styles = useStyles()
  return (
    <div className={styles.stepIndicator}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={
            i + 1 === current
              ? styles.stepDotActive
              : i + 1 < current
              ? styles.stepDotDone
              : styles.stepDot
          }
        />
      ))}
      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
        Step {current} of {total}
      </Text>
    </div>
  )
}

// ── Step 1: Choose Template ───────────────────────────────────────────────────

interface Step1Props {
  templates: TemplateOption[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onNext: () => void
}

function Step1ChooseTemplate({ templates, selectedId, onSelect, onNext }: Step1Props) {
  const styles = useStyles()
  const isBlankSelected = selectedId === ''

  return (
    <div>
      <Text weight="semibold" size={400} block className={styles.sectionTitle}>
        Choose a template
      </Text>

      <div className={styles.templateGrid}>
        {/* Blank project option */}
        <div
          className={isBlankSelected ? styles.blankCardSelected : styles.blankCard}
          onClick={() => onSelect('')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelect('')}
          aria-pressed={isBlankSelected}
        >
          <Text size={300} weight="semibold" block style={{ marginBottom: tokens.spacingVerticalXS }}>
            Start blank
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Build from scratch
          </Text>
          {isBlankSelected && (
            <div style={{ marginTop: tokens.spacingVerticalS, display: 'flex', justifyContent: 'center' }}>
              <CheckmarkCircleRegular style={{ color: tokens.colorBrandForeground1, fontSize: '20px' }} />
            </div>
          )}
        </div>

        {/* Template cards */}
        {templates.map((t) => {
          const isSelected = selectedId === t.id
          return (
            <div
              key={t.id}
              className={isSelected ? styles.templateCardSelected : styles.templateCard}
              onClick={() => onSelect(t.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(t.id)}
              aria-pressed={isSelected}
            >
              <Text size={300} weight="semibold" block style={{ marginBottom: tokens.spacingVerticalXS }}>
                {t.name}
              </Text>
              <div className={styles.cardMeta}>
                {t.industry && (
                  <Badge appearance="tint" color="informative" size="small">
                    {t.industry}
                  </Badge>
                )}
                <Badge appearance="outline" color="subtle" size="small">
                  {t._count.focusAreas} focus area{t._count.focusAreas !== 1 ? 's' : ''}
                </Badge>
              </div>
              {isSelected && (
                <div style={{ marginTop: tokens.spacingVerticalS }}>
                  <CheckmarkCircleRegular style={{ color: tokens.colorBrandForeground1, fontSize: '20px' }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className={styles.navRow}>
        <span />
        <Button
          appearance="primary"
          disabled={selectedId === null}
          onClick={onNext}
        >
          Next →
        </Button>
      </div>
    </div>
  )
}

// ── Step 2: Project Details ───────────────────────────────────────────────────

interface Step2Props {
  defaultValues: DetailsFormValues
  onBack: () => void
  onNext: (values: DetailsFormValues) => void
}

function Step2ProjectDetails({ defaultValues, onBack, onNext }: Step2Props) {
  const styles = useStyles()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onNext)}>
      <Text weight="semibold" size={400} block className={styles.sectionTitle}>
        Project details
      </Text>

      <div className={styles.formStack}>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Field
              label="Project name"
              required
              validationState={errors.name ? 'error' : 'none'}
              validationMessage={errors.name?.message}
            >
              <Input {...field} placeholder="e.g. Mine Site Commissioning 2026" autoFocus />
            </Field>
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Field label="Description">
              <Textarea
                {...field}
                placeholder="Optional — describe the scope or objectives of this project"
                rows={3}
              />
            </Field>
          )}
        />

        <div className={styles.dateRow}>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <Field label="Start date">
                <Input type="date" {...field} />
              </Field>
            )}
          />
          <Controller
            name="targetDate"
            control={control}
            render={({ field }) => (
              <Field label="Target date">
                <Input type="date" {...field} />
              </Field>
            )}
          />
        </div>
      </div>

      <div className={styles.navRow}>
        <Button appearance="secondary" onClick={onBack} type="button">
          ← Back
        </Button>
        <Button appearance="primary" type="submit">
          Next →
        </Button>
      </div>
    </form>
  )
}

// ── Step 3: Confirm ───────────────────────────────────────────────────────────

interface Step3Props {
  selectedTemplateId: string | null
  templates: TemplateOption[]
  details: DetailsFormValues
  onBack: () => void
  onSubmit: () => void
  isPending: boolean
  serverError: string | null
}

function Step3Confirm({
  selectedTemplateId,
  templates,
  details,
  onBack,
  onSubmit,
  isPending,
  serverError,
}: Step3Props) {
  const styles = useStyles()
  const template =
    selectedTemplateId ? templates.find((t) => t.id === selectedTemplateId) : null

  function formatDate(d: string | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div>
      <Text weight="semibold" size={400} block className={styles.sectionTitle}>
        Confirm project
      </Text>

      <div className={styles.summaryCard}>
        <div className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>Template</Text>
          <Text weight="semibold">
            {template ? template.name : 'Blank project (no template)'}
          </Text>
          {template && (
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              {template._count.focusAreas} focus area{template._count.focusAreas !== 1 ? 's' : ''} will be instantiated
            </Text>
          )}
        </div>

        <div className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>Project name</Text>
          <Text weight="semibold">{details.name}</Text>
        </div>

        {details.description && (
          <div className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>Description</Text>
            <Text>{details.description}</Text>
          </div>
        )}

        <div className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>Dates</Text>
          <Text>
            {formatDate(details.startDate)} → {formatDate(details.targetDate)}
          </Text>
        </div>
      </div>

      {serverError && (
        <Text className={styles.errorText}>{serverError}</Text>
      )}

      <div className={styles.navRow}>
        <Button appearance="secondary" onClick={onBack} disabled={isPending}>
          ← Back
        </Button>
        <Button
          appearance="primary"
          onClick={onSubmit}
          disabled={isPending}
          icon={isPending ? <Spinner size="tiny" /> : undefined}
        >
          Create Project
        </Button>
      </div>
    </div>
  )
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export function CreateProjectWizard({ templates }: CreateProjectWizardProps) {
  const styles = useStyles()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  // null = not yet chosen, '' = blank, 'uuid' = template id
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [details, setDetails] = useState<DetailsFormValues>({
    name: '',
    description: '',
    startDate: '',
    targetDate: '',
  })
  const [serverError, setServerError] = useState<string | null>(null)

  function handleTemplateSelect(id: string | null) {
    setSelectedTemplateId(id)
  }

  function handleDetailsSubmit(values: DetailsFormValues) {
    setDetails(values)
    setStep(3)
  }

  function handleCreate() {
    setServerError(null)
    startTransition(async () => {
      const result = await createProject({
        name: details.name,
        description: details.description || undefined,
        templateId: selectedTemplateId || undefined,
        startDate: details.startDate ? new Date(details.startDate) : undefined,
        targetDate: details.targetDate ? new Date(details.targetDate) : undefined,
      })
      if (result.ok) {
        router.push(`/projects/${result.data.id}`)
      } else {
        setServerError(result.error)
      }
    })
  }

  return (
    <div className={styles.container}>
      <StepIndicator current={step} total={3} />

      {step === 1 && (
        <Step1ChooseTemplate
          templates={templates}
          selectedId={selectedTemplateId}
          onSelect={handleTemplateSelect}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <Step2ProjectDetails
          defaultValues={details}
          onBack={() => setStep(1)}
          onNext={handleDetailsSubmit}
        />
      )}

      {step === 3 && (
        <Step3Confirm
          selectedTemplateId={selectedTemplateId}
          templates={templates}
          details={details}
          onBack={() => setStep(2)}
          onSubmit={handleCreate}
          isPending={isPending}
          serverError={serverError}
        />
      )}
    </div>
  )
}
