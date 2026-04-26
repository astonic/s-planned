-- CreateEnum
CREATE TYPE "DecisionStatus" AS ENUM ('pending', 'approved', 'rejected', 'deferred');

-- CreateTable
CREATE TABLE "deliverable_notes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "deliverableExecutionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliverable_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decisions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "impact" TEXT,
    "loggedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "DecisionStatus" NOT NULL DEFAULT 'pending',
    "comments" TEXT,
    "loggedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deliverable_notes_organizationId_idx" ON "deliverable_notes"("organizationId");

-- CreateIndex
CREATE INDEX "deliverable_notes_deliverableExecutionId_idx" ON "deliverable_notes"("deliverableExecutionId");

-- CreateIndex
CREATE INDEX "decisions_organizationId_idx" ON "decisions"("organizationId");

-- CreateIndex
CREATE INDEX "decisions_projectId_idx" ON "decisions"("projectId");

-- AddForeignKey
ALTER TABLE "deliverable_notes" ADD CONSTRAINT "deliverable_notes_deliverableExecutionId_fkey" FOREIGN KEY ("deliverableExecutionId") REFERENCES "deliverable_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
