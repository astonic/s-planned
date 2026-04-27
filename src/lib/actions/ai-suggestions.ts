'use server'

import { prisma } from '@/lib/db'
import { withTenant } from '@/lib/tenant-context'
import { requireAuth } from '@/lib/security'
import { assertProjectAccess } from '@/lib/project-access'
import { generateSuggestions, type ProjectContext } from '@/lib/ai-suggestions'
import type { ActionResult } from './projects'
import { Prisma } from '@prisma/client'

const PROMPT_VERSION = '1'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AISuggestionItemRow {
  id: string
  type: string
  priority: string
  title: string
  description: string
  actionType: string | null
  actionPayload: Record<string, unknown> | null
  dismissed: boolean
  executedAt: Date | null
  executedBy: string | null
}

export interface AISuggestionRow {
  id: string
  model: string
  createdAt: Date
  items: AISuggestionItemRow[]
}

// ── Rate limit check ──────────────────────────────────────────────────────────

async function checkAndIncrementRefreshLimit(
  orgId: string,
  projectId: string,
  limit: number,
): Promise<{ allowed: boolean; used: number; max: number }> {
  const today = new Date().toISOString().slice(0, 10)

  const log = await prisma.aIRefreshLog.upsert({
    where: { projectId_date: { projectId, date: today } },
    create: { organizationId: orgId, projectId, date: today, count: 0 },
    update: {},
  })

  if (log.count >= limit) {
    return { allowed: false, used: log.count, max: limit }
  }

  await prisma.aIRefreshLog.update({
    where: { projectId_date: { projectId, date: today } },
    data: { count: { increment: 1 } },
  })

  return { allowed: true, used: log.count + 1, max: limit }
}

// ── Generate ──────────────────────────────────────────────────────────────────

