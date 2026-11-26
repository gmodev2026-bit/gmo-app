'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  PILOT_CATEGORIES,
  PILOT_CITIES
} from '@/features/enquiries/pilot-catalog';
import type {
  EnquiryActionState,
  EnquiryFormField
} from '@/features/enquiries/form-state';
import { recordFormOpened, submitEnquiry } from './actions';

const initialState: EnquiryActionState = { status: 'idle' };

export function RequestForm({
  submissionKey,
  attribution,
  targetSupplier
}: {
  submissionKey: string;
  attribution: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
  targetSupplier?: {
    id: string;
    businessName: string;
  };
}) {
  const [state, formAction, pending] = useActionState(
    submitEnquiry,
    initialState
  );
  const openedRecorded = useRef(false);
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    if (openedRecorded.current) return;
    openedRecorded.current = true;
    void recordFormOpened(submissionKey, attribution);
  }, [submissionKey, attribution]);

  if (state.status === 'success') {
    return (
      <section aria-live='polite' className='py-6'>
        <p className='text-primary text-sm font-semibold'>Request received</p>
        <h2 className='mt-2 text-2xl font-semibold'>We’ll review it next.</h2>
        <p className='text-muted-foreground mt-3 leading-7'>
          Our team reviews requests during staffed hours. Keep this reference if
          you contact us about your request.
        </p>
        <p className='border-border bg-muted/50 mt-6 rounded-xl border px-4 py-3 font-mono text-sm'>
          {state.reference}
        </p>
      </section>
    );
  }

  return (
    <form action={formAction} className='space-y-7'>
      <input type='hidden' name='submissionKey' value={submissionKey} />
      {targetSupplier && (
        <>
          <input type='hidden' name='targetSupplierId' value={targetSupplier.id} />
          <input
            type='hidden'
            name='entryChannel'
            value='PERSONAL_BUSINESS_PAGE'
          />
        </>
      )}
      {targetSupplier && (
        <div className='border-primary/30 bg-primary/5 rounded-xl border px-4 py-3 text-sm'>
          Requesting <strong>{targetSupplier.businessName}</strong>. GrowMeOnline
          will review the request before dispatch.
        </div>
      )}
      {attribution.utmSource && (
        <input type='hidden' name='utmSource' value={attribution.utmSource} />
      )}
      {attribution.utmMedium && (
        <input type='hidden' name='utmMedium' value={attribution.utmMedium} />
      )}
      {attribution.utmCampaign && (
        <input type='hidden' name='utmCampaign' value={attribution.utmCampaign} />
      )}

      <div
        aria-hidden='true'
        className='absolute -left-[10000px] size-px overflow-hidden'
      >
        <label htmlFor='website'>Leave this field empty</label>
        <input
          id='website'
          name='website'
          type='text'
          tabIndex={-1}
          autoComplete='off'
        />
      </div>

      {state.message && (
        <p
          aria-live='polite'
          className='border-destructive/40 bg-destructive/5 text-destructive rounded-xl border px-4 py-3 text-sm'
        >
          {state.message}
        </p>
      )}

      <div className='grid gap-6 sm:grid-cols-2'>
        <FormField
          id='categoryId'
          label='What kind of help do you need?'
          error={state.fieldErrors?.categoryId}
        >
          <select
            id='categoryId'
            name='categoryId'
            required
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            aria-invalid={Boolean(state.fieldErrors?.categoryId)}
            aria-describedby={
              state.fieldErrors?.categoryId ? 'categoryId-error' : undefined
            }
            className='border-input bg-background focus-visible:ring-ring h-12 w-full rounded-2xl border px-3 text-base outline-none focus-visible:ring-2'
          >
            <option value='' disabled>
              Select a service
            </option>
            {PILOT_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          id='cityId'
          label='Where is the work?'
          error={state.fieldErrors?.cityId}
        >
          <select
            id='cityId'
            name='cityId'
            required
            defaultValue=''
            aria-invalid={Boolean(state.fieldErrors?.cityId)}
            aria-describedby={
              state.fieldErrors?.cityId ? 'cityId-error' : undefined
            }
            className='border-input bg-background focus-visible:ring-ring h-12 w-full rounded-2xl border px-3 text-base outline-none focus-visible:ring-2'
          >
            <option value='' disabled>
              Select an area
            </option>
            {PILOT_CITIES.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField
        id='jobDescription'
        label='Describe the work'
        hint='Include what is happening, when you need help, and any useful details. Please don’t include sensitive information.'
        error={state.fieldErrors?.jobDescription}
      >
        <textarea
          id='jobDescription'
          name='jobDescription'
          required
          minLength={20}
          maxLength={2000}
          rows={5}
          aria-invalid={Boolean(state.fieldErrors?.jobDescription)}
          aria-describedby={
            state.fieldErrors?.jobDescription
              ? 'jobDescription-error'
              : 'jobDescription-hint'
          }
          className='border-input bg-background focus-visible:ring-ring w-full resize-y rounded-2xl border px-3 py-3 text-base outline-none focus-visible:ring-2'
        />
      </FormField>

      <div className='grid gap-6 sm:grid-cols-2'>
        <FormField
          id='urgency'
          label='When do you need help?'
          error={state.fieldErrors?.urgency}
        >
          <select
            id='urgency'
            name='urgency'
            required
            defaultValue=''
            className='border-input bg-background focus-visible:ring-ring h-12 w-full rounded-2xl border px-3 text-base outline-none focus-visible:ring-2'
          >
            <option value='' disabled>
              Select timing
            </option>
            <option value='FLEXIBLE'>I am flexible</option>
            <option value='WITHIN_WEEK'>Within the next week</option>
            <option value='WITHIN_MONTH'>Within the next month</option>
            <option value='SPECIFIC_DATE'>I have a specific date</option>
          </select>
        </FormField>

        <FormField
          id='materialsResponsibility'
          label='Who should provide materials?'
          error={state.fieldErrors?.materialsResponsibility}
        >
          <select
            id='materialsResponsibility'
            name='materialsResponsibility'
            required
            defaultValue=''
            className='border-input bg-background focus-visible:ring-ring h-12 w-full rounded-2xl border px-3 text-base outline-none focus-visible:ring-2'
          >
            <option value='' disabled>
              Select an option
            </option>
            <option value='CUSTOMER'>I will provide materials</option>
            <option value='SUPPLIER'>The provider should provide materials</option>
            <option value='NOT_SURE'>I am not sure</option>
          </select>
        </FormField>
      </div>

      {categoryId && (
        <div className='grid gap-6 sm:grid-cols-2'>
          <CategorySpecificFields
            categoryId={categoryId}
            error={state.fieldErrors}
          />
        </div>
      )}

      <div className='grid gap-6 sm:grid-cols-2'>
        <FormField
          id='customerName'
          label='Your name'
          error={state.fieldErrors?.customerName}
        >
          <Input
            id='customerName'
            name='customerName'
            autoComplete='name'
            required
            minLength={2}
            maxLength={100}
            aria-invalid={Boolean(state.fieldErrors?.customerName)}
            aria-describedby={
              state.fieldErrors?.customerName ? 'customerName-error' : undefined
            }
            className='border-input bg-background h-12 rounded-2xl px-3'
          />
        </FormField>

        <FormField
          id='customerPhone'
          label='Phone number'
          error={state.fieldErrors?.customerPhone}
        >
          <Input
            id='customerPhone'
            name='customerPhone'
            type='tel'
            autoComplete='tel'
            inputMode='tel'
            required
            maxLength={20}
            aria-invalid={Boolean(state.fieldErrors?.customerPhone)}
            aria-describedby={
              state.fieldErrors?.customerPhone
                ? 'customerPhone-error'
                : undefined
            }
            className='border-input bg-background h-12 rounded-2xl px-3'
          />
        </FormField>
      </div>

      <div className='grid gap-6 sm:grid-cols-2'>
        <FormField
          id='customerEmail'
          label='Email (optional)'
          error={state.fieldErrors?.customerEmail}
        >
          <Input
            id='customerEmail'
            name='customerEmail'
            type='email'
            autoComplete='email'
            maxLength={254}
            aria-invalid={Boolean(state.fieldErrors?.customerEmail)}
            aria-describedby={
              state.fieldErrors?.customerEmail
                ? 'customerEmail-error'
                : undefined
            }
            className='border-input bg-background h-12 rounded-2xl px-3'
          />
        </FormField>

        <FormField
          id='preferredContact'
          label='How should we contact you?'
          error={state.fieldErrors?.preferredContact}
        >
          <select
            id='preferredContact'
            name='preferredContact'
            required
            defaultValue='PHONE'
            aria-invalid={Boolean(state.fieldErrors?.preferredContact)}
            aria-describedby={
              state.fieldErrors?.preferredContact
                ? 'preferredContact-error'
                : undefined
            }
            className='border-input bg-background focus-visible:ring-ring h-12 w-full rounded-2xl border px-3 text-base outline-none focus-visible:ring-2'
          >
            <option value='PHONE'>Phone call</option>
            <option value='WHATSAPP'>WhatsApp</option>
          </select>
        </FormField>
      </div>

      <div>
        <label className='text-muted-foreground flex items-start gap-3 text-sm leading-6'>
          <input
            type='checkbox'
            name='privacyNotice'
            value='accepted'
            required
            aria-invalid={Boolean(state.fieldErrors?.privacyNotice)}
            aria-describedby={
              state.fieldErrors?.privacyNotice
                ? 'privacyNotice-error'
                : 'privacyNotice-description'
            }
            className='border-input accent-primary mt-1 size-4 shrink-0 rounded'
          />
          <span id='privacyNotice-description'>
            I understand GrowMeOnline will review this request and may share
            relevant details with up to three suitable providers if I choose to
            proceed. This is for handling my request, not marketing.
          </span>
        </label>
        {state.fieldErrors?.privacyNotice && (
          <p
            id='privacyNotice-error'
            className='text-destructive mt-2 text-sm'
            role='alert'
          >
            {state.fieldErrors.privacyNotice}
          </p>
        )}
      </div>

      <Button
        type='submit'
        disabled={pending}
        size='lg'
        className='h-12 w-full rounded-full text-base sm:w-auto sm:px-8'
      >
        {pending ? 'Sending request…' : 'Send request'}
      </Button>

      <p className='text-muted-foreground text-xs leading-5'>
        The pilot currently serves Johannesburg and Pretoria. This service is
        not for emergencies. Requests are reviewed during staffed hours.
      </p>
    </form>
  );
}

function CategorySpecificFields({
  categoryId,
  error
}: {
  categoryId: string;
  error?: Partial<Record<EnquiryFormField, string>>;
}) {
  const category = PILOT_CATEGORIES.find((item) => item.id === categoryId);
  if (!category) return null;

  const workOptions =
    category.slug === 'plumbing'
      ? [
          ['REPAIR', 'Repair'],
          ['INSTALLATION', 'Installation'],
          ['BLOCKAGE_OR_DRAIN', 'Blockage or drain'],
          ['GEYSER', 'Geyser'],
          ['OTHER', 'Other']
        ]
      : category.slug === 'electrical'
        ? [
            ['FAULT_OR_REPAIR', 'Fault or repair'],
            ['INSTALLATION', 'Installation'],
            ['LIGHTING', 'Lighting'],
            ['APPLIANCE', 'Appliance connection'],
            ['OTHER', 'Other']
          ]
        : [
            ['SMALL_REPAIR', 'Small repair'],
            ['INSTALLATION', 'Installation'],
            ['ASSEMBLY', 'Assembly'],
            ['MAINTENANCE', 'Maintenance'],
            ['OTHER', 'Other']
          ];

  const contextOptions =
    category.slug === 'plumbing'
      ? [
          ['GEYSER', 'Geyser'],
          ['BATHROOM', 'Bathroom'],
          ['SHOWER', 'Shower'],
          ['KITCHEN', 'Kitchen'],
          ['OUTDOOR', 'Outdoor'],
          ['OTHER', 'Other']
        ]
      : category.slug === 'electrical'
        ? [
            ['INTERIOR', 'Interior'],
            ['OUTDOOR', 'Outdoor'],
            ['DISTRIBUTION_BOARD', 'Distribution board'],
            ['APPLIANCE', 'Appliance'],
            ['OTHER', 'Other']
          ]
        : [
            ['INTERIOR', 'Interior'],
            ['OUTDOOR', 'Outdoor'],
            ['FURNITURE', 'Furniture'],
            ['MOUNTING', 'Mounting or assembly'],
            ['OTHER', 'Other']
          ];

  return (
    <>
      <FormField
        id='workType'
        label={`${category.name} work needed`}
        error={error?.workType}
      >
        <select
          id='workType'
          name='workType'
          required
          defaultValue=''
          className='border-input bg-background h-12 w-full rounded-2xl border px-3'
        >
          <option value='' disabled>
            Select work type
          </option>
          {workOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        id='locationContext'
        label='Where is the work?'
        error={error?.locationContext}
      >
        <select
          id='locationContext'
          name='locationContext'
          required
          defaultValue=''
          className='border-input bg-background h-12 w-full rounded-2xl border px-3'
        >
          <option value='' disabled>
            Select location
          </option>
          {contextOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </FormField>
    </>
  );
}

function FormField({
  id,
  label,
  hint,
  error,
  children
}: {
  id: EnquiryFormField;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className='space-y-2'>
      <label htmlFor={id} className='text-sm font-medium'>
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={hintId} className='text-muted-foreground text-xs leading-5'>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className='text-destructive text-sm' role='alert'>
          {error}
        </p>
      )}
    </div>
  );
}
