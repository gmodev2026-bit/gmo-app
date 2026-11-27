import { NextResponse, type NextRequest } from 'next/server';
import { SupplierMediaError, createSupplierMedia, getSupplierMediaUploadContext } from '@/server/supplier-media';

const MAX_REQUEST_BYTES = 8 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp'
]);

class RequestTooLargeError extends Error {}

async function readBoundedBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new SupplierMediaError('Image data is required.', 400);

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_REQUEST_BYTES) {
      await reader.cancel();
      throw new RequestTooLargeError();
    }
    chunks.push(value);
  }

  if (totalBytes === 0) {
    throw new SupplierMediaError('Image data is required.', 400);
  }
  return Buffer.concat(chunks, totalBytes);
}

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  return origin !== null && origin === request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: 'Request origin is not allowed.' }, { status: 403 });
  }
  if (process.env.BUNNY_MEDIA_UPLOADS_ENABLED !== 'true') {
    return NextResponse.json(
      { message: 'Supplier image uploads are not enabled.' },
      { status: 503 }
    );
  }

  try {
    const context = await getSupplierMediaUploadContext();
    const mimeType = request.headers.get('content-type')?.split(';', 1)[0].trim();
    if (!mimeType || !ACCEPTED_MIME_TYPES.has(mimeType)) {
      throw new SupplierMediaError(
        'Choose a JPEG, PNG, or WebP image.',
        400
      );
    }

    const declaredLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
      throw new RequestTooLargeError();
    }

    const bytes = await readBoundedBody(request);
    const media = await createSupplierMedia(context, {
      bytes,
      mimeType,
      purpose: request.headers.get('x-media-purpose') ?? '',
      altText: request.headers.get('x-media-alt-text') ?? ''
    });

    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestTooLargeError) {
      return NextResponse.json(
        { message: 'Compressed image must be smaller than 8 MB.' },
        { status: 413 }
      );
    }
    if (error instanceof SupplierMediaError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    throw error;
  }
}
