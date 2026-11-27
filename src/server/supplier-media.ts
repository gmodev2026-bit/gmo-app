import 'server-only';

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { deleteBunnyImage, uploadBunnyImage, BunnyStorageError } from '@/lib/bunny-storage';
import { processSupplierImage, SupplierImageValidationError } from '@/features/media/image-processing';
import { isAuthenticated } from '@/server/user';
import { consumePublicSubmissionSlot } from '@/server/enquiry-rate-limit';

const publicMediaPurposeSchema = z.enum(['LOGO', 'COVER', 'GALLERY']);
const MAX_ACTIVE_MEDIA = {
  LOGO: 1,
  COVER: 1,
  GALLERY: 6
} as const;

export class SupplierMediaError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'SupplierMediaError';
  }
}

export async function getSupplierMediaUploadContext() {
  const session = await isAuthenticated();
  if (!session) throw new SupplierMediaError('Sign in to upload images.', 401);

  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, emailVerified: true, banned: true }
  });
  if (
    !account ||
    account.role !== 'user' ||
    !account.emailVerified ||
    account.banned
  ) {
    throw new SupplierMediaError(
      'A verified, active supplier account is required.',
      403
    );
  }

  const supplier = await prisma.supplier.findFirst({
    where: {
      ownerUserId: session.user.id,
      deletedAt: null,
      AND: [
        { slug: { not: { startsWith: 'simulation-' } } },
        { slug: { not: { startsWith: 'test-only-' } } }
      ]
    },
    select: { id: true, status: true }
  });
  if (!supplier) {
    throw new SupplierMediaError(
      'Save a supplier profile before uploading images.',
      404
    );
  }
  if (!['DRAFT', 'CHANGES_REQUESTED'].includes(supplier.status)) {
    throw new SupplierMediaError(
      'Images can only be changed while the profile is a draft or has requested changes.',
      409
    );
  }

  return { ownerUserId: session.user.id, supplierId: supplier.id };
}

export async function createSupplierMedia({
  ownerUserId,
  supplierId
}: Awaited<ReturnType<typeof getSupplierMediaUploadContext>>, {
  bytes,
  mimeType,
  purpose,
  altText
}: {
  bytes: Buffer;
  mimeType: string;
  purpose: string;
  altText: string;
}) {
  const parsedPurpose = publicMediaPurposeSchema.safeParse(purpose);
  const parsedAltText = z.string().trim().min(3).max(140).safeParse(altText);
  if (!parsedPurpose.success || !parsedAltText.success) {
    throw new SupplierMediaError(
      'Choose a public image type and provide alt text between 3 and 140 characters.',
      400
    );
  }

  const allowed = await consumePublicSubmissionSlot('media', ownerUserId);
  if (!allowed) {
    throw new SupplierMediaError(
      'Image upload limit reached. Try again later.',
      429
    );
  }

  let processed: Awaited<ReturnType<typeof processSupplierImage>>;
  try {
    processed = await processSupplierImage(bytes, mimeType);
  } catch (error) {
    if (error instanceof SupplierImageValidationError) {
      throw new SupplierMediaError(error.message, 400);
    }
    throw error;
  }

  const objectKey = `${supplierId}/${randomUUID()}.webp`;
  const media = await prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtextextended(${`supplier-media:${supplierId}:${parsedPurpose.data}`}, 0))
    `;

    const currentSupplier = await transaction.supplier.findFirst({
      where: {
        id: supplierId,
        ownerUserId,
        deletedAt: null,
        status: { in: ['DRAFT', 'CHANGES_REQUESTED'] }
      },
      select: { id: true }
    });
    if (!currentSupplier) {
      throw new SupplierMediaError(
        'The supplier profile is no longer available for image changes.',
        409
      );
    }

    const activeCount = await transaction.mediaAsset.count({
      where: {
        supplierId,
        purpose: parsedPurpose.data,
        status: { in: ['PENDING', 'READY'] }
      }
    });
    if (activeCount >= MAX_ACTIVE_MEDIA[parsedPurpose.data]) {
      throw new SupplierMediaError(
        `Remove an existing ${parsedPurpose.data.toLowerCase()} image before uploading another.`,
        409
      );
    }

    return transaction.mediaAsset.create({
      data: {
        supplierId,
        purpose: parsedPurpose.data,
        status: 'PENDING',
        objectKey,
        mimeType: 'image/webp',
        byteSize: processed.byteSize,
        width: processed.width,
        height: processed.height,
        altText: parsedAltText.data
      },
      select: {
        id: true,
        purpose: true,
        status: true,
        altText: true,
        width: true,
        height: true,
        byteSize: true,
        createdAt: true
      }
    });
  });

  try {
    await uploadBunnyImage(objectKey, processed.buffer);
  } catch (error) {
    try {
      await deleteBunnyImage(objectKey);
    } catch (cleanupError) {
      console.error('Bunny image cleanup after failed upload failed:', {
        mediaAssetId: media.id,
        error: cleanupError instanceof Error ? cleanupError.message : 'Unknown cleanup error'
      });
    }

    try {
      await prisma.mediaAsset.update({
        where: { id: media.id },
        data: { status: 'FAILED' }
      });
    } catch (updateError) {
      console.error('Failed media asset could not be marked failed:', {
        mediaAssetId: media.id,
        error: updateError instanceof Error ? updateError.message : 'Unknown database error'
      });
    }

    if (error instanceof BunnyStorageError) {
      throw new SupplierMediaError(
        'Bunny Storage could not save the image. Please try again later.',
        502
      );
    }
    throw error;
  }

  return media;
}

export async function removeSupplierMedia(mediaAssetId: string) {
  const { ownerUserId, supplierId } = await getSupplierMediaUploadContext();
  const media = await prisma.mediaAsset.findFirst({
    where: {
      id: mediaAssetId,
      supplierId,
      status: { in: ['PENDING', 'READY'] },
      purpose: { in: ['LOGO', 'COVER', 'GALLERY'] }
    },
    select: { id: true, objectKey: true }
  });
  if (!media) {
    throw new SupplierMediaError('Image not found.', 404);
  }

  await prisma.mediaAsset.updateMany({
    where: { id: media.id, supplierId, status: { in: ['PENDING', 'READY'] } },
    data: { status: 'REMOVED' }
  });

  try {
    await deleteBunnyImage(media.objectKey);
  } catch (error) {
    console.error('Removed supplier image could not be deleted from Bunny:', {
      mediaAssetId: media.id,
      ownerUserId,
      error: error instanceof Error ? error.message : 'Unknown storage error'
    });
    throw new SupplierMediaError(
      'The image is no longer visible, but storage cleanup failed. Contact support.',
      502
    );
  }
}
