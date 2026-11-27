import 'server-only';

const MAX_STORED_IMAGE_BYTES = 2 * 1024 * 1024;

export class BunnyStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BunnyStorageError';
  }
}

function getStorageConfig() {
  const endpoint = process.env.BUNNY_STORAGE_HTTP_ENDPOINT?.replace(/\/+$/, '');
  const password = process.env.BUNNY_STORAGE_PASSWORD;

  if (!endpoint || !password) {
    throw new BunnyStorageError(
      'Bunny Storage HTTP endpoint and password must be configured.'
    );
  }

  let parsedEndpoint: URL;
  try {
    parsedEndpoint = new URL(endpoint);
  } catch {
    throw new BunnyStorageError('Bunny Storage endpoint is invalid.');
  }

  if (
    parsedEndpoint.protocol !== 'https:' ||
    parsedEndpoint.username ||
    parsedEndpoint.password ||
    parsedEndpoint.search ||
    parsedEndpoint.hash
  ) {
    throw new BunnyStorageError(
      'Bunny Storage endpoint must be a plain HTTPS endpoint.'
    );
  }

  return { endpoint, password };
}

function getObjectUrl(objectKey: string) {
  const prefix = process.env.BUNNY_STORAGE_SUPPLIERS_PREFIX;
  if (
    !prefix ||
    !/^[a-zA-Z0-9_-]+$/.test(prefix) ||
    !/^[a-zA-Z0-9/_-]+$/.test(objectKey) ||
    objectKey.includes('..') ||
    objectKey.startsWith('/')
  ) {
    throw new BunnyStorageError('Bunny Storage object key is invalid.');
  }

  const { endpoint } = getStorageConfig();
  const path = [prefix, ...objectKey.split('/')].map(encodeURIComponent).join('/');
  return `${endpoint}/${path}`;
}

async function requestStorage(
  objectKey: string,
  method: 'PUT' | 'GET' | 'DELETE',
  body?: Buffer
) {
  const { password } = getStorageConfig();
  let response: Response;

  try {
    response = await fetch(getObjectUrl(objectKey), {
      method,
      headers: {
        AccessKey: password,
        ...(body
          ? {
              'Content-Type': 'image/webp',
              'Content-Length': String(body.byteLength)
            }
          : {})
      },
      ...(body ? { body: Uint8Array.from(body) } : {}),
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000)
    });
  } catch {
    throw new BunnyStorageError('Bunny Storage could not be reached.');
  }

  return response;
}

export async function uploadBunnyImage(objectKey: string, image: Buffer) {
  if (image.byteLength === 0 || image.byteLength > MAX_STORED_IMAGE_BYTES) {
    throw new BunnyStorageError('Image size is outside the storage limit.');
  }

  const response = await requestStorage(objectKey, 'PUT', image);
  if (!response.ok) {
    throw new BunnyStorageError(
      `Bunny Storage rejected the upload (HTTP ${response.status}).`
    );
  }
}

export async function downloadBunnyImage(objectKey: string) {
  const response = await requestStorage(objectKey, 'GET');
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new BunnyStorageError(
      `Bunny Storage could not read the image (HTTP ${response.status}).`
    );
  }
  if (!response.body) {
    throw new BunnyStorageError('Bunny Storage returned an empty image.');
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_STORED_IMAGE_BYTES) {
      await reader.cancel();
      throw new BunnyStorageError('Stored image exceeds the size limit.');
    }
    chunks.push(value);
  }

  if (totalBytes === 0) {
    throw new BunnyStorageError('Bunny Storage returned an empty image.');
  }

  return Buffer.concat(chunks, totalBytes);
}

export async function deleteBunnyImage(objectKey: string) {
  const response = await requestStorage(objectKey, 'DELETE');
  if (!response.ok && response.status !== 404) {
    throw new BunnyStorageError(
      `Bunny Storage could not delete the image (HTTP ${response.status}).`
    );
  }
}
