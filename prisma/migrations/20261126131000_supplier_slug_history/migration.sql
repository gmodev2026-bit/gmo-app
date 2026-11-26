CREATE TABLE "supplier_slug_history" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_slug_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "supplier_slug_history_slug_key" ON "supplier_slug_history"("slug");
CREATE INDEX "supplier_slug_history_supplierId_createdAt_idx" ON "supplier_slug_history"("supplierId", "createdAt");

ALTER TABLE "supplier_slug_history" ADD CONSTRAINT "supplier_slug_history_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
