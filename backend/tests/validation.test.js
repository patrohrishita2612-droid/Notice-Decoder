const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateNoticeInput, ValidationError } = require('../src/services/ai.service');

describe('Input Validation Tests', () => {
  it('should reject null and undefined inputs with ValidationError', () => {
    assert.throws(
      () => validateNoticeInput(null),
      err => err instanceof ValidationError && err.message.includes('required')
    );
    assert.throws(
      () => validateNoticeInput(undefined),
      err => err instanceof ValidationError && err.message.includes('required')
    );
  });

  it('should reject non-string inputs (numbers, objects, booleans)', () => {
    assert.throws(
      () => validateNoticeInput(12345),
      err => err instanceof ValidationError && err.message.includes('must be a string')
    );
    assert.throws(
      () => validateNoticeInput({ text: 'Some notice text' }),
      err => err instanceof ValidationError && err.message.includes('must be a string')
    );
    assert.throws(
      () => validateNoticeInput(true),
      err => err instanceof ValidationError && err.message.includes('must be a string')
    );
  });

  it('should reject empty or whitespace-only strings', () => {
    assert.throws(
      () => validateNoticeInput(''),
      err => err instanceof ValidationError && err.message.includes('cannot be empty')
    );
    assert.throws(
      () => validateNoticeInput('    \n\t   '),
      err => err instanceof ValidationError && err.message.includes('cannot be empty')
    );
  });

  it('should reject strings that are too short to be genuine notices', () => {
    assert.throws(
      () => validateNoticeInput('Notice'),
      err => err instanceof ValidationError && err.message.includes('too short')
    );
  });

  it('should accept valid notice text and trim leading/trailing whitespace', () => {
    const raw = '   Attention Students: Tomorrow is a holiday due to administrative reasons.   ';
    const result = validateNoticeInput(raw);
    assert.strictEqual(
      result,
      'Attention Students: Tomorrow is a holiday due to administrative reasons.'
    );
  });
});
