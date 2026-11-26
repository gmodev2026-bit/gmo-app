import { AdminGate } from '@/components/admin/auth-gate';
import { PageSkeleton } from '@/components/shared/page-skeleton';
import { listAdminOutboxEvents } from '@/server/admin/outbox';
import { connection } from 'next/server';
import Link from 'next/link';
import { Suspense } from 'react';

const statuses = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'FAILED', label: 'Failed' }
] as const;

export default function OutboxPage() {
  return (
    <AdminGate>
      <Suspense fallback={<PageSkeleton />}>
        <OutboxQueue />
      </Suspense>
    </AdminGate>
  );
}

async function OutboxQueue() {
  await connection();
  const { events, statusCounts, simulationCount } =
    await listAdminOutboxEvents();
  const totalCount = statusCounts.reduce(
    (total, item) => total + item._count._all,
    0
  );

  return (
    <main className='flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8'>
      <header>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Dispatch outbox
        </h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Internal dispatch events only. This queue does not send supplier
          messages.
        </p>
      </header>

      <section
        aria-label='Outbox event totals'
        className='grid gap-4 sm:grid-cols-2 xl:grid-cols-6'
      >
        <MetricCard label='Real events' value={totalCount} />
        {statuses.map((status) => (
          <MetricCard
            key={status.value}
            label={status.label}
            value={
              statusCounts.find((item) => item.status === status.value)?._count
                ._all ?? 0
            }
          />
        ))}
        <MetricCard label='Simulation events' value={simulationCount} />
      </section>

      <section className='border-border bg-card overflow-hidden rounded-2xl border'>
        <div className='border-border flex items-center justify-between border-b px-5 py-4'>
          <h2 className='font-medium'>Latest dispatch events</h2>
          <p className='text-muted-foreground text-sm'>
            Showing {events.length} of {totalCount + simulationCount}
          </p>
        </div>

        {events.length === 0 ? (
          <p className='text-muted-foreground px-5 py-12 text-center text-sm'>
            No dispatch events have been queued.
          </p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-sm'>
              <thead className='bg-muted/50 text-muted-foreground'>
                <tr>
                  <th scope='col' className='px-5 py-3 font-medium'>
                    Created
                  </th>
                  <th scope='col' className='px-5 py-3 font-medium'>
                    Event
                  </th>
                  <th scope='col' className='px-5 py-3 font-medium'>
                    Enquiry
                  </th>
                  <th scope='col' className='px-5 py-3 font-medium'>
                    Supplier
                  </th>
                  <th scope='col' className='px-5 py-3 font-medium'>
                    Status
                  </th>
                  <th scope='col' className='px-5 py-3 font-medium'>
                    Attempts
                  </th>
                  <th scope='col' className='px-5 py-3 font-medium'>
                    Kind
                  </th>
                </tr>
              </thead>
              <tbody className='divide-border divide-y'>
                {events.map((event) => (
                  <tr key={event.id} className='hover:bg-muted/30'>
                    <td className='text-muted-foreground px-5 py-4 whitespace-nowrap'>
                      {formatDate(event.createdAt)}
                    </td>
                    <td className='px-5 py-4'>
                      {event.type.replaceAll('_', ' ').toLowerCase()}
                    </td>
                    <td className='px-5 py-4'>
                      <Link
                        href={`/admin/enquiries/${event.enquiry.id}`}
                        className='text-primary font-mono text-xs hover:underline'
                      >
                        {event.enquiry.publicReference}
                      </Link>
                    </td>
                    <td className='px-5 py-4'>
                      {event.leadAssignment.supplier.businessName}
                    </td>
                    <td className='px-5 py-4'>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClassName(event.status)}`}
                      >
                        {event.status.toLowerCase()}
                      </span>
                    </td>
                    <td className='px-5 py-4'>{event.attempts}</td>
                    <td className='px-5 py-4'>
                      {event.isSimulation ? (
                        <span className='text-muted-foreground text-xs'>
                          Simulation
                        </span>
                      ) : (
                        <span className='text-xs'>Operational</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className='text-muted-foreground text-xs'>
        Event payloads and delivery errors are intentionally not displayed.
        Provider delivery and retry controls are not configured.
      </p>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className='border-border bg-card rounded-2xl border p-5'>
      <p className='text-muted-foreground text-sm'>{label}</p>
      <p className='mt-2 text-3xl font-semibold'>{value}</p>
    </div>
  );
}

function statusClassName(status: string) {
  switch (status) {
    case 'DELIVERED':
      return 'bg-primary/10 text-primary';
    case 'FAILED':
      return 'bg-destructive/10 text-destructive';
    case 'PROCESSING':
      return 'bg-secondary text-secondary-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function formatDate(date: Date) {
  return date.toLocaleString('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Johannesburg'
  });
}
