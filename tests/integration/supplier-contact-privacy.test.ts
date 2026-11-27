import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import 'dotenv/config';
import prisma from '../../src/lib/prisma';
import { filterPublicSupplierContacts } from '../../src/features/suppliers/public-contact';

test('supplier contact fields default private and publish only opted-in values', async () => {
  await prisma
    .$transaction(
      async (transaction) => {
        const suffix = randomUUID();
        const supplier = await transaction.supplier.create({
          data: {
            businessName: `Contact privacy test ${suffix}`,
            slug: `contact-privacy-${suffix}`,
            contactName: 'Synthetic Contact',
            phone: '+27115550123',
            email: `contact-${suffix}@example.test`,
            website: 'https://synthetic.example.test'
          },
          select: {
            contactName: true,
            phone: true,
            email: true,
            website: true,
            isContactNamePublic: true,
            isPhonePublic: true,
            isEmailPublic: true,
            isWebsitePublic: true
          }
        });

        assert.deepEqual(
          filterPublicSupplierContacts(supplier),
          {
            contactName: null,
            phone: null,
            email: null,
            website: null
          }
        );

        const optedInSupplier = await transaction.supplier.update({
          where: { slug: `contact-privacy-${suffix}` },
          data: { isPhonePublic: true, isWebsitePublic: true },
          select: {
            contactName: true,
            phone: true,
            email: true,
            website: true,
            isContactNamePublic: true,
            isPhonePublic: true,
            isEmailPublic: true,
            isWebsitePublic: true
          }
        });
        assert.deepEqual(filterPublicSupplierContacts(optedInSupplier), {
          contactName: null,
          phone: '+27115550123',
          email: null,
          website: 'https://synthetic.example.test'
        });

        throw new RollbackIntegrationTest();
      },
      { maxWait: 30_000, timeout: 30_000 }
    )
    .catch((error) => {
      if (!(error instanceof RollbackIntegrationTest)) throw error;
    });
});

class RollbackIntegrationTest extends Error {}
