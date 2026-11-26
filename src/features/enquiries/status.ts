import type { EnquiryStatus } from '@/generated/prisma/client';

const allowedTransitions: Partial<
  Record<EnquiryStatus, readonly EnquiryStatus[]>
> = {
  PENDING_REVIEW: [
    'NEEDS_INFORMATION',
    'QUALIFIED',
    'REJECTED',
    'REJECTED_SPAM'
  ],
  NEEDS_INFORMATION: [
    'PENDING_REVIEW',
    'QUALIFIED',
    'REJECTED',
    'REJECTED_SPAM'
  ],
  QUALIFIED: ['MATCHING', 'NEEDS_INFORMATION', 'REJECTED', 'REJECTED_SPAM'],
  MATCHING: ['DISPATCHED', 'NEEDS_INFORMATION', 'REJECTED', 'REJECTED_SPAM'],
  DISPATCHED: ['CLOSED'],
  CLOSED: []
};

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  PENDING_REVIEW: 'Pending review',
  NEEDS_INFORMATION: 'Needs information',
  QUALIFIED: 'Qualified',
  REJECTED: 'Rejected',
  REJECTED_SPAM: 'Rejected as spam',
  MATCHING: 'Matching',
  DISPATCHED: 'Dispatched',
  CLOSED: 'Closed'
};

export function getAllowedEnquiryTransitions(
  status: EnquiryStatus
): readonly EnquiryStatus[] {
  return allowedTransitions[status] ?? [];
}
