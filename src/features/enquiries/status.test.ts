import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getAllowedEnquiryTransitions } from './status';

describe('enquiry status transitions', () => {
  it('requires review before matching', () => {
    assert.deepEqual(getAllowedEnquiryTransitions('PENDING_REVIEW'), [
      'NEEDS_INFORMATION',
      'QUALIFIED',
      'REJECTED',
      'REJECTED_SPAM'
    ]);
  });

  it('allows dispatch only after matching', () => {
    assert.equal(
      getAllowedEnquiryTransitions('QUALIFIED').includes('DISPATCHED'),
      false
    );
    assert.equal(
      getAllowedEnquiryTransitions('MATCHING').includes('DISPATCHED'),
      true
    );
  });

  it('only allows dispatched enquiries to close', () => {
    assert.deepEqual(getAllowedEnquiryTransitions('DISPATCHED'), ['CLOSED']);
    assert.deepEqual(getAllowedEnquiryTransitions('CLOSED'), []);
  });
});
