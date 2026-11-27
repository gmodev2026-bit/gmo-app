'use client';

const MAX_INPUT_BYTES = 16 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
const MAX_EDGE = 1_800;

export async function compressSupplierImage(file: File): Promise<Blob> {
  if (file.size === 0 || file.size > MAX_INPUT_BYTES) {
    throw new Error('Choose an image smaller than 16 MB.');
  }

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPEG, PNG, or WebP image.');
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, {
      imageOrientation: 'from-image'
    });
  } catch {
    throw new Error('This image could not be opened. Try another file.');
  }

  try {
    if (
      bitmap.width * bitmap.height > MAX_IMAGE_PIXELS ||
      bitmap.width > 12_000 ||
      bitmap.height > 12_000
    ) {
      throw new Error('Image dimensions are too large.');
    }

    const canvas = document.createElement('canvas');
    let scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));

    for (let resizeAttempt = 0; resizeAttempt < 5; resizeAttempt += 1) {
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Image compression is unavailable.');

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.82, 0.74, 0.66, 0.58]) {
        const compressed = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/webp', quality);
        });
        if (!compressed || compressed.type !== 'image/webp') {
          throw new Error('Your browser could not create a WebP image.');
        }
        if (compressed.size <= MAX_OUTPUT_BYTES) return compressed;
      }

      scale *= 0.82;
    }
  } finally {
    bitmap.close();
  }

  throw new Error('The image could not be compressed below 2 MB.');
}
