'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { withTenant } from '@/lib/tenant-context'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

async function requireSession() {
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) redirect('/login')
  return session
}

// ── Validation schemas ────────────────────────────────────────────────────────

const personTypeEnum = z.enum(['internal', 'contractor', 'consultant'])
const personRoleEnum = z.enum(['owner', 'team', 'end_user'])
const vendorTypeEnum = z.enum(['supplier', 'service_provider'])

const createPersonSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: personTypeEnum,
  company: z.string().optional(),
  role: personRoleEnum,
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

const updatePersonSchema = createPersonSchema.partial()

const createVendorSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  type: vendorTypeEnum,
  contactName: z.string().optional(),
  contactRole: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
})

const updateVendorSchema = createVendorSchema.partial()

// ── Person CRUD ───────────────────────────────────────────────────────────────

export async function createPerson(
  data: z.infer<typeof createPersonSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession()
    const parsed = createPersonSchema.parse(data)
    const orgId = session.currentOrganizationId

    const person = await withTenant(orgId, async (tx) => {
      const created = await tx.person.create({
        data: {
          organizationId: orgId,
          name: parsed.name,
          type: parsed.type,
          company: parsed.company ?? null,
          role: parsed.role,
          email: parsed.email || null,
          phone: parsed.phone ?? null,
          notes: parsed.notes ?? null,
        },
      })

      await tx.auditEvent.create({
        data: {
          organizationId: orgId,
          actorName: session.user.name,
          eventType: 'stakeholder.person.created',
          description: `Created person "${created.name}"`,
          metadata: { personId: created.id, type: created.type, role: created.role },
        },
      })

      return created
    })

    revalidatePath('/stakeholders')
    return { ok: true, data: { id: person.id } }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to create person' }
  }
}

export async function updatePerson(
  personId: string,
  data: z.infer<typeof updatePersonSchema>
): Promise<ActionResult> {
  try {
    const session = await requireSession()
    const parsed = updatePersonSchema.parse(data)
    const orgId = session.currentOrganizationId

    await withTenant(orgId, async (tx) => {
      const existing = await tx.person.findUnique({
        where: { id: personId, organizationId: orgId },
        select: { id: true, name: true },
      })
      if (!existing) throw new Error('Person not found')

      await tx.person.update({
        where: { id: personId },
        data: {
          ...(parsed.name && { name: parsed.name }),
          ...(parsed.type && { type: parsed.type }),
          ...(parsed.company !== undefined && { company: parsed.company || null }),
          ...(parsed.role && { role: parsed.role }),
          ...(parsed.email !== undefined && { email: parsed.email || null }),
          ...(parsed.phone !== undefined && { phone: parsed.phone || null }),
          ...(parsed.notes !== undefined && { notes: parsed.notes || null }),
        },
      })

      await tx.auditEvent.create({
        data: {
          organizationId: orgId,
          actorName: session.user.name,
          eventType: 'stakeholder.person.updated',
          description: `Updated person "${existing.name}"`,
          metadata: { personId, changes: parsed },
        },
      })
    })

    revalidatePath('/stakeholders')
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to update person' }
  }
}

export async function deletePerson(personId: string): Promise<ActionResult> {
  try {
    const session = await requireSession()
    const orgId = session.currentOrganizationId

    await withTenant(orgId, async (tx) => {
      const existing = await tx.person.findUnique({
        where: { id: personId, organizationId: orgId },
        select: { id: true, name: true },
      })
      if (!existing) throw new Error('Person not found')

      await tx.auditEvent.create({
        data: {
          organizationId: orgId,
          actorName: session.user.name,
          eventType: 'stakeholder.person.deleted',
          description: `Deleted person "${existing.name}"`,
          metadata: { personId },
        },
      })

      await tx.person.delete({ where: { id: personId } })
    })

    revalidatePath('/stakeholders')
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to delete person' }
  }
}

// ── Vendor CRUD ───────────────────────────────────────────────────────────────

export async function createVendor(
  data: z.infer<typeof createVendorSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession()
    const parsed = createVendorSchema.parse(data)
    const orgId = session.currentOrganizationId

    const vendor = await withTenant(orgId, async (tx) => {
      const created = await tx.vendor.create({
        data: {
          organizationId: orgId,
          name: parsed.name,
          type: parsed.type,
          contactName: parsed.contactName ?? null,
          contactRole: parsed.contactRole ?? null,
          email: parsed.email || null,
          phone: parsed.phone ?? null,
          address: parsed.address ?? null,
          website: parsed.website || null,
          notes: parsed.notes ?? null,
        },
      })

      await tx.auditEvent.create({
        data: {
          organizationId: orgId,
          actorName: session.user.name,
          eventType: 'stakeholder.vendor.created',
          description: `Created vendor "${created.name}"`,
          metadata: { vendorId: created.id, type: created.type },
        },
      })

      return created
    })

    revalidatePath('/stakeholders')
    return { ok: true, data: { id: vendor.id } }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to create vendor' }
  }
}

