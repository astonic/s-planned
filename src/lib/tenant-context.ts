import type { Prisma } from '@prisma/client'
import { prisma } from './db'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function withTenant<T>(
  organizationId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  if (!UUID_RE.test(organizationId)) {
    throw new Error(`Invalid organizationId: ${organizationId}`)
  }

  return prisma.$transaction((tx: Prisma.TransactionClient) => {
    return tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${organizationId}, true)`.then(() => fn(tx))
  })
}
