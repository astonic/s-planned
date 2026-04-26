import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { storageService } from '@/lib/storage'
import path from 'path'

// Allowed MIME types and their corresponding EvidenceType
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'document',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/vnd.ms-excel': 'document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document',
  'text/plain': 'document',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orgId = session.currentOrganizationId

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  const deliverableId = formData.get('deliverableId')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (typeof deliverableId !== 'string' || !deliverableId) {
    return NextResponse.json({ error: 'deliverableId required' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File exceeds 50 MB limit' }, { status: 413 })
  }

  const mimeType = file.type
  if (!ALLOWED_MIME_TYPES[mimeType]) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 415 })
  }

  // Sanitize filename — strip directory components, keep extension
  const originalName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, '_')
  const timestamp = Date.now()
  const storagePath = `${orgId}/${deliverableId}/${timestamp}-${originalName}`

  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const result = await storageService.upload(buffer, storagePath)
    return NextResponse.json({
      url: result.url,
      name: file.name,
      fileSize: result.fileSize,
      type: ALLOWED_MIME_TYPES[mimeType],
    })
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
