'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  makeStyles,
  tokens,
  Text,
  Badge,
  Button,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Field,
  Input,
  Select,
  Spinner,
  Divider,
} from '@fluentui/react-components'
import { DocumentRegular, ShareRegular, DeleteRegular } from '@fluentui/react-icons'
import { createReport, deleteReport } from '@/lib/actions/reports'
import type { ReportType } from '@prisma/client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReportCard {
  id: string
  title: string
  reportType: ReportType
  status: 'draft' | 'published'
  projectName: string
  projectId: string
  createdBy: string
  publishedAt: Date | null
  createdAt: Date
  viewCount: number
}

export interface ProjectOption { id: string; name: string }

export interface ReportListClientProps {
  reports: ReportCard[]
  projects: ProjectOption[]
}

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: tokens.spacingHorizontalL,
  },
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    cursor: 'pointer',
    ':hover': { border: `1px solid ${tokens.colorBrandStroke1}` },
  },
  cardHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: tokens.spacingHorizontalM },
  cardMeta: { display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center', flexWrap: 'wrap' as const },
  cardFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' },
  icon: { color: tokens.colorBrandForeground1, flexShrink: 0 },
  empty: { textAlign: 'center' as const, padding: `${tokens.spacingVerticalXXL} 0`, color: tokens.colorNeutralForeground3 },
})

const TYPE_LABELS: Record<ReportType, string> = {
  detailed_activities: 'Detailed Activities',
  executive_summary: 'Executive Summary',
}

// ── Create Report Dialog ──────────────────────────────────────────────────────

function CreateReportDialog({ projects, onCreated }: { projects: ProjectOption[]; onCreated: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [reportType, setReportType] = useState<ReportType>('executive_summary')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const result = await createReport({
        projectId,
        title,
        reportType,
        periodStart: periodStart ? new Date(periodStart) : undefined,
        periodEnd: periodEnd ? new Date(periodEnd) : undefined,
      })
      if (!result.ok) { setError(result.error); return }
      setOpen(false)
      setTitle(''); setProjectId(projects[0]?.id ?? ''); setReportType('executive_summary')
      onCreated(result.data.id)
    })
  }

  return (
    <Dialog open={open} onOpenChange={(_, d) => setOpen(d.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="primary">+ New Report</Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Create Report</DialogTitle>
          <DialogContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
              <Field label="Title" required>
                <Input value={title} onChange={(_, d) => setTitle(d.value)} placeholder="e.g. Q2 Readiness Report" />
              </Field>
              <Field label="Project" required>
                <Select value={projectId} onChange={(_, d) => setProjectId(d.value)}>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
              </Field>
              <Field label="Report Type" required>
                <Select value={reportType} onChange={(_, d) => setReportType(d.value as ReportType)}>
                  <option value="executive_summary">Executive Summary</option>
                  <option value="detailed_activities">Detailed Activities</option>
                </Select>
              </Field>
              <Field label="Period Start (optional)">
                <Input type="date" value={periodStart} onChange={(_, d) => setPeriodStart(d.value)} />
              </Field>
              <Field label="Period End (optional)">
                <Input type="date" value={periodEnd} onChange={(_, d) => setPeriodEnd(d.value)} />
              </Field>
              {error && <Text size={200} style={{ color: tokens.colorStatusDangerForeground1 }}>{error}</Text>}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="subtle" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              appearance="primary"
              onClick={handleSubmit}
              disabled={pending || !title.trim() || !projectId}
            >
              {pending ? <Spinner size="tiny" /> : 'Create Report'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ReportListClient({ reports: initial, projects }: ReportListClientProps) {
  const styles = useStyles()
  const router = useRouter()
  const [reports, setReports] = useState<ReportCard[]>(initial)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleCreated(id: string) {
    router.push(`/reports/${id}`)
  }

  function handleDelete(id: string) {
    setDeletingId(id)
    startTransition(async () => {
      await deleteReport(id)
      setReports((prev) => prev.filter((r) => r.id !== id))
      setDeletingId(null)
    })
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Text size={500} weight="semibold" block>Reports</Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {reports.length} report{reports.length !== 1 ? 's' : ''}
          </Text>
        </div>
        <CreateReportDialog projects={projects} onCreated={handleCreated} />
      </div>

      <Divider />

      {reports.length === 0 ? (
        <div className={styles.empty}>
          <DocumentRegular style={{ fontSize: 48, color: tokens.colorNeutralForeground3, marginBottom: 8 }} />
          <Text size={300} block style={{ color: tokens.colorNeutralForeground3 }}>No reports yet.</Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Create your first report to share progress with stakeholders.</Text>
        </div>
      ) : (
        <div className={styles.grid}>
          {reports.map((r) => (
            <div
              key={r.id}
              className={styles.card}
              onClick={() => router.push(`/reports/${r.id}`)}
            >
              <div className={styles.cardHeader}>
                <DocumentRegular className={styles.icon} style={{ fontSize: 24, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text size={300} weight="semibold" block style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.title}
                  </Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{r.projectName}</Text>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <Button
                    icon={<DeleteRegular />}
                    size="small"
                    appearance="subtle"
                    disabled={deletingId === r.id}
                    onClick={() => handleDelete(r.id)}
                  />
                </div>
              </div>

              <div className={styles.cardMeta}>
                <Badge appearance="tint" color={r.status === 'published' ? 'success' : 'informative'} size="small">
                  {r.status === 'published' ? 'Published' : 'Draft'}
                </Badge>
                <Badge appearance="outline" size="small">{TYPE_LABELS[r.reportType]}</Badge>
              </div>

              <div className={styles.cardFooter}>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  By {r.createdBy} · {new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
                {r.status === 'published' && (
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    <ShareRegular style={{ marginRight: 4 }} />
                    {r.viewCount} views
                  </Text>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
