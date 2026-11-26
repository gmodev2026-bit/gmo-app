'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { recordContactVerificationAction } from './actions';

type ActionState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
};

const initialState: ActionState = { status: 'idle' };

export function ContactVerificationPanel({
  enquiryId,
  preferredContact,
  verifiedAt,
  verificationMethod,
  sharingApprovedAt
}: {
  enquiryId: string;
  preferredContact: 'PHONE' | 'WHATSAPP';
  verifiedAt: Date | null;
  verificationMethod: string | null;
  sharingApprovedAt: Date | null;
}) {
  const [state, formAction, pending] = useActionState(
    recordContactVerificationAction,
    initialState
  );
  const isComplete = Boolean(
    verifiedAt && verificationMethod && sharingApprovedAt
  );

  return (
    <div className='mt-5 border-t pt-4'>
      <h3 className='text-sm font-semibold'>Contact and sharing approval</h3>
      {isComplete ? (
        <p className='text-muted-foreground mt-2 text-sm'>
          Verified by{' '}
          {verificationMethod === 'WHATSAPP_MESSAGE'
            ? 'WhatsApp'
            : 'phone call'}{' '}
          on {formatDate(verifiedAt)}. Customer approval to share was recorded
          on {formatDate(sharingApprovedAt)}.
        </p>
      ) : (
        <>
          <p className='text-muted-foreground mt-2 text-sm'>
            Contact the customer through their selected channel, verify that it
            reaches them, and obtain their explicit approval before sharing
            relevant details with providers.
          </p>
          <form action={formAction} className='mt-4 space-y-3'>
            <input type='hidden' name='enquiryId' value={enquiryId} />
            <input
              type='hidden'
              name='verificationMethod'
              value={
                preferredContact === 'WHATSAPP'
                  ? 'WHATSAPP_MESSAGE'
                  : 'PHONE_CALL'
              }
            />
            <label className='flex items-start gap-3 text-sm leading-6'>
              <input
                type='checkbox'
                name='sharingApproval'
                value='confirmed'
                required
                className='accent-primary mt-1 size-4 shrink-0'
              />
              <span>
                I verified the selected contact channel and the customer
                explicitly approved sharing relevant request details with up
                to three suitable providers.
              </span>
            </label>
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
            <Button type='submit' variant='outline' disabled={pending}>
              {pending ? 'Recording…' : 'Record verification and approval'}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

function formatDate(date: Date | null) {
  return date
    ? date.toLocaleString('en-ZA', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Africa/Johannesburg'
      })
    : 'not recorded';
}
