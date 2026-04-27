'server-only'

import { generateObject } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'

// ── Output schema ─────────────────────────────────────────────────────────────

const SuggestionItemSchema = z.object({
  type: z.enum(['risk', 'action', 'insight']),
  priority: z.enum(['high', 'medium', 'low']),
  title: z.string().max(120),
  description: z.string(),
  actionType: z.enum(['send_reminder', 'request_evidence', 'create_raid']).nullable().optional(),
  actionPayload: z.record(z.unknown()).nullable().optional(),
})

const SuggestionOutputSchema = z.object({
  items: z.array(SuggestionItemSchema).min(1).max(12),
})

export type SuggestionItem = z.infer<typeof SuggestionItemSchema>
export type SuggestionItemType = SuggestionItem['type']
export type SuggestionPriority = SuggestionItem['priority']
export type SuggestionActionType = NonNullable<SuggestionItem['actionType']>

export interface SuggestionResult {
  model: string
  items: SuggestionItem[]
}

// ── Project context ───────────────────────────────────────────────────────────

export interface ProjectContext {
  projectName: string
  projectStatus: string
  readinessPct: number
  analyzeActivity: boolean
  analyzeDeliverables: boolean
  analyzeRaid: boolean
  analyzeDecisions: boolean
  analyzeNotes: boolean
  deliverables: {
    id: string
    code: string
    name: string
    status: string
    phase: string | null
    targetDate: Date | null
    ownerId: string | null
    ownerName: string | null
    domain: string | null
    notes: string | null
  }[]
  raidItems: {
    id: string
    type: string
    title: string
    severity: string
    status: string
    description: string | null
    dueDate: Date | null
    mitigationPlan: string | null
  }[]
  decisions: {
    description: string
    status: string
    loggedDate: Date
    loggedBy: string
    impact: string | null
  }[]
  recentActivity: {
    actorName: string
    eventType: string
    description: string
    createdAt: Date
  }[]
  deliverableNotes: {
    deliverableName: string
    text: string
    authorName: string
    createdAt: Date
  }[]
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(ctx: ProjectContext): string {
  const lines: string[] = [
    `Project: "${ctx.projectName}"`,
    `Status: ${ctx.projectStatus} | Readiness: ${ctx.readinessPct}%`,
    '',
  ]

  if (ctx.analyzeDeliverables && ctx.deliverables.length > 0) {
    const delayed = ctx.deliverables.filter((d) => d.status === 'delayed')
    const overdue = ctx.deliverables.filter(
      (d) => d.targetDate && d.status !== 'closed' && new Date(d.targetDate) < new Date()
    )
    const noOwner = ctx.deliverables.filter((d) => d.status !== 'closed' && !d.ownerId)
    lines.push('## Deliverables')
    lines.push(`Total: ${ctx.deliverables.length} | Delayed: ${delayed.length} | Overdue: ${overdue.length} | No owner: ${noOwner.length}`)
    delayed.slice(0, 10).forEach((d) =>
      lines.push(`  - DELAYED [${d.id}] ${d.code} ${d.name} (owner: ${d.ownerName ?? 'none'}, due: ${d.targetDate ? new Date(d.targetDate).toISOString().slice(0, 10) : 'none'})`)
    )
    overdue.slice(0, 10).forEach((d) =>
      lines.push(`  - OVERDUE [${d.id}] ${d.code} ${d.name} (owner: ${d.ownerName ?? 'none'}, due: ${new Date(d.targetDate!).toISOString().slice(0, 10)})`)
    )
    noOwner.slice(0, 5).forEach((d) =>
      lines.push(`  - NO_OWNER [${d.id}] ${d.code} ${d.name}`)
    )
    lines.push('')
  }

  if (ctx.analyzeRaid && ctx.raidItems.length > 0) {
    const open = ctx.raidItems.filter((r) => r.status !== 'closed')
    lines.push('## RAID Items (open)')
    lines.push(`Count: ${open.length}`)
    open.slice(0, 10).forEach((r) =>
      lines.push(`  - [${r.type}/${r.severity}] ${r.title}${r.dueDate ? ` due:${new Date(r.dueDate).toISOString().slice(0, 10)}` : ''}${r.mitigationPlan ? '' : ' NO-MITIGATION'}`)
    )
    lines.push('')
  }

  if (ctx.analyzeDecisions && ctx.decisions.length > 0) {
    const pending = ctx.decisions.filter((d) => d.status === 'pending')
    lines.push('## Pending Decisions')
    pending.slice(0, 5).forEach((d) =>
      lines.push(`  - ${d.description.slice(0, 120)} (by: ${d.loggedBy})`)
    )
    lines.push('')
  }

  if (ctx.analyzeActivity && ctx.recentActivity.length > 0) {
    lines.push('## Recent Activity')
    ctx.recentActivity.slice(0, 10).forEach((a) =>
      lines.push(`  - ${a.eventType}: ${a.description} (${a.actorName}, ${new Date(a.createdAt).toISOString().slice(0, 10)})`)
    )
    lines.push('')
  }

  if (ctx.analyzeNotes && ctx.deliverableNotes.length > 0) {
    lines.push('## Deliverable Notes')
    ctx.deliverableNotes.slice(0, 5).forEach((n) =>
      lines.push(`  - [${n.deliverableName}] "${n.text.slice(0, 150)}" — ${n.authorName}`)
    )
    lines.push('')
  }

  lines.push(`
Instructions:
- Produce 4–10 items analysing the project health above.
- For actionType "send_reminder": actionPayload = { deliverableId, deliverableName, suggestedMessage }
- For actionType "request_evidence": actionPayload = { deliverableId, deliverableName, suggestedMessage }
- For actionType "create_raid": actionPayload = { type: "risk"|"issue"|"assumption"|"dependency", title, description, severity: "low"|"medium"|"high"|"critical" }
- Only reference deliverable IDs that appear in the data above.
- Be specific. Do not invent data.`)

  return lines.join('\n')
}

// ── Provider factory ──────────────────────────────────────────────────────────

function createModel(provider: string, apiKey: string, model: string) {
  if (provider === 'openai') {
    return createOpenAI({ apiKey })(model)
  }
  // Default: anthropic
  return createAnthropic({ apiKey })(model)
}

// ── Generator ─────────────────────────────────────────────────────────────────

export async function generateSuggestions(
  provider: string,
  apiKey: string,
  model: string,
  ctx: ProjectContext,
): Promise<SuggestionResult> {
  const aiModel = createModel(provider, apiKey, model)
  const prompt = buildPrompt(ctx)

  const { object } = await generateObject({
    model: aiModel,
    schema: SuggestionOutputSchema,
    system: 'You are a project readiness advisor. Analyse the project data provided and return structured suggestions.',
    prompt,
  })

  return { model, items: object.items }
}
