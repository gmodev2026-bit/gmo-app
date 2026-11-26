import { Suspense } from 'react';
import { connection } from 'next/server';
import Link from 'next/link';
import { AdminGate } from '@/components/admin/auth-gate';
import { PageSkeleton } from '@/components/shared/page-skeleton';
import { getSupplierFormOptions } from '@/server/admin/suppliers';
import { SupplierForm } from '../supplier-form';

export default function NewSupplierPage() {
  return (
    <AdminGate>
      <Suspense fallback={<PageSkeleton />}>
        <NewSupplierForm />
      </Suspense>
    </AdminGate>
  );
}

async function NewSupplierForm() {
  await connection();
  const options = await getSupplierFormOptions();

  return (
    <main className='flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8'>
      <Link
        href='/admin/suppliers'
        className='text-primary w-fit text-sm font-medium hover:underline'
      >
        ← Back to supplier register
      </Link>
      <header>
        <h1 className='text-2xl font-semibold tracking-tight'>Add supplier</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Supplier records are private to the admin team until a separate public
          directory is implemented.
        </p>
      </header>
      <section className='border-border bg-card max-w-3xl rounded-2xl border p-5 sm:p-6'>
        <SupplierForm categories={options.categories} cities={options.cities} />
      </section>
    </main>
  );
}
