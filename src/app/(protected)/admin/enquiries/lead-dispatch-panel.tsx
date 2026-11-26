'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import {
  dispatchEnquiryAction,
  recordAvailabilityAction
} from './actions';

type Match = {
  id: string;
  businessName: string;
  phone: string;
};

type ExcludedMatch = {
  id: string;
  businessName: string;
  reasons: string[];
};

type Assignment = {
  id: string;
  status: 'PENDING_AVAILABILITY' | 'CONFIRMED' | 'DISPATCHED' | 'CANCELLED';
  supplier: { id: string; businessName: string; phone: string };
  availabilityResponses: Array<{
    response:
      | 'AVAILABLE'
      | 'UNAVAILABLE'
      | 'NO_RESPONSE'
      | 'NEEDS_CLARIFICATION';
    note: string | null;
    createdAt: Date;
    actor: { name: string };
  }>;
};

type ActionState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
};

const idleState: ActionState = { status: 'idle' };

export function LeadDispatchPanel({
  enquiryId,
  enquiryStatus,
  isSupplierSpecific,
  matches,
  excluded,
  assignments,
  canDispatch
}: {
  enquiryId: string;
  enquiryStatus: string;
  isSupplierSpecific: boolean;
  matches: Match[];
  excluded: ExcludedMatch[];
  assignments: Assignment[];
  canDispatch: boolean;
}) {
  const [dispatchState, dispatchAction, dispatchPending] = useActionState(
    dispatchEnquiryAction,
    idleState
  );

  return (
    <section className='border-border bg-card space-y-6 rounded-2xl border p-5 sm:p-6'>
      <header>
        <h2 className='text-lg font-semibold'>Deterministic matches</h2>
        <p className='text-muted-foreground mt-1 text-sm'>
          Eligible suppliers must be approved, verified and confirmed for this
          service and city.
        </p>
        {isSupplierSpecific && (
          <p className='text-muted-foreground mt-2 text-sm'>
            This request is for a specific supplier. Ask the customer before
            offering an alternative provider.
          </p>
        )}
      </header>

      {matches.length === 0 ? (
        <p className='text-muted-foreground text-sm'>
          No approved, verified supplier currently matches this request.
        </p>
      ) : (
        <div className='space-y-4'>
          {matches.map((supplier) => {
            const assignment = assignments.find(
              (item) => item.supplier.id === supplier.id
            );
            const latest = assignment?.availabilityResponses[0];

            return (
              <article
                key={supplier.id}
                className='border-border rounded-xl border p-4'
              >
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <p className='font-medium'>{supplier.businessName}</p>
                    <p className='text-muted-foreground mt-1 text-sm'>
                      {supplier.phone}
                    </p>
                  </div>
                  {latest && (
                    <span className='text-muted-foreground text-xs'>
                      {availabilityLabel(latest.response)}
                    </span>
                  )}
                </div>

                {assignment?.status !== 'DISPATCHED' && (
                  <AvailabilityForm
                    enquiryId={enquiryId}
                    supplierId={supplier.id}
                  />
                )}
              </article>
            );
          })}
        </div>
      )}

      {excluded.length > 0 && (
        <details className='border-border border-t pt-4'>
          <summary className='cursor-pointer text-sm font-medium'>
            Why {excluded.length} supplier{excluded.length === 1 ? ' was' : 's were'} excluded
          </summary>
          <ul className='text-muted-foreground mt-3 space-y-2 text-sm'>
            {excluded.map((supplier) => (
              <li key={supplier.id}>
                <span className='font-medium'>{supplier.businessName}</span>
                <span> — {supplier.reasons.join('; ')}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {dispatchState.message && (
        <p
          aria-live='polite'
          className={
            dispatchState.status === 'error'
              ? 'border-destructive/40 bg-destructive/5 text-destructive rounded-xl border px-3 py-2 text-sm'
              : 'border-primary/30 bg-primary/5 text-primary rounded-xl border px-3 py-2 text-sm'
          }
        >
          {dispatchState.message}
        </p>
      )}

      {!canDispatch && (
        <p className='border-border bg-muted/40 text-muted-foreground rounded-xl border px-3 py-2 text-sm'>
          Dispatch is blocked until customer contact is verified and explicit
          sharing approval is recorded.
        </p>
      )}

      {['QUALIFIED', 'MATCHING'].includes(enquiryStatus) &&
        matches.length > 0 && (
          <form action={dispatchAction} className='space-y-4 border-t pt-5'>
            <input type='hidden' name='enquiryId' value={enquiryId} />
            <p className='text-sm font-medium'>
              Confirm dispatch to available suppliers
            </p>
            <div className='space-y-2'>
              {matches.map((supplier) => {
                const assignment = assignments.find(
                  (item) => item.supplier.id === supplier.id
                );
                const latest = assignment?.availabilityResponses[0];
                const available =
                  assignment?.status !== 'DISPATCHED' &&
                  latest?.response === 'AVAILABLE';

                return (
                  <label
                    key={supplier.id}
                    className='flex items-center gap-3 text-sm'
                  >
                    <input
                      type='checkbox'
                      name='supplierIds'
                      value={supplier.id}
                      disabled={!available || !canDispatch}
                      className='accent-primary size-4'
                    />
                    <span>{supplier.businessName}</span>
                    {!available && (
                      <span className='text-muted-foreground'>
                        — availability not confirmed
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            <Button type='submit' disabled={dispatchPending || !canDispatch}>
              {dispatchPending ? 'Dispatching…' : 'Confirm dispatch'}
            </Button>
          </form>
        )}
    </section>
  );
}

function AvailabilityForm({
  enquiryId,
  supplierId
}: {
  enquiryId: string;
  supplierId: string;
}) {
  const [state, action, pending] = useActionState(
    recordAvailabilityAction,
    idleState
  );

  return (
    <form action={action} className='mt-4 space-y-3 border-t pt-4'>
      <input type='hidden' name='enquiryId' value={enquiryId} />
      <input type='hidden' name='supplierId' value={supplierId} />
      <label className='block text-sm'>
        <span className='mb-2 block font-medium'>Availability response</span>
        <select
          name='response'
          defaultValue='AVAILABLE'
          className='border-input bg-background h-10 w-full rounded-xl border px-3'
        >
          <option value='AVAILABLE'>Available</option>
          <option value='UNAVAILABLE'>Unavailable</option>
          <option value='NO_RESPONSE'>No response</option>
          <option value='NEEDS_CLARIFICATION'>Needs clarification</option>
        </select>
      </label>
      <label className='block text-sm'>
        <span className='mb-2 block font-medium'>Note</span>
        <textarea
          name='note'
          maxLength={500}
          rows={2}
          className='border-input bg-background w-full rounded-xl border px-3 py-2'
        />
      </label>
      {state.message && (
        <p
          aria-live='polite'
          className='text-muted-foreground text-sm'
        >
          {state.message}
        </p>
      )}
      <Button type='submit' variant='outline' size='sm' disabled={pending}>
        {pending ? 'Saving…' : 'Record response'}
      </Button>
    </form>
  );
}

function availabilityLabel(
  response:
    | 'AVAILABLE'
    | 'UNAVAILABLE'
    | 'NO_RESPONSE'
    | 'NEEDS_CLARIFICATION'
) {
  const labels = {
    AVAILABLE: 'Available',
    UNAVAILABLE: 'Unavailable',
    NO_RESPONSE: 'No response',
    NEEDS_CLARIFICATION: 'Needs clarification'
  };
  return labels[response];
}