export async function generateProjectSuggestions(
  projectId: string,
): Promise<ActionResult<AISuggestionRow>> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    const settings = await prisma.organizationSettings.findUnique({
      where: { organizationId: orgId },
    })

    if (!settings?.aiEnabled) {
      return { ok: false, error: 'AI suggestions are not enabled. Configure them in Settings → AI.' }
    }
    if (!settings.aiApiKey) {
      return { ok: false, error: 'No AI API key configured. Add one in Settings → AI.' }
    }

    const rateCheck = await checkAndIncrementRefreshLimit(orgId, projectId, settings.aiDailyRefreshLimit)
    if (!rateCheck.allowed) {
      return { ok: false, error: `Daily refresh limit reached (${rateCheck.max}/day). Try again tomorrow.` }
    }

    const project = await withTenant(orgId, async (tx) => {
      await assertProjectAccess({ orgId, userId: auth.userId, role: auth.role, projectId }, tx)

      return tx.project.findUnique({
        where: { id: projectId, organizationId: orgId },
        include: {
          focusAreaExecutions: {
            include: {
              subSections: {
                include: {
                  deliverables: {
                    include: {
                      owner: { select: { id: true, name: true } },
                      deliverableNotes: {
                        orderBy: { createdAt: 'desc' },
                        take: 3,
                        select: { text: true, authorName: true, createdAt: true },
                      },
                    },
                  },
                },
              },
            },
          },
          raidItems: {
            where: { status: { not: 'closed' } },
            orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
            take: 20,
          },
          decisions: {
            orderBy: { loggedDate: 'desc' },
            take: 10,
          },
          auditEvents: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { actorName: true, eventType: true, description: true, createdAt: true },
          },
        },
      })
    })

    if (!project) return { ok: false, error: 'Project not found' }

    const allDeliverables = project.focusAreaExecutions.flatMap((fa) =>
      fa.subSections.flatMap((ss) => ss.deliverables)
    )
    const totalDeliverables = allDeliverables.length
    const closedDeliverables = allDeliverables.filter((d) => d.status === 'closed').length

    const ctx: ProjectContext = {
      projectName: project.name,
      projectStatus: project.status,
      readinessPct: totalDeliverables === 0 ? 0 : Math.round((closedDeliverables / totalDeliverables) * 100),
      analyzeActivity: settings.aiAnalyzeActivity,
      analyzeDeliverables: settings.aiAnalyzeDeliverables,
      analyzeRaid: settings.aiAnalyzeRaid,
      analyzeDecisions: settings.aiAnalyzeDecisions,
      analyzeNotes: settings.aiAnalyzeNotes,
      deliverables: allDeliverables.map((d) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        status: d.status,
        phase: d.phase,
        targetDate: d.targetDate,
        ownerId: d.ownerId,
        ownerName: d.owner?.name ?? null,
        domain: d.domain,
        notes: d.deliverableNotes.map((n) => n.text).join(' | ') || null,
      })),
      raidItems: project.raidItems.map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        severity: r.severity,
        status: r.status,
        description: r.description,
        dueDate: r.dueDate,
        mitigationPlan: r.mitigationPlan,
      })),
      decisions: project.decisions.map((d) => ({
        description: d.description,
        status: d.status,
        loggedDate: d.loggedDate,
        loggedBy: d.loggedBy,
        impact: d.impact,
      })),
      recentActivity: project.auditEvents.map((a) => ({
        actorName: a.actorName,
        eventType: a.eventType,
        description: a.description,
        createdAt: a.createdAt,
      })),
      deliverableNotes: allDeliverables.flatMap((d) =>
        d.deliverableNotes.map((n) => ({
          deliverableName: d.name,
          text: n.text,
          authorName: n.authorName,
          createdAt: n.createdAt,
        }))
      ),
    }

    const result = await generateSuggestions(settings.aiProvider, settings.aiApiKey, settings.aiModel, ctx)

    const suggestion = await withTenant(orgId, async (tx) => {
      const created = await tx.aISuggestion.create({
        data: {
          organizationId: orgId,
          projectId,
          model: result.model,
          promptVersion: PROMPT_VERSION,
          items: {
            create: result.items.map((item) => ({
              type: item.type,
              priority: item.priority,
              title: item.title,
              description: item.description,
              actionType: item.actionType ?? null,
              actionPayload: item.actionPayload != null ? (item.actionPayload as Prisma.InputJsonValue) : Prisma.JsonNull,
            })),
          },
        },
      })

      const items = await tx.aISuggestionItem.findMany({
        where: { suggestionId: created.id },
        orderBy: [{ priority: 'asc' }, { type: 'asc' }],
      })

      await tx.auditEvent.create({
        data: {
          organizationId: orgId,
          projectId,
          actorName: auth.userName,
          eventType: 'ai.suggestions.generated',
          description: `Generated ${result.items.length} AI suggestions for "${project.name}"`,
          metadata: { model: result.model, itemCount: result.items.length },
        },
      })

      return { ...created, items }
    })

    return {
      ok: true,
      data: {
        id: suggestion.id,
        model: suggestion.model,
        createdAt: suggestion.createdAt,
        items: suggestion.items.map((item) => ({
          id: item.id,
          type: item.type,
          priority: item.priority,
          title: item.title,
          description: item.description,
          actionType: item.actionType,
          actionPayload: item.actionPayload as Record<string, unknown> | null,
          dismissed: item.dismissed,
          executedAt: item.executedAt,
          executedBy: item.executedBy,
        })),
      },
    }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ── Load latest ───────────────────────────────────────────────────────────────

