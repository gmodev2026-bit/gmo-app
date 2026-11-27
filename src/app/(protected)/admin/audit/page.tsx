import { AdminGate } from '@/components/admin/auth-gate';
import { PageSkeleton } from '@/components/shared/page-skeleton';
import { listAdminAuditEvents } from '@/server/admin/audit-log';
import { connection } from 'next/server';
import Link from 'next/link';
import { Suspense } from 'react';
import type { AdminAuditAction } from '@/generated/prisma/client';

export default function AdminAuditPage() {
  return (
    <AdminGate>
      <Suspense fallback={<PageSkeleton />}>
        <AuditLog />
      </Suspense>
    </AdminGate>
  );
}

async function AuditLog() {
  await connection();
  const { events, total } = await listAdminAuditEvents();

  return (
    <main className='flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8'>
      <header>
        <h1 className='text-2xl font-semibold tracking-tight'>Admin audit log</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Recent administrative changes. Customer contact details and free-text
          notes are not copied into this log.
        </p>
      </header>

      <section className='border-border bg-card overflow-hidden rounded-2xl border'>
        <div className='border-border flex items-center justify-between border-b px-5 py-4'>
          <h2 className='font-medium'>Administrative activity</h2>
          <p className='text-muted-foreground text-sm'>
            Showing {events.length} of {total}
          </p>
        </div>

        {events.length === 0 ? (
          <p className='text-muted-foreground px-5 py-12 text-center text-sm'>
            No administrative changes have been recorded.
          </p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-sm'>
              <thead className='bg-muted/50 text-muted-foreground'>
                <tr>
                  <th scope='col' className='px-5 py-3 font-medium'>
                    Time
                  </th>
                  <th scope='col' className='px-5 py-3 font-medium'>
                    Admin
                  </th>
                  <th scope='col' className='px-5 py-3 font-medium'>
                    Action
                  </th>
                  <th scope='col' className='px-5 py-3 font-medium'>
                    Record
                  </th>
                  <th scope='col' className='px-5 py-3 font-medium'>
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className='divide-border divide-y'>
                {events.map((event) => (
                  <tr key={event.id} className='hover:bg-muted/30'>
                    <td className='text-muted-foreground px-5 py-4 whitespace-nowrap'>
                      {formatDate(event.createdAt)}
                    </td>
                    <td className='px-5 py-4'>{event.actor.name}</td>
                    <td className='px-5 py-4'>{actionLabel(event.action)}</td>
                    <td className='px-5 py-4'>
                      <Link
                        href={
                          event.entityType === 'ENQUIRY'
                            ? `/admin/enquiries/${event.entityId}`
                            : `/admin/suppliers/${event.entityId}`
                        }
                        className='text-primary font-mono text-xs hover:underline'
                      >
                        {event.entityType === 'ENQUIRY' ? 'Enquiry' : 'Supplier'}{' '}
                        {event.entityId.slice(0, 8)}
                      </Link>
                    </td>
                    <td className='text-muted-foreground px-5 py-4'>
                      {formatDetails(event.action, event.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className='text-muted-foreground text-xs'>
        Audit records are written with the corresponding admin change and are
        read-only in this view.
      </p>
    </main>
  );
}

function actionLabel(action: AdminAuditAction) {
  const labels: Record<AdminAuditAction, string> = {
    SUPPLIER_CREATED: 'Supplier created',
    SUPPLIER_PROFILE_UPDATED: 'Supplier profile updated',
    SUPPLIER_REVIEWED: 'Supplier reviewed',
    SUPPLIER_ACCOUNT_LINKED: 'Supplier account linked',
    SUPPLIER_MEDIA_REVIEWED: 'Supplier media reviewed',
    ENQUIRY_CONTACT_VERIFIED: 'Customer contact verified',
    ENQUIRY_STATUS_CHANGED: 'Enquiry status changed',
    SUPPLIER_AVAILABILITY_RECORDED: 'Supplier availability recorded',
    ENQUIRY_DISPATCHED: 'Enquiry dispatched',
    FOLLOW_UP_SCHEDULED: 'Follow-up scheduled',
    FOLLOW_UP_RESOLVED: 'Follow-up resolved',
    CATALOG_UPDATED: 'Catalog updated'
  };

  return labels[action];
}

function formatDetails(
  action: AdminAuditAction,
  details: unknown
): string {
  if (!isJsonObject(details)) {
    return '—';
  }

  switch (action) {
    case 'SUPPLIER_CREATED':
      return `${readNumber(details, 'categoryCount')} categories, ${readNumber(details, 'serviceAreaCount')} service areas`;
    case 'SUPPLIER_PROFILE_UPDATED':
      return `${readNumber(details, 'categoriesAdded')} categories and ${readNumber(details, 'categoriesRemoved')} removed; ${readNumber(details, 'serviceAreasAdded')} areas added and ${readNumber(details, 'serviceAreasRemoved')} removed`;
    case 'SUPPLIER_REVIEWED':
      return `${readText(details, 'fromStatus')} → ${readText(details, 'toStatus')}; verified ${readBoolean(details, 'fromVerified')} → ${readBoolean(details, 'toVerified')}`;
    case 'SUPPLIER_ACCOUNT_LINKED':
      return 'Existing email-verified user account linked';
    case 'SUPPLIER_MEDIA_REVIEWED':
      return `${readText(details, 'purpose')}: ${readText(details, 'fromStatus')} → ${readText(details, 'toStatus')}`;
    case 'ENQUIRY_CONTACT_VERIFIED':
      return `${readText(details, 'method')}; sharing approval recorded`;
    case 'ENQUIRY_STATUS_CHANGED':
      return `${readText(details, 'fromStatus')} → ${readText(details, 'toStatus')}`;
    case 'SUPPLIER_AVAILABILITY_RECORDED':
      return `Supplier ${readText(details, 'supplierId')}: ${readText(details, 'response')}`;
    case 'ENQUIRY_DISPATCHED':
      return `${readNumber(details, 'supplierCount')} supplier(s)`;
    case 'FOLLOW_UP_SCHEDULED':
      return `${readText(details, 'channel')} for ${readDate(details, 'scheduledAt')}`;
    case 'FOLLOW_UP_RESOLVED':
      return readText(details, 'outcome');
  }

  return '—';
}

function isJsonObject(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readText(details: Record<string, unknown>, key: string) {
  const value = details[key];
  return typeof value === 'string' ? value.replaceAll('_', ' ').toLowerCase() : '—';
}

function readNumber(details: Record<string, unknown>, key: string) {
  const value = details[key];
  return typeof value === 'number' ? value : 0;
}

function readBoolean(details: Record<string, unknown>, key: string) {
  const value = details[key];
  return typeof value === 'boolean' ? (value ? 'yes' : 'no') : '—';
}

function readDate(details: Record<string, unknown>, key: string) {
  const value = details[key];
  if (typeof value !== 'string') {
    return '—';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : formatDate(date);
}

function formatDate(date: Date) {
  return date.toLocaleString('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Johannesburg'
  });
}
