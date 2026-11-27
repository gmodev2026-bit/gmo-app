'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { compressSupplierImage } from '@/features/media/compress-image';

type SupplierMediaPurpose = 'LOGO' | 'COVER' | 'GALLERY';
type SupplierMediaAsset = {
  id: string;
  purpose: SupplierMediaPurpose | 'VERIFICATION_DOCUMENT';
  status: 'PENDING' | 'READY' | 'REMOVED' | 'FAILED';
  altText: string | null;
  width: number | null;
  height: number | null;
  byteSize: number;
  createdAt: Date;
};

const PURPOSE_LABELS: Record<SupplierMediaPurpose, string> = {
  LOGO: 'Logo',
  COVER: 'Cover image',
  GALLERY: 'Gallery image'
};

export function SupplierMediaManager({
  supplierName,
  status,
  mediaAssets
}: {
  supplierName: string;
  status: string;
  mediaAssets: SupplierMediaAsset[];
}) {
  const locked = status !== 'DRAFT' && status !== 'CHANGES_REQUESTED';

  return (
    <section className='border-border bg-card rounded-2xl border p-5 sm:p-6'>
      <h2 className='text-lg font-semibold'>Business images</h2>
      <p className='text-muted-foreground mt-2 text-sm'>
        Images are resized, converted to WebP, and kept private until an admin
        approves them. Verification documents are not accepted here.
      </p>
      {locked ? (
        <p className='text-muted-foreground mt-4 text-sm'>
          Image changes are locked while this profile is under review or
          approved. Request profile changes through the admin team.
        </p>
      ) : (
        <ImageUploadForm supplierName={supplierName} />
      )}
      {mediaAssets.length > 0 && (
        <ul className='mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {mediaAssets.map((asset) => (
            <MediaAssetCard
              key={asset.id}
              asset={asset}
              canRemove={!locked && asset.status !== 'REMOVED' && asset.status !== 'FAILED'}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ImageUploadForm({ supplierName }: { supplierName: string }) {
  const router = useRouter();
  const [purpose, setPurpose] = useState<SupplierMediaPurpose>('LOGO');
  const [altText, setAltText] = useState(supplierName);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!file) {
      setError(true);
      setMessage('Choose an image to upload.');
      return;
    }

    setUploading(true);
    setMessage('');
    setError(false);
    try {
      const image = await compressSupplierImage(file);
      const response = await fetch('/api/supplier/media', {
        method: 'POST',
        headers: {
          'Content-Type': image.type,
          'X-Media-Purpose': purpose,
          'X-Media-Alt-Text': altText
        },
        body: image
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message ?? 'Image upload failed.');
      }

      setFile(null);
      form.reset();
      setPurpose('LOGO');
      setAltText(supplierName);
      setMessage('Image uploaded privately and is waiting for admin review.');
      router.refresh();
    } catch (uploadError) {
      setError(true);
      setMessage(
        uploadError instanceof Error ? uploadError.message : 'Image upload failed.'
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={submit} className='mt-5 grid gap-4 md:grid-cols-2'>
      <label className='grid gap-2 text-sm font-medium'>
        Image type
        <select
          value={purpose}
          onChange={(event) =>
            setPurpose(event.target.value as SupplierMediaPurpose)
          }
          className='border-input bg-background h-10 rounded-md border px-3'
        >
          {Object.entries(PURPOSE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className='grid gap-2 text-sm font-medium'>
        Image description (alt text)
        <input
          value={altText}
          onChange={(event) => setAltText(event.target.value)}
          required
          minLength={3}
          maxLength={140}
          className='border-input bg-background h-10 rounded-md border px-3'
        />
      </label>
      <label className='grid gap-2 text-sm font-medium md:col-span-2'>
        Select an image
        <input
          type='file'
          accept='image/jpeg,image/png,image/webp'
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          required
          className='border-input bg-background rounded-md border p-2 text-sm'
        />
        <span className='text-muted-foreground text-xs'>
          JPEG, PNG, or WebP; up to 16 MB before compression.
        </span>
      </label>
      <div className='flex flex-wrap items-center gap-3 md:col-span-2'>
        <Button type='submit' disabled={uploading || altText.trim().length < 3}>
          {uploading ? 'Compressing and uploading…' : 'Upload for review'}
        </Button>
        {message && (
          <p
            aria-live='polite'
            className={error ? 'text-destructive text-sm' : 'text-primary text-sm'}
          >
            {message}
          </p>
        )}
      </div>
    </form>
  );
}

function MediaAssetCard({
  asset,
  canRemove
}: {
  asset: SupplierMediaAsset;
  canRemove: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [removing, setRemoving] = useState(false);
  const isDisplayable = asset.status === 'PENDING' || asset.status === 'READY';

  async function remove() {
    setRemoving(true);
    setMessage('');
    try {
      const response = await fetch(`/api/supplier/media/${asset.id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const result = (await response.json()) as { message?: string };
        throw new Error(result.message ?? 'Could not remove the image.');
      }
      setMessage('Image removed.');
    } catch (removeError) {
      setMessage(
        removeError instanceof Error
          ? removeError.message
          : 'Could not remove the image.'
      );
    } finally {
      setRemoving(false);
      router.refresh();
    }
  }

  return (
    <li className='border-border rounded-xl border p-3'>
      {isDisplayable && (
        <Image
          src={`/api/media/${asset.id}`}
          alt={asset.altText ?? ''}
          width={asset.width ?? 800}
          height={asset.height ?? 600}
          unoptimized
          className='bg-muted h-40 w-full rounded-lg object-contain'
        />
      )}
      <div className='mt-3 flex items-center justify-between gap-2'>
        <div>
          <p className='text-sm font-medium'>
            {PURPOSE_LABELS[asset.purpose as SupplierMediaPurpose] ??
              'Business image'}
          </p>
          <p className='text-muted-foreground text-xs'>
            {asset.status.toLowerCase().replaceAll('_', ' ')} ·{' '}
            {Math.max(1, Math.round(asset.byteSize / 1024))} KB
          </p>
        </div>
        {canRemove && (
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={removing}
            onClick={remove}
          >
            {removing ? 'Removing…' : 'Remove'}
          </Button>
        )}
      </div>
      {message && (
        <p aria-live='polite' className='text-muted-foreground mt-2 text-xs'>
          {message}
        </p>
      )}
    </li>
  );
}
