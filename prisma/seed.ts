import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding dev data…')

  const hash = (pw: string) => bcrypt.hash(pw, 12)

  let org = await prisma.organization.findUnique({ where: { slug: 'example-mining-co' } })
  if (!org) {
    org = await prisma.organization.create({
      data: { name: 'Example Mining Co', slug: 'example-mining-co' },
    })
    console.log('Created org: Example Mining Co')
  }

  const accounts = [
    { name: 'Admin User',  email: 'admin@example.com',  role: 'owner'  as const },
    { name: 'Member User', email: 'member@example.com', role: 'member' as const },
    { name: 'Viewer User', email: 'viewer@example.com', role: 'viewer' as const },
  ]

  for (const { name, email, role } of accounts) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (!existing) {
      const user = await prisma.user.create({
        data: { name, email, passwordHash: await hash('password123') },
      })
      await prisma.organizationMembership.create({
        data: { userId: user.id, organizationId: org.id, role },
      })
      console.log(`Created ${role}: ${email} / password123`)
    }
  }

  console.log('Seed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
