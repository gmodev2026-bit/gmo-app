import type { Metadata } from 'next';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { RequestForm } from './request-form';
import { isPilotIntakeEnabled } from '@/lib/pilot-readiness';
import { getPublicSupplier } from '@/server/public-suppliers';

export const metadata: Metadata = {
  title: 'Request a local service provider',
  description:
    'Tell GrowMeOnline what home repair or maintenance help you need in Johannesburg or Pretoria.'
};

type SearchParams = Promise<{
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  supplier?: string;
}>;

export default function RequestPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  return (
    <main className='bg-background min-h-screen px-5 py-10 sm:px-8 sm:py-16'>
      <div className='mx-auto w-full max-w-3xl'>
        <Link
          href='/'
          className='text-primary inline-flex items-center gap-2 text-sm font-semibold'
        >
          <span aria-hidden='true'>←</span> GrowMeOnline
        </Link>

        <header className='mt-10 max-w-2xl'>
          <p className='text-primary text-sm font-semibold tracking-wide uppercase'>
            Home repairs and maintenance
          </p>
          <h1 className='mt-3 text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl'>
            Tell us what needs doing.
          </h1>
          <p className='text-muted-foreground mt-4 text-base leading-7'>
            We review each request before making an introduction. This pilot is
            for non-emergency work in Johannesburg and Pretoria.
          </p>
        </header>

        <div className='border-border bg-card mt-8 rounded-3xl border p-5 shadow-sm sm:p-8'>
          {isPilotIntakeEnabled() ? (
            <Suspense
              fallback={
                <p className='text-muted-foreground text-sm' role='status'>
                  Preparing the request form…
                </p>
              }
            >
              <RequestFormWithSubmissionKey searchParams={searchParams} />
            </Suspense>
          ) : (
            <section aria-live='polite' className='py-6'>
              <p className='text-primary text-sm font-semibold'>
                Controlled pilot
              </p>
              <h2 className='mt-2 text-2xl font-semibold'>
                Enquiry intake is temporarily closed.
              </h2>
              <p className='text-muted-foreground mt-3 leading-7'>
                GrowMeOnline is preparing supplier coverage and staffed review
                capacity before accepting live requests.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

async function RequestFormWithSubmissionKey({
  searchParams
}: {
  searchParams: Promise<{
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    supplier?: string;
  }>;
}) {
  await connection();
  const params = await searchParams;
  const attribution = {
    utmSource: params.utm_source,
    utmMedium: params.utm_medium,
    utmCampaign: params.utm_campaign
  };
  const targetSupplier = params.supplier
    ? await getPublicSupplier(params.supplier)
    : null;

  return (
    <RequestForm
      submissionKey={randomUUID()}
      attribution={attribution}
      targetSupplier={
        targetSupplier
          ? { id: targetSupplier.id, businessName: targetSupplier.businessName }
          : undefined
      }
    />
  );
}
