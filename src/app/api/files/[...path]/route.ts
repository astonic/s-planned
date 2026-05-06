import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'

const STORAGE_ROOT = process.env.STORAGE_PATH ?? path.join(/*turbopackIgnore: true*/ process.cwd(), 'uploads')

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

// Types that browsers can display inline
const INLINE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'])

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const orgId = session.currentOrganizationId
  const filePath = pathSegments.join('/')

  // Verify the file is scoped to the caller's org (first path segment = orgId)
  if (!filePath.startsWith(orgId + '/')) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Prevent path traversal
  const root = path.resolve(STORAGE_ROOT)
  const absPath = path.resolve(root, filePath)
  const relativePath = path.relative(root, absPath)
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  let buffer: Buffer
  try {
    buffer = await fs.readFile(absPath)
  } catch {
    return new NextResponse('Not Found', { status: 404 })
  }

  const ext = path.extname(absPath).toLowerCase()
  const contentType = EXT_MIME[ext] ?? 'application/octet-stream'
  const filename = path.basename(absPath)
  const disposition = INLINE_TYPES.has(contentType) ? 'inline' : `attachment; filename="${filename}"`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(buffer.byteLength),
      'Content-Disposition': disposition,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
