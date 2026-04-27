CREATE TYPE "ProjectNotificationChannel" AS ENUM ('email', 'whatsapp');
CREATE TYPE "ProjectNotificationStatus" AS ENUM ('sent', 'dismissed');

ALTER TABLE "organization_settings"
ADD COLUMN "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "whatsappProvider" TEXT NOT NULL DEFAULT 'meta',
ADD COLUMN "whatsappPhoneNumberId" TEXT,
ADD COLUMN "whatsappBusinessAccountId" TEXT,
ADD COLUMN "whatsappAccessToken" TEXT,
ADD COLUMN "whatsappFromNumber" TEXT;

CREATE TABLE "project_notification_messages" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "generatedKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "channel" "ProjectNotificationChannel" NOT NULL,
    "status" "ProjectNotificationStatus" NOT NULL,
    "recipientType" TEXT NOT NULL,
    "recipientId" TEXT,
    "recipientName" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_notification_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_notification_messages_projectId_generatedKey_channel_recipientType_recipientId_key"
ON "project_notification_messages"("projectId", "generatedKey", "channel", "recipientType", "recipientId");

CREATE INDEX "project_notification_messages_organizationId_idx" ON "project_notification_messages"("organizationId");
CREATE INDEX "project_notification_messages_projectId_idx" ON "project_notification_messages"("projectId");

ALTER TABLE "project_notification_messages" ADD CONSTRAINT "project_notification_messages_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
