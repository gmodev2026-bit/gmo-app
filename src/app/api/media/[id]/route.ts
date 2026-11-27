import { NextResponse } from 'next/server';
import { z } from 'zod';
import { downloadBunnyImage, BunnyStorageError } from '@/lib/bunny-storage';
import prisma from '@/lib/prisma';
import { canAccessPrivateSupplierMedia } from '@/features/media/media-access';
import { isAuthenticated } from '@/server/user';
import { PUBLIC_SUPPLIER_WHERE } from '@/server/public-suppliers';

const PUBLIC_MEDIA_PURPOSES = ['LOGO', 'COVER', 'GALLERY'] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return new NextResponse(null, { status: 404 });
  }

  const publicMedia = await prisma.mediaAsset.findFirst({
    where: {
      id,
      status: 'READY',
      purpose: { in: [...PUBLIC_MEDIA_PURPOSES] },
      supplier: PUBLIC_SUPPLIER_WHERE
    },
    select: { objectKey: true }
  });

  let objectKey = publicMedia?.objectKey;
  let isPublic = Boolean(publicMedia);

  if (!objectKey) {
    const privateMedia = await prisma.mediaAsset.findFirst({
      where: {
        id,
        status: { in: ['PENDING', 'READY'] },
        purpose: { in: [...PUBLIC_MEDIA_PURPOSES] }
      },
      select: {
        objectKey: true,
        supplier: { select: { ownerUserId: true } }
      }
    });
    if (!privateMedia) return new NextResponse(null, { status: 404 });

    const session = await isAuthenticated();
    if (
      !canAccessPrivateSupplierMedia(
        privateMedia.supplier.ownerUserId,
        session
          ? { userId: session.user.id, role: session.user.role }
          : null
      )
    ) {
      return new NextResponse(null, { status: 404 });
    }
    objectKey = privateMedia.objectKey;
  }

  try {
    const image = await downloadBunnyImage(objectKey);
    if (!image) return new NextResponse(null, { status: 404 });

    return new NextResponse(image, {
      headers: {
        'Content-Type': 'image/webp',
        'Content-Length': String(image.byteLength),
        'X-Content-Type-Options': 'nosniff',
        'Cross-Origin-Resource-Policy': 'same-site',
        'Cache-Control': isPublic
          ? 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
          : 'private, no-store'
      }
    });
  } catch (error) {
    if (error instanceof BunnyStorageError) {
      console.error('Bunny image delivery failed:', {
        mediaAssetId: id,
        error: error.message
      });
      return NextResponse.json(
        { message: 'Image delivery is temporarily unavailable.' },
        { status: 502 }
      );
    }
    throw error;
  }
}
