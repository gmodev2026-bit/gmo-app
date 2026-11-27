import sharp from 'sharp';

const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const MAX_INPUT_PIXELS = 40_000_000;
const MAX_INPUT_DIMENSION = 12_000;
const MAX_OUTPUT_DIMENSION = 1_800;

const MIME_FORMATS = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp'
} as const;

export type SupplierImageMimeType = keyof typeof MIME_FORMATS;

export class SupplierImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupplierImageValidationError';
  }
}

export async function processSupplierImage(
  input: Buffer,
  mimeType: string
): Promise<{ buffer: Buffer; width: number; height: number; byteSize: number }> {
  if (input.length === 0 || input.length > MAX_INPUT_BYTES) {
    throw new SupplierImageValidationError(
      'Image must be smaller than 8 MB.'
    );
  }

  if (!Object.hasOwn(MIME_FORMATS, mimeType)) {
    throw new SupplierImageValidationError(
      'Choose a JPEG, PNG, or WebP image.'
    );
  }

  try {
    const options = {
      failOn: 'error' as const,
      limitInputPixels: MAX_INPUT_PIXELS
    };
    const metadata = await sharp(input, options).metadata();
    const expectedFormat = MIME_FORMATS[mimeType as SupplierImageMimeType];

    if (
      metadata.format !== expectedFormat ||
      !metadata.width ||
      !metadata.height ||
      metadata.width > MAX_INPUT_DIMENSION ||
      metadata.height > MAX_INPUT_DIMENSION
    ) {
      throw new SupplierImageValidationError(
        'The image is invalid or does not match its file type.'
      );
    }

    const { data, info } = await sharp(input, options)
      .rotate()
      .resize({
        width: MAX_OUTPUT_DIMENSION,
        height: MAX_OUTPUT_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 82, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    if (data.length > MAX_OUTPUT_BYTES) {
      throw new SupplierImageValidationError(
        'The compressed image exceeds the 2 MB limit.'
      );
    }

    return {
      buffer: data,
      width: info.width,
      height: info.height,
      byteSize: data.length
    };
  } catch (error) {
    if (error instanceof SupplierImageValidationError) throw error;
    throw new SupplierImageValidationError(
      'The selected file is not a valid supported image.'
    );
  }
}
