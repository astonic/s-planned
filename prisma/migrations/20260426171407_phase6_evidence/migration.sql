-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('document', 'image', 'link', 'sign_off');

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "deliverableExecutionId" TEXT NOT NULL,
    "evidenceRequirementId" TEXT,
    "name" TEXT NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "url" TEXT NOT NULL,
    "fileSize" INTEGER,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "criteria_completions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "deliverableExecutionId" TEXT NOT NULL,
    "acceptanceCriteriaId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "criteria_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "evidence_organizationId_idx" ON "evidence"("organizationId");

-- CreateIndex
CREATE INDEX "evidence_deliverableExecutionId_idx" ON "evidence"("deliverableExecutionId");

-- CreateIndex
CREATE INDEX "criteria_completions_deliverableExecutionId_idx" ON "criteria_completions"("deliverableExecutionId");

-- CreateIndex
CREATE UNIQUE INDEX "criteria_completions_deliverableExecutionId_acceptanceCrite_key" ON "criteria_completions"("deliverableExecutionId", "acceptanceCriteriaId");

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_deliverableExecutionId_fkey" FOREIGN KEY ("deliverableExecutionId") REFERENCES "deliverable_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_evidenceRequirementId_fkey" FOREIGN KEY ("evidenceRequirementId") REFERENCES "evidence_requirements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criteria_completions" ADD CONSTRAINT "criteria_completions_deliverableExecutionId_fkey" FOREIGN KEY ("deliverableExecutionId") REFERENCES "deliverable_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criteria_completions" ADD CONSTRAINT "criteria_completions_acceptanceCriteriaId_fkey" FOREIGN KEY ("acceptanceCriteriaId") REFERENCES "acceptance_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
