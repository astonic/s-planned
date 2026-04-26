import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { AnalyticsData } from '@/app/(app)/analytics/_components/AnalyticsTabs'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const orgId = session.currentOrganizationId
  const projectId = req.nextUrl.searchParams.get('projectId') ?? 'all'

  const data = await buildAnalytics(orgId, projectId)
  return NextResponse.json(data)
}

export async function buildAnalytics(orgId: string, projectId: string): Promise<AnalyticsData> {
  const projectFilter = projectId !== 'all' ? { projectId } : {}
  const today = new Date()

  // ── Deliverables ────────────────────────────────────────────────────────────
  const deliverables = await prisma.deliverableExecution.findMany({
    where: { organizationId: orgId, ...projectFilter },
    select: {
      id: true, status: true, phase: true, targetDate: true,
      subSectionExecution: { select: { focusAreaExecution: { select: { name: true, code: true } } } },
    },
  })

  const totalDeliverables = deliverables.length
  const closedDeliverables = deliverables.filter((d) => d.status === 'closed').length
  const overallPct = totalDeliverables === 0 ? 0 : Math.round((closedDeliverables / totalDeliverables) * 100)

  // Focus area readiness
  const faMap = new Map<string, { name: string; code: string; total: number; closed: number }>()
  for (const d of deliverables) {
    const fa = d.subSectionExecution.focusAreaExecution
    const key = fa.code
    const cur = faMap.get(key) ?? { name: fa.name, code: key, total: 0, closed: 0 }
    cur.total++
    if (d.status === 'closed') cur.closed++
    faMap.set(key, cur)
  }
  const byFocusAreaReadiness = Array.from(faMap.values()).map((fa) => ({ ...fa, pct: fa.total === 0 ? 0 : Math.round((fa.closed / fa.total) * 100) }))

  // Phase readiness
  const phases = ['pre_commissioning', 'commissioning', 'ramp_up', 'handover'] as const
  const byPhase = phases.map((phase) => {
    const phaseDels = deliverables.filter((d) => d.phase === phase)
    const total = phaseDels.length
    const closed = phaseDels.filter((d) => d.status === 'closed').length
    return { phase, label: phase, total, closed, pct: total === 0 ? 0 : Math.round((closed / total) * 100) }
  })

  // Status breakdown
  const statusCounts = new Map<string, number>()
  for (const d of deliverables) { statusCounts.set(d.status, (statusCounts.get(d.status) ?? 0) + 1) }
  const byStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count }))

  // Focus area deliverable breakdown
  const faDelMap = new Map<string, { name: string; code: string; planned: number; in_progress: number; delayed: number; closed: number }>()
  for (const d of deliverables) {
    const fa = d.subSectionExecution.focusAreaExecution
    const key = fa.code
    const cur = faDelMap.get(key) ?? { name: fa.name, code: key, planned: 0, in_progress: 0, delayed: 0, closed: 0 }
    if (d.status === 'planned') cur.planned++
    else if (d.status === 'in_progress') cur.in_progress++
    else if (d.status === 'delayed') cur.delayed++
    else if (d.status === 'closed') cur.closed++
    faDelMap.set(key, cur)
  }
  const byFocusAreaDel = Array.from(faDelMap.values())

  // Overdue & delayed counts
  const totalOverdue = deliverables.filter((d) => d.targetDate && d.targetDate < today && d.status !== 'closed').length
  const totalDelayed = deliverables.filter((d) => d.status === 'delayed').length

  // Trend: last 8 weeks of audit events (deliverable.status_changed with 'closed')
  const eightWeeksAgo = new Date(today.getTime() - 56 * 24 * 60 * 60 * 1000)
  const closeEvents = await prisma.auditEvent.findMany({
    where: {
      organizationId: orgId,
      eventType: 'deliverable.status_changed',
      createdAt: { gte: eightWeeksAgo },
      description: { contains: 'closed' },
      ...(projectId !== 'all' ? { projectId } : {}),
    },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  // Bucket by week
  const weekMap = new Map<string, number>()
  for (const e of closeEvents) {
    const d = new Date(e.createdAt)
    const weekStart = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay())
    const key = weekStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    weekMap.set(key, (weekMap.get(key) ?? 0) + 1)
  }
  const trend = Array.from(weekMap.entries()).map(([date, closed]) => ({ date, closed, total: totalDeliverables }))

  // ── RAID ────────────────────────────────────────────────────────────────────
  const raidItems = await prisma.rAIDItem.findMany({
    where: { organizationId: orgId, ...projectFilter },
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
    const isOpen = r.status !== 'closed'
    if (isOpen) {
      openCount++
      raidSevMap.set(r.severity, (raidSevMap.get(r.severity) ?? 0) + 1)
      if (r.severity === 'critical') criticalOpenCount++
      if (r.dueDate && r.dueDate < today) overdueCount++
    }
  }

  const byRaidType = Array.from(raidTypeMap.entries()).map(([type, count]) => ({ type, count }))
  const byRaidSeverity = Array.from(raidSevMap.entries()).map(([severity, count]) => ({ severity, count }))
  const byRaidStatus = Array.from(raidStatusMap.entries()).map(([status, count]) => ({ status, count }))

  // ── Team ────────────────────────────────────────────────────────────────────
  const [people, vendors, actorActivity] = await Promise.all([
    prisma.person.findMany({
      where: { organizationId: orgId },
      select: { type: true },
    }),
    prisma.vendor.findMany({
      where: { organizationId: orgId },
      select: { type: true },
    }),
    prisma.auditEvent.groupBy({
      by: ['actorName'],
      where: { organizationId: orgId, ...(projectId !== 'all' ? { projectId } : {}) },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ])

  const personTypeMap = new Map<string, number>()
  for (const p of people) { personTypeMap.set(p.type, (personTypeMap.get(p.type) ?? 0) + 1) }
  const byPersonType = Array.from(personTypeMap.entries()).map(([type, count]) => ({ type, count }))

  const vendorTypeMap = new Map<string, number>()
  for (const v of vendors) { vendorTypeMap.set(v.type, (vendorTypeMap.get(v.type) ?? 0) + 1) }
  const byVendorType = Array.from(vendorTypeMap.entries()).map(([type, count]) => ({ type, count }))

  const topPeople = actorActivity.map((a) => ({ name: a.actorName, eventCount: a._count.id }))

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
      byType: byRaidType,
      bySeverity: byRaidSeverity,
      byStatus: byRaidStatus,
      openCount,
      criticalOpenCount,
      overdueCount,
    },
    team: {
      byPersonType,
      byVendorType,
      topPeople,
      totalPeople: people.length,
      totalVendors: vendors.length,
    },
  }
}
