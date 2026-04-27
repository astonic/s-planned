'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { withTenant } from '@/lib/tenant-context'
import { requireAuth } from '@/lib/security'
import { assertProjectAccess } from '@/lib/project-access'
import { deliverProjectNotification } from '@/lib/notification-delivery'
import type { ProjectNotificationChannel } from '@prisma/client'

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export type ProjectNotificationSuggestion = {
  id: string
  generatedKey: string
  kind: string
  title: string
  reason: string
  recipientType: 'person' | 'vendor' | 'team'
  recipientId: string | null
  recipientName: string
  recipientEmail: string | null
  recipientPhone: string | null
  subject: string
  body: string
  channels: ProjectNotificationChannel[]
  createdAt: string
  status: 'suggested' | 'sent' | 'dismissed'
}

const sendSchema = z.object({
  generatedKey: z.string().min(1),
  kind: z.string().min(1),
  channel: z.enum(['email', 'whatsapp']),
  recipientType: z.string().min(1),
  recipientId: z.string().nullable(),
  recipientName: z.string().min(1),
  recipientEmail: z.string().nullable(),
  recipientPhone: z.string().nullable(),
  subject: z.string().min(1),
  body: z.string().min(1),
})

const dismissSchema = z.object({
  generatedKey: z.string().min(1),
  kind: z.string().min(1),
  recipientType: z.string().min(1),
  recipientId: z.string().nullable(),
  recipientName: z.string().min(1),
  recipientEmail: z.string().nullable(),
  recipientPhone: z.string().nullable(),
  subject: z.string().min(1),
  body: z.string().min(1),
})

function fmtDate(d: Date | null) {
  if (!d) return 'No date'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function channelsFor(email: string | null, phone: string | null, emailEnabled: boolean): ProjectNotificationChannel[] {
  return [
    ...(email && emailEnabled ? ['email' as const] : []),
    ...(phone ? ['whatsapp' as const] : []),
  ]
}

async function assertProject(orgId: string, userId: string, role: string, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId, organizationId: orgId },
    select: { id: true, name: true, organizationId: true },
  })
  if (!project) throw new Error('Project not found')
  await assertProjectAccess({ orgId, userId, role: role as any, projectId })
  return project
}

