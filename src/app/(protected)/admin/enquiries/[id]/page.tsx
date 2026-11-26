import { Suspense } from 'react';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { AdminGate } from '@/components/admin/auth-gate';
import { PageSkeleton } from '@/components/shared/page-skeleton';
import { ENQUIRY_STATUS_LABELS } from '@/features/enquiries/status';
import {
  getAdminEnquiry,
  getDeterministicEnquiryMatches
} from '@/server/admin/enquiries';
import { StatusBadge } from '../status-badge';
import { ReviewForm } from '../review-form';
import { LeadDispatchPanel } from '../lead-dispatch-panel';
import { FollowUpPanel } from '../follow-up-panel';
import { ContactVerificationPanel } from '../contact-verification-panel';

type RouteParams = Promise<{ id: string }>;

export default function EnquiryDetailPage({ params }: { params: RouteParams }) {
  return (
    <AdminGate>
      <Suspense fallback={<PageSkeleton />}>
        <EnquiryDetail params={params} />
      </Suspense>
    </AdminGate>
  );
}

async function EnquiryDetail({ params }: { params: RouteParams }) {
  await connection();
  const { id } = await params;

  if (!z.uuid().safeParse(id).success) {
    notFound();
  }

  const enquiry = await getAdminEnquiry(id);
  if (!enquiry) {
    notFound();
  }
  const matching = await getDeterministicEnquiryMatches(id);

  return (
    <main className='flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8'>
      <Link
        href='/admin/enquiries'
        className='text-primary w-fit text-sm font-medium hover:underline'
      >
        ← Back to enquiries
      </Link>

      <header className='flex flex-col justify-between gap-3 sm:flex-row sm:items-start'>
        <div>
          <p className='text-muted-foreground font-mono text-sm'>
            {enquiry.publicReference}
          </p>
          <h1 className='mt-1 text-2xl font-semibold tracking-tight'>
            Enquiry review
          </h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Submitted {formatDate(enquiry.createdAt)}
          </p>
        </div>
        <StatusBadge status={enquiry.status} />
      </header>

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.8fr)]'>
        <div className='space-y-6'>
          <section className='border-border bg-card rounded-2xl border p-5 sm:p-6'>
            <h2 className='text-lg font-semibold'>Request details</h2>
            {enquiry.possibleDuplicateOf && (
              <div className='border-destructive/30 bg-destructive/5 mt-4 rounded-xl border p-3 text-sm'>
                <p className='font-medium'>Possible duplicate - review manually</p>
                <p className='text-muted-foreground mt-1'>
                  Similar recent request: {enquiry.possibleDuplicateOf.publicReference}
                  {' '}({formatDate(enquiry.possibleDuplicateOf.createdAt)}).
                  This is only a review signal; it has not been rejected.
                </p>
                <Link
                  href={`/admin/enquiries/${enquiry.possibleDuplicateOf.id}`}
                  className='text-primary mt-2 inline-block font-medium hover:underline'
                >
                  Compare enquiry
                </Link>
              </div>
            )}
            <dl className='mt-5 grid gap-4 sm:grid-cols-2'>
              <Detail label='Service' value={enquiry.category.name} />
              <Detail label='Area' value={enquiry.city.name} />
              <div className='sm:col-span-2'>
                <dt className='text-muted-foreground text-sm'>
                  Work requested
                </dt>
                <dd className='mt-1 text-sm leading-6 whitespace-pre-wrap'>
                  {enquiry.jobDescription}
                </dd>
              </div>
            </dl>
          </section>

          <section className='border-border bg-card rounded-2xl border p-5 sm:p-6'>
            <h2 className='text-lg font-semibold'>Qualification answers</h2>
            <p className='text-muted-foreground mt-1 text-xs'>
              Form template: {enquiry.formTemplateVersion}
            </p>
            <dl className='mt-5 grid gap-4 sm:grid-cols-2'>
              {Object.entries(
                (enquiry.structuredAnswers as Record<string, string>) ?? {}
              ).map(([key, value]) => (
                <Detail
                  key={key}
                  label={formatAnswerLabel(key)}
                  value={formatAnswerValue(key, value)}
                />
              ))}
            </dl>
          </section>

          <section className='border-border bg-card rounded-2xl border p-5 sm:p-6'>
            <h2 className='text-lg font-semibold'>Review history</h2>
            {enquiry.statusHistory.length === 0 ? (
              <p className='text-muted-foreground mt-4 text-sm'>
                No status changes have been recorded.
              </p>
            ) : (
              <ol className='mt-5 space-y-5'>
                {enquiry.statusHistory.map((event) => (
                  <li key={event.id} className='border-border border-l-2 pl-4'>
                    <p className='text-sm font-medium'>
                      {ENQUIRY_STATUS_LABELS[event.fromStatus]} →{' '}
                      {ENQUIRY_STATUS_LABELS[event.toStatus]}
                    </p>
                    <p className='mt-1 text-sm leading-6'>{event.reason}</p>
                    <p className='text-muted-foreground mt-1 text-xs'>
                      {event.actor.name} · {formatDate(event.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className='space-y-6'>
          <section className='border-border bg-card rounded-2xl border p-5 sm:p-6'>
            <h2 className='text-lg font-semibold'>Customer contact</h2>
            <p className='text-muted-foreground mt-1 text-xs'>
              Confidential. Share only after the required verification and
              customer approval.
            </p>
            <dl className='mt-5 space-y-4'>
              <Detail label='Name' value={enquiry.customerName} />
              <Detail label='Phone' value={enquiry.customerPhone} />
              <Detail
                label='Preferred contact'
                value={
                  enquiry.preferredContact === 'WHATSAPP'
                    ? 'WhatsApp'
                    : 'Phone call'
                }
              />
              {enquiry.customerEmail && (
                <Detail label='Email' value={enquiry.customerEmail} />
              )}
            </dl>
            <ContactVerificationPanel
              enquiryId={enquiry.id}
              preferredContact={enquiry.preferredContact}
              verifiedAt={enquiry.contactVerifiedAt}
              verificationMethod={enquiry.contactVerificationMethod}
              sharingApprovedAt={enquiry.supplierSharingApprovedAt}
            />
          </section>

          <section className='border-border bg-card rounded-2xl border p-5 sm:p-6'>
            <h2 className='text-lg font-semibold'>Update review status</h2>
            <p className='text-muted-foreground mt-1 mb-5 text-sm'>
              Every change requires a reason and is added to the review history.
            </p>
            <ReviewForm enquiryId={enquiry.id} currentStatus={enquiry.status} />
          </section>

          {matching && (
            <LeadDispatchPanel
              enquiryId={enquiry.id}
              enquiryStatus={enquiry.status}
              isSupplierSpecific={Boolean(enquiry.targetSupplierId)}
              matches={matching.matches}
              excluded={matching.excluded}
              assignments={enquiry.leadAssignments}
              canDispatch={Boolean(
                enquiry.contactVerifiedAt && enquiry.supplierSharingApprovedAt
              )}
            />
          )}

          <FollowUpPanel
            enquiryId={enquiry.id}
            assignments={enquiry.leadAssignments
              .filter((assignment) => assignment.status === 'DISPATCHED')
              .map((assignment) => ({
                id: assignment.id,
                supplier: { businessName: assignment.supplier.businessName }
              }))}
            activities={enquiry.leadActivities}
          />

          <p className='text-muted-foreground px-1 text-xs leading-5'>
            Privacy acknowledgement: {enquiry.privacyNoticeVersion} ·{' '}
            {formatDate(enquiry.privacyNoticeAcceptedAt)}
          </p>
        </aside>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className='text-muted-foreground text-sm'>{label}</dt>
      <dd className='mt-1 text-sm font-medium break-words'>{value}</dd>
    </div>
  );
}

function formatDate(date: Date) {
  return date.toLocaleString('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Johannesburg'
  });
}

function formatAnswerLabel(key: string) {
  const labels: Record<string, string> = {
    urgency: 'Timing',
    workType: 'Work type',
    locationContext: 'Location context',
    materialsResponsibility: 'Materials responsibility'
  };
  return labels[key] ?? key;
}

function formatAnswerValue(key: string, value: string) {
  if (key === 'urgency') {
    return (
      {
        FLEXIBLE: 'Flexible',
        WITHIN_WEEK: 'Within the next week',
        WITHIN_MONTH: 'Within the next month',
        SPECIFIC_DATE: 'Specific date'
      } as Record<string, string>
    )[value] ?? value;
  }
  if (key === 'materialsResponsibility') {
    return (
      {
        CUSTOMER: 'Customer provides materials',
        SUPPLIER: 'Supplier provides materials',
        NOT_SURE: 'Not sure'
      } as Record<string, string>
    )[value] ?? value;
  }
  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}
