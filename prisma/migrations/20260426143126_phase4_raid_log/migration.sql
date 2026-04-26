-- CreateEnum
CREATE TYPE "RAIDType" AS ENUM ('risk', 'assumption', 'issue', 'dependency');

-- CreateEnum
CREATE TYPE "RAIDSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "RAIDLikelihood" AS ENUM ('rare', 'unlikely', 'possible', 'likely', 'almost_certain');

-- CreateEnum
CREATE TYPE "RAIDStatus" AS ENUM ('open', 'in_progress', 'closed');

-- CreateTable
CREATE TABLE "raid_items" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "RAIDType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" "RAIDSeverity" NOT NULL DEFAULT 'medium',
    "likelihood" "RAIDLikelihood",
    "status" "RAIDStatus" NOT NULL DEFAULT 'open',
    "owner" TEXT,
    "dueDate" TIMESTAMP(3),
    "mitigationPlan" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raid_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raid_item_deliverables" (
    "raidItemId" TEXT NOT NULL,
    "deliverableExecutionId" TEXT NOT NULL,

    CONSTRAINT "raid_item_deliverables_pkey" PRIMARY KEY ("raidItemId","deliverableExecutionId")
);

-- CreateIndex
CREATE INDEX "raid_items_organizationId_idx" ON "raid_items"("organizationId");

-- CreateIndex
CREATE INDEX "raid_items_projectId_idx" ON "raid_items"("projectId");

-- AddForeignKey
ALTER TABLE "raid_items" ADD CONSTRAINT "raid_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raid_item_deliverables" ADD CONSTRAINT "raid_item_deliverables_raidItemId_fkey" FOREIGN KEY ("raidItemId") REFERENCES "raid_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raid_item_deliverables" ADD CONSTRAINT "raid_item_deliverables_deliverableExecutionId_fkey" FOREIGN KEY ("deliverableExecutionId") REFERENCES "deliverable_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
