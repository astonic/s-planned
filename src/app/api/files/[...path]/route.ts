import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'

const STORAGE_ROOT = process.env.STORAGE_PATH ?? path.join(process.cwd(), 'uploads')

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const orgId = session.currentOrganizationId
  const filePath = params.path.join('/')

  // Verify the file is scoped to the caller's org (first path segment = orgId)
  if (!filePath.startsWith(orgId + '/')) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Prevent path traversal
  const absPath = path.resolve(STORAGE_ROOT, filePath)
  if (!absPath.startsWith(path.resolve(STORAGE_ROOT))) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const buffer = await fs.readFile(absPath)
    const ext = path.extname(absPath).toLowerCase()
    const contentType = EXT_MIME[ext] ?? 'application/octet-stream'
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch {
    return new NextResponse('Not Found', { status: 404 })
  }
}

const EXT_MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
}
