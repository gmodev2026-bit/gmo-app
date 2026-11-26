'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  requestClientDeletionAction,
  updateClientProfileAction
} from './actions';

type ActionState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
};

const initialState: ActionState = { status: 'idle' };

export function ClientAccountForms({
  name,
  email,
  phone,
  preferredContact,
  deletionRequestedAt
}: {
  name: string;
  email: string;
  phone: string;
  preferredContact: 'PHONE' | 'WHATSAPP';
  deletionRequestedAt: string | null;
}) {
  const [profileState, updateProfile, updatingProfile] = useActionState(
    updateClientProfileAction,
    initialState
  );
  const [deletionState, requestDeletion, requestingDeletion] = useActionState(
    requestClientDeletionAction,
    initialState
  );

  return (
    <>
      <form action={updateProfile} className='mt-8 space-y-5'>
        <label htmlFor='client-name' className='grid gap-2 text-sm font-medium'>
          Name
          <Input
            id='client-name'
            name='name'
            defaultValue={name}
            required
            minLength={2}
            maxLength={100}
          />
        </label>
        <label
          htmlFor='client-email'
          className='grid gap-2 text-sm font-medium'
        >
          Email
          <Input id='client-email' value={email} readOnly />
        </label>
        <label
          htmlFor='client-phone'
          className='grid gap-2 text-sm font-medium'
        >
          Phone (optional)
          <Input
            id='client-phone'
            name='phone'
            type='tel'
            autoComplete='tel'
            defaultValue={phone}
            placeholder='+27'
            maxLength={20}
          />
        </label>
        <label
          htmlFor='client-preferred-contact'
          className='grid gap-2 text-sm font-medium'
        >
          Preferred contact
          <select
            id='client-preferred-contact'
            name='preferredContact'
            defaultValue={preferredContact}
            className='border-input bg-background h-10 rounded-md border px-3 text-sm'
          >
            <option value='PHONE'>Phone</option>
            <option value='WHATSAPP'>WhatsApp</option>
          </select>
        </label>
        <Button type='submit' disabled={updatingProfile}>
          {updatingProfile ? 'Saving…' : 'Save profile'}
        </Button>
        <ActionFeedback state={profileState} />
      </form>

      <section className='border-destructive/30 mt-10 rounded-2xl border p-5'>
        <h2 className='font-semibold'>Privacy action</h2>
        <p className='text-muted-foreground mt-2 text-sm'>
          Request account deletion. GMO will verify identity and apply the
          approved legal retention schedule.
        </p>
        {deletionRequestedAt ? (
          <p className='mt-4 text-sm' role='status'>
            Your account deletion request has been recorded.
          </p>
        ) : (
          <form action={requestDeletion} className='mt-4 space-y-3'>
            <label
              htmlFor='deletion-reason'
              className='grid gap-2 text-sm font-medium'
            >
              Reason (optional)
              <Input id='deletion-reason' name='reason' maxLength={500} />
            </label>
            <Button
              type='submit'
              variant='destructive'
              disabled={requestingDeletion}
            >
              {requestingDeletion ? 'Submitting…' : 'Request account deletion'}
            </Button>
            <ActionFeedback state={deletionState} />
          </form>
        )}
      </section>
    </>
  );
}

function ActionFeedback({ state }: { state: ActionState }) {
  if (!state.message) return null;

  return (
    <p
      role={state.status === 'error' ? 'alert' : 'status'}
      aria-live='polite'
      className={
        state.status === 'error'
          ? 'text-destructive text-sm'
          : 'text-primary text-sm'
      }
    >
      {state.message}
    </p>
  );
}
