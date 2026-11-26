import { DashboardGate } from '@/components/dashboard/auth-gate';
import { PageSkeleton } from '@/components/shared/page-skeleton';
import {
  getSupplierOnboardingOptions,
  getSupplierPortalProfile
} from '@/server/supplier-portal';
import { SupplierOnboardingForm } from './supplier-onboarding-form';
import { connection } from 'next/server';
import { Suspense } from 'react';
import Link from 'next/link';

export default function SupplierPortalPage() {
  return (
    <DashboardGate>
      <Suspense fallback={<PageSkeleton />}>
        <SupplierPortal />
      </Suspense>
    </DashboardGate>
  );
}

async function SupplierPortal() {
  await connection();
  const [supplier, options] = await Promise.all([
    getSupplierPortalProfile(),
    getSupplierOnboardingOptions()
  ]);

  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 md:p-10'>
      <header>
        <h1 className='text-3xl font-bold tracking-tight'>Supplier profile</h1>
        <p className='text-muted-foreground mt-2 text-sm'>
          Create and manage the supplier profile owned by your verified account.
        </p>
      </header>

      {supplier && (
        <Link
          href='/dashboard/supplier/preview'
          className='border-border bg-card w-fit rounded-xl border px-4 py-2 text-sm font-medium'
        >
          Private profile preview
        </Link>
      )}

      {!options ? (
        <section className='border-border bg-card rounded-2xl border p-6'>
          <h2 className='font-semibold'>Verify your account</h2>
          <p className='text-muted-foreground mt-2 text-sm'>
            Supplier onboarding requires an active, email-verified regular account.
          </p>
        </section>
      ) : (
        <section className='border-border bg-card rounded-2xl border p-6'>
          <SupplierOnboardingForm
            supplier={supplier}
            categories={options.categories}
            cities={options.cities}
          />
        </section>
      )}
    </main>
  );
}
