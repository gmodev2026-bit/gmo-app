'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import type { SupplierStatus } from '@/generated/prisma/client';
import { saveSupplierContactVisibilityAction } from './actions';

type VisibilityPreferences = {
  isContactNamePublic: boolean;
  isPhonePublic: boolean;
  isEmailPublic: boolean;
  isWebsitePublic: boolean;
};

type ActionState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
};

const initialState: ActionState = { status: 'idle' };

export function SupplierContactVisibilityForm({
  preferences,
  status
}: {
  preferences: VisibilityPreferences;
  status: SupplierStatus;
}) {
  const [state, formAction, pending] = useActionState(
    saveSupplierContactVisibilityAction,
    initialState
  );

  return (
    <section className='border-border rounded-2xl border p-5'>
      <h2 className='font-semibold'>Public contact details</h2>
      <p className='text-muted-foreground mt-2 text-sm'>
        Contact name, phone, email, and website are private unless you opt in.
        You can hide details at any time. While review is pending, you can hide
        existing details but cannot make new fields public.
      </p>
      <form action={formAction} className='mt-4 space-y-3'>
        <VisibilityCheckbox
          name='isContactNamePublic'
          label='Show contact name'
          checked={preferences.isContactNamePublic}
          disabled={status === 'PENDING_APPROVAL'}
        />
        <VisibilityCheckbox
          name='isPhonePublic'
          label='Show phone number'
          checked={preferences.isPhonePublic}
          disabled={status === 'PENDING_APPROVAL'}
        />
        <VisibilityCheckbox
          name='isEmailPublic'
          label='Show email address'
          checked={preferences.isEmailPublic}
          disabled={status === 'PENDING_APPROVAL'}
        />
        <VisibilityCheckbox
          name='isWebsitePublic'
          label='Show website'
          checked={preferences.isWebsitePublic}
          disabled={status === 'PENDING_APPROVAL'}
        />
        <Button type='submit' disabled={pending}>
          {pending ? 'Saving…' : 'Save contact preferences'}
        </Button>
      </form>
      {state.message && (
        <p
          aria-live='polite'
          className={
            state.status === 'error'
              ? 'text-destructive mt-3 text-sm'
              : 'text-primary mt-3 text-sm'
          }
        >
          {state.message}
        </p>
      )}
    </section>
  );
}

function VisibilityCheckbox({
  name,
  label,
  checked,
  disabled
}: {
  name: keyof VisibilityPreferences;
  label: string;
  checked: boolean;
  disabled: boolean;
}) {
  return (
    <label className='flex items-center gap-2 text-sm'>
      <input
        type='checkbox'
        name={name}
        defaultChecked={checked}
        disabled={disabled && !checked}
      />
      {label}
    </label>
  );
}
