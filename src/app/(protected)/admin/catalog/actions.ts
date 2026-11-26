'use server';

import {
  createAdminCategory,
  createAdminCity
} from '@/server/admin/catalog';

export async function submitCategoryAction(formData: FormData) {
  await createAdminCategory(formData);
}

export async function submitCityAction(formData: FormData) {
  await createAdminCity(formData);
}
