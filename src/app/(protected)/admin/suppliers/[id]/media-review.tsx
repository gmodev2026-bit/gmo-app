'use client';

import Image from 'next/image';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import type { SupplierActionState } from '@/features/suppliers/action-state';
import { reviewSupplierMediaAction } from '../actions';

type MediaAsset = {
  id: string;
  purpose: 'LOGO' | 'COVER' | 'GALLERY' | 'VERIFICATION_DOCUMENT';
  status: 'PENDING' | 'READY' | 'REMOVED' | 'FAILED';
  altText: string | null;
  width: number | null;
  height: number | null;
  byteSize: number;
};

const idleState: SupplierActionState = { status: 'idle' };

export function SupplierMediaReview({
  mediaAssets
}: {
  mediaAssets: MediaAsset[];
}) {
  return (
    <section className='border-border bg-card rounded-2xl border p-5 sm:p-6'>
      <h2 className='text-lg font-semibold'>Supplier media</h2>
      <p className='text-muted-foreground mt-1 text-sm'>
        Only approved public images can be delivered from a public supplier
        profile. Verification evidence is never accepted through this flow.
      </p>
      {mediaAssets.length === 0 ? (
        <p className='text-muted-foreground mt-4 text-sm'>
          No supplier images have been uploaded.
        </p>
      ) : (
        <ul className='mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {mediaAssets.map((asset) => (
            <MediaReviewCard key={asset.id} asset={asset} />
          ))}
        </ul>
      )}
    </section>
  );
}

function MediaReviewCard({ asset }: { asset: MediaAsset }) {
  const [state, action, pending] = useActionState(
    reviewSupplierMediaAction,
    idleState
  );
  const canPreview = asset.status === 'PENDING' || asset.status === 'READY';

  return (
    <li className='border-border rounded-xl border p-3'>
      {canPreview && (
        <Image
          src={`/api/media/${asset.id}`}
          alt={asset.altText ?? ''}
          width={asset.width ?? 800}
          height={asset.height ?? 600}
          unoptimized
          className='bg-muted h-40 w-full rounded-lg object-contain'
        />
      )}
      <p className='mt-3 text-sm font-medium'>
        {asset.purpose.replaceAll('_', ' ')} · {asset.status.toLowerCase()}
      </p>
      <p className='text-muted-foreground mt-1 text-xs'>
        {asset.width ?? '—'} × {asset.height ?? '—'} ·{' '}
        {Math.max(1, Math.round(asset.byteSize / 1024))} KB
      </p>
      {asset.status === 'PENDING' && (
        <form action={action} className='mt-3 grid gap-2'>
          <input type='hidden' name='mediaAssetId' value={asset.id} />
          <label className='grid gap-1 text-xs font-medium'>
            Review reason
            <input
              name='reason'
              required
              minLength={5}
              maxLength={500}
              defaultValue='Image checked for public display.'
              className='border-input bg-background h-9 rounded-md border px-2'
            />
          </label>
          <div className='flex gap-2'>
            <Button
              type='submit'
              name='decision'
              value='approve'
              size='sm'
              disabled={pending}
            >
              Approve
            </Button>
            <Button
              type='submit'
              name='decision'
              value='remove'
              variant='outline'
              size='sm'
              disabled={pending}
            >
              Remove
            </Button>
          </div>
        </form>
      )}
      {asset.status === 'READY' && (
        <form action={action} className='mt-3 grid gap-2'>
          <input type='hidden' name='mediaAssetId' value={asset.id} />
          <label className='grid gap-1 text-xs font-medium'>
            Removal reason
            <input
              name='reason'
              required
              minLength={5}
              maxLength={500}
              defaultValue='Image removed during admin review.'
              className='border-input bg-background h-9 rounded-md border px-2'
            />
          </label>
          <Button
            type='submit'
            name='decision'
            value='remove'
            variant='outline'
            size='sm'
            disabled={pending}
          >
            Remove from public profile
          </Button>
        </form>
      )}
      {(asset.status === 'REMOVED' || asset.status === 'FAILED') && (
        <form action={action} className='mt-3'>
          <input type='hidden' name='mediaAssetId' value={asset.id} />
          <input
            type='hidden'
            name='reason'
            value='Retrying cleanup of removed supplier media.'
          />
          <Button
            type='submit'
            name='decision'
            value='remove'
            variant='outline'
            size='sm'
            disabled={pending}
          >
            Retry storage cleanup
          </Button>
        </form>
      )}
      {state.message && (
        <p
          aria-live='polite'
          className={
            state.status === 'error'
              ? 'text-destructive mt-2 text-xs'
              : 'text-primary mt-2 text-xs'
          }
        >
          {state.message}
        </p>
      )}
    </li>
  );
}
