ALTER TABLE "enquiry"
ADD COLUMN "possibleDuplicateOfId" TEXT;

CREATE INDEX "enquiry_customerPhone_categoryId_cityId_createdAt_idx"
ON "enquiry"("customerPhone", "categoryId", "cityId", "createdAt");

CREATE INDEX "enquiry_possibleDuplicateOfId_idx"
ON "enquiry"("possibleDuplicateOfId");

ALTER TABLE "enquiry"
ADD CONSTRAINT "enquiry_possibleDuplicateOfId_fkey"
FOREIGN KEY ("possibleDuplicateOfId")
REFERENCES "enquiry"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
