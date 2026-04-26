'use client'

import Link from 'next/link'
import { Button, Text, Card, Badge, makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  page: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: `48px ${tokens.spacingHorizontalXXL}`,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
    gap: tokens.spacingHorizontalXXL,
    marginTop: tokens.spacingVerticalXXL,
  },
  card: {
    padding: tokens.spacingHorizontalXXL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  activities: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalXS,
  },
  cta: {
    textAlign: 'center',
    padding: `64px ${tokens.spacingHorizontalXXL}`,
    backgroundColor: tokens.colorNeutralBackground2,
    marginTop: tokens.spacingVerticalXXXL,
    borderRadius: tokens.borderRadiusXLarge,
  },
})

const USE_CASES = [
  {
    industry: 'Mining & Resources',
    description:
      'Commissioning a new processing plant or mine shaft involves dozens of interdependent systems. S-Planned provides the structure to track pre-commissioning checks, safety sign-offs, and handover evidence across mechanical, electrical, and process teams.',
    activities: [
      'Pre-commissioning checklists',
      'Safety case evidence',
      'Equipment handover sign-offs',
      'Regulatory compliance packages',
      'Maintenance readiness verification',
    ],
  },
  {
    industry: 'Construction & Engineering',
    description:
      'Major infrastructure projects require coordinated readiness across civil, structural, and services trades. S-Planned keeps all parties aligned on what evidence is needed, who owns it, and what remains before practical completion.',
    activities: [
      'Practical completion checklists',
      'Defects register management',
      'Statutory inspection evidence',
      'Operations and maintenance manual collection',
      'Handover to building management',
    ],
  },
  {
    industry: 'Healthcare',
    description:
      'Hospital and clinic openings require meticulous preparation across clinical, facilities, and IT domains. S-Planned ensures every accreditation requirement, staff training record, and equipment certification is tracked and evidenced.',
    activities: [
      'Clinical accreditation readiness',
      'Staff training and credentialing',
      'Medical equipment certification',
      'IT systems go-live readiness',
      'Emergency preparedness sign-offs',
    ],
  },
  {
    industry: 'Manufacturing',
    description:
      'New production lines and factory fit-outs demand coordinated readiness across operations, quality, safety, and supply chain. S-Planned tracks every pre-production requirement from equipment qualification to operator training.',
    activities: [
      'Equipment qualification (IQ/OQ/PQ)',
      'Quality management sign-offs',
      'Operator training records',
      'Safety and environmental compliance',
      'Supply chain readiness verification',
    ],
  },
]

export default function UseCasesPage() {
  const styles = useStyles()

  return (
    <div className={styles.page}>
      <Text size={700} weight="semibold" block>
        Use Cases
      </Text>
      <Text size={400} style={{ color: tokens.colorNeutralForeground2, marginTop: '8px', display: 'block' }}>
        S-Planned is built for any project-intensive industry where operational readiness must be planned, evidenced, and reported.
      </Text>

      <div className={styles.grid}>
        {USE_CASES.map(({ industry, description, activities }) => (
          <Card key={industry} className={styles.card}>
            <Text size={500} weight="semibold">{industry}</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
              {description}
            </Text>
            <Text size={200} weight="semibold" style={{ marginTop: '4px' }}>
              Common activities:
            </Text>
            <div className={styles.activities}>
              {activities.map((a) => (
                <Badge key={a} appearance="outline" color="brand" size="medium">
                  {a}
                </Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className={styles.cta}>
        <Text size={500} weight="semibold" block>
          Ready to get started?
        </Text>
        <Text size={300} style={{ color: tokens.colorNeutralForeground2, marginTop: '8px', display: 'block', marginBottom: '24px' }}>
          Create your free account and start your first operational readiness project in minutes.
        </Text>
        <Link href="/register">
          <Button appearance="primary" size="large">
            Create free account
          </Button>
        </Link>
      </div>
    </div>
  )
}
