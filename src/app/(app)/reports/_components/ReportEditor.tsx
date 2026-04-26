'use client'

import { useState, useTransition, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  makeStyles,
  tokens,
  Text,
  Badge,
  Button,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Textarea,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Spinner,
  Divider,
  Tooltip,
} from '@fluentui/react-components'
import {
  ArrowUploadRegular,
  DismissCircleRegular,
  CopyRegular,
  DeleteRegular,
  CheckmarkCircleRegular,
} from '@fluentui/react-icons'
import { publishReport, unpublishReport, updateSectionComment } from '@/lib/actions/reports'
import { SectionRenderer } from './SectionRenderer'
import type { ReportType, ReportStatus } from '@prisma/client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReportSection {
  id: string
  type: string
  title: string
  content: unknown
  comment: string | null
  sortOrder: number
}

export interface ReportEditorProps {
  id: string
  title: string
  reportType: ReportType
  status: ReportStatus
  shareToken: string | null
  projectName: string
  createdBy: string
  createdAt: Date
  sections: ReportSection[]
}

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  header: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalL,
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: tokens.spacingHorizontalL,
  },
  headerLeft: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  headerActions: { display: 'flex', gap: tokens.spacingHorizontalS, flexShrink: 0 },
  sectionCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
  accordionHeader: {
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
  },
  sectionContent: {
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  narrativeBlock: {
    marginTop: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  copyBanner: {
    display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorStatusSuccessBackground1,
    border: `1px solid ${tokens.colorStatusSuccessBorderActive}`,
    borderRadius: tokens.borderRadiusMedium,
  },
})

// ── CopyLinkButton ────────────────────────────────────────────────────────────

function CopyLinkButton({ shareToken }: { shareToken: string }) {
  const [copied, setCopied] = useState(false)
  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${shareToken}`

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <Tooltip content={copied ? 'Copied!' : url} relationship="description">
      <Button icon={copied ? <CheckmarkCircleRegular /> : <CopyRegular />} size="small" appearance={copied ? 'primary' : 'outline'} onClick={handleCopy}>
        {copied ? 'Copied' : 'Copy Link'}
      </Button>
    </Tooltip>
  )
}

// ── Narrative Textarea (auto-saves on blur) ───────────────────────────────────

function NarrativeField({ sectionId, initial, readOnly }: { sectionId: string; initial: string | null; readOnly?: boolean }) {
  const [value, setValue] = useState(initial ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const lastSaved = useRef(initial ?? '')
  const [, startTransition] = useTransition()

  const handleBlur = useCallback(() => {
    if (value === lastSaved.current || readOnly) return
    setSaving(true)
    startTransition(async () => {
      await updateSectionComment(sectionId, { comment: value })
      lastSaved.current = value
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }, [value, sectionId, readOnly])

  return (
    <div>
      <Text size={200} weight="semibold" style={{ color: tokens.colorNeutralForeground2 }} block>
        Narrative / Commentary
        {saving && <Spinner size="tiny" style={{ marginLeft: 8 }} />}
        {saved && !saving && <Text size={100} style={{ color: tokens.colorStatusSuccessForeground1, marginLeft: 8 }}>Saved</Text>}
      </Text>
      <Textarea
        value={value}
        onChange={(_, d) => setValue(d.value)}
        onBlur={handleBlur}
        placeholder="Add narrative or commentary for this section…"
        resize="vertical"
        rows={3}
        disabled={readOnly}
        style={{ marginTop: 4, width: '100%' }}
      />
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ReportEditor(props: ReportEditorProps & { readOnly?: boolean }) {
  const styles = useStyles()
  const router = useRouter()
  const [status, setStatus] = useState<ReportStatus>(props.status)
  const [shareToken, setShareToken] = useState<string | null>(props.shareToken)
  const [publishing, startPublish] = useTransition()

  function handlePublish() {
    startPublish(async () => {
      const result = await publishReport(props.id)
      if (result.ok) {
        setStatus('published')
        setShareToken(result.data.shareToken)
      }
    })
  }

  function handleUnpublish() {
    startPublish(async () => {
      await unpublishReport(props.id)
      setStatus('draft')
    })
  }

  const sortedSections = [...props.sections].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className={styles.root}>
      {/* Header card */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div style={{ display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center', flexWrap: 'wrap' as const }}>
            <Badge appearance="tint" color={status === 'published' ? 'success' : 'informative'}>
              {status === 'published' ? 'Published' : 'Draft'}
            </Badge>
            <Badge appearance="outline">
              {props.reportType === 'executive_summary' ? 'Executive Summary' : 'Detailed Activities'}
            </Badge>
          </div>
          <Text size={500} weight="semibold">{props.title}</Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {props.projectName} · By {props.createdBy} ·{' '}
            {new Date(props.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Text>
        </div>
        {!props.readOnly && (
          <div className={styles.headerActions}>
            {status === 'published' && shareToken && <CopyLinkButton shareToken={shareToken} />}
            {status === 'draft' ? (
              <Button icon={<ArrowUploadRegular />} appearance="primary" onClick={handlePublish} disabled={publishing}>
                {publishing ? <Spinner size="tiny" /> : 'Publish'}
              </Button>
            ) : (
              <Button icon={<DismissCircleRegular />} appearance="outline" onClick={handleUnpublish} disabled={publishing}>
                Unpublish
              </Button>
            )}
            <Button icon={<DeleteRegular />} appearance="subtle" onClick={() => router.push('/reports')} />
          </div>
        )}
      </div>

      {/* Published share banner */}
      {status === 'published' && shareToken && !props.readOnly && (
        <div className={styles.copyBanner}>
          <CheckmarkCircleRegular style={{ color: tokens.colorStatusSuccessForeground1, flexShrink: 0 }} />
          <Text size={200}>
            Report is published. Share this link:{' '}
            <strong>{typeof window !== 'undefined' ? window.location.origin : ''}/r/{shareToken}</strong>
          </Text>
          <CopyLinkButton shareToken={shareToken} />
        </div>
      )}

      <Divider />

      {/* Sections accordion */}
      <Accordion multiple defaultOpenItems={sortedSections.map((s) => s.id)}>
        {sortedSections.map((section) => (
          <div key={section.id} className={styles.sectionCard}>
            <AccordionItem value={section.id}>
              <AccordionHeader className={styles.accordionHeader}>
                <Text size={300} weight="semibold">{section.title}</Text>
              </AccordionHeader>
              <AccordionPanel>
                <div className={styles.sectionContent}>
                  <SectionRenderer type={section.type} content={section.content} />
                  <div className={styles.narrativeBlock}>
                    <NarrativeField sectionId={section.id} initial={section.comment} readOnly={props.readOnly} />
                  </div>
                </div>
              </AccordionPanel>
            </AccordionItem>
          </div>
        ))}
      </Accordion>
    </div>
  )
}
