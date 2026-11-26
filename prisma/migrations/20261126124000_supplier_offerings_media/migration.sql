CREATE TYPE "MediaPurpose" AS ENUM ('LOGO', 'COVER', 'GALLERY', 'VERIFICATION_DOCUMENT');
CREATE TYPE "MediaStatus" AS ENUM ('PENDING', 'READY', 'REMOVED', 'FAILED');

CREATE TABLE "supplier_offering" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_offering_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "media_asset" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "purpose" "MediaPurpose" NOT NULL,
    "status" "MediaStatus" NOT NULL DEFAULT 'PENDING',
    "objectKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "altText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_asset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "media_asset_objectKey_key" ON "media_asset"("objectKey");
CREATE INDEX "supplier_offering_supplierId_isActive_sortOrder_idx" ON "supplier_offering"("supplierId", "isActive", "sortOrder");
CREATE INDEX "media_asset_supplierId_purpose_status_idx" ON "media_asset"("supplierId", "purpose", "status");

ALTER TABLE "supplier_offering" ADD CONSTRAINT "supplier_offering_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
