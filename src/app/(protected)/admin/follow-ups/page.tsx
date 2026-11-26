import { Suspense } from 'react';
import { connection } from 'next/server';
import Link from 'next/link';
import { AdminGate } from '@/components/admin/auth-gate';
import { PageSkeleton } from '@/components/shared/page-skeleton';
import { listAdminFollowUps } from '@/server/admin/follow-ups';
import { FollowUpQueue } from './follow-up-queue';

export default function FollowUpsPage() {
  return (
    <AdminGate>
      <Suspense fallback={<PageSkeleton />}>
        <FollowUpQueueContent />
      </Suspense>
    </AdminGate>
  );
}

async function FollowUpQueueContent() {
  await connection();
  const activities = await listAdminFollowUps();

  return (
    <main className='flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8'>
      <header>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Follow-up queue
        </h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Complete customer and supplier follow-ups with dated, auditable outcomes.
        </p>
      </header>

      {activities.length === 0 ? (
        <section className='border-border bg-card rounded-2xl border px-5 py-12 text-center'>
          <p className='text-muted-foreground text-sm'>
            No open follow-ups are scheduled.
          </p>
        </section>
      ) : (
        <div className='grid gap-4'>
          {activities.map((activity) => (
            <article
              key={activity.id}
              className='border-border bg-card rounded-2xl border p-5'
            >
              <div className='flex flex-col justify-between gap-4 sm:flex-row'>
                <div>
                  <p className='font-mono text-xs text-primary'>
                    {activity.enquiry.publicReference}
                  </p>
                  <h2 className='mt-1 font-medium'>
                    {activity.enquiry.customerName}
                  </h2>
                  <p className='text-muted-foreground mt-1 text-sm'>
                    {activity.enquiry.category.name} · {activity.enquiry.city.name}
                  </p>
                  <p className='mt-3 text-sm leading-6'>{activity.summary}</p>
                  <p className='text-muted-foreground mt-2 text-xs'>
                    Due {formatDate(activity.scheduledAt)}
                    {' · '}Channel {activity.channel.toLowerCase()}
                    {' · '}Assigned by {activity.actor.name}
                  </p>
                </div>
                <Link
                  href={`/admin/enquiries/${activity.enquiry.id}`}
                  className='text-primary h-fit text-sm font-medium hover:underline'
                >
                  Open enquiry
                </Link>
              </div>
              <FollowUpQueue activityId={activity.id} />
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

function formatDate(date: Date | null) {
  if (!date) return 'No date';
  return date.toLocaleString('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Johannesburg'
  });
}
