import { prisma } from '@/lib/db'
import type { AnalyticsData } from '@/app/(app)/analytics/_components/AnalyticsTabs'
import type { Prisma } from '@prisma/client'

function projectIdsForAnalytics(projectId: string, scopedProjectIds?: string[]) {
  if (projectId !== 'all') return [projectId]
  return scopedProjectIds
}

function deliverableProjectWhere(projectIds?: string[]): Prisma.DeliverableExecutionWhereInput {
  return projectIds
    ? { subSectionExecution: { focusAreaExecution: { projectId: { in: projectIds } } } }
    : {}
}

function auditProjectWhere(projectIds?: string[]): Prisma.AuditEventWhereInput {
  return projectIds ? { projectId: { in: projectIds } } : {}
}

function raidProjectWhere(projectIds?: string[]): Prisma.RAIDItemWhereInput {
  return projectIds ? { projectId: { in: projectIds } } : {}
}

function personProjectWhere(projectIds?: string[]): Prisma.PersonWhereInput {
  return projectIds
    ? {
        OR: [
          {
            deliverableLinks: {
              some: {
                deliverableExecution: {
                  subSectionExecution: { focusAreaExecution: { projectId: { in: projectIds } } },
                },
              },
            },
          },
          {
            ownedDeliverables: {
              some: {
                subSectionExecution: { focusAreaExecution: { projectId: { in: projectIds } } },
              },
            },
          },
        ],
      }
    : {}
}

function vendorProjectWhere(projectIds?: string[]): Prisma.VendorWhereInput {
  return projectIds
    ? {
        deliverableLinks: {
          some: {
            deliverableExecution: {
              subSectionExecution: { focusAreaExecution: { projectId: { in: projectIds } } },
            },
          },
        },
      }
    : {}
}

function emptyAnalytics(): AnalyticsData {
  return {
    readiness: {
      overallPct: 0,
      totalDeliverables: 0,
      closedDeliverables: 0,
      byFocusArea: [],
      byPhase: [
        { phase: 'pre_commissioning', label: 'pre_commissioning', total: 0, closed: 0, pct: 0 },
        { phase: 'commissioning', label: 'commissioning', total: 0, closed: 0, pct: 0 },
        { phase: 'ramp_up', label: 'ramp_up', total: 0, closed: 0, pct: 0 },
        { phase: 'handover', label: 'handover', total: 0, closed: 0, pct: 0 },
      ],
    },
    deliverables: { byStatus: [], byFocusArea: [], trend: [], totalOverdue: 0, totalDelayed: 0 },
    raid: { byType: [], bySeverity: [], byStatus: [], openCount: 0, criticalOpenCount: 0, overdueCount: 0 },
    team: { byPersonType: [], byVendorType: [], topPeople: [], totalPeople: 0, totalVendors: 0 },
  }
}

