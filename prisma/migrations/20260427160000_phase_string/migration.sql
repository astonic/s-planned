-- Change phase from ProjectPhase enum to String on deliverable_templates and deliverable_executions

ALTER TABLE "deliverable_templates"
  ALTER COLUMN "phase" TYPE TEXT
  USING "phase"::TEXT;

ALTER TABLE "deliverable_executions"
  ALTER COLUMN "phase" TYPE TEXT
  USING "phase"::TEXT;

DROP TYPE IF EXISTS "ProjectPhase";
