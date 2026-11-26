import { AdminGate } from '@/components/admin/auth-gate';
import { PageSkeleton } from '@/components/shared/page-skeleton';
import { getAdminPilotReadiness } from '@/server/admin/readiness';
import { connection } from 'next/server';
import Link from 'next/link';
import { Suspense } from 'react';
import type { ReactNode } from 'react';

const ownerChecks = [
  {
    title: 'Privacy and legal review',
    description:
      'Confirm the privacy notice, consent wording, retention schedule and POPIA obligations with the appropriate reviewer.'
  },
  {
    title: 'Supplier verification policy',
    description:
      'Approve which evidence is required, how verification is recorded and which profile changes require re-review.'
  },
  {
    title: 'Staffed operations',
    description:
      'Confirm named ownership for enquiry triage, supplier follow-up, dispatch and customer outcome tracking during staffed hours.'
  },
  {
    title: 'Backups and production access',
    description:
      'Verify backup and restore procedures, rotate deployment secrets and approve the production environment before launch.'
  },
  {
    title: 'Supplier communications',
    description:
      'Approve the provider, delivery worker and consent requirements before sending messages. The current outbox only queues events.'
  }
];

export default function PilotReadinessPage() {
  return (
    <AdminGate>
      <Suspense fallback={<PageSkeleton />}>
        <PilotReadiness />
      </Suspense>
    </AdminGate>
  );
}

async function PilotReadiness() {
  await connection();
  const { intakeEnabled, coverage } = await getAdminPilotReadiness();
  const coveredCount = coverage.filter((item) => item.isCovered).length;

  return (
    <main className='flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8'>
      <header>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Pilot readiness
        </h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          System gates are checked automatically. Owner approvals must be
          confirmed outside this dashboard; this page cannot mark them complete.
        </p>
      </header>

      <section
        aria-label='Automatic pilot gates'
        className='grid gap-4 md:grid-cols-2'
      >
        <article className='border-border bg-card rounded-2xl border p-5'>
          <div className='flex items-center justify-between gap-3'>
            <h2 className='font-semibold'>Public enquiry intake</h2>
            <StatusBadge positive={!intakeEnabled}>
              {intakeEnabled ? 'Enabled by configuration' : 'Closed'}
            </StatusBadge>
          </div>
          <p className='text-muted-foreground mt-3 text-sm'>
            {intakeEnabled
              ? 'The environment flag is enabled. Each submitted category and city must still pass its supplier coverage gate.'
              : 'The intake flag is off, so public enquiries remain closed.'}
          </p>
        </article>

        <article className='border-border bg-card rounded-2xl border p-5'>
          <div className='flex items-center justify-between gap-3'>
            <h2 className='font-semibold'>Supplier coverage</h2>
            <StatusBadge positive={coveredCount === coverage.length}>
              {coveredCount} / {coverage.length} areas ready
            </StatusBadge>
          </div>
          <p className='text-muted-foreground mt-3 text-sm'>
            Every service area requires at least five active, approved and
            verified suppliers with confirmed coverage.
          </p>
          <Link
            href='/admin/suppliers'
            className='text-primary mt-3 inline-block text-sm font-medium hover:underline'
          >
            Manage suppliers
          </Link>
        </article>
      </section>

      <section className='border-border bg-card overflow-hidden rounded-2xl border'>
        <div className='border-border flex items-center justify-between border-b px-5 py-4'>
          <h2 className='font-semibold'>Coverage by service area</h2>
          <p className='text-muted-foreground text-sm'>Minimum: 5 suppliers</p>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-sm'>
            <thead className='bg-muted/50 text-muted-foreground'>
              <tr>
                <th scope='col' className='px-5 py-3 font-medium'>
                  Service
                </th>
                <th scope='col' className='px-5 py-3 font-medium'>
                  City
                </th>
                <th scope='col' className='px-5 py-3 font-medium'>
                  Eligible suppliers
                </th>
                <th scope='col' className='px-5 py-3 font-medium'>
                  Gate
                </th>
              </tr>
            </thead>
            <tbody className='divide-border divide-y'>
              {coverage.map((item) => (
                <tr key={`${item.categoryId}-${item.cityId}`}>
                  <td className='px-5 py-4'>{item.categoryName}</td>
                  <td className='px-5 py-4'>{item.cityName}</td>
                  <td className='px-5 py-4'>
                    {item.eligibleSupplierCount} / {item.minimumSupplierCount}
                    {!item.isCovered && (
                      <span className='text-muted-foreground ml-2 text-xs'>
                        {item.missingSupplierCount} more needed
                      </span>
                    )}
                  </td>
                  <td className='px-5 py-4'>
                    <StatusBadge positive={item.isCovered}>
                      {item.isCovered ? 'Coverage ready' : 'Blocked'}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className='text-muted-foreground px-5 py-4 text-xs'>
          Simulation and test-only suppliers are excluded. Meeting coverage
          counts does not approve legal, operational or deployment readiness.
        </p>
      </section>

      <section className='border-border bg-card rounded-2xl border p-5 sm:p-6'>
        <div>
          <h2 className='text-lg font-semibold'>Owner and operator checks</h2>
          <p className='text-muted-foreground mt-1 text-sm'>
            These items require real-world approval or evidence and are not
            inferred from application data.
          </p>
        </div>
        <ul className='mt-5 grid gap-3 md:grid-cols-2'>
          {ownerChecks.map((check) => (
            <li
              key={check.title}
              className='border-border flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between'
            >
              <div>
                <h3 className='font-medium'>{check.title}</h3>
                <p className='text-muted-foreground mt-1 text-sm'>
                  {check.description}
                </p>
              </div>
              <StatusBadge positive={false}>Verify externally</StatusBadge>
            </li>
          ))}
        </ul>
      </section>

      <p className='text-muted-foreground text-xs'>
        This checklist is informational and does not change public intake,
        supplier status or notification delivery.
      </p>
    </main>
  );
}

function StatusBadge({
  positive,
  children
}: {
  positive: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={
        positive
          ? 'bg-primary/10 text-primary inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium'
          : 'bg-muted text-muted-foreground inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium'
      }
    >
      {children}
    </span>
  );
}
