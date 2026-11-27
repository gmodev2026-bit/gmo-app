'use client';

import { useActionState } from 'react';
import { submitContactMessage } from '@/server/contact';

const initialState = {
  status: 'idle',
  message: ''
} as const;

const inputClassName =
  'mt-2 h-11 w-full rounded-xl border border-[#dfe6ed] bg-white px-3 text-sm text-[#090f24] outline-none transition focus:border-[#135858] focus:ring-4 focus:ring-[#135858]/10';

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(
    submitContactMessage,
    initialState
  );

  return (
    <form
      action={formAction}
      className='rounded-3xl border border-[#e4eaf0] bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.06)] sm:p-7'
    >
      <div className='grid gap-4 sm:grid-cols-2'>
        <label className='text-sm font-medium text-[#090f24]'>
          Full name *
          <input
            required
            name='fullName'
            autoComplete='name'
            maxLength={120}
            className={inputClassName}
          />
        </label>
        <label className='text-sm font-medium text-[#090f24]'>
          Email *
          <input
            required
            name='email'
            type='email'
            autoComplete='email'
            maxLength={320}
            className={inputClassName}
          />
        </label>
        <label className='text-sm font-medium text-[#090f24]'>
          Phone (optional)
          <input
            name='phone'
            type='tel'
            autoComplete='tel'
            maxLength={40}
            className={inputClassName}
          />
        </label>
        <label className='text-sm font-medium text-[#090f24]'>
          Subject *
          <select
            required
            name='subject'
            defaultValue='General Enquiry'
            className={inputClassName}
          >
            <option>General Enquiry</option>
            <option>Supplier Support</option>
            <option>Customer Question</option>
            <option>Billing</option>
            <option>Other</option>
          </select>
        </label>
      </div>
      <label className='mt-4 block text-sm font-medium text-[#090f24]'>
        Message *
        <textarea
          required
          name='message'
          minLength={10}
          maxLength={4000}
          rows={5}
          className={`${inputClassName} h-auto min-h-32 resize-y py-3`}
        />
      </label>
      <div
        aria-hidden='true'
        className='absolute -left-[10000px] top-auto h-px w-px overflow-hidden'
      >
        <label>
          Company website
          <input
            name='companyWebsite'
            tabIndex={-1}
            autoComplete='off'
          />
        </label>
      </div>
      {state.message && (
        <p
          className={`mt-4 text-sm ${
            state.status === 'success' ? 'text-[#137a52]' : 'text-red-700'
          }`}
          role={state.status === 'error' ? 'alert' : 'status'}
          aria-live={state.status === 'error' ? 'assertive' : 'polite'}
        >
          {state.message}
        </p>
      )}
      <button
        type='submit'
        disabled={isPending}
        className='mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#135858] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#0f4b4b] disabled:cursor-not-allowed disabled:opacity-60'
      >
        {isPending ? 'Sending message…' : 'Send message'}
      </button>
    </form>
  );
}
