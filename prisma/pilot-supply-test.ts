import { randomUUID } from 'node:crypto';
import { config } from 'dotenv';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { getDatabaseSchema } from '../src/lib/database-schema';
import {
  PILOT_CATEGORIES,
  PILOT_CITIES,
  PILOT_PROVINCE
} from '../src/features/enquiries/pilot-catalog';

config({ path: '.env.local' });
config();

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    { connectionString: process.env.DATABASE_URL },
    { schema: getDatabaseSchema() }
  )
});

class RollbackSupplyTest extends Error {}

async function main() {
  const runId = randomUUID();

  try {
    await prisma.$transaction(async (transaction) => {
      const province = await transaction.province.upsert({
        where: { code: PILOT_PROVINCE.code },
        update: { isActive: true },
        create: {
          id: PILOT_PROVINCE.id,
          name: PILOT_PROVINCE.name,
          code: PILOT_PROVINCE.code,
          isActive: true
        }
      });

      const city = await transaction.city.upsert({
        where: {
          provinceId_slug: {
            provinceId: province.id,
            slug: PILOT_CITIES[0].slug
          }
        },
        update: { isActive: true },
        create: {
          id: PILOT_CITIES[0].id,
          name: PILOT_CITIES[0].name,
          slug: PILOT_CITIES[0].slug,
          provinceId: province.id,
          isActive: true
        }
      });

      const category = await transaction.category.upsert({
        where: { slug: PILOT_CATEGORIES[0].slug },
        update: { isActive: true },
        create: {
          id: PILOT_CATEGORIES[0].id,
          name: PILOT_CATEGORIES[0].name,
          slug: PILOT_CATEGORIES[0].slug,
          isActive: true,
          sortOrder: PILOT_CATEGORIES[0].sortOrder
        }
      });

      for (let index = 1; index <= 5; index += 1) {
        await transaction.supplier.create({
          data: {
            businessName: `[TEST-ONLY ${runId.slice(0, 8)}] Plumbing ${index}`,
            slug: `test-only-${runId}-${index}`,
            businessType: 'SERVICE_PROVIDER',
            phone: `+27000${index}`,
            status: 'APPROVED',
            isVerified: true,
            verificationMethod: 'Test-only transaction',
            verifiedAt: new Date(),
            isActive: true,
            categories: {
              create: {
                categoryId: category.id,
                isPrimary: true,
                isConfirmed: true
              }
            },
            serviceAreas: {
              create: {
                cityId: city.id,
                isConfirmed: true,
                isActive: true
              }
            }
          }
        });
      }

      const eligibleSupplierCount = await transaction.supplier.count({
        where: {
          slug: { startsWith: `test-only-${runId}-` },
          deletedAt: null,
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

      if (eligibleSupplierCount !== 5) {
        throw new Error(
          `Synthetic coverage check expected 5 suppliers, received ${eligibleSupplierCount}.`
        );
      }

      console.log(
        'Test-only gate passed: 5 approved, verified Plumbing suppliers cover Johannesburg.'
      );
      console.log(
        'The transaction will now roll back and persist no synthetic supplier records.'
      );
      throw new RollbackSupplyTest();
    }, {
      maxWait: 20_000,
      timeout: 60_000
    });
  } catch (error) {
    if (!(error instanceof RollbackSupplyTest)) throw error;
  }

  const remaining = await prisma.supplier.count({
    where: { slug: { startsWith: `test-only-${runId}-` } }
  });
  if (remaining !== 0) {
    throw new Error(
      `Synthetic supplier rollback failed; ${remaining} records from this run remain.`
    );
  }

  console.log('Rollback verified: 0 test-only supplier records from this run remain.');
}

main()
  .catch((error: unknown) => {
    console.error('Synthetic supplier gate test failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
