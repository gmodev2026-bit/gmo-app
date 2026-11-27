import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canEditSupplierProfile,
  getAllowedSupplierTransitions
} from './status';

describe('supplier status transitions', () => {
  it('does not let a draft supplier skip submission and approval', () => {
    assert.deepEqual(getAllowedSupplierTransitions('DRAFT'), [
      'PENDING_APPROVAL'
    ]);
  });

  it('allows approval review outcomes for submitted suppliers', () => {
    assert.deepEqual(getAllowedSupplierTransitions('PENDING_APPROVAL'), [
      'APPROVED',
      'CHANGES_REQUESTED',
      'SUSPENDED'
    ]);
  });

  it('requires a suspended supplier to return through pending approval', () => {
    assert.deepEqual(getAllowedSupplierTransitions('SUSPENDED'), [
      'PENDING_APPROVAL'
    ]);
  });

  it('only allows profile edits in statuses that can be resubmitted', () => {
    assert.equal(canEditSupplierProfile('DRAFT'), true);
    assert.equal(canEditSupplierProfile('CHANGES_REQUESTED'), true);
    assert.equal(canEditSupplierProfile('SUSPENDED'), true);
    assert.equal(canEditSupplierProfile('PENDING_APPROVAL'), false);
    assert.equal(canEditSupplierProfile('APPROVED'), false);
  });
});