export async function getLatestAISuggestion(
  projectId: string,
): Promise<ActionResult<AISuggestionRow | null>> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    const suggestion = await prisma.aISuggestion.findFirst({
      where: { projectId, organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      include: { items: { orderBy: [{ priority: 'asc' }, { type: 'asc' }] } },
    })

    if (!suggestion) return { ok: true, data: null }

    return {
      ok: true,
      data: {
        id: suggestion.id,
        model: suggestion.model,
        createdAt: suggestion.createdAt,
        items: suggestion.items.map((item) => ({
          id: item.id,
          type: item.type,
          priority: item.priority,
          title: item.title,
          description: item.description,
          actionType: item.actionType,
          actionPayload: item.actionPayload as Record<string, unknown> | null,
          dismissed: item.dismissed,
          executedAt: item.executedAt,
          executedBy: item.executedBy,
        })),
      },
    }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ── Dismiss ───────────────────────────────────────────────────────────────────

export async function dismissSuggestionItem(itemId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    const item = await prisma.aISuggestionItem.findFirst({
      where: { id: itemId, suggestion: { organizationId: orgId } },
    })
    if (!item) return { ok: false, error: 'Item not found' }

    await prisma.aISuggestionItem.update({
      where: { id: itemId },
      data: { dismissed: true },
    })

    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ── Execute action ────────────────────────────────────────────────────────────

export async function executeAISuggestionAction(
  itemId: string,
): Promise<ActionResult<{ message: string }>> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    const item = await prisma.aISuggestionItem.findFirst({
      where: { id: itemId, suggestion: { organizationId: orgId } },
      include: { suggestion: { select: { projectId: true } } },
    })
    if (!item) return { ok: false, error: 'Item not found' }
    if (item.executedAt) return { ok: false, error: 'Action already executed' }

    const payload = item.actionPayload as Record<string, unknown> | null
    const projectId = item.suggestion.projectId
    let resultMessage = ''

    await withTenant(orgId, async (tx) => {
      if (item.actionType === 'send_reminder' || item.actionType === 'request_evidence') {
        const deliverableId = payload?.deliverableId as string | undefined
        const suggestedMessage = payload?.suggestedMessage as string | undefined
        const deliverableName = payload?.deliverableName as string | undefined

        if (deliverableId) {
          await tx.deliverableNote.create({
            data: {
              organizationId: orgId,
              deliverableExecutionId: deliverableId,
              text: suggestedMessage ?? `AI-suggested ${item.actionType === 'send_reminder' ? 'reminder' : 'evidence request'}: ${item.title}`,
              authorName: auth.userName,
            },
          })
        }

        await tx.auditEvent.create({
          data: {
            organizationId: orgId,
            projectId,
            actorName: auth.userName,
            eventType: `ai.action.${item.actionType}`,
            description: `${item.actionType === 'send_reminder' ? 'Sent reminder' : 'Requested evidence'} for "${deliverableName ?? 'deliverable'}"`,
          },
        })
        resultMessage = `${item.actionType === 'send_reminder' ? 'Reminder' : 'Evidence request'} note added to deliverable.`
      }

      if (item.actionType === 'create_raid') {
        const raidType = (payload?.type as string) || 'risk'
        const raidTitle = (payload?.title as string) || item.title
        const raidDesc = (payload?.description as string) || item.description
        const raidSeverity = (payload?.severity as string) || 'medium'

        await tx.rAIDItem.create({
          data: {
            organizationId: orgId,
            projectId,
            type: raidType as 'risk' | 'assumption' | 'issue' | 'dependency',
            title: raidTitle,
            description: raidDesc,
            severity: raidSeverity as 'low' | 'medium' | 'high' | 'critical',
            status: 'open',
          },
        })

        await tx.auditEvent.create({
          data: {
            organizationId: orgId,
            projectId,
            actorName: auth.userName,
            eventType: 'ai.action.create_raid',
            description: `Created RAID item "${raidTitle}" from AI suggestion`,
          },
        })
        resultMessage = `RAID item "${raidTitle}" created successfully.`
      }

      await tx.aISuggestionItem.update({
        where: { id: itemId },
        data: { executedAt: new Date(), executedBy: auth.userName },
      })
    })

    return { ok: true, data: { message: resultMessage || 'Action executed.' } }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// ── Daily refresh count ───────────────────────────────────────────────────────

export async function getAIRefreshStatus(
  projectId: string,
): Promise<ActionResult<{ used: number; max: number; aiEnabled: boolean }>> {
  try {
    const auth = await requireAuth('member')
    const orgId = auth.orgId

    const [settings, log] = await Promise.all([
      prisma.organizationSettings.findUnique({
        where: { organizationId: orgId },
        select: { aiEnabled: true, aiDailyRefreshLimit: true },
      }),
      prisma.aIRefreshLog.findUnique({
        where: { projectId_date: { projectId, date: new Date().toISOString().slice(0, 10) } },
        select: { count: true },
      }),
    ])

    return {
      ok: true,
      data: {
        aiEnabled: settings?.aiEnabled ?? false,
        used: log?.count ?? 0,
        max: settings?.aiDailyRefreshLimit ?? 10,
      },
    }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
