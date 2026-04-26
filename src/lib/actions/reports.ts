'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { ReportType } from '@prisma/client'
import { buildAnalytics } from '@/app/api/analytics/route'

type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string }

// ── Types ─────────────────────────────────────────────────────────────────────

interface CreateReportInput {
  projectId: string
  title: string
  reportType: ReportType
  periodStart?: Date
  periodEnd?: Date
}

interface UpdateSectionInput {
  comment: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getOrgId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.currentOrganizationId ?? null
}

async function getActorName(): Promise<string> {
  const session = await getServerSession(authOptions)
  return session?.user?.name ?? 'Unknown'
}

// ── Build snapshot sections ───────────────────────────────────────────────────

async function buildSections(orgId: string, projectId: string, reportType: ReportType, periodStart?: Date, periodEnd?: Date) {
  const since = periodStart ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const until = periodEnd ?? new Date()

  const [project, analytics, recentActivity, raidItems, decisions, evidenceItems] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      include: {
        template: { select: { name: true } },
        focusAreaExecutions: {
          orderBy: { order: 'asc' },
          include: {
            subSections: {
              orderBy: { order: 'asc' },
              include: {
                deliverables: {
                  select: { id: true, name: true, code: true, status: true, phase: true, targetDate: true },
                },
              },
            },
          },
        },
      },
    }),
    buildAnalytics(orgId, projectId),
    prisma.auditEvent.findMany({
      where: { organizationId: orgId, projectId, createdAt: { gte: since, lte: until } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, actorName: true, eventType: true, description: true, createdAt: true },
    }),
    prisma.rAIDItem.findMany({
      where: { organizationId: orgId, projectId },
      select: { id: true, type: true, title: true, severity: true, status: true, owner: true, dueDate: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.decision.findMany({
      where: { organizationId: orgId, projectId },
      select: { id: true, description: true, status: true, loggedDate: true, loggedBy: true, impact: true },
      orderBy: { loggedDate: 'desc' },
    }),
    prisma.evidence.findMany({
      where: { organizationId: orgId, deliverableExecution: { subSectionExecution: { focusAreaExecution: { projectId } } } },
      select: { id: true, name: true, type: true, verified: true, uploadedAt: true, uploadedBy: true },
      orderBy: { uploadedAt: 'desc' },
      take: 50,
    }),
  ])

  if (!project) return []

  const allDeliverables = project.focusAreaExecutions.flatMap((fa) =>
    fa.subSections.flatMap((ss) => ss.deliverables)
  )
  const total = allDeliverables.length
  const closed = allDeliverables.filter((d) => d.status === 'closed').length
  const readinessPct = total === 0 ? 0 : Math.round((closed / total) * 100)

  if (reportType === 'executive_summary') {
    return [
      { type: 'executive_overview', title: 'Executive Overview', sortOrder: 0, content: {
        projectName: project.name,
        projectStatus: project.status,
        templateName: project.template?.name ?? null,
        startDate: project.startDate,
        targetDate: project.targetDate,
        readinessPct,
        totalDeliverables: total,
        closedDeliverables: closed,
        openRisks: raidItems.filter((r) => r.status !== 'closed' && r.type === 'risk').length,
        criticalRisks: raidItems.filter((r) => r.status !== 'closed' && r.severity === 'critical').length,
        periodStart: since,
        periodEnd: until,
      }},
      { type: 'readiness_summary', title: 'Readiness Summary', sortOrder: 1, content: {
        overallPct: analytics.readiness.overallPct,
        byFocusArea: analytics.readiness.byFocusArea,
        byPhase: analytics.readiness.byPhase,
      }},
      { type: 'key_risks', title: 'Key Risks & Issues', sortOrder: 2, content: {
        items: raidItems.filter((r) => r.status !== 'closed'),
      }},
      { type: 'decisions', title: 'Key Decisions', sortOrder: 3, content: { decisions }},
      { type: 'evidence_summary', title: 'Evidence Summary', sortOrder: 4, content: {
        totalEvidence: evidenceItems.length,
        verifiedEvidence: evidenceItems.filter((e) => e.verified).length,
        recentItems: evidenceItems.slice(0, 10),
      }},
    ]
  }

  // detailed_activities
  return [
    { type: 'project_status', title: 'Project Status', sortOrder: 0, content: {
      projectName: project.name,
      projectStatus: project.status,
      readinessPct,
      totalDeliverables: total,
      closedDeliverables: closed,
      periodStart: since,
      periodEnd: until,
    }},
    { type: 'deliverables_detail', title: 'Deliverable Activities', sortOrder: 1, content: {
      byFocusArea: project.focusAreaExecutions.map((fa) => ({
        name: fa.name,
        code: fa.code,
        subSections: fa.subSections.map((ss) => ({
          name: ss.name,
          deliverables: ss.deliverables,
        })),
      })),
    }},
    { type: 'raid_detail', title: 'RAID Log', sortOrder: 2, content: { items: raidItems }},
    { type: 'decisions_detail', title: 'Decisions', sortOrder: 3, content: { decisions }},
    { type: 'evidence_detail', title: 'Evidence Log', sortOrder: 4, content: { items: evidenceItems }},
    { type: 'activity_log', title: 'Activity Log', sortOrder: 5, content: {
      events: recentActivity,
      periodStart: since,
      periodEnd: until,
    }},
  ]
}

