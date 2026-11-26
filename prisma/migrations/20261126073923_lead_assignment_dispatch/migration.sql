-- CreateEnum
CREATE TYPE "LeadAssignmentStatus" AS ENUM ('PENDING_AVAILABILITY', 'CONFIRMED', 'DISPATCHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AvailabilityResponse" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'NO_RESPONSE', 'NEEDS_CLARIFICATION');

-- CreateEnum
CREATE TYPE "QuotaLedgerEntryType" AS ENUM ('FREE_ASSIGNMENT_CONSUMED');

-- CreateTable
CREATE TABLE "lead_assignment" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" "LeadAssignmentStatus" NOT NULL DEFAULT 'PENDING_AVAILABILITY',
    "dispatchedAt" TIMESTAMP(3),
    "dispatchedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_availability_response" (
    "id" TEXT NOT NULL,
    "leadAssignmentId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "response" "AvailabilityResponse" NOT NULL,
    "note" TEXT,
    "actorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_availability_response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quota_ledger_entry" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "leadAssignmentId" TEXT NOT NULL,
    "type" "QuotaLedgerEntryType" NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quota_ledger_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lead_assignment_enquiryId_supplierId_key" ON "lead_assignment"("enquiryId", "supplierId");

-- CreateIndex
CREATE INDEX "lead_assignment_status_createdAt_idx" ON "lead_assignment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "lead_assignment_supplierId_status_createdAt_idx" ON "lead_assignment"("supplierId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "supplier_availability_response_leadAssignmentId_createdAt_idx" ON "supplier_availability_response"("leadAssignmentId", "createdAt");

-- CreateIndex
CREATE INDEX "supplier_availability_response_supplierId_createdAt_idx" ON "supplier_availability_response"("supplierId", "createdAt");

-- CreateIndex
CREATE INDEX "supplier_availability_response_enquiryId_createdAt_idx" ON "supplier_availability_response"("enquiryId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "quota_ledger_entry_leadAssignmentId_key" ON "quota_ledger_entry"("leadAssignmentId");

-- CreateIndex
CREATE INDEX "quota_ledger_entry_supplierId_createdAt_idx" ON "quota_ledger_entry"("supplierId", "createdAt");

-- CreateIndex
CREATE INDEX "quota_ledger_entry_enquiryId_createdAt_idx" ON "quota_ledger_entry"("enquiryId", "createdAt");

-- AddForeignKey
ALTER TABLE "lead_assignment" ADD CONSTRAINT "lead_assignment_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_assignment" ADD CONSTRAINT "lead_assignment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_assignment" ADD CONSTRAINT "lead_assignment_dispatchedByUserId_fkey" FOREIGN KEY ("dispatchedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_availability_response" ADD CONSTRAINT "supplier_availability_response_leadAssignmentId_fkey" FOREIGN KEY ("leadAssignmentId") REFERENCES "lead_assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_availability_response" ADD CONSTRAINT "supplier_availability_response_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_availability_response" ADD CONSTRAINT "supplier_availability_response_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_availability_response" ADD CONSTRAINT "supplier_availability_response_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quota_ledger_entry" ADD CONSTRAINT "quota_ledger_entry_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quota_ledger_entry" ADD CONSTRAINT "quota_ledger_entry_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quota_ledger_entry" ADD CONSTRAINT "quota_ledger_entry_leadAssignmentId_fkey" FOREIGN KEY ("leadAssignmentId") REFERENCES "lead_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quota_ledger_entry" ADD CONSTRAINT "quota_ledger_entry_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
