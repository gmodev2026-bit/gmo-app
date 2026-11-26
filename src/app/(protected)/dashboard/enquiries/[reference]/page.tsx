import { DashboardGate } from '@/components/dashboard/auth-gate';
import { PageSkeleton } from '@/components/shared/page-skeleton';
import { getAuthenticatedClientEnquiry } from '@/server/clients';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

export const instant = false;

export default function ClientEnquiryDetailPage({
  params
}: {
  params: Promise<{ reference: string }>;
}) {
  return (
    <DashboardGate>
      <Suspense fallback={<PageSkeleton />}>
        <ClientEnquiryDetail params={params} />
      </Suspense>
    </DashboardGate>
  );
}

async function ClientEnquiryDetail({
  params
}: {
  params: Promise<{ reference: string }>;
}) {
  await connection();
  const { reference } = await params;
  const enquiry = await getAuthenticatedClientEnquiry(reference);
  if (!enquiry) notFound();

  return (
    <main className='mx-auto w-full max-w-4xl p-6 md:p-10'>
      <Link href='/dashboard/enquiries' className='text-primary text-sm font-semibold'>
        ← My enquiries
      </Link>
      <header className='mt-6'>
        <h1 className='text-3xl font-bold tracking-tight'>
          {enquiry.publicReference}
        </h1>
        <p className='text-muted-foreground mt-2 text-sm'>
          {enquiry.category.name} · {enquiry.city.name}
        </p>
      </header>

      <section className='border-border bg-card mt-8 rounded-2xl border p-6'>
        <h2 className='font-semibold'>Request status</h2>
        <p className='mt-2 text-sm'>{enquiry.status.replaceAll('_', ' ').toLowerCase()}</p>
        <p className='mt-5 whitespace-pre-wrap text-sm leading-6'>{enquiry.jobDescription}</p>
      </section>

      {enquiry.leadAssignments.length > 0 && (
        <section className='border-border bg-card mt-6 rounded-2xl border p-6'>
          <h2 className='font-semibold'>Confirmed introductions</h2>
          <div className='mt-4 space-y-3'>
            {enquiry.leadAssignments.map(({ supplier }) => (
              <div key={supplier.businessName} className='text-sm'>
                <p className='font-medium'>{supplier.businessName}</p>
                {supplier.phone && <p>{supplier.phone}</p>}
                {supplier.email && <p>{supplier.email}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
