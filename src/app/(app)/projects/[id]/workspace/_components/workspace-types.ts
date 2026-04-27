import type {
  Project,
  FocusAreaExecution,
  SubSectionExecution,
  DeliverableExecution,
  DeliverableStatus,
  Person,
} from '@prisma/client'

export type DeliverableWithOwner = DeliverableExecution & {
  owner?: Pick<Person, 'id' | 'name'> | null
}

export type SubSectionWithDeliverables = SubSectionExecution & {
  deliverables: DeliverableWithOwner[]
}

export type FocusAreaWithAll = FocusAreaExecution & {
  subSections: SubSectionWithDeliverables[]
}

export type ProjectWorkspaceData = Project & {
  focusAreaExecutions: FocusAreaWithAll[]
}

export function flatDeliverables(focusAreas: FocusAreaWithAll[]): DeliverableWithOwner[] {
  return focusAreas.flatMap((fa) => fa.subSections.flatMap((ss) => ss.deliverables))
}

export function dateMs(value: Date | string | null | undefined): number {
  if (!value) return 0
  return value instanceof Date ? value.getTime() : new Date(value).getTime()
}

export function fmt(value: Date | string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function pctForStatus(status: DeliverableStatus): number {
  if (status === 'closed') return 100
  if (status === 'in_progress') return 50
  if (status === 'delayed') return 25
  return 0
}

export const STATUS_COLORS: Record<DeliverableStatus, string> = {
  planned: '#605E5C',
  in_progress: '#5B0E91',
  delayed: '#C4314B',
  closed: '#107C10',
}

export const STATUS_LABELS: Record<DeliverableStatus, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  delayed: 'Delayed',
  closed: 'Closed',
}
