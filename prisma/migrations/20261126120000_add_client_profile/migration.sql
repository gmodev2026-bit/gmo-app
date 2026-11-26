-- CreateTable
CREATE TABLE "client" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT,
    "preferredContact" "ContactPreference" NOT NULL DEFAULT 'PHONE',
    "deletionRequestedAt" TIMESTAMP(3),
    "deletionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "enquiry" ADD COLUMN "clientId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "client_userId_key" ON "client"("userId");

-- CreateIndex
CREATE INDEX "enquiry_clientId_createdAt_idx" ON "enquiry"("clientId", "createdAt");

-- AddForeignKey
ALTER TABLE "client" ADD CONSTRAINT "client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry" ADD CONSTRAINT "enquiry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
