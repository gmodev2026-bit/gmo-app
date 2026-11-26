import type { EnquiryStatus } from '@/generated/prisma/client';
import { ENQUIRY_STATUS_LABELS } from '@/features/enquiries/status';

export function StatusBadge({ status }: { status: EnquiryStatus }) {
  return (
    <span className='bg-muted text-foreground inline-flex rounded-full px-2.5 py-1 text-xs font-medium'>
      {ENQUIRY_STATUS_LABELS[status]}
    </span>
  );
}
