-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('PENDING_REVIEW', 'NEEDS_INFORMATION', 'QUALIFIED', 'REJECTED', 'REJECTED_SPAM', 'MATCHING', 'DISPATCHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ContactPreference" AS ENUM ('PHONE', 'WHATSAPP');

-- CreateTable
CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "province" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "province_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "city_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiry" (
    "id" TEXT NOT NULL,
    "publicReference" TEXT NOT NULL,
    "submissionKey" TEXT NOT NULL,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "categoryId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "preferredContact" "ContactPreference" NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "privacyNoticeVersion" TEXT NOT NULL,
    "privacyNoticeAcceptedAt" TIMESTAMP(3) NOT NULL,
    "contactVerifiedAt" TIMESTAMP(3),
    "contactVerificationMethod" TEXT,
    "source" TEXT NOT NULL DEFAULT 'WEBSITE',
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_slug_key" ON "category"("slug");

-- CreateIndex
CREATE INDEX "category_parentId_isActive_sortOrder_idx" ON "category"("parentId", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "province_name_key" ON "province"("name");

-- CreateIndex
CREATE UNIQUE INDEX "province_code_key" ON "province"("code");

-- CreateIndex
CREATE INDEX "city_provinceId_isActive_idx" ON "city"("provinceId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "city_provinceId_slug_key" ON "city"("provinceId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "enquiry_publicReference_key" ON "enquiry"("publicReference");

-- CreateIndex
CREATE UNIQUE INDEX "enquiry_submissionKey_key" ON "enquiry"("submissionKey");

-- CreateIndex
CREATE INDEX "enquiry_status_createdAt_idx" ON "enquiry"("status", "createdAt");

-- CreateIndex
CREATE INDEX "enquiry_categoryId_cityId_status_idx" ON "enquiry"("categoryId", "cityId", "status");

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "city" ADD CONSTRAINT "city_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "province"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry" ADD CONSTRAINT "enquiry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry" ADD CONSTRAINT "enquiry_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "city"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
