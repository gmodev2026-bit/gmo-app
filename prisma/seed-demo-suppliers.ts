import { config } from 'dotenv';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PILOT_CATEGORIES, PILOT_PROVINCE } from '../src/features/enquiries/pilot-catalog';
import { getDatabaseSchema } from '../src/lib/database-schema';

config({ path: '.env.local' });
config();

if (process.env.NODE_ENV === 'production') {
  throw new Error('Demo suppliers cannot be seeded in production.');
}

if (process.env.GMO_SEED_DEMO_DATA !== 'true') {
  throw new Error(
    'Set GMO_SEED_DEMO_DATA=true to explicitly seed synthetic demo suppliers.'
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    { connectionString: process.env.DATABASE_URL },
    { schema: getDatabaseSchema() }
  )
});

const fixtures = PILOT_CATEGORIES.map((category, index) => ({
  slug: `test-only-demo-johannesburg-${category.slug}`,
  businessName: `[TEST ONLY - NOT REAL] ${category.name} Demo`,
  phone: `+2700000000${index + 1}`,
  email: `${category.slug}@example.invalid`,
  categorySlug: category.slug
}));

async function seedDemoSuppliers() {
  const city = await prisma.city.findFirst({
    where: {
      slug: 'johannesburg',
      province: { code: PILOT_PROVINCE.code }
    },
    select: { id: true }
  });

  if (!city) {
    throw new Error('Seed the pilot catalog before seeding demo suppliers.');
  }

  const categories = await prisma.category.findMany({
    where: { slug: { in: fixtures.map((fixture) => fixture.categorySlug) } },
    select: { id: true, slug: true }
  });
  const categoryIds = new Map(categories.map((category) => [category.slug, category.id]));

  if (categoryIds.size !== fixtures.length) {
    throw new Error('The pilot service categories are incomplete; seed the pilot catalog first.');
  }

  const result = await prisma.$transaction(async (transaction) => {
    let created = 0;
    let alreadyPresent = 0;

    for (const fixture of fixtures) {
      const categoryId = categoryIds.get(fixture.categorySlug);
      if (!categoryId) {
        throw new Error(
          `Missing pilot category ${fixture.categorySlug}; seed the pilot catalog first.`
        );
      }

      const existing = await transaction.supplier.findUnique({
        where: { slug: fixture.slug },
        select: {
          businessName: true,
          internalNotes: true,
          status: true,
          isVerified: true,
          isActive: true
        }
      });

      if (existing) {
        const isSafeDemoRecord =
          existing.businessName === fixture.businessName &&
          existing.internalNotes?.includes('[SYNTHETIC TEST FIXTURE]') &&
          existing.status === 'DRAFT' &&
          !existing.isVerified &&
          !existing.isActive;

        if (!isSafeDemoRecord) {
          throw new Error(
            `Refusing to overwrite supplier record with reserved demo slug ${fixture.slug}.`
          );
        }

        alreadyPresent += 1;
        continue;
      }

      await transaction.supplier.create({
        data: {
          slug: fixture.slug,
          businessName: fixture.businessName,
          phone: fixture.phone,
          email: fixture.email,
          businessType: 'SERVICE_PROVIDER',
          status: 'DRAFT',
          isVerified: false,
          isActive: false,
          internalNotes:
            '[SYNTHETIC TEST FIXTURE] Not a real business. Do not contact, verify, publish, or count toward supplier coverage.',
          categories: {
            create: {
              categoryId,
              isPrimary: true,
              isConfirmed: false
            }
          },
          serviceAreas: {
            create: {
              cityId: city.id,
              isConfirmed: false,
              isActive: false
            }
          }
        }
      });
      created += 1;
    }

    return { created, alreadyPresent };
  });

  console.log('Synthetic demo supplier seed completed.');
  console.log(JSON.stringify(result, null, 2));
  console.log(
    'All fixtures are draft, unverified, inactive, and excluded from public listings and pilot coverage.'
  );
}

seedDemoSuppliers()
  .catch((error: unknown) => {
    console.error('Failed to seed synthetic demo suppliers:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
