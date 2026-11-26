import type { Metadata } from 'next';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import { getPublicSupplier, getPublicSupplierForLegacySlug } from '@/server/public-suppliers';
import { SITE_URL } from '@/lib/constants';

type RouteParams = Promise<{ slug: string }>;

export async function generateMetadata({
  params
}: {
  params: RouteParams;
}): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const supplier = await getPublicSupplier(slug);
  if (!supplier) {
    const canonicalSlug = await getPublicSupplierForLegacySlug(slug);
    if (canonicalSlug) permanentRedirect(`/b/${canonicalSlug}`);
    return { title: 'Supplier not found', robots: { index: false, follow: false } };
  }

  const canonical = `${SITE_URL}/b/${supplier.slug}`;
  return {
    title: `${supplier.businessName} - local service provider`,
    description:
      supplier.tagline ??
      `Find ${supplier.businessName} and submit a reviewed service request.`,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      title: supplier.businessName,
      description: supplier.tagline ?? 'GrowMeOnline supplier profile',
      url: canonical
    }
  };
}

export default function SupplierProfilePage({
  params
}: {
  params: RouteParams;
}) {
  return (
    <Suspense fallback={<div className='min-h-screen bg-background px-5 py-12' />}>
      <SupplierProfile params={params} />
    </Suspense>
  );
}

async function SupplierProfile({ params }: { params: RouteParams }) {
  await connection();
  const { slug } = await params;
  const supplier = await getPublicSupplier(slug);
  if (!supplier) {
    const canonicalSlug = await getPublicSupplierForLegacySlug(slug);
    if (canonicalSlug) permanentRedirect(`/b/${canonicalSlug}`);
    notFound();
  }

  return (
    <main className='min-h-screen bg-background px-5 py-12 sm:px-8'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ProfessionalService',
            name: supplier.businessName,
            description: supplier.description ?? supplier.tagline ?? undefined,
            url: `${SITE_URL}/b/${supplier.slug}`,
            telephone: supplier.phone,
            email: supplier.email ?? undefined,
            areaServed: supplier.serviceAreas.map((item) => ({
              '@type': 'City',
              name: item.city.name,
              containedInPlace: {
                '@type': 'AdministrativeArea',
                name: item.city.province.name
              }
            })),
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Services',
              itemListElement: supplier.categories.map((item) => ({
                '@type': 'Offer',
                itemOffered: {
                  '@type': 'Service',
                  name: item.category.name
                }
              }))
            }
          }).replaceAll('<', '\\u003c')
        }}
      />
      <div className='mx-auto max-w-4xl'>
        <Link
          href='/suppliers'
          className='text-primary text-sm font-semibold hover:underline'
        >
          ← Browse suppliers
        </Link>

        <header className='mt-8 rounded-3xl border border-border bg-card p-6 sm:p-8'>
          <p className='text-primary text-sm font-semibold'>Verified provider</p>
          <h1 className='mt-2 text-3xl font-semibold tracking-tight sm:text-4xl'>
            {supplier.businessName}
          </h1>
          {supplier.tagline && (
            <p className='mt-3 text-lg text-muted-foreground'>
              {supplier.tagline}
            </p>
          )}
          {supplier.description && (
            <p className='mt-5 max-w-2xl leading-7'>{supplier.description}</p>
          )}
          <Link
            href={`/request?supplier=${encodeURIComponent(supplier.slug)}`}
            className='mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground'
          >
            Request this supplier
          </Link>
          <p className='mt-3 text-xs text-muted-foreground'>
            GrowMeOnline reviews the request before any introduction.
          </p>
        </header>

        <div className='mt-6 grid gap-6 md:grid-cols-2'>
          <section className='rounded-2xl border border-border bg-card p-5'>
            <h2 className='font-semibold'>Offerings</h2>
            {supplier.offerings.length === 0 ? (
              <p className='mt-4 text-sm text-muted-foreground'>No specific offerings listed.</p>
            ) : (
              <ul className='mt-4 space-y-2 text-sm'>
                {supplier.offerings.map((offering) => (
                  <li key={offering.id}>
                    <p>{offering.name}</p>
                    {offering.description && (
                      <p className='mt-1 text-muted-foreground'>{offering.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className='rounded-2xl border border-border bg-card p-5'>
            <h2 className='font-semibold'>Services</h2>
            <ul className='mt-4 space-y-2 text-sm'>
              {supplier.categories.map((item) => (
                <li key={item.category.id}>
                  {item.isPrimary ? 'Primary: ' : ''}
                  {item.category.name}
                </li>
              ))}
            </ul>
          </section>
          <section className='rounded-2xl border border-border bg-card p-5'>
            <h2 className='font-semibold'>Areas covered</h2>
            <ul className='mt-4 space-y-2 text-sm'>
              {supplier.serviceAreas.map((item) => (
                <li key={item.city.id}>
                  {item.city.name}, {item.city.province.name}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {supplier.website && (
          <a
            href={supplier.website}
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary mt-6 inline-block text-sm font-semibold hover:underline'
          >
            Visit supplier website
          </a>
        )}
      </div>
    </main>
  );
}
