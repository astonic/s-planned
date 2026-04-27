ALTER TABLE "deliverable_executions"
  ADD COLUMN "progress" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'medium';
