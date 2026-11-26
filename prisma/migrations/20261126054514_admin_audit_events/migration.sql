-- CreateEnum
CREATE TYPE "AdminAuditAction" AS ENUM ('SUPPLIER_CREATED', 'SUPPLIER_PROFILE_UPDATED', 'SUPPLIER_REVIEWED', 'ENQUIRY_CONTACT_VERIFIED', 'ENQUIRY_STATUS_CHANGED', 'SUPPLIER_AVAILABILITY_RECORDED', 'ENQUIRY_DISPATCHED', 'FOLLOW_UP_SCHEDULED', 'FOLLOW_UP_RESOLVED');

-- CreateEnum
CREATE TYPE "AdminAuditEntityType" AS ENUM ('SUPPLIER', 'ENQUIRY');

-- CreateTable
CREATE TABLE "admin_audit_event" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" "AdminAuditAction" NOT NULL,
    "entityType" "AdminAuditEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_audit_event_createdAt_id_idx" ON "admin_audit_event"("createdAt", "id");

-- CreateIndex
CREATE INDEX "admin_audit_event_actorUserId_createdAt_idx" ON "admin_audit_event"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "admin_audit_event_entityType_entityId_createdAt_idx" ON "admin_audit_event"("entityType", "entityId", "createdAt");

-- AddForeignKey
ALTER TABLE "admin_audit_event" ADD CONSTRAINT "admin_audit_event_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
