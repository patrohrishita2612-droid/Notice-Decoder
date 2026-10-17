const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  processNotice,
  REQUIRED_SCHEMA_KEYS,
  MockProvider
} = require('../src/services/ai.service');

describe('Structured Response Tests', () => {
  const sampleNotice = `Department of Computer Science
Date: 25 October 2026
Notice for all 3rd year students.
The CSA Workshop will be held on 15 November 2026 from 10:00 AM to 01:00 PM in Seminar Hall A.
Attendance is mandatory. Bring your college ID card.
Registration deadline: 10 November 2026.`;

  const validAiResponse = {
    title: 'CSA Workshop for 3rd Year Students',
    summary: 'A mandatory CSA workshop will be held on 15 November 2026 for 3rd year students in Seminar Hall A.',
    event_date: '15 November 2026',
    start_time: '10:00 AM',
    end_time: '01:00 PM',
    venue: 'Seminar Hall A',
    deadline: '10 November 2026',
    target_audience: '3rd year students',
    required_actions: ['Attend the workshop', 'Register before 10 November 2026'],
    documents_required: ['College ID card'],
    urgency: 'high',
    missing_information: [],
    evidence: [
      '15 November 2026',
      'Seminar Hall A',
      'Attendance is mandatory',
      'Bring your college ID card'
    ]
  };

  it('should process notice and return all 13 schema fields matching requirements', async () => {
    const mockProvider = new MockProvider({ response: validAiResponse });
    const result = await processNotice(sampleNotice, { providerInstance: mockProvider });

    // Verify all 13 keys are present
    for (const key of REQUIRED_SCHEMA_KEYS) {
      assert.ok(key in result, `Missing expected key: ${key}`);
    }

    assert.strictEqual(result.title, 'CSA Workshop for 3rd Year Students');
    assert.strictEqual(result.event_date, '15 November 2026');
    assert.strictEqual(result.start_time, '10:00 AM');
    assert.strictEqual(result.end_time, '01:00 PM');
    assert.strictEqual(result.venue, 'Seminar Hall A');
    assert.strictEqual(result.deadline, '10 November 2026');
    assert.strictEqual(result.target_audience, '3rd year students');
    assert.strictEqual(result.urgency, 'high');

    assert.ok(Array.isArray(result.required_actions));
    assert.strictEqual(result.required_actions.length, 2);

    assert.ok(Array.isArray(result.documents_required));
    assert.strictEqual(result.documents_required.length, 1);

    assert.ok(Array.isArray(result.missing_information));
    assert.ok(Array.isArray(result.evidence));
    assert.strictEqual(result.evidence.length, 4);

    // Verify backward compatibility fields for Member 2 database insert
    assert.strictEqual(result.date, '15 November 2026');
    assert.strictEqual(result.time, '10:00 AM - 01:00 PM');
    assert.ok(result.required_action.includes('Attend the workshop'));
  });
});