export async function buildAnalytics(orgId: string, projectId: string, scopedProjectIds?: string[]): Promise<AnalyticsData> {
  const projectIds = projectIdsForAnalytics(projectId, scopedProjectIds)
  if (projectIds && projectIds.length === 0) return emptyAnalytics()

  const deliverableFilter = deliverableProjectWhere(projectIds)
  const auditFilter = auditProjectWhere(projectIds)
  const raidFilter = raidProjectWhere(projectIds)
  const today = new Date()

  const deliverables = await prisma.deliverableExecution.findMany({
    where: { organizationId: orgId, ...deliverableFilter },
    select: {
      id: true,
      status: true,
      phase: true,
      targetDate: true,
      subSectionExecution: { select: { focusAreaExecution: { select: { name: true, code: true } } } },
    },
  })

  const totalDeliverables = deliverables.length
  const closedDeliverables = deliverables.filter((d) => d.status === 'closed').length
  const overallPct = totalDeliverables === 0 ? 0 : Math.round((closedDeliverables / totalDeliverables) * 100)

  const faMap = new Map<string, { name: string; code: string; total: number; closed: number }>()
  for (const d of deliverables) {
    const fa = d.subSectionExecution.focusAreaExecution
    const cur = faMap.get(fa.code) ?? { name: fa.name, code: fa.code, total: 0, closed: 0 }
    cur.total++
    if (d.status === 'closed') cur.closed++
    faMap.set(fa.code, cur)
  }
  const byFocusAreaReadiness = Array.from(faMap.values()).map((fa) => ({
    ...fa,
    pct: fa.total === 0 ? 0 : Math.round((fa.closed / fa.total) * 100),
  }))

  const phases = ['pre_commissioning', 'commissioning', 'ramp_up', 'handover'] as const
  const byPhase = phases.map((phase) => {
    const phaseDels = deliverables.filter((d) => d.phase === phase)
    const total = phaseDels.length
    const closed = phaseDels.filter((d) => d.status === 'closed').length
    return { phase, label: phase, total, closed, pct: total === 0 ? 0 : Math.round((closed / total) * 100) }
  })

  const statusCounts = new Map<string, number>()
  for (const d of deliverables) statusCounts.set(d.status, (statusCounts.get(d.status) ?? 0) + 1)
  const byStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count }))

  const faDelMap = new Map<string, { name: string; code: string; planned: number; in_progress: number; delayed: number; closed: number }>()
  for (const d of deliverables) {
    const fa = d.subSectionExecution.focusAreaExecution
    const cur = faDelMap.get(fa.code) ?? { name: fa.name, code: fa.code, planned: 0, in_progress: 0, delayed: 0, closed: 0 }
    if (d.status === 'planned') cur.planned++
    else if (d.status === 'in_progress') cur.in_progress++
    else if (d.status === 'delayed') cur.delayed++
    else if (d.status === 'closed') cur.closed++
    faDelMap.set(fa.code, cur)
  }
  const byFocusAreaDel = Array.from(faDelMap.values())

  const totalOverdue = deliverables.filter((d) => d.targetDate && d.targetDate < today && d.status !== 'closed').length
  const totalDelayed = deliverables.filter((d) => d.status === 'delayed').length

  const eightWeeksAgo = new Date(today.getTime() - 56 * 24 * 60 * 60 * 1000)
  const closeEvents = await prisma.auditEvent.findMany({
    where: {
      organizationId: orgId,
      eventType: 'deliverable.status_changed',
      createdAt: { gte: eightWeeksAgo },
      description: { contains: 'closed' },
      ...auditFilter,
    },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  const weekMap = new Map<string, number>()
  for (const e of closeEvents) {
    const d = new Date(e.createdAt)
    const weekStart = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay())
    const key = weekStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    weekMap.set(key, (weekMap.get(key) ?? 0) + 1)
  }
  const trend = Array.from(weekMap.entries()).map(([date, closed]) => ({ date, closed, total: totalDeliverables }))

  const raidItems = await prisma.rAIDItem.findMany({
    where: { organizationId: orgId, ...raidFilter },
    select: { type: true, severity: true, status: true, dueDate: true },
  })

  const raidTypeMap = new Map<string, number>()
  const raidSevMap = new Map<string, number>()
  const raidStatusMap = new Map<string, number>()
  let openCount = 0
  let criticalOpenCount = 0
  let overdueCount = 0

  for (const r of raidItems) {
    raidTypeMap.set(r.type, (raidTypeMap.get(r.type) ?? 0) + 1)
    raidStatusMap.set(r.status, (raidStatusMap.get(r.status) ?? 0) + 1)
    if (r.status !== 'closed') {
      openCount++
      raidSevMap.set(r.severity, (raidSevMap.get(r.severity) ?? 0) + 1)
      if (r.severity === 'critical') criticalOpenCount++
      if (r.dueDate && r.dueDate < today) overdueCount++
    }
  }

  const [people, vendors, actorActivity] = await Promise.all([
    prisma.person.findMany({ where: { organizationId: orgId, ...personProjectWhere(projectIds) }, select: { type: true } }),
    prisma.vendor.findMany({ where: { organizationId: orgId, ...vendorProjectWhere(projectIds) }, select: { type: true } }),
    prisma.auditEvent.groupBy({
      by: ['actorName'],
      where: { organizationId: orgId, ...auditFilter },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ])

  const personTypeMap = new Map<string, number>()
  for (const p of people) personTypeMap.set(p.type, (personTypeMap.get(p.type) ?? 0) + 1)

  const vendorTypeMap = new Map<string, number>()
  for (const v of vendors) vendorTypeMap.set(v.type, (vendorTypeMap.get(v.type) ?? 0) + 1)

  return {
    readiness: {
      overallPct,
      totalDeliverables,
      closedDeliverables,
      byFocusArea: byFocusAreaReadiness,
      byPhase,
    },
    deliverables: {
      byStatus,
      byFocusArea: byFocusAreaDel,
      trend,
      totalOverdue,
      totalDelayed,
    },
    raid: {
      byType: Array.from(raidTypeMap.entries()).map(([type, count]) => ({ type, count })),
      bySeverity: Array.from(raidSevMap.entries()).map(([severity, count]) => ({ severity, count })),
      byStatus: Array.from(raidStatusMap.entries()).map(([status, count]) => ({ status, count })),
      openCount,
      criticalOpenCount,
      overdueCount,
    },
    team: {
      byPersonType: Array.from(personTypeMap.entries()).map(([type, count]) => ({ type, count })),
      byVendorType: Array.from(vendorTypeMap.entries()).map(([type, count]) => ({ type, count })),
      topPeople: actorActivity.map((a) => ({ name: a.actorName, eventCount: a._count.id })),
      totalPeople: people.length,
      totalVendors: vendors.length,
    },
  }
}
