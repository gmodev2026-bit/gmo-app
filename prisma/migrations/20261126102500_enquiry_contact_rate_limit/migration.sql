CREATE TABLE "enquiry_rate_limit_attempt" (
    "id" TEXT NOT NULL,
    "phoneFingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiry_rate_limit_attempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "enquiry_rate_limit_attempt_phoneFingerprint_createdAt_idx"
ON "enquiry_rate_limit_attempt"("phoneFingerprint", "createdAt");

CREATE INDEX "enquiry_rate_limit_attempt_createdAt_idx"
ON "enquiry_rate_limit_attempt"("createdAt");
