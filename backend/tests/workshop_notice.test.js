const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  processNotice,
  validateAndNormalizeAIResponse,
  MockProvider
} = require('../src/services/ai.service');

describe('Sample Workshop Notice & Urgency/Title Inference Tests', () => {
  const workshopNoticeText =
    'All second-year AI and Data Science students must attend the workshop on 25 October 2026 at 10 AM in Room 302. Registration deadline is 22 October 2026.';

  it('should infer a meaningful title and high/medium urgency for the sample workshop notice', async () => {
    // Simulate model returning valid extracted fields
    const mockModelOutput = {
      title: 'AI and Data Science Workshop',
      summary:
        'All second-year AI and Data Science students are required to attend a workshop on 25 October 2026 at 10 AM in Room 302. Registration deadline is 22 October 2026.',
      event_date: '25 October 2026',
      start_time: '10 AM',
      end_time: null,
      venue: 'Room 302',
      deadline: '22 October 2026',
      target_audience: 'All second-year AI and Data Science students',
      required_actions: [
        'Register by 22 October 2026',
        'Attend the workshop on 25 October 2026 at 10 AM in Room 302'
      ],
      documents_required: [],
      urgency: 'high',
      missing_information: ['Workshop end time'],
      evidence: [
        'All second-year AI and Data Science students must attend the workshop',
        '25 October 2026 at 10 AM',
        'Room 302',
        'Registration deadline is 22 October 2026'
      ]
    };

    const mockProvider = new MockProvider({ response: mockModelOutput });
    const result = await processNotice(workshopNoticeText, { providerInstance: mockProvider });

    assert.ok(result.title, 'Title must not be null');
    assert.match(result.title, /workshop/i);
    assert.strictEqual(result.event_date, '25 October 2026');
    assert.strictEqual(result.venue, 'Room 302');
    assert.strictEqual(result.deadline, '22 October 2026');
    assert.strictEqual(result.urgency, 'high');
    assert.notStrictEqual(result.urgency, 'unknown');
  });

  it('should infer title and urgency even if raw AI model omitted title or returned unknown urgency', () => {
    const rawAiOutputWithGaps = {
      title: null, // Model failed to title it
      summary:
        'Second-year AI and Data Science students are required to attend a workshop on 25 October 2026.',
      event_date: '25 October 2026',
      start_time: '10 AM',
      venue: 'Room 302',
      deadline: '22 October 2026',
      target_audience: 'All second-year AI and Data Science students',
      required_actions: ['Attend the workshop', 'Register before deadline'],
      urgency: 'unknown' // Model was too timid
    };

    const result = validateAndNormalizeAIResponse(rawAiOutputWithGaps, workshopNoticeText);

    // Title should be inferred from the stated workshop and department
    assert.ok(result.title, 'Title should be inferred from notice text');
    assert.match(result.title, /workshop/i);

    // Urgency must not remain unknown because of mandatory attendance + deadline
    assert.strictEqual(result.urgency, 'high');
  });

  it('should preserve null title and unknown urgency when information genuinely cannot be inferred', () => {
    const completelyVagueNotice = 'Please note that the general advisory remains in effect until further notice.';

    const rawAiOutput = {
      title: null,
      summary: 'Advisory remains in effect.',
      event_date: null,
      start_time: null,
      end_time: null,
      venue: null,
      deadline: null,
      target_audience: null,
      required_actions: [],
      documents_required: [],
      urgency: 'unknown',
      missing_information: ['No event date, venue, or deadline specified']
    };

    const result = validateAndNormalizeAIResponse(rawAiOutput, completelyVagueNotice);

    assert.strictEqual(result.title, null, 'Vague text without event must have title: null');
    assert.strictEqual(result.urgency, 'unknown', 'Vague text without dates/deadlines must have urgency: unknown');
    assert.strictEqual(result.event_date, null);
    assert.strictEqual(result.venue, null);
    assert.strictEqual(result.deadline, null);
  });

  it('should preserve low urgency for optional informational notices', () => {
    const optionalNotice = 'Students are invited to attend an optional coding webinar this Saturday.';
    const rawAiOutput = {
      title: 'Optional Coding Webinar',
      summary: 'Optional webinar this Saturday.',
      event_date: 'Saturday',
      urgency: 'low'
    };

    const result = validateAndNormalizeAIResponse(rawAiOutput, optionalNotice);
    assert.strictEqual(result.urgency, 'low');
  });
});
