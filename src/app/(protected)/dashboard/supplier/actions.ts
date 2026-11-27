'use server';

import {
  saveSupplierDraft,
  saveSupplierContactVisibility,
  submitSupplierProfile
} from '@/server/supplier-portal';

export async function saveSupplierDraftAction(
  _previousState: { status: 'idle' | 'error' | 'success'; message?: string },
  formData: FormData
) {
  return saveSupplierDraft(formData);
}

export async function submitSupplierProfileAction(
  _previousState: { status: 'idle' | 'error' | 'success'; message?: string }
) {
  return submitSupplierProfile();
}

export async function saveSupplierContactVisibilityAction(
  _previousState: { status: 'idle' | 'error' | 'success'; message?: string },
  formData: FormData
) {
  return saveSupplierContactVisibility(formData);
}
