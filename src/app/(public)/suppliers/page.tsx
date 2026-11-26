import type { Metadata } from 'next';
import { Suspense } from 'react';
import { connection } from 'next/server';
import Link from 'next/link';
import {
  listPublicSupplierCategories,
  listPublicSupplierCities,
  listPublicSuppliers
} from '@/server/public-suppliers';

export const metadata: Metadata = {
  title: 'Find local service providers',
  description:
    'Browse approved and verified GrowMeOnline suppliers for pilot home services.'
};

type SearchParams = Promise<{
  category?: string;
  city?: string;
  page?: string;
}>;

export default function SuppliersPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  return (
    <main className='bg-background min-h-screen px-5 py-12 sm:px-8'>
      <div className='mx-auto max-w-6xl'>
        <header className='max-w-2xl'>
          <p className='text-primary text-sm font-semibold tracking-wide uppercase'>
            Pilot supplier directory
          </p>
          <h1 className='mt-2 text-3xl font-semibold tracking-tight sm:text-4xl'>
            Find local service providers
          </h1>
          <p className='text-muted-foreground mt-3 leading-7'>
            Only active suppliers that are approved and verified are shown.
          </p>
        </header>
        <Suspense fallback={<p className='text-muted-foreground mt-8 text-sm'>Loading suppliers…</p>}>
          <SupplierDirectory searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function SupplierDirectory({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  await connection();
  const params = await searchParams;
  const categorySlug = first(params.category);
  const citySlug = first(params.city);
  const page = Number(first(params.page));
  const [categories, cities, result] = await Promise.all([
    listPublicSupplierCategories(),
    listPublicSupplierCities(),
    listPublicSuppliers({
      categorySlug,
      citySlug,
      page: Number.isSafeInteger(page) && page > 0 ? page : 1
    })
  ]);

  return (
    <>
      <form
        method='get'
        action='/suppliers'
        className='mt-8 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_auto]'
      >
        <label className='text-sm font-medium'>
          Service
          <select
            name='category'
            defaultValue={categorySlug ?? ''}
            className='mt-2 h-10 w-full rounded-xl border border-input bg-background px-3'
          >
            <option value=''>All services</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className='text-sm font-medium'>
          Area
          <select
            name='city'
            defaultValue={citySlug ?? ''}
            className='mt-2 h-10 w-full rounded-xl border border-input bg-background px-3'
          >
            <option value=''>All areas</option>
            {cities.map((city) => (
              <option key={city.id} value={city.slug}>
                {city.name}, {city.province.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type='submit'
          className='mt-auto h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground'
        >
          Apply
        </button>
      </form>

      <p className='mt-6 text-sm text-muted-foreground'>
        {result.total} eligible supplier{result.total === 1 ? '' : 's'}
      </p>

      {result.suppliers.length === 0 ? (
        <section className='mt-4 rounded-2xl border border-border bg-card px-5 py-12 text-center'>
          <p className='text-sm text-muted-foreground'>
            No eligible suppliers match these filters.
          </p>
        </section>
      ) : (
        <div className='mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {result.suppliers.map((supplier) => (
            <article
              key={supplier.id}
              className='rounded-2xl border border-border bg-card p-5'
            >
              <h2 className='text-lg font-semibold'>{supplier.businessName}</h2>
              {supplier.tagline && (
                <p className='mt-2 text-sm text-muted-foreground'>
                  {supplier.tagline}
                </p>
              )}
              <p className='mt-4 text-sm'>
                {supplier.categories.map((item) => item.category.name).join(', ') ||
                  'Service provider'}
              </p>
              <p className='mt-2 text-xs text-muted-foreground'>
                {supplier.serviceAreas
                  .map((item) => item.city.name)
                  .join(', ')}
              </p>
              <Link
                href={`/b/${supplier.slug}`}
                className='mt-5 inline-flex h-9 items-center rounded-xl border border-border px-4 text-sm font-semibold'
              >
                View profile
              </Link>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function first(value: string | undefined) {
  return value || undefined;
}
