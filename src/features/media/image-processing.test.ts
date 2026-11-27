import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import {
  processSupplierImage,
  SupplierImageValidationError
} from './image-processing';

test('resizes supplier images and re-encodes them as WebP', async () => {
  const input = await sharp({
    create: {
      width: 2400,
      height: 1200,
      channels: 3,
      background: { r: 32, g: 96, b: 160 }
    }
  })
    .png()
    .toBuffer();

  const output = await processSupplierImage(input, 'image/png');
  const metadata = await sharp(output.buffer).metadata();

  assert.equal(metadata.format, 'webp');
  assert.equal(output.width, 1800);
  assert.equal(output.height, 900);
  assert.ok(output.byteSize < input.byteLength);
  assert.equal(metadata.exif, undefined);
});

test('rejects invalid image bytes and mismatched MIME types', async () => {
  await assert.rejects(
    processSupplierImage(Buffer.from('not an image'), 'image/jpeg'),
    SupplierImageValidationError
  );

  const png = await sharp({
    create: {
      width: 2,
      height: 2,
      channels: 3,
      background: { r: 10, g: 20, b: 30 }
    }
  })
    .png()
    .toBuffer();
  await assert.rejects(
    processSupplierImage(png, 'image/webp'),
    SupplierImageValidationError
  );
});