export async function getProjectNotificationSuggestions(projectId: string): Promise<ProjectNotificationSuggestion[]> {
  const auth = await requireAuth('viewer')
  const project = await assertProject(auth.orgId, auth.userId, auth.role, projectId)
  const now = new Date()
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const since = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

  const [deliverables, raidItems, recentEvents, recorded, notificationSettings] = await Promise.all([
    prisma.deliverableExecution.findMany({
      where: {
        organizationId: auth.orgId,
        status: { not: 'closed' },
        targetDate: { lte: inSevenDays },
        subSectionExecution: { focusAreaExecution: { projectId } },
      },
      orderBy: { targetDate: 'asc' },
      take: 12,
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        targetDate: true,
        owner: { select: { id: true, name: true, email: true, phone: true } },
      },
    }),
    prisma.rAIDItem.findMany({
      where: {
        organizationId: auth.orgId,
        projectId,
        status: { not: 'closed' },
        severity: { in: ['critical', 'high'] },
        createdAt: { gte: since },
      },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
      take: 8,
      select: { id: true, title: true, severity: true, owner: true, dueDate: true, createdAt: true },
    }),
    prisma.auditEvent.findMany({
      where: { organizationId: auth.orgId, projectId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, eventType: true, description: true, createdAt: true },
    }),
    prisma.projectNotificationMessage.findMany({
      where: { organizationId: auth.orgId, projectId },
      select: { generatedKey: true, status: true },
    }),
    prisma.projectNotificationSettings.findUnique({
      where: { projectId },
      select: { notifyEmail: true, notifyReminders: true, notifyRaid: true, notifyDigest: true },
    }),
  ])

  const prefs = {
    notifyEmail: notificationSettings?.notifyEmail ?? true,
    notifyReminders: notificationSettings?.notifyReminders ?? true,
    notifyRaid: notificationSettings?.notifyRaid ?? true,
    notifyDigest: notificationSettings?.notifyDigest ?? false,
  }
  const blockedKeys = new Set(recorded.map((item) => item.generatedKey))
  const suggestions: ProjectNotificationSuggestion[] = []

  for (const d of prefs.notifyReminders ? deliverables : []) {
    if (!d.owner) continue
    const isOverdue = d.targetDate ? d.targetDate < now : false
    const kind = isOverdue ? 'deliverable_overdue' : 'deliverable_due_soon'
    const generatedKey = `${kind}:${d.id}:${d.owner.id}`
    if (blockedKeys.has(generatedKey)) continue

    suggestions.push({
      id: generatedKey,
      generatedKey,
      kind,
      title: isOverdue ? 'Overdue deliverable reminder' : 'Upcoming deliverable reminder',
      reason: `${d.code} is ${isOverdue ? 'overdue' : 'due soon'} (${fmtDate(d.targetDate)}).`,
      recipientType: 'person',
      recipientId: d.owner.id,
      recipientName: d.owner.name,
      recipientEmail: d.owner.email,
      recipientPhone: d.owner.phone,
      subject: `${project.name}: ${d.code} ${isOverdue ? 'is overdue' : 'is due soon'}`,
      body: `Hi ${d.owner.name},\n\n${d.name} (${d.code}) on ${project.name} is ${isOverdue ? 'overdue' : `due on ${fmtDate(d.targetDate)}`}.\n\nCurrent status: ${d.status.replace('_', ' ')}.\n\nPlease update the deliverable status, add evidence, or flag any blockers.`,
      channels: channelsFor(d.owner.email, d.owner.phone, prefs.notifyEmail),
      createdAt: now.toISOString(),
      status: 'suggested',
    })
  }

  const projectPeople = await prisma.person.findMany({
    where: {
      organizationId: auth.orgId,
      OR: [
        { ownedDeliverables: { some: { subSectionExecution: { focusAreaExecution: { projectId } } } } },
        { deliverableLinks: { some: { deliverableExecution: { subSectionExecution: { focusAreaExecution: { projectId } } } } } },
      ],
    },
    select: { id: true, name: true, email: true, phone: true },
    take: 8,
  })
  const primaryPeople = projectPeople.filter((p) => p.email || p.phone).slice(0, 3)

  for (const raid of prefs.notifyRaid ? raidItems : []) {
    for (const person of primaryPeople) {
      const generatedKey = `raid_alert:${raid.id}:${person.id}`
      if (blockedKeys.has(generatedKey)) continue
      suggestions.push({
        id: generatedKey,
        generatedKey,
        kind: 'raid_alert',
        title: 'RAID alert',
        reason: `${raid.severity} RAID item was added recently.`,
        recipientType: 'person',
        recipientId: person.id,
        recipientName: person.name,
        recipientEmail: person.email,
        recipientPhone: person.phone,
        subject: `${project.name}: ${raid.severity} RAID item needs attention`,
        body: `Hi ${person.name},\n\nA ${raid.severity} RAID item was added on ${project.name}:\n\n${raid.title}\n\nDue: ${fmtDate(raid.dueDate)}\n\nPlease review and update mitigation or next steps where needed.`,
        channels: channelsFor(person.email, person.phone, prefs.notifyEmail),
        createdAt: raid.createdAt.toISOString(),
        status: 'suggested',
      })
    }
  }

  if (prefs.notifyDigest && recentEvents.length > 0) {
    const eventLines = recentEvents.slice(0, 5).map((event) => `- ${event.description}`).join('\n')
    for (const person of primaryPeople) {
      const generatedKey = `recent_changes:${projectId}:${person.id}:${recentEvents[0].id}`
      if (blockedKeys.has(generatedKey)) continue
      suggestions.push({
        id: generatedKey,
        generatedKey,
        kind: 'recent_changes',
        title: 'Recent project changes summary',
        reason: `${recentEvents.length} project change${recentEvents.length === 1 ? '' : 's'} in the last 3 days.`,
        recipientType: 'person',
        recipientId: person.id,
        recipientName: person.name,
        recipientEmail: person.email,
        recipientPhone: person.phone,
        subject: `${project.name}: recent changes summary`,
        body: `Hi ${person.name},\n\nHere are the latest changes on ${project.name}:\n\n${eventLines}\n\nPlease review anything that affects your deliverables or commitments.`,
        channels: channelsFor(person.email, person.phone, prefs.notifyEmail),
        createdAt: recentEvents[0].createdAt.toISOString(),
        status: 'suggested',
      })
    }
  }

  const history = await prisma.projectNotificationMessage.findMany({
    where: { organizationId: auth.orgId, projectId, status: { in: ['sent', 'dismissed'] } },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  })

  return [
    ...suggestions.filter((item) => item.channels.length > 0),
    ...history.map((item) => ({
      id: item.id,
      generatedKey: item.generatedKey,
      kind: item.kind,
      title: item.status === 'sent' ? 'Sent notification' : 'Deleted notification',
      reason: item.status === 'sent'
        ? `${item.channel} sent to ${item.recipientName}`
        : `Suggestion deleted for ${item.recipientName}`,
      recipientType: item.recipientType as 'person' | 'vendor' | 'team',
      recipientId: item.recipientId,
      recipientName: item.recipientName,
      recipientEmail: item.recipientEmail,
      recipientPhone: item.recipientPhone,
      subject: item.subject,
      body: item.body,
      channels: [item.channel],
      createdAt: (item.sentAt ?? item.dismissedAt ?? item.createdAt).toISOString(),
      status: item.status,
    })),
  ]
}

