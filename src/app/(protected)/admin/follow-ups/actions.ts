'use server';

import { revalidatePath } from 'next/cache';
import {
  resolveLeadFollowUp,
  scheduleLeadFollowUp
} from '@/server/admin/follow-ups';

export async function scheduleFollowUpAction(
  _previousState: { status: 'idle' | 'success' | 'error'; message?: string },
  formData: FormData
) {
  const result = await scheduleLeadFollowUp(formData);
  if (result.status === 'success') {
    const enquiryId = formData.get('enquiryId');
    if (typeof enquiryId === 'string') {
      revalidatePath(`/admin/enquiries/${enquiryId}`);
    }
    revalidatePath('/admin/follow-ups');
  }
  return result;
}

export async function resolveFollowUpAction(
  _previousState: { status: 'idle' | 'success' | 'error'; message?: string },
  formData: FormData
) {
  const result = await resolveLeadFollowUp(formData);
  if (result.status === 'success') {
    revalidatePath('/admin/follow-ups');
  }
  return result;
}
