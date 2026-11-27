import { DashboardGate } from '@/components/dashboard/auth-gate';
import { PageSkeleton } from '@/components/shared/page-skeleton';
import { getSupplierPortalProfile } from '@/server/supplier-portal';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Image from 'next/image';

export const metadata = {
  robots: { index: false, follow: false }
};

export default function SupplierPreviewPage() {
  return (
    <DashboardGate>
      <Suspense fallback={<PageSkeleton />}>
        <SupplierPreview />
      </Suspense>
    </DashboardGate>
  );
}

async function SupplierPreview() {
  await connection();
  const supplier = await getSupplierPortalProfile();
  if (!supplier) notFound();

  return (
    <main className='mx-auto w-full max-w-4xl p-6 md:p-10'>
      <p className='text-destructive text-xs font-semibold'>PRIVATE PREVIEW — NOT INDEXABLE</p>
      <h1 className='mt-3 text-3xl font-bold'>{supplier.businessName}</h1>
      {supplier.tagline && <p className='text-muted-foreground mt-2'>{supplier.tagline}</p>}
      {supplier.description && <p className='mt-5 leading-7'>{supplier.description}</p>}
      <div className='mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3'>
        {supplier.mediaAssets
          .filter((asset) => asset.status === 'PENDING' || asset.status === 'READY')
          .map((asset) => (
            <figure key={asset.id} className='border-border rounded-xl border p-2'>
              <Image
                src={`/api/media/${asset.id}`}
                alt={asset.altText ?? ''}
                width={asset.width ?? 800}
                height={asset.height ?? 600}
                unoptimized
                className='bg-muted h-40 w-full rounded-lg object-contain'
              />
              <figcaption className='text-muted-foreground mt-2 text-xs'>
                {asset.purpose.toLowerCase()} · {asset.status.toLowerCase()}
              </figcaption>
            </figure>
          ))}
      </div>
      <div className='mt-6 grid gap-4 md:grid-cols-2'>
        <section className='border-border rounded-2xl border p-5'>
          <h2 className='font-semibold'>Categories</h2>
          <ul className='mt-3 text-sm'>
            {supplier.categories.map((item) => <li key={item.categoryId}>{item.category.name}</li>)}
          </ul>
        </section>
        <section className='border-border rounded-2xl border p-5'>
          <h2 className='font-semibold'>Service areas</h2>
          <ul className='mt-3 text-sm'>
            {supplier.serviceAreas.map((item) => (
              <li key={item.cityId}>{item.city.name}, {item.city.province.name}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
