import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding dev data…')

  const passwordHash = await bcrypt.hash('password123', 12)

  const existingUser = await prisma.user.findUnique({ where: { email: 'admin@example.com' } })

  if (!existingUser) {
    const user = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        passwordHash,
      },
    })

    const org = await prisma.organization.create({
      data: {
        name: 'Example Mining Co',
        slug: 'example-mining-co',
      },
    })

    await prisma.organizationMembership.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: 'owner',
      },
    })

    console.log('Created user admin@example.com (password: password123)')
    console.log('Created org: Example Mining Co')
  } else {
    console.log('Seed data already exists — skipping')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
