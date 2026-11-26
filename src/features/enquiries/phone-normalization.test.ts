import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getPhoneLookupValues } from './phone-normalization';

describe('South African phone normalization', () => {
  it('normalizes local numbers and retains matching formats', () => {
    assert.deepEqual(getPhoneLookupValues('082 123 4567'), {
      canonical: '+27821234567',
      lookupValues: ['+27821234567', '27821234567', '0821234567']
    });
  });

  it('normalizes international numbers to the same canonical value', () => {
    assert.deepEqual(getPhoneLookupValues('+27 82 123 4567'), {
      canonical: '+27821234567',
      lookupValues: ['+27821234567', '27821234567', '0821234567']
    });
  });
});
