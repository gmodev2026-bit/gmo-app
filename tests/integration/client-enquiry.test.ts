import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import 'dotenv/config';
import prisma from '../../src/lib/prisma';

test('client records and enquiries remain isolated in a rolled-back transaction', async () => {
  await prisma.$transaction(async (transaction) => {
    const suffix = randomUUID();
    const province = await transaction.province.create({
      data: { name: `Test Province ${suffix}`, code: `TP-${suffix.slice(0, 8)}` }
    });
    const city = await transaction.city.create({
      data: { name: `Test City ${suffix}`, slug: `test-city-${suffix}`, provinceId: province.id }
    });
    const category = await transaction.category.create({
      data: { name: `Test Category ${suffix}`, slug: `test-category-${suffix}` }
    });

    const [firstUser, secondUser] = await Promise.all([
      transaction.user.create({
        data: { name: 'First Test Client', email: `first-${suffix}@example.invalid`, emailVerified: true }
      }),
      transaction.user.create({
        data: { name: 'Second Test Client', email: `second-${suffix}@example.invalid`, emailVerified: true }
      })
    ]);
    const [firstClient, secondClient] = await Promise.all([
      transaction.client.create({ data: { userId: firstUser.id } }),
      transaction.client.create({ data: { userId: secondUser.id } })
    ]);

    const enquiry = await transaction.enquiry.create({
      data: {
        publicReference: `TEST-${randomUUID()}`,
        submissionKey: randomUUID(),
        status: 'PENDING_REVIEW',
        clientId: firstClient.id,
        categoryId: category.id,
        cityId: city.id,
        customerName: 'First Test Client',
        customerPhone: '+27 82 000 0001',
        customerEmail: firstUser.email,
        preferredContact: 'PHONE',
        jobDescription: 'Synthetic integration test enquiry.',
        privacyNoticeVersion: 'test-v1',
        privacyNoticeAcceptedAt: new Date()
      }
    });

    const ownEnquiries = await transaction.enquiry.findMany({
      where: { clientId: firstClient.id },
      select: { id: true }
    });
    const otherEnquiries = await transaction.enquiry.findMany({
      where: { clientId: secondClient.id, id: enquiry.id },
      select: { id: true }
    });

    assert.equal(ownEnquiries.some((item) => item.id === enquiry.id), true);
    assert.deepEqual(otherEnquiries, []);

    throw new RollbackIntegrationTest();
  }, {
    maxWait: 30_000,
    timeout: 30_000
  }).catch((error) => {
    if (!(error instanceof RollbackIntegrationTest)) throw error;
  });
});

class RollbackIntegrationTest extends Error {}
