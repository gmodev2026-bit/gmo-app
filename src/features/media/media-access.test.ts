import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canAccessPrivateSupplierMedia } from './media-access';

describe('private supplier media access', () => {
  it('allows the supplier owner and admins to view pending media', () => {
    assert.equal(
      canAccessPrivateSupplierMedia('owner-1', {
        userId: 'owner-1',
        role: 'user'
      }),
      true
    );
    assert.equal(
      canAccessPrivateSupplierMedia('owner-1', {
        userId: 'admin-1',
        role: 'admin'
      }),
      true
    );
  });

  it('denies anonymous and unrelated accounts', () => {
    assert.equal(canAccessPrivateSupplierMedia('owner-1', null), false);
    assert.equal(
      canAccessPrivateSupplierMedia('owner-1', {
        userId: 'other-1',
        role: 'user'
      }),
      false
    );
    assert.equal(
      canAccessPrivateSupplierMedia(null, {
        userId: 'other-1',
        role: 'user'
      }),
      false
    );
  });
});
