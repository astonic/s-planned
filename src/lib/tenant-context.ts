import type { Prisma } from '@prisma/client'
import { prisma } from './db'

export async function withTenant<T>(
  organizationId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction((tx: Prisma.TransactionClient) => {
    return tx.$executeRaw`SET LOCAL app.current_tenant_id = ${organizationId}`.then(() => fn(tx))
  })
}
