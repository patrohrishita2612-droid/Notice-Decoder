const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateAndNormalizeAIResponse } = require('../src/services/ai.service');

describe('Evidence Grounding & Hallucination Guard Tests', () => {
  const noticeText = `College Circular No 45.
All students must report to the Main Auditorium on Friday 20th November at 9:00 AM.
Late entry will not be permitted under any circumstances.`;

  it('should accept evidence quotations that appear word-for-word in the notice', () => {
    const rawAiOutput = {
      title: 'Mandatory Assembly',
      summary: 'Students must report to the Main Auditorium on Friday 20th November at 9:00 AM.',
      evidence: [
        'Main Auditorium',
        'Friday 20th November',
        'Late entry will not be permitted'
      ]
    };

    const result = validateAndNormalizeAIResponse(rawAiOutput, noticeText);
    assert.strictEqual(result.evidence.length, 3);
    assert.deepStrictEqual(result.evidence, [
      'Main Auditorium',
      'Friday 20th November',
      'Late entry will not be permitted'
    ]);
  });

  it('should filter out hallucinated evidence quotations that do not match the notice text', () => {
    const rawAiOutput = {
      title: 'Mandatory Assembly',
      summary: 'Students must report to the auditorium.',
      evidence: [
        'Main Auditorium', // Genuine quote
        'Registration fee of 500 Rupees applies', // Hallucinated quote (not in notice!)
        'Bring your parent signature' // Hallucinated quote (not in notice!)
      ]
    };

    const result = validateAndNormalizeAIResponse(rawAiOutput, noticeText);

    // Only genuine quote should remain
    assert.strictEqual(result.evidence.length, 1);
    assert.strictEqual(result.evidence[0], 'Main Auditorium');

    // Filtered quotes should trigger a notice verification note in missing_information
    assert.ok(
      result.missing_information.some(item =>
        item.includes('candidate quote(s) could not be verified')
      )
    );
  });
});
