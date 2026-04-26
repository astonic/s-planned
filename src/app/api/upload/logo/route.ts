import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { storageService } from '@/lib/storage'
import { prisma } from '@/lib/db'
import path from 'path'

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const membership = await prisma.organizationMembership.findFirst({
    where: {
      organizationId: session.currentOrganizationId,
      userId: session.user.id,
      role: { in: ['owner', 'admin'] },
    },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const orgId = session.currentOrganizationId

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Image must be under 2 MB' }, { status: 413 })
  }

  const ext = ALLOWED_MIME_TYPES[file.type]
  if (!ext) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP, or GIF allowed' }, { status: 415 })
  }

  const storagePath = `logos/${orgId}/logo.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    // Delete old logos with other extensions to avoid stale files
    for (const otherExt of Object.values(ALLOWED_MIME_TYPES)) {
      if (otherExt !== ext) {
        await storageService.delete(`logos/${orgId}/logo.${otherExt}`).catch(() => {/* ok */})
      }
    }

    const result = await storageService.upload(buffer, storagePath)

    await prisma.organization.update({
      where: { id: orgId },
      data: { logoUrl: result.url },
    })

    return NextResponse.json({ url: result.url })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const membership = await prisma.organizationMembership.findFirst({
    where: {
      organizationId: session.currentOrganizationId,
      userId: session.user.id,
      role: { in: ['owner', 'admin'] },
    },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const orgId = session.currentOrganizationId

  for (const ext of Object.values(ALLOWED_MIME_TYPES)) {
    await storageService.delete(`logos/${orgId}/logo.${ext}`).catch(() => {/* ok */})
  }

  await prisma.organization.update({
    where: { id: orgId },
    data: { logoUrl: null },
  })

  return NextResponse.json({ ok: true })
}
