import { Suspense } from 'react';
import { connection } from 'next/server';
import Link from 'next/link';
import { AdminGate } from '@/components/admin/auth-gate';
import { PageSkeleton } from '@/components/shared/page-skeleton';
import { ENQUIRY_STATUS_LABELS } from '@/features/enquiries/status';
import type { EnquiryQueueFilter } from '@/server/admin/enquiries';
import { listAdminEnquiries } from '@/server/admin/enquiries';
import { StatusBadge } from './status-badge';

type SearchParams = Promise<{
  filter?: string | string[];
  page?: string | string[];
}>;

const queueFilters: EnquiryQueueFilter[] = [
  'open',
  'all',
  'PENDING_REVIEW',
  'NEEDS_INFORMATION',
  'QUALIFIED',
  'REJECTED',
  'REJECTED_SPAM',
  'MATCHING',
  'DISPATCHED',
  'CLOSED'
];

export default function EnquiriesPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  return (
    <AdminGate>
      <Suspense fallback={<PageSkeleton />}>
        <EnquiryQueue searchParams={searchParams} />
      </Suspense>
    </AdminGate>
  );
}

async function EnquiryQueue({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const params = await searchParams;
  const filter = parseFilter(first(params.filter));
  const requestedPage = parsePage(first(params.page));
  const result = await listAdminEnquiries(filter, requestedPage);

  return (
    <main className='flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8'>
      <header className='flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Enquiry queue
          </h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Review customer requests before matching or sharing contact details.
          </p>
        </div>
        <form
          method='get'
          action='/admin/enquiries'
          className='flex items-center gap-2'
        >
          <label htmlFor='enquiry-filter' className='sr-only'>
            Filter enquiries
          </label>
          <select
            id='enquiry-filter'
            name='filter'
            defaultValue={filter}
            className='border-input bg-background focus-visible:ring-ring h-10 rounded-xl border px-3 text-sm outline-none focus-visible:ring-2'
          >
            <option value='open'>Open requests</option>
            <option value='all'>All statuses</option>
            {Object.entries(ENQUIRY_STATUS_LABELS).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
          <button
            type='submit'
            className='bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-xl px-4 text-sm font-medium'
          >
            Apply
          </button>
        </form>
      </header>

      <section className='border-border bg-card overflow-hidden rounded-2xl border'>
        <div className='border-border flex items-center justify-between border-b px-5 py-4'>
          <h2 className='font-medium'>
            {result.total} {result.total === 1 ? 'request' : 'requests'}
          </h2>
          <p className='text-muted-foreground text-sm'>
            Page {result.page} of {result.pageCount}
          </p>
        </div>

        {result.enquiries.length === 0 ? (
          <p className='text-muted-foreground px-5 py-12 text-center text-sm'>
            No enquiries match this filter.
          </p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-sm'>
              <thead className='bg-muted/50 text-muted-foreground'>
                <tr>
                  <th scope='col' className='px-5 py-3 font-medium'>
                    Reference
                  </th>
                  <th scope='col' className='px-5 py-3 font-medium'>
                    Service
                  </th>
                  <th scope='col' className='px-5 py-3 font-medium'>
                    Area
                  </th>
                  <th scope='col' className='px-5 py-3 font-medium'>
                    Status
                  </th>
                  <th scope='col' className='px-5 py-3 font-medium'>
                    Duplicate review
                  </th>
                  <th scope='col' className='px-5 py-3 font-medium'>
                    Submitted
                  </th>
                  <th scope='col' className='px-5 py-3'>
                    <span className='sr-only'>Open enquiry</span>
                  </th>
                </tr>
              </thead>
              <tbody className='divide-border divide-y'>
                {result.enquiries.map((enquiry) => (
                  <tr key={enquiry.id} className='hover:bg-muted/30'>
                    <td className='px-5 py-4 font-mono text-xs'>
                      {enquiry.publicReference}
                    </td>
                    <td className='px-5 py-4'>{enquiry.category.name}</td>
                    <td className='px-5 py-4'>{enquiry.city.name}</td>
                    <td className='px-5 py-4'>
                      <StatusBadge status={enquiry.status} />
                    </td>
                    <td className='px-5 py-4'>
                      {enquiry.possibleDuplicateOfId ? (
                        <span className='text-destructive text-xs font-medium'>
                          Possible duplicate
                        </span>
                      ) : (
                        <span className='text-muted-foreground text-xs'>-</span>
                      )}
                    </td>
                    <td className='text-muted-foreground px-5 py-4 whitespace-nowrap'>
                      {formatDate(enquiry.createdAt)}
                    </td>
                    <td className='px-5 py-4 text-right'>
                      <Link
                        href={`/admin/enquiries/${enquiry.id}`}
                        className='text-primary font-medium hover:underline'
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result.pageCount > 1 && (
          <nav
            aria-label='Enquiry pages'
            className='border-border flex justify-between border-t px-5 py-4'
          >
            {result.page > 1 ? (
              <PageLink filter={filter} page={result.page - 1}>
                Previous
              </PageLink>
            ) : (
              <span className='text-muted-foreground text-sm'>Previous</span>
            )}
            {result.page < result.pageCount ? (
              <PageLink filter={filter} page={result.page + 1}>
                Next
              </PageLink>
            ) : (
              <span className='text-muted-foreground text-sm'>Next</span>
            )}
          </nav>
        )}
      </section>
    </main>
  );
}

function PageLink({
  filter,
  page,
  children
}: {
  filter: EnquiryQueueFilter;
  page: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={`/admin/enquiries?filter=${encodeURIComponent(filter)}&page=${page}`}
      className='text-primary text-sm font-medium hover:underline'
    >
      {children}
    </Link>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseFilter(value: string | undefined): EnquiryQueueFilter {
  return queueFilters.find((filter) => filter === value) ?? 'open';
}

function parsePage(value: string | undefined) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function formatDate(date: Date) {
  return date.toLocaleString('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Johannesburg'
  });
}
