const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateAndNormalizeAIResponse } = require('../src/services/ai.service');

describe('Missing Dates, Venues, and Deadlines Tests', () => {
  it('should map undefined, empty, or placeholder strings ("N/A", "TBD", "none") to strictly null', () => {
    const rawAiOutput = {
      title: 'Ambiguous Notice',
      summary: 'A notice without specific dates or venues.',
      event_date: 'N/A',
      start_time: 'TBD',
      end_time: 'To Be Announced',
      venue: 'unknown',
      deadline: 'none',
      target_audience: 'All students',
      urgency: 'low'
    };

    const result = validateAndNormalizeAIResponse(rawAiOutput, 'Ambiguous Notice notice text here');

    assert.strictEqual(result.event_date, null, 'event_date should be null when N/A');
    assert.strictEqual(result.start_time, null, 'start_time should be null when TBD');
    assert.strictEqual(result.end_time, null, 'end_time should be null when To Be Announced');
    assert.strictEqual(result.venue, null, 'venue should be null when unknown');
    assert.strictEqual(result.deadline, null, 'deadline should be null when none');
    assert.strictEqual(result.target_audience, 'All students');
  });

  it('should not invent a year or alter ambiguous date strings', () => {
    const rawAiOutput = {
      title: 'Ambiguous Date Notice',
      summary: 'Meeting on 12th March.',
      event_date: '12th March', // Notice did not state a year
      venue: null,
      deadline: null
    };

    const result = validateAndNormalizeAIResponse(rawAiOutput, 'Meeting on 12th March in main building');
    assert.strictEqual(result.event_date, '12th March');
    assert.strictEqual(result.venue, null);
    assert.strictEqual(result.deadline, null);
  });
});
