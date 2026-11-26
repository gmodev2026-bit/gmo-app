import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { getDatabaseSchema } from '../src/lib/database-schema';
import {
  HOME_REPAIRS_CATEGORY,
  PILOT_CATEGORIES,
  PILOT_CITIES,
  PILOT_PROVINCE
} from '../src/features/enquiries/pilot-catalog';

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    {
      connectionString: process.env.DATABASE_URL
    },
    {
      schema: getDatabaseSchema()
    }
  )
});

async function seedPilotCatalog() {
  const province = await prisma.province.upsert({
    where: { code: PILOT_PROVINCE.code },
    update: { name: PILOT_PROVINCE.name, isActive: true },
    create: { ...PILOT_PROVINCE }
  });

  for (const city of PILOT_CITIES) {
    await prisma.city.upsert({
      where: {
        provinceId_slug: {
          provinceId: province.id,
          slug: city.slug
        }
      },
      update: { name: city.name, isActive: true },
      create: {
        ...city,
        provinceId: province.id
      }
    });
  }

  const parentCategory = await prisma.category.upsert({
    where: { slug: HOME_REPAIRS_CATEGORY.slug },
    update: {
      name: HOME_REPAIRS_CATEGORY.name,
      parentId: null,
      isActive: true
    },
    create: { ...HOME_REPAIRS_CATEGORY }
  });

  for (const category of PILOT_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        parentId: parentCategory.id,
        isActive: true,
        sortOrder: category.sortOrder
      },
      create: {
        ...category,
        parentId: parentCategory.id
      }
    });
  }
}

seedPilotCatalog()
  .catch((error: unknown) => {
    console.error('Failed to seed the GrowMeOnline pilot catalog:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
