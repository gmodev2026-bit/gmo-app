import { AdminGate } from '@/components/admin/auth-gate';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { PageSkeleton } from '@/components/shared/page-skeleton';
import { getPilotMetrics } from '@/server/admin/metrics';
import { getAdminPilotCoverage } from '@/server/admin/readiness';
import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <AdminGate>
      <Suspense fallback={<PageSkeleton />}>
        <PilotDashboard />
      </Suspense>
    </AdminGate>
  );
}

async function PilotDashboard() {
  await connection();
  const [metrics, coverage] = await Promise.all([
    getPilotMetrics(),
    getAdminPilotCoverage()
  ]);

  return (
    <main className='flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8'>
      <header>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Pilot operations
        </h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Canonical marketplace activity. These figures are live database
          counts, not simulated dashboard data.
        </p>
      </header>

      <section className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <MetricCard label='Enquiries received' value={metrics.funnel.received} />
        <MetricCard label='Qualified' value={metrics.funnel.qualified} />
        <MetricCard
          label='Rejected / spam'
          value={metrics.funnel.rejected + metrics.funnel.spam}
        />
        <MetricCard
          label='Leads dispatched'
          value={metrics.funnel.dispatchedAssignments}
        />
        <MetricCard
          label='Simulation enquiries'
          value={metrics.funnel.simulationEnquiries}
        />
      </section>

      <section className='border-border bg-card rounded-2xl border p-5 sm:p-6'>
        <div className='flex flex-col justify-between gap-3 sm:flex-row sm:items-start'>
          <div>
            <h2 className='text-lg font-semibold'>
              Supplier coverage readiness
            </h2>
            <p className='text-muted-foreground mt-1 text-sm'>
              Each service area needs at least five active, approved and
              verified suppliers with confirmed coverage.
            </p>
          </div>
          <Link
            href='/admin/suppliers'
            className='text-primary text-sm font-medium hover:underline'
          >
            Manage suppliers
          </Link>
        </div>

        <div className='mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
          {coverage.map((item) => (
            <article
              key={`${item.categoryId}-${item.cityId}`}
              className='border-border rounded-xl border p-4'
            >
              <h3 className='font-medium'>
                {item.categoryName} · {item.cityName}
              </h3>
              <div className='mt-3 flex items-baseline justify-between gap-3'>
                <p className='text-lg font-semibold'>
                  {item.eligibleSupplierCount} / {item.minimumSupplierCount}
                </p>
                <p
                  className={
                    item.isCovered
                      ? 'text-primary text-xs font-medium'
                      : 'text-muted-foreground text-xs'
                  }
                >
                  {item.isCovered
                    ? 'Coverage ready'
                    : `${item.missingSupplierCount} more needed`}
                </p>
              </div>
            </article>
          ))}
        </div>

        <p className='text-muted-foreground mt-4 text-xs'>
          Simulation and test-only suppliers are excluded. Meeting this count
          does not by itself enable public intake.
        </p>
      </section>

      <section className='border-border bg-card rounded-2xl border p-5 sm:p-6'>
        <h2 className='text-lg font-semibold'>Website funnel</h2>
        <p className='text-muted-foreground mt-1 text-sm'>
          Privacy-safe counts from the public landing and request pages.
          Abandonment is an estimate based on opened forms minus recorded submissions.
        </p>
        <div className='mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-6'>
          <Metric label='Landing views' value={String(metrics.funnel.landingViews)} />
          <Metric label='Forms opened' value={String(metrics.funnel.formOpened)} />
          <Metric label='Submissions' value={String(metrics.funnel.funnelSubmitted)} />
          <Metric label='Failed attempts' value={String(metrics.funnel.funnelFailed)} />
          <Metric
            label='Landing to submission'
            value={percentage(metrics.funnel.landingToSubmissionRate)}
          />
          <Metric
            label='Form to submission'
            value={percentage(metrics.funnel.formToSubmissionRate)}
          />
          <Metric
            label='Estimated abandonment'
            value={String(metrics.funnel.abandonmentEstimate)}
          />
        </div>
      </section>

      <section className='grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,.9fr)]'>
        <div className='border-border bg-card rounded-2xl border p-5 sm:p-6'>
          <h2 className='text-lg font-semibold'>Supplier response</h2>
          <div className='mt-5 grid gap-4 sm:grid-cols-2'>
            <Metric label='Response rate' value={percentage(metrics.supplierResponse.responseRate)} />
            <Metric label='Requested' value={String(metrics.supplierResponse.requested)} />
            <Metric label='Available' value={String(metrics.supplierResponse.available)} />
            <Metric label='Unavailable' value={String(metrics.supplierResponse.unavailable)} />
            <Metric label='No response' value={String(metrics.supplierResponse.noResponse)} />
            <Metric
              label='Needs clarification'
              value={String(metrics.supplierResponse.needsClarification)}
            />
          </div>
        </div>

        <div className='border-border bg-card rounded-2xl border p-5 sm:p-6'>
          <h2 className='text-lg font-semibold'>Pilot follow-through</h2>
          <div className='mt-5 grid gap-4'>
            <Metric label='Open follow-ups' value={String(metrics.funnel.openFollowUps)} />
            <Metric
              label='Average time to first review'
              value={duration(metrics.funnel.averageFirstReviewMinutes)}
            />
            <Metric label='Quotes reported received' value={String(metrics.outcomes.quoteCount)} />
            <Metric label='Jobs reported won' value={String(metrics.outcomes.wonCount)} />
            <Metric label='Jobs reported lost' value={String(metrics.outcomes.lostCount)} />
          </div>
        </div>
      </section>

      <section className='grid gap-6 lg:grid-cols-2'>
        <RankingCard title='Top categories' rows={metrics.topCategories} />
        <RankingCard title='Top locations' rows={metrics.topCities} />
      </section>

      <section className='border-border bg-card rounded-2xl border p-5 sm:p-6'>
        <h2 className='text-lg font-semibold'>Recent operational activity</h2>
        {metrics.recentActivities.length === 0 ? (
          <p className='text-muted-foreground mt-4 text-sm'>
            No operational activity has been recorded.
          </p>
        ) : (
          <ol className='mt-5 space-y-4'>
            {metrics.recentActivities.map((activity) => (
              <li key={activity.id} className='border-border border-l-2 pl-4'>
                <p className='text-sm font-medium'>
                  {activity.enquiry.publicReference} ·{' '}
                  {activity.type.replaceAll('_', ' ').toLowerCase()}
                </p>
                <p className='mt-1 text-sm leading-6'>{activity.summary}</p>
                <p className='text-muted-foreground mt-1 text-xs'>
                  {activity.actor.name} · {formatDate(activity.createdAt)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className='text-muted-foreground text-xs'>
        Paid supplier entitlements and revenue are deferred. Free-pilot assignment
        counts are enforced in the quota ledger and are not shown as a claim of
        paid conversion.
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className='text-muted-foreground text-sm'>{label}</p>
      <p className='mt-1 text-lg font-semibold'>{value}</p>
    </div>
  );
}

function RankingCard({
  title,
  rows
}: {
  title: string;
  rows: Array<{ name: string; count: number }>;
}) {
  return (
    <div className='border-border bg-card rounded-2xl border p-5 sm:p-6'>
      <h2 className='text-lg font-semibold'>{title}</h2>
      {rows.length === 0 ? (
        <p className='text-muted-foreground mt-4 text-sm'>No data yet.</p>
      ) : (
        <ol className='mt-5 space-y-3'>
          {rows.map((row) => (
            <li
              key={row.name}
              className='flex items-center justify-between text-sm'
            >
              <span>{row.name}</span>
              <span className='font-semibold'>{row.count}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function percentage(value: number | null) {
  return value === null ? 'No requests' : `${value}%`;
}

function duration(minutes: number | null) {
  if (minutes === null) return 'No reviews';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `${hours} hr`;
}

function formatDate(date: Date) {
  return date.toLocaleString('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Johannesburg'
  });
}