export async function updateVendor(
  vendorId: string,
  data: z.infer<typeof updateVendorSchema>
): Promise<ActionResult> {
  try {
    const session = await requireSession()
    const parsed = updateVendorSchema.parse(data)
    const orgId = session.currentOrganizationId

    await withTenant(orgId, async (tx) => {
      const existing = await tx.vendor.findUnique({
        where: { id: vendorId, organizationId: orgId },
        select: { id: true, name: true },
      })
      if (!existing) throw new Error('Vendor not found')

      await tx.vendor.update({
        where: { id: vendorId },
        data: {
          ...(parsed.name && { name: parsed.name }),
          ...(parsed.type && { type: parsed.type }),
          ...(parsed.contactName !== undefined && { contactName: parsed.contactName || null }),
          ...(parsed.contactRole !== undefined && { contactRole: parsed.contactRole || null }),
          ...(parsed.email !== undefined && { email: parsed.email || null }),
          ...(parsed.phone !== undefined && { phone: parsed.phone || null }),
          ...(parsed.address !== undefined && { address: parsed.address || null }),
          ...(parsed.website !== undefined && { website: parsed.website || null }),
          ...(parsed.notes !== undefined && { notes: parsed.notes || null }),
        },
      })

      await tx.auditEvent.create({
        data: {
          organizationId: orgId,
          actorName: session.user.name,
          eventType: 'stakeholder.vendor.updated',
          description: `Updated vendor "${existing.name}"`,
          metadata: { vendorId, changes: parsed },
        },
      })
    })

    revalidatePath('/stakeholders')
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to update vendor' }
  }
}

export async function deleteVendor(vendorId: string): Promise<ActionResult> {
  try {
    const session = await requireSession()
    const orgId = session.currentOrganizationId

    await withTenant(orgId, async (tx) => {
      const existing = await tx.vendor.findUnique({
        where: { id: vendorId, organizationId: orgId },
        select: { id: true, name: true },
      })
      if (!existing) throw new Error('Vendor not found')

      await tx.auditEvent.create({
        data: {
          organizationId: orgId,
          actorName: session.user.name,
          eventType: 'stakeholder.vendor.deleted',
          description: `Deleted vendor "${existing.name}"`,
          metadata: { vendorId },
        },
      })

      await tx.vendor.delete({ where: { id: vendorId } })
    })

    revalidatePath('/stakeholders')
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to delete vendor' }
  }
}

// ── Deliverable linking ───────────────────────────────────────────────────────

export async function linkPersonToDeliverable(
  deliverableExecutionId: string,
  personId: string
): Promise<ActionResult> {
  try {
    const session = await requireSession()
    const orgId = session.currentOrganizationId

    await withTenant(orgId, async (tx) => {
      const [deliverable, person] = await Promise.all([
        tx.deliverableExecution.findUnique({
          where: { id: deliverableExecutionId, organizationId: orgId },
          select: {
            id: true,
            name: true,
            subSectionExecution: {
              select: {
                focusAreaExecution: {
                  select: { projectId: true },
                },
              },
            },
          },
        }),
        tx.person.findUnique({
          where: { id: personId, organizationId: orgId },
          select: { id: true, name: true },
        }),
      ])
      if (!deliverable) throw new Error('Deliverable not found')
      if (!person) throw new Error('Person not found')

      await tx.deliverableExecutionPerson.upsert({
        where: { deliverableExecutionId_personId: { deliverableExecutionId, personId } },
        create: { deliverableExecutionId, personId },
        update: {},
      })

      await tx.auditEvent.create({
        data: {
          organizationId: orgId,
          projectId: deliverable.subSectionExecution.focusAreaExecution.projectId,
          deliverableExecutionId,
          actorName: session.user.name,
          eventType: 'stakeholder.person.linked',
          description: `Linked person "${person.name}" to deliverable "${deliverable.name}"`,
          metadata: { personId, deliverableExecutionId },
        },
      })
    })

    revalidatePath('/', 'layout')
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to link person' }
  }
}

export async function unlinkPersonFromDeliverable(
  deliverableExecutionId: string,
  personId: string
): Promise<ActionResult> {
  try {
    const session = await requireSession()
    const orgId = session.currentOrganizationId

    await withTenant(orgId, async (tx) => {
      const [deliverable, person] = await Promise.all([
        tx.deliverableExecution.findUnique({
          where: { id: deliverableExecutionId, organizationId: orgId },
          select: {
            id: true,
            name: true,
            subSectionExecution: {
              select: {
                focusAreaExecution: {
                  select: { projectId: true },
                },
              },
            },
          },
        }),
        tx.person.findUnique({
          where: { id: personId, organizationId: orgId },
          select: { id: true, name: true },
        }),
      ])
      if (!deliverable) throw new Error('Deliverable not found')
      if (!person) throw new Error('Person not found')

      await tx.deliverableExecutionPerson.deleteMany({
        where: { deliverableExecutionId, personId },
      })

      await tx.auditEvent.create({
        data: {
          organizationId: orgId,
          projectId: deliverable.subSectionExecution.focusAreaExecution.projectId,
          deliverableExecutionId,
          actorName: session.user.name,
          eventType: 'stakeholder.person.unlinked',
          description: `Unlinked person "${person.name}" from deliverable "${deliverable.name}"`,
          metadata: { personId, deliverableExecutionId },
        },
      })
    })

    revalidatePath('/', 'layout')
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to unlink person' }
  }
}

