const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateNoticeInput, validateAndNormalizeAIResponse, ValidationError } = require('../src/services/ai.service');

describe('Notice Extraction Integrity & False Dates Prevention Tests', () => {
  it('should reject gibberish input like "hiiii" with descriptive message', () => {
    assert.throws(
      () => validateNoticeInput('hiiii'),
      err => {
        return err instanceof ValidationError &&
          err.message.includes('Not enough information to extract a notice') &&
          err.message.includes('too short');
      }
    );
  });

  it('should reject repeated characters or gibberish words', () => {
    assert.throws(
      () => validateNoticeInput('aaaaaaa'),
      err => err instanceof ValidationError && err.message.includes('Not enough information to extract a notice')
    );
  });

  it('should reject empty or whitespace-only notice input', () => {
    assert.throws(
      () => validateNoticeInput('   '),
      err => err instanceof ValidationError && err.message.includes('cannot be empty')
    );
  });

  it('should keep missing fields strictly null for notice with only date but no time or venue', () => {
    const noticeText = 'Campus Annual Sports Day will take place on 2026-12-05 for all university students.';
    const rawAiOutput = {
      title: 'Campus Annual Sports Day',
      summary: 'Campus Annual Sports Day scheduled for 2026-12-05.',
      event_date: '2026-12-05',
      start_time: null,
      end_time: null,
      venue: null,
      deadline: null,
      target_audience: 'All university students',
      urgency: 'normal'
    };

    const normalized = validateAndNormalizeAIResponse(rawAiOutput, noticeText);
    assert.strictEqual(normalized.event_date, '2026-12-05');
    assert.strictEqual(normalized.start_time, null);
    assert.strictEqual(normalized.end_time, null);
    assert.strictEqual(normalized.venue, null);
    assert.strictEqual(normalized.deadline, null);
  });

  it('should keep missing fields strictly null when notice has date and venue but no time', () => {
    const noticeText = 'All department representatives must assemble in Auditorium 1 on 2026-11-20.';
    const rawAiOutput = {
      title: 'Department Representatives Assembly',
      summary: 'Department representatives assembly in Auditorium 1 on 2026-11-20.',
      event_date: '2026-11-20',
      start_time: null,
      end_time: null,
      venue: 'Auditorium 1',
      deadline: null,
      target_audience: 'Department representatives',
      urgency: 'normal'
    };

    const normalized = validateAndNormalizeAIResponse(rawAiOutput, noticeText);
    assert.strictEqual(normalized.event_date, '2026-11-20');
    assert.strictEqual(normalized.venue, 'Auditorium 1');
    assert.strictEqual(normalized.start_time, null);
    assert.strictEqual(normalized.end_time, null);
  });

  it('should properly structure notice when all dates, times, and venues are fully specified', () => {
    const noticeText = 'Guest lecture by Dr. Ramanujan on 2026-11-14 from 09:30 to 10:30 in Seminar Hall B.';
    const rawAiOutput = {
      title: 'Guest lecture by Dr. Ramanujan',
      summary: 'Guest lecture on microservices.',
      event_date: '2026-11-14',
      start_time: '09:30',
      end_time: '10:30',
      venue: 'Seminar Hall B',
      deadline: null,
      target_audience: 'Students',
      urgency: 'high'
    };

    const normalized = validateAndNormalizeAIResponse(rawAiOutput, noticeText);
    assert.strictEqual(normalized.event_date, '2026-11-14');
    assert.strictEqual(normalized.start_time, '09:30');
    assert.strictEqual(normalized.end_time, '10:30');
    assert.strictEqual(normalized.venue, 'Seminar Hall B');
  });

  it('should map placeholder strings like "TBA", "unknown", "None" to null and avoid inventing defaults', () => {
    const noticeText = 'Announcement: The final project submission instructions are available online.';
    const rawAiOutput = {
      title: 'Final Project Submission Instructions',
      summary: 'Instructions available online.',
      event_date: 'TBA',
      start_time: 'none',
      end_time: 'N/A',
      venue: 'unknown',
      deadline: 'None',
      target_audience: 'Students',
      urgency: 'low'
    };

    const normalized = validateAndNormalizeAIResponse(rawAiOutput, noticeText);
    assert.strictEqual(normalized.event_date, null);
    assert.strictEqual(normalized.start_time, null);
    assert.strictEqual(normalized.end_time, null);
    assert.strictEqual(normalized.venue, null);
    assert.strictEqual(normalized.deadline, null);
  });
});
