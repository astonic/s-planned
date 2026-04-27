'use client'

import Link from 'next/link'
import { makeStyles, tokens, Text, Badge, Button } from '@fluentui/react-components'
import { ArrowRightRegular } from '@fluentui/react-icons'

// ── Industry colour map ───────────────────────────────────────────────────────

const INDUSTRY_COLOURS: Record<string, { bg: string; text: string; border: string }> = {
  'Mining & Resources':         { bg: 'var(--sp-warning-light)', text: 'var(--sp-warning-dark)', border: 'var(--sp-warning)' },
  'Construction & Engineering': { bg: 'var(--sp-blue-50)', text: 'var(--sp-blue-500)', border: 'var(--sp-blue-200)' },
  Healthcare:                   { bg: 'var(--sp-success-light)', text: 'var(--sp-success-dark)', border: 'var(--sp-success)' },
  Manufacturing:                { bg: 'var(--sp-blue-100)', text: 'var(--sp-blue-600)', border: 'var(--sp-blue-200)' },
  Aviation:                     { bg: 'var(--sp-blue-50)', text: 'var(--sp-teal)', border: 'var(--sp-teal)' },
  'Legal & Fiduciary':          { bg: 'var(--sp-danger-light)', text: 'var(--sp-danger-dark)', border: 'var(--sp-danger)' },
}

function getIndustryColour(industry: string) {
  return INDUSTRY_COLOURS[industry] ?? { bg: 'var(--sp-gray-100)', text: 'var(--sp-gray-600)', border: 'var(--sp-gray-200)' }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  card: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: 'var(--sp-radius-lg)',
    border: '0.5px solid var(--sp-blue-100)',
    padding: tokens.spacingVerticalXL,
    gap: tokens.spacingVerticalM,
    height: '100%',
    boxSizing: 'border-box',
    boxShadow: 'var(--sp-shadow-2)',
  },
  industryBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 10px',
    borderRadius: 'var(--sp-radius-pill)',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.02em',
    border: '1.5px solid',
    width: 'fit-content',
  },
  title: {
    lineHeight: 1.3,
  },
  desc: {
    color: tokens.colorNeutralForeground3,
    flex: 1,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  phasesRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXS,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: tokens.spacingVerticalS,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    marginTop: 'auto',
  },
})

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GalleryTemplate {
  industry: string
  name: string
  desc: string
  deliverables: number
  phases: string[]
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GalleryCard({ t }: { t: GalleryTemplate }) {
  const styles = useStyles()
  const colour = getIndustryColour(t.industry)

  return (
    <div className={`${styles.card} card-lift`}>
      {/* Industry badge */}
      <span
        className={styles.industryBadge}
        style={{
          backgroundColor: colour.bg,
          color: colour.text,
          borderColor: colour.border,
        }}
      >
        {t.industry}
      </span>

      {/* Name */}
      <Text size={400} weight="semibold" className={styles.title}>{t.name}</Text>

      {/* Description */}
      <Text size={200} className={styles.desc}>{t.desc}</Text>

      {/* Phases */}
      <div className={styles.phasesRow}>
        {t.phases.map((phase) => (
          <Badge key={phase} appearance="tint" color="brand" size="small">{phase}</Badge>
        ))}
      </div>

      {/* Footer: deliverable count + CTA */}
      <div className={styles.footer}>
        <div className={styles.metaRow}>
          <Badge appearance="outline" color="subtle" size="medium">
            {t.deliverables} deliverables
          </Badge>
        </div>
        <Link href="/register" style={{ textDecoration: 'none' }}>
          <Button
            appearance="primary"
            size="small"
            icon={<ArrowRightRegular />}
            iconPosition="after"
          >
            Use Template
          </Button>
        </Link>
      </div>
    </div>
  )
}
