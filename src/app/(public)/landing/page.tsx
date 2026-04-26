'use client'

import Link from 'next/link'
import {
  Button,
  Text,
  Card,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import {
  CheckmarkCircleRegular,
  ShieldRegular,
  DocumentRegular,
} from '@fluentui/react-icons'

const useStyles = makeStyles({
  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: `80px ${tokens.spacingHorizontalXXL} 64px`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  heroHeadline: {
    fontSize: '42px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    maxWidth: '680px',
    lineHeight: '1.2',
    marginBottom: tokens.spacingVerticalL,
  },
  heroSub: {
    maxWidth: '560px',
    marginBottom: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground2,
  },
  pillars: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: tokens.spacingHorizontalXXL,
    padding: `64px ${tokens.spacingHorizontalXXL}`,
    maxWidth: '1100px',
    margin: '0 auto',
  },
  pillarCard: {
    padding: tokens.spacingHorizontalXXL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  industries: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: `48px ${tokens.spacingHorizontalXXL}`,
    textAlign: 'center',
  },
  industryGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
    gap: tokens.spacingHorizontalXXL,
    marginTop: tokens.spacingVerticalXL,
  },
  footer: {
    backgroundColor: tokens.colorNeutralBackground3,
    padding: `32px ${tokens.spacingHorizontalXXL}`,
    display: 'flex',
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingHorizontalL,
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  footerLinks: {
    display: 'flex',
    gap: tokens.spacingHorizontalXL,
  },
})

const PILLARS = [
  {
    icon: CheckmarkCircleRegular,
    title: 'Deliverable Management',
    description:
      'Structure your readiness program with focus areas, sub-sections, and individual deliverables. Track status, evidence, and team ownership — all in one place.',
  },
  {
    icon: ShieldRegular,
    title: 'RAID Log',
    description:
      'Capture and track Risks, Assumptions, Issues, and Dependencies with severity ratings, owners, and due dates. Link RAID items directly to the deliverables they affect.',
  },
  {
    icon: DocumentRegular,
    title: 'Executive Reports',
    description:
      'Generate detailed activity reports or slide-style executive summaries with RAG status, Gantt timelines, and key decisions. Publish with a shareable public link.',
  },
]

const INDUSTRIES = [
  'Mining & Resources',
  'Construction & Engineering',
  'Healthcare',
  'Manufacturing',
  'Aviation',
  'Legal & Fiduciary',
]

export default function LandingPage() {
  const styles = useStyles()

  return (
    <div>
      <section className={styles.hero}>
        <Text className={styles.heroHeadline}>
          Plan. Track. Evidence.{' '}
          <span style={{ color: tokens.colorBrandForeground1 }}>
            Operational Readiness, Simplified.
          </span>
        </Text>
        <Text size={400} className={styles.heroSub}>
          S-Planned gives project teams in mining, construction, healthcare, and
          manufacturing a structured, evidence-based system for proving operational
          readiness before go-live.
        </Text>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/register">
            <Button appearance="primary" size="large">
              Get started free
            </Button>
          </Link>
          <Link href="/use-cases">
            <Button appearance="secondary" size="large">
              See use cases
            </Button>
          </Link>
        </div>
      </section>

      <section>
        <div style={{ textAlign: 'center', padding: '48px 32px 0' }}>
          <Text size={500} weight="semibold">
            Everything you need for operational readiness
          </Text>
        </div>
        <div className={styles.pillars}>
          {PILLARS.map(({ icon: Icon, title, description }) => (
            <Card key={title} className={styles.pillarCard}>
              <Icon style={{ fontSize: 32, color: tokens.colorBrandForeground1 }} />
              <Text size={400} weight="semibold">{title}</Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                {description}
              </Text>
            </Card>
          ))}
        </div>
      </section>

      <section className={styles.industries}>
        <Text size={300} weight="semibold" style={{ color: tokens.colorNeutralForeground2 }}>
          BUILT FOR REGULATED, PROJECT-INTENSIVE INDUSTRIES
        </Text>
        <div className={styles.industryGrid}>
          {INDUSTRIES.map((industry) => (
            <Text key={industry} size={300} weight="semibold">
              {industry}
            </Text>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          © 2026 S-Planned. Operational Readiness Platform.
        </Text>
        <div className={styles.footerLinks}>
          {[
            { label: 'Use Cases', href: '/use-cases' },
            { label: 'Template Gallery', href: '/template-gallery' },
            { label: 'Sign In', href: '/login' },
            { label: 'Register', href: '/register' },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              style={{ color: tokens.colorNeutralForeground2, fontSize: '14px', textDecoration: 'none' }}
            >
              {label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
