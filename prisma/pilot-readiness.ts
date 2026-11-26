import { config } from 'dotenv';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { getDatabaseSchema } from '../src/lib/database-schema';
import {
  PILOT_CATEGORIES,
  PILOT_CITIES
} from '../src/features/enquiries/pilot-catalog';

config({ path: '.env.local' });
config();

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    { connectionString: process.env.DATABASE_URL },
    { schema: getDatabaseSchema() }
  )
});

async function main() {
  const readiness = [];

  for (const category of PILOT_CATEGORIES) {
    for (const city of PILOT_CITIES) {
      const eligibleSupplierCount = await prisma.supplier.count({
        where: {
          deletedAt: null,
          AND: [
            { slug: { not: { startsWith: 'simulation-' } } },
            { slug: { not: { startsWith: 'test-only-' } } }
          ],
          isActive: true,
          status: 'APPROVED',
          isVerified: true,
          categories: {
            some: {
              categoryId: category.id,
              isConfirmed: true
            }
          },
          serviceAreas: {
            some: {
              cityId: city.id,
              isConfirmed: true,
              isActive: true
            }
          }
        }
      });

      const missing = Math.max(0, 5 - eligibleSupplierCount);
      readiness.push({
        category: category.name,
        city: city.name,
        eligibleSupplierCount,
        required: 5,
        missing,
        ready: missing === 0
      });
    }
  }

  console.log('GrowMeOnline controlled-pilot supplier coverage');
  console.log(JSON.stringify(readiness, null, 2));

  const readyCount = readiness.filter((row) => row.ready).length;
  console.log(
    `${readyCount}/${readiness.length} category/city combinations meet the five-supplier gate.`
  );
}

main()
  .catch((error: unknown) => {
    console.error('Pilot readiness report failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
