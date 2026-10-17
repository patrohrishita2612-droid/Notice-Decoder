const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const {
  checkScheduleConflict,
  submitConflictRequest,
  getConflictRequests
} = require('../src/controllers/conflict.controller');
const {
  createEvent,
  getAllEvents,
  memoryEvents
} = require('../src/controllers/event.controller');

// Helper to create mock Express req and res
function createMockHttp(body = {}, params = {}, query = {}, user = { id: 'prof-demo-1', role: 'professor', name: 'Professor A' }) {
  const req = { body, params, query, user };
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return { req, res };
}

describe('Student-Professor Scheduling Conflict Detection Tests', () => {
  beforeEach(() => {
    // Reset memoryEvents to clean state before each test
    memoryEvents.length = 0;
  });

  it('1. Detects 30-minute conflict when Professor A schedules 14:00-15:00 against existing 14:30-15:30 commitment', async () => {
    // Seed existing student commitment: Project Review with Professor B (14:30 - 15:30) on 2026-10-27
    const createReq = createMockHttp(
      {
        title: 'Project Review with Professor B',
        date: '2026-10-27',
        start_time: '14:30',
        end_time: '15:30',
        venue: 'Room 304',
        target_audience: 'CS-302 CSA',
        is_official: true,
        published_by: 'Professor B'
      },
      {},
      {},
      { id: 'prof-b-id', role: 'professor', name: 'Professor B' }
    );
    await createEvent(createReq.req, createReq.res, err => { throw err; });
    assert.strictEqual(createReq.res.statusCode, 201);

    // Professor A checks proposed lecture for same date, 14:00 - 15:00, audience CS-302 CSA
    const checkReq = createMockHttp(
      {
        date: '2026-10-27',
        start_time: '14:00',
        end_time: '15:00',
        target_audience: 'CS-302 CSA'
      },
      {},
      {},
      { id: 'prof-a-id', role: 'professor', name: 'Professor A' }
    );
    await checkScheduleConflict(checkReq.req, checkReq.res, err => { throw err; });

    assert.strictEqual(checkReq.res.statusCode, 200);
    assert.strictEqual(checkReq.res.body.has_conflict, true);
    assert.strictEqual(checkReq.res.body.conflict_count, 1);

    const conflict = checkReq.res.body.conflicts[0];
    assert.strictEqual(conflict.title, 'Project Review with Professor B');
    assert.strictEqual(conflict.overlapMinutes, 30);
    assert.strictEqual(conflict.overlapStart, '14:30');
    assert.strictEqual(conflict.overlapEnd, '15:00');
    assert.strictEqual(conflict.organizer, 'Professor B');
  });

  it('2. Strict interval logic: Back-to-back events (14:00-15:00 vs 15:00-16:00) yield NO conflict', async () => {
    // Seed existing event 15:00 - 16:00
    const createReq = createMockHttp(
      {
        title: 'Department Seminar',
        date: '2026-10-27',
        start_time: '15:00',
        end_time: '16:00',
        target_audience: 'All Students',
        is_official: true,
        published_by: 'Dr. Evelyn Reed'
      },
      {},
      {},
      { id: 'prof-head', role: 'professor', name: 'Dr. Evelyn Reed' }
    );
    await createEvent(createReq.req, createReq.res, err => { throw err; });

    // Proposed session ends exactly when existing session starts (14:00 - 15:00)
    const checkReq = createMockHttp({
      date: '2026-10-27',
      start_time: '14:00',
      end_time: '15:00',
      target_audience: 'All Students'
    });
    await checkScheduleConflict(checkReq.req, checkReq.res, err => { throw err; });

    assert.strictEqual(checkReq.res.statusCode, 200);
    assert.strictEqual(checkReq.res.body.has_conflict, false);
    assert.strictEqual(checkReq.res.body.conflict_count, 0);
    assert.strictEqual(checkReq.res.body.conflicts.length, 0);
  });

  it('3. Detects commitment created by another professor (cross-faculty overlap)', async () => {
    // Professor B creates Capstone Evaluation on 2026-10-27, 10:00 - 11:30
    const profBReq = createMockHttp(
      {
        title: 'Capstone Evaluation Committee',
        date: '2026-10-27',
        start_time: '10:00',
        end_time: '11:30',
        target_audience: 'Year 3 Computer Science',
        is_official: true,
        published_by: 'Professor B (External Evaluator)'
      },
      {},
      {},
      { id: 'prof-b-uuid', role: 'professor', name: 'Professor B' }
    );
    await createEvent(profBReq.req, profBReq.res, err => { throw err; });

    // Professor A checks proposed guest lecture 10:30 - 12:00 for Year 3 Computer Science
    const checkReq = createMockHttp(
      {
        date: '2026-10-27',
        start_time: '10:30',
        end_time: '12:00',
        target_audience: 'Year 3 Computer Science'
      },
      {},
      {},
      { id: 'prof-a-uuid', role: 'professor', name: 'Professor A' }
    );
    await checkScheduleConflict(checkReq.req, checkReq.res, err => { throw err; });

    assert.strictEqual(checkReq.res.statusCode, 200);
    assert.strictEqual(checkReq.res.body.has_conflict, true);
    assert.strictEqual(checkReq.res.body.conflicts[0].title, 'Capstone Evaluation Committee');
    assert.strictEqual(checkReq.res.body.conflicts[0].organizer, 'Professor B (External Evaluator)');
    assert.strictEqual(checkReq.res.body.conflicts[0].overlapMinutes, 60); // 10:30 to 11:30
  });

  it('4. Changing the proposed time dynamically updates the conflict result', async () => {
    // Seed existing review 14:30 - 15:30
    const createReq = createMockHttp({
      title: 'Lab Viva',
      date: '2026-10-27',
      start_time: '14:30',
      end_time: '15:30',
      target_audience: 'CS-302 CSA',
      is_official: true
    });
    await createEvent(createReq.req, createReq.res, err => { throw err; });

    // Test 1: 14:00 - 15:00 -> Conflicts
    const check1 = createMockHttp({
      date: '2026-10-27',
      start_time: '14:00',
      end_time: '15:00',
      target_audience: 'CS-302 CSA'
    });
    await checkScheduleConflict(check1.req, check1.res, err => { throw err; });
    assert.strictEqual(check1.res.body.has_conflict, true);

    // Test 2: Rescheduled to 16:00 - 17:00 -> Conflict free!
    const check2 = createMockHttp({
      date: '2026-10-27',
      start_time: '16:00',
      end_time: '17:00',
      target_audience: 'CS-302 CSA'
    });
    await checkScheduleConflict(check2.req, check2.res, err => { throw err; });
    assert.strictEqual(check2.res.body.has_conflict, false);
    assert.strictEqual(check2.res.body.conflict_count, 0);
  });

  it('5. Computes feasible, conflict-free alternative slots from actual saved commitments', async () => {
    // Seed morning event (09:00 - 10:30) and afternoon event (14:00 - 15:30)
    await createEvent(createMockHttp({
      title: 'Morning Lecture',
      date: '2026-10-27',
      start_time: '09:00',
      end_time: '10:30',
      target_audience: 'All Students'
    }).req, createMockHttp().res, () => {});

    await createEvent(createMockHttp({
      title: 'Afternoon Lab',
      date: '2026-10-27',
      start_time: '14:00',
      end_time: '15:30',
      target_audience: 'All Students'
    }).req, createMockHttp().res, () => {});

    // Proposed 1-hour session clashing with Afternoon Lab (14:30 - 15:30)
    const checkReq = createMockHttp({
      date: '2026-10-27',
      start_time: '14:30',
      end_time: '15:30',
      target_audience: 'All Students'
    });
    await checkScheduleConflict(checkReq.req, checkReq.res, err => { throw err; });

    assert.strictEqual(checkReq.res.body.has_conflict, true);
    assert.ok(Array.isArray(checkReq.res.body.suggested_slots));
    assert.ok(checkReq.res.body.suggested_slots.length > 0);

    // Verify all suggested slots are genuinely conflict free
    for (const slot of checkReq.res.body.suggested_slots) {
      // Must not clash with 09:00-10:30 or 14:00-15:30
      const slotStart = parseInt(slot.startTime.split(':')[0], 10) * 60 + parseInt(slot.startTime.split(':')[1], 10);
      const slotEnd = parseInt(slot.endTime.split(':')[0], 10) * 60 + parseInt(slot.endTime.split(':')[1], 10);

      // Check morning clash
      const morningClash = Math.max(slotStart, 9 * 60) < Math.min(slotEnd, 10 * 60 + 30);
      assert.strictEqual(morningClash, false, `Suggested slot ${slot.startTime}-${slot.endTime} clashed with morning lecture`);

      // Check afternoon clash
      const afternoonClash = Math.max(slotStart, 14 * 60) < Math.min(slotEnd, 15 * 60 + 30);
      assert.strictEqual(afternoonClash, false, `Suggested slot ${slot.startTime}-${slot.endTime} clashed with afternoon lab`);
    }
  });

  it('6. Refresh & persistence: Events remain saved and retrievable on subsequent queries', async () => {
    // Create an event
    const postReq = createMockHttp({
      title: 'Persisted Database Review',
      date: '2026-10-27',
      start_time: '11:00',
      end_time: '12:00',
      venue: 'Auditorium 1',
      target_audience: 'CS-302 CSA',
      is_official: true
    });
    await createEvent(postReq.req, postReq.res, () => {});

    // Subsequent retrieval (simulating page reload / fresh query)
    const getReq = createMockHttp({}, {}, { date: '2026-10-27' });
    await getAllEvents(getReq.req, getReq.res, () => {});

    assert.strictEqual(getReq.res.statusCode, 200);
    const found = getReq.res.body.events.find(e => e.title === 'Persisted Database Review');
    assert.ok(found, 'Event must remain persisted in backend storage across queries');
    assert.strictEqual(found.start_time, '11:00');
    assert.strictEqual(found.end_time, '12:00');
  });
});
