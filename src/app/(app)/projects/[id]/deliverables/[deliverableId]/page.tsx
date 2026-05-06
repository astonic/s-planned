import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DeliverableDetail } from './_components/DeliverableDetail'
import { canAccessProject } from '@/lib/project-access'

interface Props {
  params: Promise<{ id: string; deliverableId: string }>
}

export default async function DeliverableDetailPage({ params }: Props) {
  const { deliverableId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.currentOrganizationId) notFound()

  const orgId = session.currentOrganizationId

  const deliverable = await prisma.deliverableExecution.findUnique({
    where: { id: deliverableId },
    include: {
      subSectionExecution: {
        include: {
          focusAreaExecution: {
            include: {
              project: {
                select: { id: true, name: true, organizationId: true },
              },
            },
          },
        },
      },
      owner: true,
      peopleLinks: { include: { person: true } },
      vendorLinks: { include: { vendor: true } },
    },
  })

  if (!deliverable) notFound()

  const project = deliverable.subSectionExecution.focusAreaExecution.project

  // Tenant check
  if (project.organizationId !== orgId) notFound()
  const hasProjectAccess = await canAccessProject({
    orgId,
    userId: session.user.id,
    role: session.role ?? 'viewer',
    projectId: project.id,
  })
  if (!hasProjectAccess) notFound()

  const [
    linkedRAID,
    projectRAID,
    orgPeople,
    orgVendors,
    auditEventRows,
    auditEventTypes,
    evidenceItems,
    criteriaCompletions,
    templateCriteria,
    evidenceRequirements,
    noteRows,
  ] = await Promise.all([
    prisma.rAIDItemDeliverable.findMany({
      where: { deliverableExecutionId: deliverableId },
      include: {
        raidItem: {
          select: { id: true, type: true, title: true, severity: true, status: true },
        },
      },
    }),
    prisma.rAIDItem.findMany({
      where: { projectId: project.id },
      select: { id: true, type: true, title: true, severity: true, status: true },
    }),
    prisma.person.findMany({
      where: { organizationId: orgId },
      orderBy: { name: 'asc' },
    }),
    prisma.vendor.findMany({
      where: { organizationId: orgId },
      orderBy: { name: 'asc' },
    }),
    prisma.auditEvent.findMany({
      where: {
        organizationId: orgId,
        deliverableExecutionId: deliverableId,
      },
      orderBy: { createdAt: 'desc' },
      take: 21,
      select: {
        id: true,
        actorName: true,
        eventType: true,
        description: true,
        createdAt: true,
      },
    }),
    prisma.auditEvent.findMany({
      where: {
        organizationId: orgId,
        deliverableExecutionId: deliverableId,
      },
      distinct: ['eventType'],
      select: { eventType: true },
      orderBy: { eventType: 'asc' },
    }),
    prisma.evidence.findMany({
      where: { deliverableExecutionId: deliverableId, organizationId: orgId },
      orderBy: { uploadedAt: 'desc' },
    }),
    prisma.criteriaCompletion.findMany({
      where: { deliverableExecutionId: deliverableId, organizationId: orgId },
    }),
    prisma.acceptanceCriteria.findMany({
      where: {
        OR: [
          { deliverableExecutionId: deliverable.id },
          ...(deliverable.templateDeliverableId ? [{ deliverableTemplateId: deliverable.templateDeliverableId }] : []),
        ],
      },
      orderBy: { id: 'asc' },
    }),
    prisma.evidenceRequirement.findMany({
      where: {
        OR: [
          { deliverableExecutionId: deliverable.id },
          ...(deliverable.templateDeliverableId ? [{ deliverableTemplateId: deliverable.templateDeliverableId }] : []),
        ],
      },
      orderBy: { id: 'asc' },
    }),
    prisma.deliverableNote.findMany({
      where: { deliverableExecutionId: deliverableId, organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, text: true, authorName: true, createdAt: true },
    }),
  ])

  const auditEvents = auditEventRows.slice(0, 20)
  const auditEventsHasMore = auditEventRows.length > 20

  // Shape criteria with completions merged in
  const criteriaWithCompletions = templateCriteria.map((c) => {
    const comp = criteriaCompletions.find((cc) => cc.acceptanceCriteriaId === c.id)
    return {
      id: c.id,
      description: c.description,
      verificationMethod: c.verificationMethod,
      completion: comp
        ? { completed: comp.completed, completedAt: comp.completedAt, completedBy: comp.completedBy }
        : null,
    }
  })

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={deliverable.name}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'var(--sp-page-bg)',
        color: 'var(--sp-page-fg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: 56,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '0 24px',
          borderBottom: '1px solid var(--sp-gray-200)',
          background: 'var(--sp-surface)',
          boxShadow: 'var(--sp-shadow-1)',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ color: 'var(--sp-gray-600)', fontSize: 12, fontWeight: 700, letterSpacing: 0.4 }}>
            Projects / {project.name} / Deliverables
          </div>
          <div style={{ color: 'var(--sp-page-fg)', fontSize: 16, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {deliverable.name}
          </div>
        </div>
        <Link
          href={`/projects/${project.id}?tab=deliverables`}
          aria-label="Close deliverable details"
          style={{
            width: 36,
            height: 36,
            borderRadius: 4,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--sp-gray-600)',
            textDecoration: 'none',
            border: '1px solid var(--sp-gray-200)',
            background: 'var(--sp-surface)',
            fontSize: 22,
            lineHeight: 1,
          }}
        >
          X
        </Link>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 'clamp(20px, 3vw, 40px)' }}>
        <DeliverableDetail
          deliverable={deliverable}
          projectId={project.id}
          linkedRAID={linkedRAID}
          projectRAID={projectRAID}
          orgPeople={orgPeople}
          orgVendors={orgVendors}
          auditEvents={auditEvents}
          auditEventsHasMore={auditEventsHasMore}
          auditEventTypes={auditEventTypes.map((t) => t.eventType)}
          evidenceItems={evidenceItems}
          evidenceRequirements={evidenceRequirements}
          criteria={criteriaWithCompletions}
          deliverableNotes={noteRows}
        />
      </div>
    </div>
  )
}
