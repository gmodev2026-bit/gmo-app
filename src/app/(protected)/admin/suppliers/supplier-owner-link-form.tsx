'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import type { SupplierActionState } from '@/features/suppliers/action-state';
import { linkSupplierOwnerAction } from './actions';

const initialState: SupplierActionState = { status: 'idle' };

export function SupplierOwnerLinkForm({
  supplierId
}: {
  supplierId: string;
}) {
  const [state, formAction, pending] = useActionState(
    linkSupplierOwnerAction,
    initialState
  );

  return (
    <form action={formAction} className='space-y-4'>
      <input type='hidden' name='supplierId' value={supplierId} />
      <div className='space-y-2'>
        <label
          htmlFor='supplier-owner-email'
          className='text-sm font-medium'
        >
          Account email
        </label>
        <input
          id='supplier-owner-email'
          name='email'
          type='email'
          autoComplete='email'
          required
          maxLength={254}
          className='border-input bg-background focus-visible:ring-ring h-11 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2'
          placeholder='provider@example.com'
        />
      </div>

      <p className='text-muted-foreground text-xs leading-5'>
        The provider must already have a GrowMeOnline account with a verified
        email. Email verification does not approve or verify the supplier.
      </p>

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
        {pending ? 'Linking account…' : 'Link verified account'}
      </Button>
    </form>
  );
}
