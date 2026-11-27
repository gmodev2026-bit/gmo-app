import 'server-only';

import { createHmac } from 'node:crypto';
import prisma from '@/lib/prisma';

const MAX_SUBMISSIONS_PER_HOUR = 5;
const MAX_MEDIA_UPLOADS_PER_HOUR = 10;
const WINDOW_MS = 60 * 60 * 1000;

export async function consumeEnquirySubmissionSlot(phone: string) {
  return consumePublicSubmissionSlot('enquiry', phone);
}

export async function consumePublicSubmissionSlot(
  form: 'enquiry' | 'contact' | 'media',
  identifier: string
) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      'BETTER_AUTH_SECRET is required for public form rate limiting.'
    );
  }

  const fingerprintInput =
    form === 'enquiry'
      ? `growmeonline:public-enquiry-rate:v1:${identifier}`
      : `growmeonline:public-form-rate:v1:${form}:${identifier}`;
  const identityFingerprint = createHmac('sha256', secret)
    .update(fingerprintInput)
    .digest('hex');
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MS);

  return prisma.$transaction(
    async (transaction) => {
      await transaction.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtextextended(${identityFingerprint}, 0))
      `;

      await transaction.enquiryRateLimitAttempt.deleteMany({
        where: { createdAt: { lt: windowStart } }
      });

      const attempts = await transaction.enquiryRateLimitAttempt.count({
        where: {
          phoneFingerprint: identityFingerprint,
          createdAt: { gte: windowStart }
        }
      });

      const maxSubmissions =
        form === 'media'
          ? MAX_MEDIA_UPLOADS_PER_HOUR
          : MAX_SUBMISSIONS_PER_HOUR;
      if (attempts >= maxSubmissions) {
        return false;
      }

      await transaction.enquiryRateLimitAttempt.create({
        data: { phoneFingerprint: identityFingerprint, createdAt: now }
      });
      return true;
    },
    { maxWait: 10_000, timeout: 30_000 }
  );
}
