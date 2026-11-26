-- CreateEnum
CREATE TYPE "SupplierBusinessType" AS ENUM ('SERVICE_PROVIDER', 'PRODUCT_SELLER', 'HYBRID');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'CHANGES_REQUESTED', 'APPROVED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SupplierReviewEventType" AS ENUM ('SUPPLIER_CREATED', 'PROFILE_UPDATED', 'STATUS_CHANGED', 'VERIFICATION_CHANGED');

-- CreateTable
CREATE TABLE "supplier" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "businessType" "SupplierBusinessType" NOT NULL DEFAULT 'SERVICE_PROVIDER',
    "tagline" TEXT,
    "description" TEXT,
    "contactName" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "website" TEXT,
    "status" "SupplierStatus" NOT NULL DEFAULT 'DRAFT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationMethod" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedByUserId" TEXT,
    "ownerUserId" TEXT,
    "internalNotes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_category" (
    "supplierId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_category_pkey" PRIMARY KEY ("supplierId","categoryId")
);

-- CreateTable
CREATE TABLE "supplier_service_area" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_service_area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_review_event" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "type" "SupplierReviewEventType" NOT NULL,
    "fromStatus" "SupplierStatus",
    "toStatus" "SupplierStatus",
    "fromVerified" BOOLEAN,
    "toVerified" BOOLEAN,
    "reason" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_review_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "supplier_slug_key" ON "supplier"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_ownerUserId_key" ON "supplier"("ownerUserId");

-- CreateIndex
CREATE INDEX "supplier_status_isVerified_isActive_idx" ON "supplier"("status", "isVerified", "isActive");

-- CreateIndex
CREATE INDEX "supplier_category_categoryId_isConfirmed_idx" ON "supplier_category"("categoryId", "isConfirmed");

-- CreateIndex
CREATE INDEX "supplier_service_area_cityId_isConfirmed_isActive_idx" ON "supplier_service_area"("cityId", "isConfirmed", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_service_area_supplierId_cityId_key" ON "supplier_service_area"("supplierId", "cityId");

-- CreateIndex
CREATE INDEX "supplier_review_event_supplierId_createdAt_idx" ON "supplier_review_event"("supplierId", "createdAt");

-- CreateIndex
CREATE INDEX "supplier_review_event_actorUserId_createdAt_idx" ON "supplier_review_event"("actorUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_category" ADD CONSTRAINT "supplier_category_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_category" ADD CONSTRAINT "supplier_category_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_service_area" ADD CONSTRAINT "supplier_service_area_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_service_area" ADD CONSTRAINT "supplier_service_area_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "city"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_review_event" ADD CONSTRAINT "supplier_review_event_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_review_event" ADD CONSTRAINT "supplier_review_event_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
