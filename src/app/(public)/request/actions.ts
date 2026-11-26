'use server';

import { createPublicEnquiry } from '@/server/enquiries';
import type { EnquiryActionState } from '@/features/enquiries/form-state';
import { recordFunnelEvent } from '@/server/funnel-events';

export async function submitEnquiry(
  previousState: EnquiryActionState,
  formData: FormData
): Promise<EnquiryActionState> {
  return createPublicEnquiry(previousState, formData);
}

export async function recordFormOpened(
  sessionKey: string,
  attribution: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }
) {
  await recordFunnelEvent({
    type: 'ENQUIRY_FORM_OPENED',
    sessionKey,
    attribution
  });
}
