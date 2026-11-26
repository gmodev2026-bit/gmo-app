-- CreateTable
CREATE TABLE "enquiry_status_history" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "fromStatus" "EnquiryStatus" NOT NULL,
    "toStatus" "EnquiryStatus" NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiry_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "enquiry_status_history_enquiryId_createdAt_idx" ON "enquiry_status_history"("enquiryId", "createdAt");

-- CreateIndex
CREATE INDEX "enquiry_status_history_actorUserId_createdAt_idx" ON "enquiry_status_history"("actorUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "enquiry_status_history" ADD CONSTRAINT "enquiry_status_history_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "enquiry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_status_history" ADD CONSTRAINT "enquiry_status_history_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