// ── Server Actions ────────────────────────────────────────────────────────────

export async function createReport(input: CreateReportInput): Promise<ActionResult<{ id: string }>> {
  const orgId = await getOrgId()
  if (!orgId) return { ok: false, error: 'Unauthorized' }

  const actorName = await getActorName()

  const project = await prisma.project.findUnique({ where: { id: input.projectId }, select: { organizationId: true } })
  if (!project || project.organizationId !== orgId) return { ok: false, error: 'Project not found' }

  const sections = await buildSections(orgId, input.projectId, input.reportType, input.periodStart, input.periodEnd)

  const report = await prisma.report.create({
    data: {
      organizationId: orgId,
      projectId: input.projectId,
      title: input.title,
      reportType: input.reportType,
      createdBy: actorName,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      sections: {
        create: sections.map((s) => ({
          type: s.type,
          title: s.title,
          sortOrder: s.sortOrder,
          content: s.content as object,
        })),
      },
    },
  })

  await prisma.auditEvent.create({
    data: {
      organizationId: orgId,
      projectId: input.projectId,
      actorName,
      eventType: 'report.created',
      description: `Report "${input.title}" created`,
    },
  })

  return { ok: true, data: { id: report.id } }
}

export async function updateSectionComment(
  sectionId: string,
  input: UpdateSectionInput
): Promise<ActionResult<void>> {
  const orgId = await getOrgId()
  if (!orgId) return { ok: false, error: 'Unauthorized' }

  const section = await prisma.reportSection.findUnique({
    where: { id: sectionId },
    include: { report: { select: { organizationId: true } } },
  })
  if (!section || section.report.organizationId !== orgId) return { ok: false, error: 'Not found' }

  await prisma.reportSection.update({
    where: { id: sectionId },
    data: { comment: input.comment },
  })

  return { ok: true, data: undefined }
}

export async function publishReport(reportId: string): Promise<ActionResult<{ shareToken: string }>> {
  const orgId = await getOrgId()
  if (!orgId) return { ok: false, error: 'Unauthorized' }

  const actorName = await getActorName()

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { organizationId: true, projectId: true, title: true, shareToken: true, status: true },
  })
  if (!report || report.organizationId !== orgId) return { ok: false, error: 'Not found' }
  if (report.status === 'published') return { ok: true, data: { shareToken: report.shareToken! } }

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: { status: 'published', publishedAt: new Date() },
    select: { shareToken: true },
  })

  await prisma.auditEvent.create({
    data: {
      organizationId: orgId,
      projectId: report.projectId,
      actorName,
      eventType: 'report.published',
      description: `Report "${report.title}" published`,
    },
  })

  return { ok: true, data: { shareToken: updated.shareToken! } }
}

export async function unpublishReport(reportId: string): Promise<ActionResult<void>> {
  const orgId = await getOrgId()
  if (!orgId) return { ok: false, error: 'Unauthorized' }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { organizationId: true },
  })
  if (!report || report.organizationId !== orgId) return { ok: false, error: 'Not found' }

  await prisma.report.update({
    where: { id: reportId },
    data: { status: 'draft', publishedAt: null },
  })

  return { ok: true, data: undefined }
}

export async function deleteReport(reportId: string): Promise<ActionResult<void>> {
  const orgId = await getOrgId()
  if (!orgId) return { ok: false, error: 'Unauthorized' }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { organizationId: true },
  })
  if (!report || report.organizationId !== orgId) return { ok: false, error: 'Not found' }

  await prisma.report.delete({ where: { id: reportId } })
  return { ok: true, data: undefined }
}

export async function logReportAccess(
  reportId: string,
  meta: { accessedBy?: string; ipAddress?: string; userAgent?: string }
): Promise<void> {
  await prisma.reportAccess.create({
    data: { reportId, ...meta },
  })
}
