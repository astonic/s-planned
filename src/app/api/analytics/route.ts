import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { buildAnalytics } from '@/lib/analytics'

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
