ALTER TABLE "supplier" ADD COLUMN "isIndexable" BOOLEAN NOT NULL DEFAULT false;

-- Preserve existing publicly eligible profiles unless an admin explicitly turns indexing off.
UPDATE "supplier"
SET "isIndexable" = true
WHERE "status" = 'APPROVED'
  AND "isVerified" = true
  AND "isActive" = true
  AND "deletedAt" IS NULL;