export async function dismissProjectNotificationSuggestion(
  projectId: string,
  input: z.infer<typeof dismissSchema>,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    await assertProject(auth.orgId, auth.userId, auth.role, projectId)
    const parsed = dismissSchema.parse(input)
    const recipientId = parsed.recipientId ?? '__none__'

    await withTenant(auth.orgId, async (tx) => {
      await tx.projectNotificationMessage.upsert({
        where: {
          projectId_generatedKey_channel_recipientType_recipientId: {
            projectId,
            generatedKey: parsed.generatedKey,
            channel: 'email',
            recipientType: parsed.recipientType,
            recipientId,
          },
        },
        create: {
          organizationId: auth.orgId,
          projectId,
          generatedKey: parsed.generatedKey,
          kind: parsed.kind,
          channel: 'email',
          status: 'dismissed',
          recipientType: parsed.recipientType,
          recipientId,
          recipientName: parsed.recipientName,
          recipientEmail: parsed.recipientEmail,
          recipientPhone: parsed.recipientPhone,
          subject: parsed.subject,
          body: parsed.body,
          dismissedAt: new Date(),
        },
        update: { status: 'dismissed', dismissedAt: new Date() },
      })
    })
    revalidatePath(`/projects/${projectId}`)
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function sendProjectNotification(
  projectId: string,
  input: z.infer<typeof sendSchema>,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth('member')
    await assertProject(auth.orgId, auth.userId, auth.role, projectId)
    const parsed = sendSchema.parse(input)
    const recipientId = parsed.recipientId ?? '__none__'

    const settings = await prisma.organizationSettings.findUnique({ where: { organizationId: auth.orgId } })
    await deliverProjectNotification({
      channel: parsed.channel,
      settings,
      toName: parsed.recipientName,
      toEmail: parsed.recipientEmail,
      toPhone: parsed.recipientPhone,
      subject: parsed.subject,
      body: parsed.body,
    })

    await withTenant(auth.orgId, async (tx) => {
      await tx.projectNotificationMessage.upsert({
        where: {
          projectId_generatedKey_channel_recipientType_recipientId: {
            projectId,
            generatedKey: parsed.generatedKey,
            channel: parsed.channel,
            recipientType: parsed.recipientType,
            recipientId,
          },
        },
        create: {
          organizationId: auth.orgId,
          projectId,
          generatedKey: parsed.generatedKey,
          kind: parsed.kind,
          channel: parsed.channel,
          status: 'sent',
          recipientType: parsed.recipientType,
          recipientId,
          recipientName: parsed.recipientName,
          recipientEmail: parsed.recipientEmail,
          recipientPhone: parsed.recipientPhone,
          subject: parsed.subject,
          body: parsed.body,
          sentAt: new Date(),
        },
        update: {
          status: 'sent',
          subject: parsed.subject,
          body: parsed.body,
          recipientEmail: parsed.recipientEmail,
          recipientPhone: parsed.recipientPhone,
          sentAt: new Date(),
        },
      })

      await tx.auditEvent.create({
        data: {
          organizationId: auth.orgId,
          projectId,
          actorName: auth.userName,
          eventType: 'project.notification.sent',
          description: `Sent ${parsed.channel} notification to ${parsed.recipientName}`,
          metadata: { kind: parsed.kind, generatedKey: parsed.generatedKey },
        },
      })
    })

    revalidatePath(`/projects/${projectId}`)
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
