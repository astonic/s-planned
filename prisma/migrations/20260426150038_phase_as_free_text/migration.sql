/*
  Warnings:

  - The `phase` column on the `deliverable_executions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `phase` column on the `deliverable_templates` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "deliverable_executions" DROP COLUMN "phase",
ADD COLUMN     "phase" TEXT;

-- AlterTable
ALTER TABLE "deliverable_templates" DROP COLUMN "phase",
ADD COLUMN     "phase" TEXT;

-- DropEnum
DROP TYPE "ProjectPhase";
