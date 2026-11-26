import { config } from 'dotenv';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { getDatabaseSchema } from '../src/lib/database-schema';

config({ path: '.env.local' });
config();

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    { connectionString: process.env.DATABASE_URL },
    { schema: getDatabaseSchema() }
  )
});

async function main() {
  const deleted = await prisma.$transaction(async (transaction) => {
    const suppliers = await transaction.supplier.findMany({
      where: {
        OR: [
          { slug: { startsWith: 'test-only-ui-' } },
          { slug: { startsWith: 'test-only-' } }
        ]
      },
      select: { id: true, slug: true }
    });

    if (suppliers.length === 0) {
      return 0;
    }

    const supplierIds = suppliers.map((supplier) => supplier.id);
    await transaction.supplierReviewEvent.deleteMany({
      where: { supplierId: { in: supplierIds } }
    });
    await transaction.supplier.deleteMany({
      where: { id: { in: supplierIds } }
    });

    console.log(
      `Removed ${suppliers.length} test-only supplier record(s): ${suppliers
        .map((supplier) => supplier.slug)
        .join(', ')}`
    );
    return suppliers.length;
  }, {
    maxWait: 20_000,
    timeout: 60_000
  });

  console.log(`Test-only supplier cleanup complete: ${deleted} record(s) removed.`);
}

main()
  .catch((error: unknown) => {
    console.error('Test-only supplier cleanup failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
