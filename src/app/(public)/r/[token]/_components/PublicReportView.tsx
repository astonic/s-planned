'use client'

import {
  makeStyles,
  tokens,
  Text,
  Badge,
  Divider,
  FluentProvider,
  webLightTheme,
} from '@fluentui/react-components'
import { SectionRenderer } from '@/app/(app)/reports/_components/SectionRenderer'
import type { ReportType } from '@prisma/client'

interface Section {
  id: string
  type: string
  title: string
  content: unknown
  comment: string | null
  sortOrder: number
}

interface PublicReportViewProps {
  title: string
  reportType: ReportType
  projectName: string
  createdBy: string
  publishedAt: Date | null
  sections: Section[]
}

const useStyles = makeStyles({
  page: {
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground3,
    display: 'flex', flexDirection: 'column',
  },
  topBar: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalXL}`,
    display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM,
  },
  brand: { fontWeight: tokens.fontWeightSemibold, color: tokens.colorBrandForeground1 },
  body: {
    maxWidth: '900px',
    width: '100%',
    margin: '0 auto',
    padding: `${tokens.spacingVerticalXL} ${tokens.spacingHorizontalL}`,
    display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL,
  },
  header: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalL,
    display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS,
  },
  sectionCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  sectionBody: {
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
  },
  narrativeBlock: {
    marginTop: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  footer: {
    textAlign: 'center' as const,
    padding: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground3,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    marginTop: 'auto',
  },
})

export function PublicReportView({ title, reportType, projectName, createdBy, publishedAt, sections }: PublicReportViewProps) {
  const styles = useStyles()
  const sortedSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder)

  const inner = (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <Text className={styles.brand} size={400}>S-Planned</Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Operational Readiness Report</Text>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* Report header */}
        <div className={styles.header}>
          <div style={{ display: 'flex', gap: tokens.spacingHorizontalS, flexWrap: 'wrap' as const }}>
            <Badge appearance="tint" color="success">Published</Badge>
            <Badge appearance="outline">{reportType === 'executive_summary' ? 'Executive Summary' : 'Detailed Activities'}</Badge>
          </div>
          <Text size={600} weight="semibold">{title}</Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {projectName} · Prepared by {createdBy}
            {publishedAt && ` · Published ${new Date(publishedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`}
          </Text>
        </div>

        <Divider />

        {/* Sections */}
        {sortedSections.map((section) => (
          <div key={section.id} className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <Text size={300} weight="semibold">{section.title}</Text>
            </div>
            <div className={styles.sectionBody}>
              <SectionRenderer type={section.type} content={section.content} />
              {section.comment && (
                <div className={styles.narrativeBlock}>
                  <Text size={200} weight="semibold" style={{ color: tokens.colorNeutralForeground2 }} block>Commentary</Text>
                  <Text size={200} style={{ whiteSpace: 'pre-wrap' as const }}>{section.comment}</Text>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className={styles.footer}>
          <Text size={200}>Powered by <strong>S-Planned</strong> — Operational Readiness Platform</Text>
        </div>
      </div>
    </div>
  )

  return <FluentProvider theme={webLightTheme}>{inner}</FluentProvider>
}
