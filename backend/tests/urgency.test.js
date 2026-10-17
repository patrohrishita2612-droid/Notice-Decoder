const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateAndNormalizeAIResponse } = require('../src/services/ai.service');

describe('Urgency Normalization Tests', () => {
  it('should preserve valid urgency values (low, medium, high, unknown)', () => {
    for (const val of ['low', 'medium', 'high', 'unknown']) {
      const res = validateAndNormalizeAIResponse({ urgency: val }, 'sample notice text');
      assert.strictEqual(res.urgency, val);
    }
  });

  it('should normalize uppercase or mixed case urgency values', () => {
    assert.strictEqual(
      validateAndNormalizeAIResponse({ urgency: 'HIGH' }, 'sample text').urgency,
      'high'
    );
    assert.strictEqual(
      validateAndNormalizeAIResponse({ urgency: 'Medium' }, 'sample text').urgency,
      'medium'
    );
    assert.strictEqual(
      validateAndNormalizeAIResponse({ urgency: '  LOW  ' }, 'sample text').urgency,
      'low'
    );
  });

  it('should normalize unrecognized urgency values to "unknown"', () => {
    const invalidValues = ['critical', 'urgent', 'asap', 'normal', 'none', '', null, undefined, 42];
    for (const invalid of invalidValues) {
      const res = validateAndNormalizeAIResponse({ urgency: invalid }, 'sample notice text');
      assert.strictEqual(res.urgency, 'unknown');
    }
  });
});
