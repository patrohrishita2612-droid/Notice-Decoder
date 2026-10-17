const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { SYSTEM_INSTRUCTION, buildNoticePrompt } = require('../src/services/ai.service');

describe('Prompt Construction Tests', () => {
  it('should include strict non-hallucination negative constraints in system instruction', () => {
    assert.ok(SYSTEM_INSTRUCTION.includes('NEVER invent, infer, or hallucinate'));
    assert.ok(SYSTEM_INSTRUCTION.includes('PRESERVE UNCERTAINTY'));
    assert.ok(SYSTEM_INSTRUCTION.includes('DO NOT assume the current year'));
    assert.ok(SYSTEM_INSTRUCTION.includes('output null'));
  });

  it('should include urgency definitions in system instruction', () => {
    assert.ok(SYSTEM_INSTRUCTION.includes('"low", "medium", "high", "unknown"'));
  });

  it('should embed the exact notice text into the prompt without corruption', () => {
    const noticeText = 'Campus workshop on AI in Room 302 on 24 November 2026.';
    const prompt = buildNoticePrompt(noticeText);

    assert.ok(prompt.includes(noticeText));
    assert.ok(prompt.includes('"title"'));
    assert.ok(prompt.includes('"event_date"'));
    assert.ok(prompt.includes('"start_time"'));
    assert.ok(prompt.includes('"end_time"'));
    assert.ok(prompt.includes('"venue"'));
    assert.ok(prompt.includes('"deadline"'));
    assert.ok(prompt.includes('"target_audience"'));
    assert.ok(prompt.includes('"required_actions"'));
    assert.ok(prompt.includes('"documents_required"'));
    assert.ok(prompt.includes('"urgency"'));
    assert.ok(prompt.includes('"missing_information"'));
    assert.ok(prompt.includes('"evidence"'));
  });
});
