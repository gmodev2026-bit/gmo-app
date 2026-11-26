'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { resolveFollowUpAction } from './actions';

type ActionState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
};

const idleState: ActionState = { status: 'idle' };

export function FollowUpQueue({ activityId }: { activityId: string }) {
  const [state, action, pending] = useActionState(
    resolveFollowUpAction,
    idleState
  );

  return (
    <form action={action} className='mt-5 grid gap-3 border-t pt-5 sm:grid-cols-[14rem_minmax(0,1fr)_auto]'>
      <input type='hidden' name='activityId' value={activityId} />
      <label className='text-sm'>
        <span className='mb-2 block font-medium'>Outcome</span>
        <select
          name='outcome'
          defaultValue='REACHED'
          className='border-input bg-background h-10 w-full rounded-xl border px-3'
        >
          <option value='REACHED'>Reached</option>
          <option value='NO_ANSWER'>No answer</option>
          <option value='UNAVAILABLE'>Unavailable</option>
          <option value='NEEDS_MORE_INFORMATION'>Needs more information</option>
          <option value='APPOINTMENT_PROPOSED'>Appointment proposed</option>
          <option value='APPOINTMENT_BOOKED'>Appointment booked</option>
          <option value='QUOTE_REQUESTED'>Quote requested</option>
          <option value='QUOTE_RECEIVED'>Quote received</option>
          <option value='JOB_REPORTED_WON'>Job reported won</option>
          <option value='JOB_REPORTED_LOST'>Job reported lost</option>
          <option value='COMPLETED'>Completed</option>
          <option value='CANCELLED'>Cancelled</option>
          <option value='FEEDBACK_RECORDED'>Feedback recorded</option>
        </select>
      </label>
      <label className='text-sm'>
        <span className='mb-2 block font-medium'>Outcome summary</span>
        <input
          name='summary'
          required
          minLength={5}
          maxLength={500}
          placeholder='Short operational note'
          className='border-input bg-background h-10 w-full rounded-xl border px-3'
        />
      </label>
      <div className='flex items-end'>
        <Button type='submit' size='sm' disabled={pending}>
          {pending ? 'Saving…' : 'Resolve'}
        </Button>
      </div>
      {state.message && (
        <p
          aria-live='polite'
          className={
            state.status === 'error'
              ? 'text-destructive text-sm sm:col-span-3'
              : 'text-primary text-sm sm:col-span-3'
          }
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
