import type { Metadata } from 'next';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
  const socialImage =
    supplier.mediaAssets.find((asset) => asset.purpose === 'COVER') ??
    supplier.mediaAssets.find((asset) => asset.purpose === 'LOGO');
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
      url: canonical,
      ...(socialImage
        ? {
            images: [
              {
                url: `${SITE_URL}/api/media/${socialImage.id}`,
                width: socialImage.width ?? undefined,
                height: socialImage.height ?? undefined,
                alt: socialImage.altText ?? supplier.businessName
              }
            ]
          }
        : {})
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
  const logo = supplier.mediaAssets.find((asset) => asset.purpose === 'LOGO');
  const cover = supplier.mediaAssets.find((asset) => asset.purpose === 'COVER');
  const gallery = supplier.mediaAssets.filter(
    (asset) => asset.purpose === 'GALLERY'
  );

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
            ...(supplier.phone ? { telephone: supplier.phone } : {}),
            ...(supplier.email ? { email: supplier.email } : {}),
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
          {cover && (
            <div className='relative mb-6 h-48 overflow-hidden rounded-2xl sm:h-64'>
              <Image
                src={`/api/media/${cover.id}`}
                alt={cover.altText ?? `${supplier.businessName} cover`}
                fill
                sizes='(max-width: 768px) 100vw, 896px'
                className='object-cover'
              />
            </div>
          )}
          <p className='text-primary text-sm font-semibold'>Verified provider</p>
          <div className='mt-2 flex items-center gap-4'>
            {logo && (
              <Image
                src={`/api/media/${logo.id}`}
                alt={logo.altText ?? `${supplier.businessName} logo`}
                width={96}
                height={96}
                className='bg-background h-20 w-20 rounded-2xl border border-border object-contain p-2 sm:h-24 sm:w-24'
              />
            )}
            <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>
              {supplier.businessName}
            </h1>
          </div>
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
          {(supplier.contactName || supplier.phone || supplier.email) && (
            <div className='mt-5 grid gap-2 text-sm sm:grid-cols-2'>
              {supplier.contactName && (
                <p>
                  Contact: <span className='font-medium'>{supplier.contactName}</span>
                </p>
              )}
              {supplier.phone && (
                <p>
                  Phone:{' '}
                  <a
                    href={`tel:${supplier.phone}`}
                    className='text-primary font-medium hover:underline'
                  >
                    {supplier.phone}
                  </a>
                </p>
              )}
              {supplier.email && (
                <p>
                  Email:{' '}
                  <a
                    href={`mailto:${supplier.email}`}
                    className='text-primary font-medium hover:underline'
                  >
                    {supplier.email}
                  </a>
                </p>
              )}
            </div>
          )}
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

        {gallery.length > 0 && (
          <section className='mt-6 rounded-2xl border border-border bg-card p-5'>
            <h2 className='font-semibold'>Business photos</h2>
            <ul className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3'>
              {gallery.map((image) => (
                <li
                  key={image.id}
                  className='relative aspect-[4/3] overflow-hidden rounded-xl'
                >
                  <Image
                    src={`/api/media/${image.id}`}
                    alt={image.altText ?? `${supplier.businessName} photo`}
                    fill
                    sizes='(max-width: 640px) 50vw, 33vw'
                    className='object-cover'
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

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
