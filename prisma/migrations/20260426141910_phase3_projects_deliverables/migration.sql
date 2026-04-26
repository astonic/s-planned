-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('active', 'blocked', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "DeliverableStatus" AS ENUM ('planned', 'in_progress', 'delayed', 'closed');

-- AlterTable
ALTER TABLE "audit_events" ADD COLUMN     "deliverableExecutionId" TEXT,
ADD COLUMN     "projectId" TEXT;

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "templateId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3),
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "focus_area_executions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "focus_area_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_section_executions" (
    "id" TEXT NOT NULL,
    "focusAreaExecutionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sub_section_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_executions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "subSectionExecutionId" TEXT NOT NULL,
    "templateDeliverableId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "DeliverableStatus" NOT NULL DEFAULT 'planned',
    "phase" "ProjectPhase",
    "domain" TEXT,
    "startDate" TIMESTAMP(3),
    "targetDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliverable_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_organizationId_idx" ON "projects"("organizationId");

-- CreateIndex
CREATE INDEX "focus_area_executions_projectId_idx" ON "focus_area_executions"("projectId");

-- CreateIndex
CREATE INDEX "sub_section_executions_focusAreaExecutionId_idx" ON "sub_section_executions"("focusAreaExecutionId");

-- CreateIndex
CREATE INDEX "deliverable_executions_organizationId_idx" ON "deliverable_executions"("organizationId");

-- CreateIndex
CREATE INDEX "deliverable_executions_subSectionExecutionId_idx" ON "deliverable_executions"("subSectionExecutionId");

-- CreateIndex
CREATE INDEX "audit_events_projectId_idx" ON "audit_events"("projectId");

-- CreateIndex
CREATE INDEX "audit_events_deliverableExecutionId_idx" ON "audit_events"("deliverableExecutionId");

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_deliverableExecutionId_fkey" FOREIGN KEY ("deliverableExecutionId") REFERENCES "deliverable_executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_area_executions" ADD CONSTRAINT "focus_area_executions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_section_executions" ADD CONSTRAINT "sub_section_executions_focusAreaExecutionId_fkey" FOREIGN KEY ("focusAreaExecutionId") REFERENCES "focus_area_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_executions" ADD CONSTRAINT "deliverable_executions_subSectionExecutionId_fkey" FOREIGN KEY ("subSectionExecutionId") REFERENCES "sub_section_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
