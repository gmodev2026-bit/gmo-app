import type { SupplierStatus } from '@/generated/prisma/client';
import { SUPPLIER_STATUS_LABELS } from '@/features/suppliers/status';

const statusStyles: Record<SupplierStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  PENDING_APPROVAL: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  CHANGES_REQUESTED: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  APPROVED: 'bg-green-500/10 text-green-700 dark:text-green-300',
  SUSPENDED: 'bg-destructive/10 text-destructive'
};

export function SupplierStatusBadge({ status }: { status: SupplierStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}
    >
      {SUPPLIER_STATUS_LABELS[status]}
    </span>
  );
}
