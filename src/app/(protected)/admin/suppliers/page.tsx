import { Suspense } from 'react';
import { connection } from 'next/server';
import Link from 'next/link';
import { AdminGate } from '@/components/admin/auth-gate';
import { PageSkeleton } from '@/components/shared/page-skeleton';
import { listAdminSuppliers } from '@/server/admin/suppliers';
import { SupplierStatusBadge } from './status-badge';

type SearchParams = Promise<{ page?: string | string[] }>;

export default function SuppliersPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  return (
    <AdminGate>
      <Suspense fallback={<PageSkeleton />}>
        <SupplierRegister searchParams={searchParams} />
      </Suspense>
    </AdminGate>
  );
}

async function SupplierRegister({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  await connection();
  const params = await searchParams;
  const result = await listAdminSuppliers(parsePage(first(params.page)));

  return (
    <main className='flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8'>
      <header className='flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Supplier register
          </h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Maintain supplier details, confirmed services, coverage and review
            status.
          </p>
        </div>
        <Link
          href='/admin/suppliers/new'
          className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 w-fit items-center rounded-xl px-4 text-sm font-medium'
        >
          Add supplier
        </Link>
      </header>

      <section className='border-border bg-card overflow-hidden rounded-2xl border'>
        <div className='border-border flex items-center justify-between border-b px-5 py-4'>
          <h2 className='font-medium'>
            {result.total} {result.total === 1 ? 'supplier' : 'suppliers'}
          </h2>
          <p className='text-muted-foreground text-sm'>
            Page {result.page} of {result.pageCount}
          </p>
        </div>

        {result.suppliers.length === 0 ? (
          <p className='text-muted-foreground px-5 py-12 text-center text-sm'>
            No supplier records yet.
          </p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-sm'>
              <thead className='bg-muted/50 text-muted-foreground'>
                <tr>
                  <th scope='col' className='px-5 py-3 font-medium'>
                    Business
                  </th>
                  <th scope='col' className='px-5 py-3 font-medium'>
                    Confirmed services
                  </th>
                  <th scope='col' className='px-5 py-3 font-medium'>
                    Confirmed coverage
                  </th>
                  <th scope='col' className='px-5 py-3 font-medium'>
                    Status
                  </th>
                  <th scope='col' className='px-5 py-3 font-medium'>
                    Verification
                  </th>
                  <th scope='col' className='px-5 py-3'>
                    <span className='sr-only'>Open supplier</span>
                  </th>
                </tr>
              </thead>
              <tbody className='divide-border divide-y'>
                {result.suppliers.map((supplier) => (
                  <tr key={supplier.id} className='hover:bg-muted/30'>
                    <td className='px-5 py-4'>
                      <p className='font-medium'>{supplier.businessName}</p>
                      <p className='text-muted-foreground mt-1 font-mono text-xs'>
                        /b/{supplier.slug}
                      </p>
                    </td>
                    <td className='px-5 py-4'>
                      {supplier.categories
                        .map((item) => item.category.name)
                        .join(', ') || 'None'}
                    </td>
                    <td className='px-5 py-4'>
                      {supplier.serviceAreas
                        .map(
                          (area) =>
                            `${area.city.name}, ${area.city.province.name}`
                        )
                        .join(', ') || 'None'}
                    </td>
                    <td className='px-5 py-4'>
                      <SupplierStatusBadge status={supplier.status} />
                    </td>
                    <td className='px-5 py-4'>
                      {supplier.isVerified ? 'Verified' : 'Not verified'}
                    </td>
                    <td className='px-5 py-4 text-right'>
                      <Link
                        href={`/admin/suppliers/${supplier.id}`}
                        className='text-primary font-medium hover:underline'
                      >
                        Manage
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
            aria-label='Supplier pages'
            className='border-border flex justify-between border-t px-5 py-4'
          >
            {result.page > 1 ? (
              <Link
                href={`/admin/suppliers?page=${result.page - 1}`}
                className='text-primary text-sm font-medium hover:underline'
              >
                Previous
              </Link>
            ) : (
              <span className='text-muted-foreground text-sm'>Previous</span>
            )}
            {result.page < result.pageCount ? (
              <Link
                href={`/admin/suppliers?page=${result.page + 1}`}
                className='text-primary text-sm font-medium hover:underline'
              >
                Next
              </Link>
            ) : (
              <span className='text-muted-foreground text-sm'>Next</span>
            )}
          </nav>
        )}
      </section>
    </main>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}
