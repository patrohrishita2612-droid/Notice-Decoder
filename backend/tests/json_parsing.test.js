const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  extractJsonFromResponse,
  validateAndNormalizeAIResponse,
  AIResponseError
} = require('../src/services/ai.service');

describe('JSON Parsing & Missing Fields Tests', () => {
  it('should parse clean JSON object string', () => {
    const raw = '{"title":"Test Notice","summary":"A summary."}';
    const parsed = extractJsonFromResponse(raw);
    assert.strictEqual(parsed.title, 'Test Notice');
    assert.strictEqual(parsed.summary, 'A summary.');
  });

  it('should handle markdown fenced code blocks (```json ... ```)', () => {
    const raw = '```json\n{\n  "title": "Fenced Notice",\n  "summary": "Inside fence."\n}\n```';
    const parsed = extractJsonFromResponse(raw);
    assert.strictEqual(parsed.title, 'Fenced Notice');
  });

  it('should extract JSON when model includes conversational text before/after JSON', () => {
    const raw = `Here is the requested extraction:
    {
      "title": "Embedded Notice",
      "summary": "Notice embedded with text."
    }
    Hope this helps!`;
    const parsed = extractJsonFromResponse(raw);
    assert.strictEqual(parsed.title, 'Embedded Notice');
  });

  it('should throw AIResponseError when output is malformed and not parseable as JSON', () => {
    const raw = 'I am sorry, but I cannot extract details as a JSON.';
    assert.throws(
      () => extractJsonFromResponse(raw),
      err => err instanceof AIResponseError && err.message.includes('Failed to parse AI response')
    );
  });

  it('should safely fill in missing fields with default nulls and empty arrays', () => {
    // Only summary and title provided
    const partialData = {
      title: 'Minimal Notice',
      summary: 'Short note.'
    };

    const normalized = validateAndNormalizeAIResponse(partialData, 'Minimal Notice text here');

    assert.strictEqual(normalized.title, 'Minimal Notice');
    assert.strictEqual(normalized.summary, 'Short note.');
    assert.strictEqual(normalized.event_date, null);
    assert.strictEqual(normalized.start_time, null);
    assert.strictEqual(normalized.end_time, null);
    assert.strictEqual(normalized.venue, null);
    assert.strictEqual(normalized.deadline, null);
    assert.strictEqual(normalized.target_audience, null);
    assert.deepStrictEqual(normalized.required_actions, []);
    assert.deepStrictEqual(normalized.documents_required, []);
    assert.deepStrictEqual(normalized.missing_information, []);
    assert.deepStrictEqual(normalized.evidence, []);
    assert.strictEqual(normalized.urgency, 'unknown');
  });
});
