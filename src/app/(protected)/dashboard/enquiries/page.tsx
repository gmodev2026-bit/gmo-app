import { DashboardGate } from '@/components/dashboard/auth-gate';
import { PageSkeleton } from '@/components/shared/page-skeleton';
import { getAuthenticatedClientEnquiries } from '@/server/clients';
import { connection } from 'next/server';
import Link from 'next/link';
import { Suspense } from 'react';

export default function ClientEnquiriesPage() {
  return (
    <DashboardGate>
      <Suspense fallback={<PageSkeleton />}>
        <ClientEnquiries />
      </Suspense>
    </DashboardGate>
  );
}

async function ClientEnquiries() {
  await connection();
  const enquiries = await getAuthenticatedClientEnquiries();

  if (!enquiries) {
    return (
      <main className='mx-auto w-full max-w-5xl p-6 md:p-10'>
        <h1 className='text-3xl font-bold tracking-tight'>Verify your email</h1>
      </main>
    );
  }

  return (
    <main className='mx-auto w-full max-w-5xl p-6 md:p-10'>
      <h1 className='text-3xl font-bold tracking-tight'>My enquiries</h1>
      {enquiries.length === 0 ? (
        <p className='text-muted-foreground mt-6 text-sm'>
          Your signed-in enquiries will appear here.
        </p>
      ) : (
        <div className='mt-6 space-y-3'>
          {enquiries.map((enquiry) => (
            <Link
              key={enquiry.publicReference}
              href={`/dashboard/enquiries/${encodeURIComponent(enquiry.publicReference)}`}
              className='border-border bg-card block rounded-2xl border p-5'
            >
              <div className='flex flex-wrap justify-between gap-3'>
                <div>
                  <p className='font-semibold'>{enquiry.category.name}</p>
                  <p className='text-muted-foreground mt-1 text-sm'>
                    {enquiry.city.name} · {enquiry.status.replaceAll('_', ' ').toLowerCase()}
                  </p>
                </div>
                <span className='text-muted-foreground text-sm'>
                  {enquiry.publicReference}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
