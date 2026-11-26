'use server';

import { revalidatePath } from 'next/cache';
import {
  dispatchAdminEnquiry,
  recordEnquiryContactVerification,
  recordSupplierAvailability,
  updateAdminEnquiryStatus
} from '@/server/admin/enquiries';
import type { EnquiryReviewActionState } from '@/features/enquiries/review-state';

export async function updateEnquiryStatusAction(
  _previousState: EnquiryReviewActionState,
  formData: FormData
): Promise<EnquiryReviewActionState> {
  const result = await updateAdminEnquiryStatus(formData);

  if (result.status === 'success') {
    revalidatePath('/admin/enquiries');
    const enquiryId = formData.get('enquiryId');
    if (typeof enquiryId === 'string') {
      revalidatePath(`/admin/enquiries/${enquiryId}`);
    }
  }

  return result;
}

export async function recordAvailabilityAction(
  _previousState: { status: 'idle' | 'success' | 'error'; message?: string },
  formData: FormData
) {
  const result = await recordSupplierAvailability(formData);
  if (result.status === 'success') {
    const enquiryId = formData.get('enquiryId');
    if (typeof enquiryId === 'string') {
      revalidatePath(`/admin/enquiries/${enquiryId}`);
    }
  }
  return result;
}

export async function recordContactVerificationAction(
  _previousState: { status: 'idle' | 'success' | 'error'; message?: string },
  formData: FormData
) {
  const result = await recordEnquiryContactVerification(formData);
  if (result.status === 'success') {
    const enquiryId = formData.get('enquiryId');
    if (typeof enquiryId === 'string') {
      revalidatePath(`/admin/enquiries/${enquiryId}`);
    }
  }
  return result;
}

export async function dispatchEnquiryAction(
  _previousState: { status: 'idle' | 'success' | 'error'; message?: string },
  formData: FormData
) {
  const result = await dispatchAdminEnquiry(formData);
  if (result.status === 'success') {
    revalidatePath('/admin/enquiries');
    const enquiryId = formData.get('enquiryId');
    if (typeof enquiryId === 'string') {
      revalidatePath(`/admin/enquiries/${enquiryId}`);
    }
  }
  return result;
}
