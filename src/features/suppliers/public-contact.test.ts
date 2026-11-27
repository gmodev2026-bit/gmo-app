import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { filterPublicSupplierContacts } from './public-contact';

const supplierContact = {
  contactName: 'Test Contact',
  phone: '+27123456789',
  email: 'contact@example.test',
  website: 'https://example.test',
  isContactNamePublic: false,
  isPhonePublic: false,
  isEmailPublic: false,
  isWebsitePublic: false
};

describe('public supplier contact visibility', () => {
  it('omits all contact values unless the supplier opts in', () => {
    assert.deepEqual(filterPublicSupplierContacts(supplierContact), {
      contactName: null,
      phone: null,
      email: null,
      website: null
    });
  });

  it('exposes only the individually enabled contact values', () => {
    assert.deepEqual(
      filterPublicSupplierContacts({
        ...supplierContact,
        isPhonePublic: true,
        isWebsitePublic: true
      }),
      {
        contactName: null,
        phone: supplierContact.phone,
        email: null,
        website: supplierContact.website
      }
    );
  });
});
