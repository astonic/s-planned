-- CreateEnum
CREATE TYPE "ProjectPhase" AS ENUM ('pre_commissioning', 'commissioning', 'ramp_up', 'handover');

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "industry" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "focus_areas" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "focus_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_sections" (
    "id" TEXT NOT NULL,
    "focusAreaId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_templates" (
    "id" TEXT NOT NULL,
    "subSectionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "phase" "ProjectPhase",
    "domain" TEXT,
    "estimatedDuration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliverable_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acceptance_criteria" (
    "id" TEXT NOT NULL,
    "deliverableTemplateId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "verificationMethod" TEXT,

    CONSTRAINT "acceptance_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_requirements" (
    "id" TEXT NOT NULL,
    "deliverableTemplateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "evidence_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_template_dependencies" (
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,

    CONSTRAINT "deliverable_template_dependencies_pkey" PRIMARY KEY ("sourceId","targetId")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "templateId" TEXT,
    "actorName" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "templates_organizationId_idx" ON "templates"("organizationId");

-- CreateIndex
CREATE INDEX "focus_areas_templateId_idx" ON "focus_areas"("templateId");

-- CreateIndex
CREATE INDEX "sub_sections_focusAreaId_idx" ON "sub_sections"("focusAreaId");

-- CreateIndex
CREATE INDEX "deliverable_templates_subSectionId_idx" ON "deliverable_templates"("subSectionId");

-- CreateIndex
CREATE INDEX "acceptance_criteria_deliverableTemplateId_idx" ON "acceptance_criteria"("deliverableTemplateId");

-- CreateIndex
CREATE INDEX "evidence_requirements_deliverableTemplateId_idx" ON "evidence_requirements"("deliverableTemplateId");

-- CreateIndex
CREATE INDEX "audit_events_organizationId_idx" ON "audit_events"("organizationId");

-- CreateIndex
CREATE INDEX "audit_events_templateId_idx" ON "audit_events"("templateId");

-- AddForeignKey
ALTER TABLE "focus_areas" ADD CONSTRAINT "focus_areas_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_sections" ADD CONSTRAINT "sub_sections_focusAreaId_fkey" FOREIGN KEY ("focusAreaId") REFERENCES "focus_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_templates" ADD CONSTRAINT "deliverable_templates_subSectionId_fkey" FOREIGN KEY ("subSectionId") REFERENCES "sub_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acceptance_criteria" ADD CONSTRAINT "acceptance_criteria_deliverableTemplateId_fkey" FOREIGN KEY ("deliverableTemplateId") REFERENCES "deliverable_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_requirements" ADD CONSTRAINT "evidence_requirements_deliverableTemplateId_fkey" FOREIGN KEY ("deliverableTemplateId") REFERENCES "deliverable_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_template_dependencies" ADD CONSTRAINT "deliverable_template_dependencies_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "deliverable_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_template_dependencies" ADD CONSTRAINT "deliverable_template_dependencies_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "deliverable_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
