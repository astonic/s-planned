-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('internal', 'contractor', 'consultant');

-- CreateEnum
CREATE TYPE "PersonRole" AS ENUM ('owner', 'team', 'end_user');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('supplier', 'service_provider');

-- AlterTable
ALTER TABLE "deliverable_executions" ADD COLUMN     "ownerId" TEXT;

-- CreateTable
CREATE TABLE "people" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PersonType" NOT NULL DEFAULT 'internal',
    "company" TEXT,
    "role" "PersonRole" NOT NULL DEFAULT 'team',
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "VendorType" NOT NULL DEFAULT 'supplier',
    "contactName" TEXT,
    "contactRole" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_execution_people" (
    "deliverableExecutionId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,

    CONSTRAINT "deliverable_execution_people_pkey" PRIMARY KEY ("deliverableExecutionId","personId")
);

-- CreateTable
CREATE TABLE "deliverable_execution_vendors" (
    "deliverableExecutionId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,

    CONSTRAINT "deliverable_execution_vendors_pkey" PRIMARY KEY ("deliverableExecutionId","vendorId")
);

-- CreateIndex
CREATE INDEX "people_organizationId_idx" ON "people"("organizationId");

-- CreateIndex
CREATE INDEX "vendors_organizationId_idx" ON "vendors"("organizationId");

-- AddForeignKey
ALTER TABLE "deliverable_executions" ADD CONSTRAINT "deliverable_executions_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_execution_people" ADD CONSTRAINT "deliverable_execution_people_deliverableExecutionId_fkey" FOREIGN KEY ("deliverableExecutionId") REFERENCES "deliverable_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_execution_people" ADD CONSTRAINT "deliverable_execution_people_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_execution_vendors" ADD CONSTRAINT "deliverable_execution_vendors_deliverableExecutionId_fkey" FOREIGN KEY ("deliverableExecutionId") REFERENCES "deliverable_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_execution_vendors" ADD CONSTRAINT "deliverable_execution_vendors_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
