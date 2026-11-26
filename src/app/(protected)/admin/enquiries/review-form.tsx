'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getAllowedEnquiryTransitions } from '@/features/enquiries/status';
import type { EnquiryReviewActionState } from '@/features/enquiries/review-state';
import type { EnquiryStatus } from '@/generated/prisma/client';
import { updateEnquiryStatusAction } from './actions';
import { ENQUIRY_STATUS_LABELS } from '@/features/enquiries/status';

const initialState: EnquiryReviewActionState = { status: 'idle' };

export function ReviewForm({
  enquiryId,
  currentStatus
}: {
  enquiryId: string;
  currentStatus: EnquiryStatus;
}) {
  const [state, formAction, pending] = useActionState(
    updateEnquiryStatusAction,
    initialState
  );
  const nextStatuses = getAllowedEnquiryTransitions(currentStatus);

  if (nextStatuses.length === 0) {
    return (
      <p className='text-muted-foreground text-sm'>
        No review actions are available for this status.
      </p>
    );
  }

  return (
    <form action={formAction} className='space-y-4'>
      <input type='hidden' name='enquiryId' value={enquiryId} />

      <div className='space-y-2'>
        <label htmlFor='toStatus' className='text-sm font-medium'>
          Next status
        </label>
        <select
          id='toStatus'
          name='toStatus'
          required
          defaultValue=''
          className='border-input bg-background focus-visible:ring-ring h-11 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2'
        >
          <option value='' disabled>
            Choose an action
          </option>
          {nextStatuses.map((status) => (
            <option key={status} value={status}>
              {ENQUIRY_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div className='space-y-2'>
        <label htmlFor='reason' className='text-sm font-medium'>
          Review reason
        </label>
        <Textarea
          id='reason'
          name='reason'
          required
          minLength={5}
          maxLength={500}
          rows={4}
          placeholder='Record the operational reason for this status change.'
        />
        <p className='text-muted-foreground text-xs leading-5'>
          Keep the note concise. Do not repeat customer contact details here.
        </p>
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
