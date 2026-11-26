import 'server-only';

import { PILOT_CATEGORIES, PILOT_CITIES } from '@/features/enquiries/pilot-catalog';
import {
  getPilotCoverage,
  isPilotIntakeEnabled
} from '@/lib/pilot-readiness';
import { requireAdmin } from '@/server/authorization';

export async function getAdminPilotCoverage() {
  const readiness = await getAdminPilotReadiness();
  return readiness.coverage;
}

export async function getAdminPilotReadiness() {
  await requireAdmin();

  const coverage = await Promise.all(
    PILOT_CATEGORIES.flatMap((category) =>
      PILOT_CITIES.map(async (city) => {
        const coverage = await getPilotCoverage(category.id, city.id);

        return {
          categoryId: category.id,
          categoryName: category.name,
          cityId: city.id,
          cityName: city.name,
          ...coverage,
          missingSupplierCount: Math.max(
            0,
            coverage.minimumSupplierCount - coverage.eligibleSupplierCount
          )
        };
      })
    )
  );

  return {
    intakeEnabled: isPilotIntakeEnabled(),
    coverage
  };
}
