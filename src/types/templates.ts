// Shared types for the template editor — mirroring the Prisma schema shape

export interface AcceptanceCriteriaItem {
  id: string
  description: string
  verificationMethod: string | null
}

export interface EvidenceRequirementItem {
  id: string
  name: string
  type: string | null
  description: string | null
  required: boolean
}

export interface DeliverableTemplate {
  id: string
  code: string
  name: string
  description: string | null
  phase: string | null
  domain: string | null
  estimatedDuration: number | null
  order: number
  acceptanceCriteria: AcceptanceCriteriaItem[]
  evidenceRequirements: EvidenceRequirementItem[]
}

export interface SubSection {
  id: string
  code: string
  name: string
  order: number
  deliverables: DeliverableTemplate[]
}

export interface FocusArea {
  id: string
  code: string
  name: string
  order: number
  subSections: SubSection[]
}

export interface TemplateWithHierarchy {
  id: string
  name: string
  description: string | null
  industry: string | null
  version: string
  organizationId: string
  focusAreas: FocusArea[]
}
