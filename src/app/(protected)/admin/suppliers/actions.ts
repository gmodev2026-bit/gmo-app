'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { SupplierActionState } from '@/features/suppliers/action-state';
import {
  createAdminSupplier,
  linkAdminSupplierOwner,
  reviewAdminSupplier,
  updateAdminSupplierProfile
} from '@/server/admin/suppliers';

export async function createSupplierAction(
  _previousState: SupplierActionState,
  formData: FormData
): Promise<SupplierActionState> {
  const result = await createAdminSupplier(formData);

  if (!result.success) {
    return { status: 'error', message: result.message };
  }

  revalidatePath('/admin/suppliers');
  redirect(`/admin/suppliers/${result.supplierId}`);
}

export async function updateSupplierAction(
  _previousState: SupplierActionState,
  formData: FormData
): Promise<SupplierActionState> {
  const result = await updateAdminSupplierProfile(formData);

  if (!result.success) {
    return { status: 'error', message: result.message };
  }

  revalidatePath('/admin/suppliers');
  revalidatePath(`/admin/suppliers/${result.supplierId}`);
  return { status: 'success', message: 'Supplier details saved.' };
}

export async function reviewSupplierAction(
  _previousState: SupplierActionState,
  formData: FormData
): Promise<SupplierActionState> {
  const result = await reviewAdminSupplier(formData);

  if (!result.success) {
    return { status: 'error', message: result.message };
  }

  revalidatePath('/admin/suppliers');
  revalidatePath(`/admin/suppliers/${result.supplierId}`);
  return { status: 'success', message: 'Supplier review saved.' };
}

export async function linkSupplierOwnerAction(
  _previousState: SupplierActionState,
  formData: FormData
): Promise<SupplierActionState> {
  const result = await linkAdminSupplierOwner(formData);

  if (!result.success) {
    return { status: 'error', message: result.message };
  }

  revalidatePath(`/admin/suppliers/${result.supplierId}`);
  return {
    status: 'success',
    message: 'Verified account linked to this supplier.'
  };
}
