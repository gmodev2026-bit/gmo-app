'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import type { SupplierStatus } from '@/generated/prisma/client';
import type { SupplierActionState } from '@/features/suppliers/action-state';
import {
  getAllowedSupplierTransitions,
  SUPPLIER_STATUS_LABELS
} from '@/features/suppliers/status';
import { reviewSupplierAction } from './actions';

const initialState: SupplierActionState = { status: 'idle' };

export function SupplierReviewForm({
  supplierId,
  currentStatus,
  isVerified,
  isIndexable,
  verificationMethod
}: {
  supplierId: string;
  currentStatus: SupplierStatus;
  isVerified: boolean;
  isIndexable: boolean;
  verificationMethod: string;
}) {
  const [state, formAction, pending] = useActionState(
    reviewSupplierAction,
    initialState
  );
  const availableStatuses = [
    currentStatus,
    ...getAllowedSupplierTransitions(currentStatus)
  ];

  return (
    <form action={formAction} className='space-y-4'>
      <input type='hidden' name='supplierId' value={supplierId} />

      <div className='space-y-2'>
        <label htmlFor='supplier-status' className='text-sm font-medium'>
          Approval status
        </label>
        <select
          id='supplier-status'
          name='toStatus'
          required
          defaultValue={currentStatus}
          className={inputClassName}
        >
          {availableStatuses.map((status) => (
            <option key={status} value={status}>
              {SUPPLIER_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div className='space-y-2'>
        <label htmlFor='supplier-verification' className='text-sm font-medium'>
          Verification state
        </label>
        <select
          id='supplier-verification'
          name='isVerified'
          required
          defaultValue={String(isVerified)}
          className={inputClassName}
        >
          <option value='false'>Not verified</option>
          <option value='true'>Verified</option>
        </select>
      </div>

      <div className='space-y-2'>
        <label htmlFor='supplier-indexability' className='text-sm font-medium'>
          Public indexability
        </label>
        <select
          id='supplier-indexability'
          name='isIndexable'
          required
          defaultValue={String(isIndexable)}
          className={inputClassName}
        >
          <option value='false'>No index / private public visibility</option>
          <option value='true'>Indexable public profile</option>
        </select>
      </div>

      <div className='space-y-2'>
        <label htmlFor='verification-method' className='text-sm font-medium'>
          Verification method
        </label>
        <input
          id='verification-method'
          name='verificationMethod'
          maxLength={200}
          defaultValue={verificationMethod}
          placeholder='Describe what GMO actually checked'
          className={inputClassName}
        />
        <p className='text-muted-foreground text-xs leading-5'>
          Do not describe a business as independently verified unless that check
          was performed.
        </p>
      </div>

      <div className='space-y-2'>
        <label htmlFor='supplier-review-reason' className='text-sm font-medium'>
          Review reason
        </label>
        <textarea
          id='supplier-review-reason'
          name='reason'
          required
          minLength={5}
          maxLength={500}
          rows={3}
          className='border-input bg-background focus-visible:ring-ring w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2'
          placeholder='Record the operational reason for this change.'
        />
      </div>

      {state.message && (
        <p
          aria-live='polite'
          role={state.status === 'error' ? 'alert' : 'status'}
          className={
            state.status === 'error'
              ? 'text-destructive text-sm'
              : 'text-primary text-sm'
          }
        >
          {state.message}
        </p>
      )}

      <Button type='submit' disabled={pending} className='w-full'>
        {pending ? 'Saving review…' : 'Save review'}
      </Button>
    </form>
  );
}

const inputClassName =
  'border-input bg-background focus-visible:ring-ring h-11 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2';
