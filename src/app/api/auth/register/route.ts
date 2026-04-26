import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { generateSlug } from '@/lib/slugify'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const existingOrgs = await prisma.organization.findMany({ select: { slug: true } })
  const existingSlugs = existingOrgs.map((o: { slug: string }) => o.slug)
  const orgName = `${name}'s Organization`
  const slug = generateSlug(orgName, existingSlugs)

  await prisma.$transaction(async (tx: import('@prisma/client').Prisma.TransactionClient) => {
    const user = await tx.user.create({
      data: { name, email, passwordHash },
    })

    const org = await tx.organization.create({
      data: { name: orgName, slug },
    })

    await tx.organizationMembership.create({
      data: { userId: user.id, organizationId: org.id, role: 'owner' },
    })
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
