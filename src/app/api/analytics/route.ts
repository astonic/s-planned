import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { buildAnalytics } from '@/lib/analytics'
import { projectAccessWhere } from '@/lib/project-access'
import type { UserRole } from '@/lib/security'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const orgId = session.currentOrganizationId
  const role = (session.role ?? 'viewer') as UserRole
  const projectId = req.nextUrl.searchParams.get('projectId') ?? 'all'

  const projects = await prisma.project.findMany({
    where: projectAccessWhere({ orgId, userId: session.user.id, role }),
    select: { id: true },
  })
  const accessibleProjectIds = projects.map((project) => project.id)

  if (projectId !== 'all' && !accessibleProjectIds.includes(projectId)) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const data = await buildAnalytics(orgId, projectId, accessibleProjectIds)
  return NextResponse.json(data)
}
