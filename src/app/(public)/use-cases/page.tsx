'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button, Text, Card, Badge, makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  page: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: `48px ${tokens.spacingHorizontalXXL}`,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
    gap: tokens.spacingHorizontalXXL,
    marginTop: tokens.spacingVerticalXXL,
  },
  card: {
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '100%',
  },
  imageWrap: {
    position: 'relative',
    height: '188px',
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground3,
  },
  image: {
    objectFit: 'cover',
  },
  cardBody: {
    padding: tokens.spacingHorizontalXXL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    flex: 1,
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
    image: {
      src: 'https://images.unsplash.com/photo-1523848309072-c199db53f137?auto=format&fit=crop&w=1200&q=80',
      alt: 'Open-pit mine with excavators and haul trucks in operation',
    },
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
    image: {
      src: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
      alt: 'Construction team coordinating work on a major infrastructure project',
    },
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
    image: {
      src: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
      alt: 'Modern hospital room prepared for clinical operations',
    },
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
    image: {
      src: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=1200&q=80',
      alt: 'Factory production line equipment inside a manufacturing facility',
    },
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
        {USE_CASES.map(({ industry, description, activities, image }) => (
          <Card key={industry} className={styles.card}>
            <div className={styles.imageWrap}>
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 700px) 100vw, (max-width: 1200px) 50vw, 520px"
                className={styles.image}
              />
            </div>
            <div className={styles.cardBody}>
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
