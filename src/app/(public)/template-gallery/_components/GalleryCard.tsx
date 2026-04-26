'use client'

import Link from 'next/link'
import { makeStyles, tokens, Text, Badge, Button } from '@fluentui/react-components'
import { ArrowRightRegular } from '@fluentui/react-icons'

// ── Industry colour map ───────────────────────────────────────────────────────

const INDUSTRY_COLOURS: Record<string, { bg: string; text: string; border: string }> = {
  'Mining & Resources':        { bg: '#FFF8E1', text: '#F7B900', border: '#F7B900' },
  'Construction & Engineering':{ bg: '#EFF6FC', text: '#0078D4', border: '#0078D4' },
  'Healthcare':                { bg: '#F0FFF0', text: '#13A10E', border: '#13A10E' },
  'Manufacturing':             { bg: '#F5F0FF', text: '#8764B8', border: '#8764B8' },
  'Aviation':                  { bg: '#E8FAFB', text: '#00B7C3', border: '#00B7C3' },
  'Legal & Fiduciary':         { bg: '#FFF0F2', text: '#C4314B', border: '#C4314B' },
}

function getIndustryColour(industry: string) {
  return INDUSTRY_COLOURS[industry] ?? { bg: '#F5F5F5', text: '#666', border: '#ccc' }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  card: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: tokens.spacingVerticalXL,
    gap: tokens.spacingVerticalM,
    height: '100%',
    boxSizing: 'border-box',
  },
  industryBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 10px',
    borderRadius: tokens.borderRadiusCircular,
    fontSize: '11px',
    fontWeight: '600',
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
