-- CreateEnum
CREATE TYPE "EnquiryEntryChannel" AS ENUM ('GUIDED_REQUEST', 'PERSONAL_BUSINESS_PAGE');

-- AlterTable
ALTER TABLE "enquiry"
ADD COLUMN "entryChannel" "EnquiryEntryChannel" NOT NULL DEFAULT 'GUIDED_REQUEST',
ADD COLUMN "targetSupplierId" TEXT;

-- CreateIndex
CREATE INDEX "enquiry_targetSupplierId_idx" ON "enquiry"("targetSupplierId");

-- AddForeignKey
ALTER TABLE "enquiry"
ADD CONSTRAINT "enquiry_targetSupplierId_fkey"
FOREIGN KEY ("targetSupplierId") REFERENCES "supplier"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
