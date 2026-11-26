-- CreateEnum
CREATE TYPE "FunnelEventType" AS ENUM ('LANDING_VIEWED', 'ENQUIRY_FORM_OPENED', 'ENQUIRY_SUBMITTED', 'ENQUIRY_SUBMISSION_FAILED');

-- CreateTable
CREATE TABLE "funnel_event" (
    "id" TEXT NOT NULL,
    "type" "FunnelEventType" NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'WEBSITE',
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "categoryId" TEXT,
    "cityId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "funnel_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "funnel_event_type_occurredAt_idx" ON "funnel_event"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "funnel_event_sessionKey_occurredAt_idx" ON "funnel_event"("sessionKey", "occurredAt");

-- CreateIndex
CREATE INDEX "funnel_event_utmSource_occurredAt_idx" ON "funnel_event"("utmSource", "occurredAt");

-- CreateIndex
CREATE INDEX "funnel_event_categoryId_occurredAt_idx" ON "funnel_event"("categoryId", "occurredAt");

-- CreateIndex
CREATE INDEX "funnel_event_cityId_occurredAt_idx" ON "funnel_event"("cityId", "occurredAt");

-- AddForeignKey
ALTER TABLE "funnel_event" ADD CONSTRAINT "funnel_event_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funnel_event" ADD CONSTRAINT "funnel_event_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "city"("id") ON DELETE SET NULL ON UPDATE CASCADE;
