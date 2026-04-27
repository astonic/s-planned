-- AI Settings on OrganizationSettings
ALTER TABLE "organization_settings"
  ADD COLUMN "aiEnabled"             BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "aiProvider"            TEXT NOT NULL DEFAULT 'anthropic',
  ADD COLUMN "aiModel"               TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
  ADD COLUMN "aiApiKey"              TEXT,
  ADD COLUMN "aiDailyRefreshLimit"   INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN "aiAnalyzeActivity"     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "aiAnalyzeDeliverables" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "aiAnalyzeRaid"         BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "aiAnalyzeDecisions"    BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "aiAnalyzeNotes"        BOOLEAN NOT NULL DEFAULT true;

-- AISuggestion
CREATE TABLE "ai_suggestions" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId"      TEXT NOT NULL,
  "model"          TEXT NOT NULL,
  "promptVersion"  TEXT NOT NULL DEFAULT '1',
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_suggestions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_suggestions_organizationId_idx" ON "ai_suggestions"("organizationId");
CREATE INDEX "ai_suggestions_projectId_idx" ON "ai_suggestions"("projectId");

ALTER TABLE "ai_suggestions"
  ADD CONSTRAINT "ai_suggestions_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AISuggestionItem
CREATE TABLE "ai_suggestion_items" (
  "id"            TEXT NOT NULL,
  "suggestionId"  TEXT NOT NULL,
  "type"          TEXT NOT NULL,
  "priority"      TEXT NOT NULL,
  "title"         TEXT NOT NULL,
  "description"   TEXT NOT NULL,
  "actionType"    TEXT,
  "actionPayload" JSONB,
  "dismissed"     BOOLEAN NOT NULL DEFAULT false,
  "executedAt"    TIMESTAMP(3),
  "executedBy"    TEXT,
  CONSTRAINT "ai_suggestion_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_suggestion_items_suggestionId_idx" ON "ai_suggestion_items"("suggestionId");

ALTER TABLE "ai_suggestion_items"
  ADD CONSTRAINT "ai_suggestion_items_suggestionId_fkey"
  FOREIGN KEY ("suggestionId") REFERENCES "ai_suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AIRefreshLog
CREATE TABLE "ai_refresh_logs" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId"      TEXT NOT NULL,
  "date"           TEXT NOT NULL,
  "count"          INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ai_refresh_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_refresh_logs_projectId_date_key" ON "ai_refresh_logs"("projectId", "date");
CREATE INDEX "ai_refresh_logs_organizationId_idx" ON "ai_refresh_logs"("organizationId");
