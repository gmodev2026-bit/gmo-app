'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { scheduleFollowUpAction } from '../follow-ups/actions';

type Activity = {
  id: string;
  type: string;
  channel: string;
  status: string;
  outcome: string | null;
  summary: string;
  scheduledAt: Date | null;
  occurredAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  actor: { name: string };
  leadAssignment: { supplier: { businessName: string } } | null;
};

type Assignment = {
  id: string;
  supplier: { businessName: string };
};

type ActionState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
};

const idleState: ActionState = { status: 'idle' };

export function FollowUpPanel({
  enquiryId,
  assignments,
  activities
}: {
  enquiryId: string;
  assignments: Assignment[];
  activities: Activity[];
}) {
  const [state, action, pending] = useActionState(
    scheduleFollowUpAction,
    idleState
  );

  return (
    <section className='border-border bg-card space-y-6 rounded-2xl border p-5 sm:p-6'>
      <header>
        <h2 className='text-lg font-semibold'>Follow-up activity</h2>
        <p className='text-muted-foreground mt-1 text-sm'>
          Record service follow-up, supplier introduction and customer outcomes.
          Do not store marketing consent or full message bodies here.
        </p>
      </header>

      <form action={action} className='space-y-4'>
        <input type='hidden' name='enquiryId' value={enquiryId} />

        <label className='block text-sm'>
          <span className='mb-2 block font-medium'>Related supplier</span>
          <select
            name='leadAssignmentId'
            defaultValue=''
            className='border-input bg-background h-10 w-full rounded-xl border px-3'
          >
            <option value=''>Customer or general enquiry</option>
            {assignments.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.supplier.businessName}
              </option>
            ))}
          </select>
        </label>

        <div className='grid gap-4 sm:grid-cols-2'>
          <label className='block text-sm'>
            <span className='mb-2 block font-medium'>Channel</span>
            <select
              name='channel'
              defaultValue='PHONE'
              className='border-input bg-background h-10 w-full rounded-xl border px-3'
            >
              <option value='INTERNAL'>Internal</option>
              <option value='PHONE'>Phone</option>
              <option value='EMAIL'>Email</option>
              <option value='WHATSAPP'>WhatsApp</option>
              <option value='SMS'>SMS</option>
              <option value='IN_PERSON'>In person</option>
              <option value='OTHER'>Other</option>
            </select>
          </label>

          <label className='block text-sm'>
            <span className='mb-2 block font-medium'>Scheduled time</span>
            <input
              type='datetime-local'
              name='scheduledAt'
              required
              className='border-input bg-background h-10 w-full rounded-xl border px-3'
            />
          </label>
        </div>

        <label className='block text-sm'>
          <span className='mb-2 block font-medium'>Operational summary</span>
          <textarea
            name='summary'
            required
            minLength={5}
            maxLength={500}
            rows={3}
            placeholder='Record the next action or attempt without storing unnecessary personal details.'
            className='border-input bg-background w-full rounded-xl border px-3 py-2'
          />
        </label>

        {state.message && (
          <p
            aria-live='polite'
            className={
              state.status === 'error'
                ? 'text-destructive text-sm'
                : 'text-primary text-sm'
            }
          >
            {state.message}
          </p>
        )}

        <Button type='submit' variant='outline' size='sm' disabled={pending}>
          {pending ? 'Scheduling…' : 'Schedule follow-up'}
        </Button>
      </form>

      <div className='border-border border-t pt-5'>
        <h3 className='font-medium'>Activity history</h3>
        {activities.length === 0 ? (
          <p className='text-muted-foreground mt-3 text-sm'>
            No follow-up activity recorded.
          </p>
        ) : (
          <ol className='mt-4 space-y-4'>
            {activities.map((activity) => (
              <li key={activity.id} className='border-border border-l-2 pl-4'>
                <p className='text-sm font-medium'>
                  {activityLabel(activity)}
                  {activity.leadAssignment
                    ? ` · ${activity.leadAssignment.supplier.businessName}`
                    : ''}
                </p>
                <p className='mt-1 text-sm leading-6'>{activity.summary}</p>
                <p className='text-muted-foreground mt-1 text-xs'>
                  {activity.actor.name} · {formatDate(activity.createdAt)}
                  {activity.scheduledAt
                    ? ` · Due ${formatDate(activity.scheduledAt)}`
                    : ''}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function activityLabel(activity: Activity) {
  const status =
    activity.status === 'OPEN'
      ? 'Open'
      : activity.status === 'COMPLETED'
        ? 'Completed'
        : 'Cancelled';
  return `${activity.type.replaceAll('_', ' ').toLowerCase()} · ${activity.channel.toLowerCase()} · ${status}`;
}

function formatDate(date: Date) {
  return date.toLocaleString('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Johannesburg'
  });
}
