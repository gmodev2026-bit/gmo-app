import 'server-only';

import prisma from '@/lib/prisma';

export function isPilotIntakeEnabled() {
  return process.env.GMO_PILOT_INTAKE_ENABLED === 'true';
}

export async function getPilotCoverage(categoryId: string, cityId: string) {
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
          categoryId,
          isConfirmed: true
        }
      },
      serviceAreas: {
        some: {
          cityId,
          isConfirmed: true,
          isActive: true
        }
      }
    }
  });

  return {
    eligibleSupplierCount,
    minimumSupplierCount: 5,
    isCovered: eligibleSupplierCount >= 5
  };
}
