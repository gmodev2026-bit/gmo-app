import 'server-only';

import { createHmac } from 'node:crypto';
import prisma from '@/lib/prisma';

const MAX_SUBMISSIONS_PER_HOUR = 5;
const WINDOW_MS = 60 * 60 * 1000;

export async function consumeEnquirySubmissionSlot(phone: string) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET is required for enquiry rate limiting.');
  }

  const phoneFingerprint = createHmac('sha256', secret)
    .update(`growmeonline:public-enquiry-rate:v1:${phone}`)
    .digest('hex');
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MS);

  return prisma.$transaction(
    async (transaction) => {
      await transaction.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtextextended(${phoneFingerprint}, 0))
      `;

      await transaction.enquiryRateLimitAttempt.deleteMany({
        where: { createdAt: { lt: windowStart } }
      });

      const attempts = await transaction.enquiryRateLimitAttempt.count({
        where: {
          phoneFingerprint,
          createdAt: { gte: windowStart }
        }
      });

      if (attempts >= MAX_SUBMISSIONS_PER_HOUR) {
        return false;
      }

      await transaction.enquiryRateLimitAttempt.create({
        data: { phoneFingerprint, createdAt: now }
      });
      return true;
    },
    { maxWait: 10_000, timeout: 30_000 }
  );
}
