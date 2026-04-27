CREATE TABLE "project_assignments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_assignments_membershipId_projectId_key" ON "project_assignments"("membershipId", "projectId");
CREATE INDEX "project_assignments_organizationId_idx" ON "project_assignments"("organizationId");
CREATE INDEX "project_assignments_projectId_idx" ON "project_assignments"("projectId");

ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "organization_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "project_assignments" ("id", "organizationId", "membershipId", "projectId")
SELECT
    'pa_' || md5(random()::text || clock_timestamp()::text || m."id" || p."id"),
    p."organizationId",
    m."id",
    p."id"
FROM "projects" p
JOIN "organization_memberships" m ON m."organizationId" = p."organizationId"
WHERE m."role" <> 'owner'
ON CONFLICT ("membershipId", "projectId") DO NOTHING;
