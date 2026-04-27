ALTER TABLE "acceptance_criteria" ADD COLUMN "deliverableExecutionId" TEXT;

ALTER TABLE "acceptance_criteria" ALTER COLUMN "deliverableTemplateId" DROP NOT NULL;

ALTER TABLE "evidence_requirements" ADD COLUMN "deliverableExecutionId" TEXT;

ALTER TABLE "evidence_requirements" ALTER COLUMN "deliverableTemplateId" DROP NOT NULL;

CREATE INDEX "acceptance_criteria_deliverableExecutionId_idx" ON "acceptance_criteria"("deliverableExecutionId");
CREATE INDEX "evidence_requirements_deliverableExecutionId_idx" ON "evidence_requirements"("deliverableExecutionId");

ALTER TABLE "acceptance_criteria" ADD CONSTRAINT "acceptance_criteria_deliverableExecutionId_fkey"
FOREIGN KEY ("deliverableExecutionId") REFERENCES "deliverable_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "evidence_requirements" ADD CONSTRAINT "evidence_requirements_deliverableExecutionId_fkey"
FOREIGN KEY ("deliverableExecutionId") REFERENCES "deliverable_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
