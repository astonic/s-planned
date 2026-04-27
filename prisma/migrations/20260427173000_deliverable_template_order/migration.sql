ALTER TABLE "deliverable_templates" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (PARTITION BY "subSectionId" ORDER BY "code" ASC, "createdAt" ASC, "id" ASC) - 1 AS "newOrder"
  FROM "deliverable_templates"
)
UPDATE "deliverable_templates"
SET "order" = ranked."newOrder"
FROM ranked
WHERE "deliverable_templates"."id" = ranked."id";