export async function setDeliverableOwner(
  deliverableExecutionId: string,
  personId: string | null
): Promise<ActionResult> {
  try {
    const session = await requireSession()
    const orgId = session.currentOrganizationId

    await withTenant(orgId, async (tx) => {
      const existing = await tx.deliverableExecution.findUnique({
        where: { id: deliverableExecutionId, organizationId: orgId },
        select: {
          id: true,
          name: true,
          owner: { select: { id: true, name: true } },
          subSectionExecution: {
            select: {
              focusAreaExecution: {
                select: { projectId: true },
              },
            },
          },
        },
      })
      if (!existing) throw new Error('Deliverable not found')

      let newOwnerName: string | null = null
      if (personId) {
        const owner = await tx.person.findUnique({
          where: { id: personId, organizationId: orgId },
          select: { name: true },
        })
        if (!owner) throw new Error('Person not found')
        newOwnerName = owner.name
      }

      await tx.deliverableExecution.update({
        where: { id: deliverableExecutionId, organizationId: orgId },
        data: { ownerId: personId },
      })

      await tx.auditEvent.create({
        data: {
          organizationId: orgId,
          projectId: existing.subSectionExecution.focusAreaExecution.projectId,
          deliverableExecutionId,
          actorName: session.user.name,
          eventType: 'stakeholder.owner.changed',
          description: personId
            ? `Set owner of deliverable "${existing.name}" to "${newOwnerName}"`
            : `Cleared owner on deliverable "${existing.name}"`,
          metadata: {
            previousOwnerId: existing.owner?.id ?? null,
            nextOwnerId: personId,
          },
        },
      })
    })

    revalidatePath('/', 'layout')
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to set owner' }
  }
}

export async function linkVendorToDeliverable(
  deliverableExecutionId: string,
  vendorId: string
): Promise<ActionResult> {
  try {
    const session = await requireSession()
    const orgId = session.currentOrganizationId

    await withTenant(orgId, async (tx) => {
      const [deliverable, vendor] = await Promise.all([
        tx.deliverableExecution.findUnique({
          where: { id: deliverableExecutionId, organizationId: orgId },
          select: {
            id: true,
            name: true,
            subSectionExecution: {
              select: {
                focusAreaExecution: {
                  select: { projectId: true },
                },
              },
            },
          },
        }),
        tx.vendor.findUnique({
          where: { id: vendorId, organizationId: orgId },
          select: { id: true, name: true },
        }),
      ])
      if (!deliverable) throw new Error('Deliverable not found')
      if (!vendor) throw new Error('Vendor not found')

      await tx.deliverableExecutionVendor.upsert({
        where: { deliverableExecutionId_vendorId: { deliverableExecutionId, vendorId } },
        create: { deliverableExecutionId, vendorId },
        update: {},
      })

      await tx.auditEvent.create({
        data: {
          organizationId: orgId,
          projectId: deliverable.subSectionExecution.focusAreaExecution.projectId,
          deliverableExecutionId,
          actorName: session.user.name,
          eventType: 'stakeholder.vendor.linked',
          description: `Linked vendor "${vendor.name}" to deliverable "${deliverable.name}"`,
          metadata: { vendorId, deliverableExecutionId },
        },
      })
    })

    revalidatePath('/', 'layout')
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to link vendor' }
  }
}

export async function unlinkVendorFromDeliverable(
  deliverableExecutionId: string,
  vendorId: string
): Promise<ActionResult> {
  try {
    const session = await requireSession()
    const orgId = session.currentOrganizationId

    await withTenant(orgId, async (tx) => {
      const [deliverable, vendor] = await Promise.all([
        tx.deliverableExecution.findUnique({
          where: { id: deliverableExecutionId, organizationId: orgId },
          select: {
            id: true,
            name: true,
            subSectionExecution: {
              select: {
                focusAreaExecution: {
                  select: { projectId: true },
                },
              },
            },
          },
        }),
        tx.vendor.findUnique({
          where: { id: vendorId, organizationId: orgId },
          select: { id: true, name: true },
        }),
      ])
      if (!deliverable) throw new Error('Deliverable not found')
      if (!vendor) throw new Error('Vendor not found')

      await tx.deliverableExecutionVendor.deleteMany({
        where: { deliverableExecutionId, vendorId },
      })

      await tx.auditEvent.create({
        data: {
          organizationId: orgId,
          projectId: deliverable.subSectionExecution.focusAreaExecution.projectId,
          deliverableExecutionId,
          actorName: session.user.name,
          eventType: 'stakeholder.vendor.unlinked',
          description: `Unlinked vendor "${vendor.name}" from deliverable "${deliverable.name}"`,
          metadata: { vendorId, deliverableExecutionId },
        },
      })
    })

    revalidatePath('/', 'layout')
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to unlink vendor' }
  }
}
