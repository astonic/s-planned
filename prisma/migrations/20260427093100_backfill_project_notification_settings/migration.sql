INSERT INTO "project_notification_settings" (
    "id",
    "projectId",
    "organizationId",
    "notifyEmail",
    "notifyReminders",
    "notifyRaid",
    "notifyDigest",
    "updatedAt"
)
SELECT
    'pns_' || md5(random()::text || clock_timestamp()::text || p."id"),
    p."id",
    p."organizationId",
    COALESCE(s."notifyEmail", true),
    COALESCE(s."notifyReminders", true),
    COALESCE(s."notifyRaid", true),
    COALESCE(s."notifyDigest", false),
    CURRENT_TIMESTAMP
FROM "projects" p
LEFT JOIN "organization_settings" s ON s."organizationId" = p."organizationId"
ON CONFLICT ("projectId") DO NOTHING;
