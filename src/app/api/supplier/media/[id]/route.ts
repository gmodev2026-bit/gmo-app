import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { SupplierMediaError, removeSupplierMedia } from '@/server/supplier-media';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (request.headers.get('origin') !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: 'Request origin is not allowed.' },
      { status: 403 }
    );
  }

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ message: 'Image not found.' }, { status: 404 });
  }

  try {
    await removeSupplierMedia(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof SupplierMediaError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    throw error;
  }
}
