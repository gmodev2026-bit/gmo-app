import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { SignupForm } from '@/app/(auth)/signup/signup-form';
import { RedirectIfAuthenticated } from '@/components/shared/redirect-if-authenticated';

export const metadata: Metadata = {
  title: 'List your business | GrowMeOnline',
  description:
    'Create a supplier account, submit your business profile for review, and get a public GrowMeOnline page after approval.'
};

export default function SupplierJoinPage() {
  return (
    <main className='bg-background min-h-screen px-5 py-8 sm:px-8 sm:py-12'>
      <div className='mx-auto max-w-6xl'>
        <Link href='/' className='text-xl font-bold tracking-tight'>
          GrowMe<span className='text-primary'>Online</span>
        </Link>

        <div className='mt-10 grid items-start gap-12 lg:grid-cols-2'>
          <section>
            <p className='text-primary text-sm font-semibold tracking-wide uppercase'>
              For local service providers
            </p>
            <h1 className='mt-3 text-3xl font-semibold tracking-tight sm:text-4xl'>
              Create your supplier profile
            </h1>
            <p className='text-muted-foreground mt-4 max-w-xl leading-7'>
              Register your business, choose the services and areas you cover,
              then submit your profile for review.
            </p>

            <ol className='mt-8 space-y-5'>
              <li>
                <h2 className='font-semibold'>
                  1. Create and verify your account
                </h2>
                <p className='text-muted-foreground mt-1 text-sm leading-6'>
                  We use your account to keep your supplier profile under your
                  control.
                </p>
              </li>
              <li>
                <h2 className='font-semibold'>2. Add your business details</h2>
                <p className='text-muted-foreground mt-1 text-sm leading-6'>
                  Provide your business name, services, service areas, and
                  contact details.
                </p>
              </li>
              <li>
                <h2 className='font-semibold'>3. Submit for review</h2>
                <p className='text-muted-foreground mt-1 text-sm leading-6'>
                  Your profile stays private until it has been reviewed and
                  approved. Approval, verification, and public indexing are
                  separate checks.
                </p>
              </li>
            </ol>
          </section>

          <section className='border-border bg-card rounded-3xl border p-5 sm:p-8'>
            <SignupForm
              callbackURL='/dashboard/supplier'
              heading='Create your supplier account'
              introduction='Start with an account. After email verification, you can build and submit your supplier profile.'
              verificationMessage='You will continue to supplier setup.'
            />
          </section>
        </div>
      </div>

      <Suspense fallback={null}>
        <RedirectIfAuthenticated redirectTo='/dashboard/supplier' />
      </Suspense>
    </main>
  );
}
