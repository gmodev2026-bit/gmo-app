import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isAllowedTargetSupplier,
  isValidDispatchSelection
} from './dispatch';
import { isFreePilotQuotaExhausted } from './quota';

describe('supplier-specific enquiry routing', () => {
  const targetSupplierId = 'supplier-target';

  it('allows the selected supplier', () => {
    assert.equal(
      isAllowedTargetSupplier(targetSupplierId, targetSupplierId),
      true
    );
    assert.equal(
      isValidDispatchSelection(targetSupplierId, [targetSupplierId]),
      true
    );
  });

  it('blocks contacting or dispatching to an alternative supplier', () => {
    assert.equal(
      isAllowedTargetSupplier(targetSupplierId, 'supplier-other'),
      false
    );
    assert.equal(
      isValidDispatchSelection(targetSupplierId, ['supplier-other']),
      false
    );
  });

  it('does not allow adding another supplier alongside the selected supplier', () => {
    assert.equal(
      isValidDispatchSelection(targetSupplierId, [
        targetSupplierId,
        'supplier-other'
      ]),
      false
    );
  });

  it('keeps general enquiries eligible for multiple selected suppliers', () => {
    assert.equal(
      isValidDispatchSelection(null, [
        'supplier-one',
        'supplier-two',
        'supplier-three'
      ]),
      true
    );
  });
});

describe('free pilot assignment quota', () => {
  it('allows dispatch while fewer than five assignments are committed', () => {
    assert.equal(isFreePilotQuotaExhausted(4), false);
  });

  it('blocks dispatch once five assignments are committed', () => {
    assert.equal(isFreePilotQuotaExhausted(5), true);
  });
});
