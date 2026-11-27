import { Suspense } from 'react';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { AdminGate } from '@/components/admin/auth-gate';
import { PageSkeleton } from '@/components/shared/page-skeleton';
import { SUPPLIER_STATUS_LABELS } from '@/features/suppliers/status';
import {
  getAdminSupplier,
  getSupplierFormOptions
} from '@/server/admin/suppliers';
import { SupplierForm } from '../supplier-form';
import { SupplierReviewForm } from '../supplier-review-form';
import { SupplierOwnerLinkForm } from '../supplier-owner-link-form';
import { SupplierStatusBadge } from '../status-badge';
import { SupplierMediaReview } from './media-review';

type RouteParams = Promise<{ id: string }>;

export default function SupplierDetailPage({
  params
}: {
  params: RouteParams;
}) {
  return (
    <AdminGate>
      <Suspense fallback={<PageSkeleton />}>
        <SupplierDetail params={params} />
      </Suspense>
    </AdminGate>
  );
}

async function SupplierDetail({ params }: { params: RouteParams }) {
  await connection();
  const { id } = await params;

  if (!z.uuid().safeParse(id).success) {
    notFound();
  }

  const [supplier, options] = await Promise.all([
    getAdminSupplier(id),
    getSupplierFormOptions()
  ]);
  if (!supplier) {
    notFound();
  }

  const selectedCategories = supplier.categories.map(
    ({ categoryId, isPrimary }) => ({ categoryId, isPrimary })
  );
  const selectedCityIds = supplier.serviceAreas.map((area) => area.cityId);

  return (
    <main className='flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8'>
      <Link
        href='/admin/suppliers'
        className='text-primary w-fit text-sm font-medium hover:underline'
      >
        ← Back to supplier register
      </Link>

      <header className='flex flex-col justify-between gap-3 sm:flex-row sm:items-start'>
        <div>
          <p className='text-muted-foreground font-mono text-sm'>
            /b/{supplier.slug}
          </p>
          <h1 className='mt-1 text-2xl font-semibold tracking-tight'>
            {supplier.businessName}
          </h1>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Link
            href={`/admin/suppliers/${supplier.id}/preview`}
            className='border-border bg-background inline-flex h-9 items-center rounded-xl border px-3 text-xs font-medium'
          >
            Private preview
          </Link>
          <SupplierStatusBadge status={supplier.status} />
          <span className='bg-muted text-muted-foreground inline-flex rounded-full px-2.5 py-1 text-xs font-medium'>
            {supplier.isVerified ? 'Verified' : 'Not verified'}
          </span>
        </div>
      </header>

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.8fr)]'>
        <section className='border-border bg-card rounded-2xl border p-5 sm:p-6'>
          <h2 className='mb-5 text-lg font-semibold'>Supplier details</h2>
          <SupplierForm
            supplier={{
              id: supplier.id,
              businessName: supplier.businessName,
              slug: supplier.slug,
              businessType: supplier.businessType,
              tagline: supplier.tagline ?? '',
              description: supplier.description ?? '',
              contactName: supplier.contactName ?? '',
              phone: supplier.phone,
              email: supplier.email ?? '',
              website: supplier.website ?? '',
              internalNotes: supplier.internalNotes ?? '',
              categories: selectedCategories,
              primaryCategoryId:
                supplier.categories.find((category) => category.isPrimary)
                  ?.categoryId ?? '',
              cityIds: selectedCityIds
            }}
            categories={options.categories}
            cities={options.cities}
          />
        </section>

        <aside className='space-y-6'>
          <section className='border-border bg-card rounded-2xl border p-5 sm:p-6'>
            <h2 className='text-lg font-semibold'>Approval and verification</h2>
            <p className='text-muted-foreground mt-1 mb-5 text-sm'>
              Approval requires documented verification and confirmed services
              and coverage.
            </p>
            <SupplierReviewForm
              supplierId={supplier.id}
              currentStatus={supplier.status}
              isVerified={supplier.isVerified}
              isIndexable={supplier.isIndexable}
              verificationMethod={supplier.verificationMethod ?? ''}
            />
            {supplier.verifiedAt && (
              <p className='text-muted-foreground mt-4 text-xs'>
                Verified by {supplier.verifiedBy?.name ?? 'an admin'} on{' '}
                {formatDate(supplier.verifiedAt)}.
              </p>
            )}
          </section>

          <section className='border-border bg-card rounded-2xl border p-5 sm:p-6'>
            <h2 className='text-lg font-semibold'>Public contact preferences</h2>
            <p className='text-muted-foreground mt-1 text-sm'>
              Contact fields stay private unless the supplier opts in.
            </p>
            <dl className='mt-4 grid grid-cols-2 gap-2 text-sm'>
              <dt>Contact name</dt>
              <dd>{supplier.isContactNamePublic ? 'Public' : 'Private'}</dd>
              <dt>Phone</dt>
              <dd>{supplier.isPhonePublic ? 'Public' : 'Private'}</dd>
              <dt>Email</dt>
              <dd>{supplier.isEmailPublic ? 'Public' : 'Private'}</dd>
              <dt>Website</dt>
              <dd>{supplier.isWebsitePublic ? 'Public' : 'Private'}</dd>
            </dl>
          </section>

          <section className='border-border bg-card rounded-2xl border p-5 sm:p-6'>
            <h2 className='text-lg font-semibold'>Supplier account</h2>
            <p className='text-muted-foreground mt-1 mb-5 text-sm'>
              Link an existing email-verified user account. This does not
              approve the supplier or grant access to customer enquiries.
            </p>
            {supplier.owner ? (
              <div className='space-y-1 text-sm'>
                <p className='font-medium'>{supplier.owner.name}</p>
                <p className='text-muted-foreground'>{supplier.owner.email}</p>
                <p className='text-muted-foreground text-xs'>
                  {supplier.owner.emailVerified
                    ? 'Email verified'
                    : 'Email not verified'}
                </p>
              </div>
            ) : (
              <SupplierOwnerLinkForm supplierId={supplier.id} />
            )}
          </section>

          <section className='border-border bg-card rounded-2xl border p-5 sm:p-6'>
            <h2 className='text-lg font-semibold'>Review history</h2>
            {supplier.reviewHistory.length === 0 ? (
              <p className='text-muted-foreground mt-4 text-sm'>
                No review events have been recorded.
              </p>
            ) : (
              <ol className='mt-5 space-y-5'>
                {supplier.reviewHistory.map((event) => (
                  <li key={event.id} className='border-border border-l-2 pl-4'>
                    <p className='text-sm font-medium'>
                      {eventTitle(event.type)}
                      {event.fromStatus &&
                        event.toStatus &&
                        event.fromStatus !== event.toStatus &&
                        ` · ${SUPPLIER_STATUS_LABELS[event.fromStatus]} → ${SUPPLIER_STATUS_LABELS[event.toStatus]}`}
                    </p>
                    {event.fromVerified !== null &&
                      event.toVerified !== null &&
                      event.fromVerified !== event.toVerified && (
                        <p className='text-muted-foreground mt-1 text-xs'>
                          Verification:{' '}
                          {event.fromVerified ? 'verified' : 'not verified'} →{' '}
                          {event.toVerified ? 'verified' : 'not verified'}
                        </p>
                      )}
                    <p className='mt-1 text-sm leading-6'>{event.reason}</p>
                    <p className='text-muted-foreground mt-1 text-xs'>
                      {event.actor.name} · {formatDate(event.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
      <SupplierMediaReview mediaAssets={supplier.mediaAssets} />
    </main>
  );
}

function eventTitle(type: string) {
  switch (type) {
    case 'SUPPLIER_CREATED':
      return 'Supplier record created';
    case 'PROFILE_UPDATED':
      return 'Supplier details updated';
    case 'STATUS_CHANGED':
      return 'Approval status changed';
    case 'VERIFICATION_CHANGED':
      return 'Verification updated';
    default:
      return 'Supplier review event';
  }
}

function formatDate(date: Date) {
  return date.toLocaleString('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Johannesburg'
  });
}
