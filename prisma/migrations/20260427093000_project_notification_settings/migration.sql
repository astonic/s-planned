CREATE TABLE "project_notification_settings" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifyReminders" BOOLEAN NOT NULL DEFAULT true,
    "notifyRaid" BOOLEAN NOT NULL DEFAULT true,
    "notifyDigest" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_notification_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_notification_settings_projectId_key" ON "project_notification_settings"("projectId");
CREATE INDEX "project_notification_settings_organizationId_idx" ON "project_notification_settings"("organizationId");

ALTER TABLE "project_notification_settings" ADD CONSTRAINT "project_notification_settings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
