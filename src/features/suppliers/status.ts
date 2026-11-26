import type { SupplierStatus } from '@/generated/prisma/client';

export const SUPPLIER_STATUS_LABELS: Record<SupplierStatus, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending approval',
  CHANGES_REQUESTED: 'Changes requested',
  APPROVED: 'Approved',
  SUSPENDED: 'Suspended'
};

const allowedTransitions: Partial<
  Record<SupplierStatus, readonly SupplierStatus[]>
> = {
  DRAFT: ['PENDING_APPROVAL'],
  PENDING_APPROVAL: ['APPROVED', 'CHANGES_REQUESTED', 'SUSPENDED'],
  CHANGES_REQUESTED: ['PENDING_APPROVAL', 'SUSPENDED'],
  APPROVED: ['SUSPENDED'],
  SUSPENDED: ['PENDING_APPROVAL']
};

export function getAllowedSupplierTransitions(
  status: SupplierStatus
): readonly SupplierStatus[] {
  return allowedTransitions[status] ?? [];
}
