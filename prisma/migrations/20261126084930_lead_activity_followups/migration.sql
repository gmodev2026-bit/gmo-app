-- CreateEnum
CREATE TYPE "LeadActivityType" AS ENUM ('INTERNAL_REVIEW', 'CUSTOMER_CONTACT_ATTEMPT', 'SUPPLIER_CONTACT_ATTEMPT', 'CUSTOMER_REACHED', 'SUPPLIER_RESPONDED', 'APPOINTMENT_PROPOSED', 'APPOINTMENT_BOOKED', 'QUOTE_REQUESTED', 'QUOTE_RECEIVED', 'JOB_REPORTED_WON', 'JOB_REPORTED_LOST', 'FOLLOW_UP_SCHEDULED', 'FOLLOW_UP_COMPLETED', 'FEEDBACK_RECORDED');

-- CreateEnum
CREATE TYPE "LeadActivityChannel" AS ENUM ('INTERNAL', 'PHONE', 'EMAIL', 'WHATSAPP', 'SMS', 'IN_PERSON', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadActivityOutcome" AS ENUM ('NO_ANSWER', 'REACHED', 'UNAVAILABLE', 'NEEDS_MORE_INFORMATION', 'APPOINTMENT_PROPOSED', 'APPOINTMENT_BOOKED', 'QUOTE_REQUESTED', 'QUOTE_RECEIVED', 'JOB_REPORTED_WON', 'JOB_REPORTED_LOST', 'COMPLETED', 'CANCELLED', 'FEEDBACK_RECORDED');

-- CreateEnum
CREATE TYPE "LeadActivityStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "lead_activity" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "leadAssignmentId" TEXT,
    "type" "LeadActivityType" NOT NULL,
    "channel" "LeadActivityChannel" NOT NULL,
    "status" "LeadActivityStatus" NOT NULL DEFAULT 'OPEN',
    "outcome" "LeadActivityOutcome",
    "summary" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lead_activity_status_scheduledAt_idx" ON "lead_activity"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "lead_activity_enquiryId_createdAt_idx" ON "lead_activity"("enquiryId", "createdAt");

-- CreateIndex
CREATE INDEX "lead_activity_leadAssignmentId_createdAt_idx" ON "lead_activity"("leadAssignmentId", "createdAt");

-- CreateIndex
CREATE INDEX "lead_activity_actorUserId_createdAt_idx" ON "lead_activity"("actorUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "lead_activity" ADD CONSTRAINT "lead_activity_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activity" ADD CONSTRAINT "lead_activity_leadAssignmentId_fkey" FOREIGN KEY ("leadAssignmentId") REFERENCES "lead_assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activity" ADD CONSTRAINT "lead_activity_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
