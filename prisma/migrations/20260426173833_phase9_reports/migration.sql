-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('detailed_activities', 'executive_summary');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('draft', 'published');

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'draft',
    "shareToken" TEXT,
    "createdBy" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_sections" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "comment" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_access" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessedBy" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "report_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reports_shareToken_key" ON "reports"("shareToken");

-- CreateIndex
CREATE INDEX "reports_organizationId_idx" ON "reports"("organizationId");

-- CreateIndex
CREATE INDEX "reports_projectId_idx" ON "reports"("projectId");

-- CreateIndex
CREATE INDEX "reports_shareToken_idx" ON "reports"("shareToken");

-- CreateIndex
CREATE INDEX "report_sections_reportId_idx" ON "report_sections"("reportId");

-- CreateIndex
CREATE INDEX "report_access_reportId_idx" ON "report_access"("reportId");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_sections" ADD CONSTRAINT "report_sections_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_access" ADD CONSTRAINT "report_access_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
