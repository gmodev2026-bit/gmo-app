CREATE TYPE "OutboxEventType" AS ENUM ('SUPPLIER_DISPATCH_CONFIRMED');
CREATE TYPE "OutboxEventStatus" AS ENUM ('PENDING', 'PROCESSING', 'DELIVERED', 'FAILED');

CREATE TABLE "outbox_event" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "type" "OutboxEventType" NOT NULL,
    "status" "OutboxEventStatus" NOT NULL DEFAULT 'PENDING',
    "enquiryId" TEXT NOT NULL,
    "leadAssignmentId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "isSimulation" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbox_event_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "outbox_event_idempotencyKey_key"
ON "outbox_event"("idempotencyKey");

CREATE INDEX "outbox_event_status_availableAt_idx"
ON "outbox_event"("status", "availableAt");

CREATE INDEX "outbox_event_enquiryId_createdAt_idx"
ON "outbox_event"("enquiryId", "createdAt");

CREATE INDEX "outbox_event_leadAssignmentId_createdAt_idx"
ON "outbox_event"("leadAssignmentId", "createdAt");

ALTER TABLE "outbox_event"
ADD CONSTRAINT "outbox_event_enquiryId_fkey"
FOREIGN KEY ("enquiryId") REFERENCES "enquiry"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "outbox_event"
ADD CONSTRAINT "outbox_event_leadAssignmentId_fkey"
FOREIGN KEY ("leadAssignmentId") REFERENCES "lead_assignment"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
