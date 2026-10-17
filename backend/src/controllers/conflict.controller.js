const { getSupabaseClient } = require('../config/database');
const { memoryEvents } = require('./event.controller');
const { memoryNotifications } = require('./notice.controller');

// Memory store fallback for conflict requests
let memoryConflicts = [];

/**
 * Controller: Submit a Schedule Conflict Request
 * POST /api/conflicts
 */
async function submitConflictRequest(req, res, next) {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body.' });
    }

    const { 
      event_id, event_title, conflicting_commitment_title, 
      overlap_minutes, student_reason, suggested_date, suggested_time 
    } = req.body;

    if (!event_title || !student_reason) {
      return res.status(400).json({
        error: 'Official event title and reason for conflict are required.'
      });
    }

    const newConflict = {
      id: memoryConflicts.length + 1,
      event_id: event_id || null,
      event_title: event_title.trim(),
      student_id: req.user?.id || null,
      student_name: req.user?.name || 'Student',
      student_email: req.user?.email || '',
      conflicting_commitment_title: (conflicting_commitment_title || 'Personal Commitment').trim(),
      overlap_minutes: Number(overlap_minutes) || 30,
      student_reason: student_reason.trim(),
      suggested_date: suggested_date || null,
      suggested_time: suggested_time || null,
      status: 'submitted',
      professor_response: null,
      created_at: new Date().toISOString()
    };

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('conflict_requests')
        .insert([newConflict])
        .select()
        .single();
      if (!error && data) {
        return res.status(201).json({
          message: 'Conflict request submitted successfully for professor review.',
          conflict: data
        });
      }
    } catch {
      // Memory fallback
    }

    memoryConflicts.unshift(newConflict);
    return res.status(201).json({
      message: 'Conflict request submitted successfully for professor review.',
      conflict: newConflict
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Get Conflict Requests
 * GET /api/conflicts
 */
async function getConflictRequests(req, res, next) {
  try {
    const isProfessor = req.user?.role === 'professor';

    let conflicts = [];
    try {
      const supabase = getSupabaseClient();
      let query = supabase.from('conflict_requests').select('*').order('created_at', { ascending: false });
      if (!isProfessor) {
        query = query.eq('student_id', req.user?.id);
      }
      const { data, error } = await query;
      if (!error && data) {
        conflicts = data;
      } else {
        conflicts = isProfessor 
          ? memoryConflicts 
          : memoryConflicts.filter(c => c.student_id === req.user?.id);
      }
    } catch {
      conflicts = isProfessor 
        ? memoryConflicts 
        : memoryConflicts.filter(c => c.student_id === req.user?.id);
    }

    return res.status(200).json({
      conflicts: conflicts || []
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Review Conflict Request (Professor Only)
 * PATCH /api/conflicts/:id/review
 */
async function reviewConflictRequest(req, res, next) {
  try {
    const { id } = req.params;
    const { action, professor_response, new_date, new_start_time, new_end_time } = req.body;

    if (!['accept', 'reject', 'propose'].includes(action)) {
      return res.status(400).json({
        error: "Action must be 'accept', 'reject', or 'propose'."
      });
    }

    const targetStatus = action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'alternative_proposed';

    let updatedConflict = null;
    const memIdx = memoryConflicts.findIndex(c => String(c.id) === String(id));
    if (memIdx >= 0) {
      memoryConflicts[memIdx].status = targetStatus;
      memoryConflicts[memIdx].professor_response = professor_response || (
        action === 'accept' ? 'Rescheduled to accommodate student timetable conflict.' : 'Cannot reschedule at this time.'
      );
      memoryConflicts[memIdx].resolved_at = new Date().toISOString();
      updatedConflict = memoryConflicts[memIdx];
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('conflict_requests')
        .update({
          status: targetStatus,
          professor_response: professor_response,
          resolved_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) updatedConflict = data;
    } catch {
      // Memory fallback
    }

    // If accepted and time changes are supplied, update official event in events list!
    if (action === 'accept' && updatedConflict) {
      const eventToUpdate = memoryEvents.find(e => 
        (updatedConflict.event_id && String(e.id) === String(updatedConflict.event_id)) ||
        (e.title && e.title.includes(updatedConflict.event_title))
      );

      if (eventToUpdate) {
        if (new_date) eventToUpdate.date = new_date;
        if (new_start_time) eventToUpdate.start_time = new_start_time;
        if (new_end_time) eventToUpdate.end_time = new_end_time;
      }

      // Dispatch in-app notification to all students
      memoryNotifications.unshift({
        id: memoryNotifications.length + 1,
        user_id: null,
        target_audience: 'All Students',
        title: `Schedule Adjustment: ${updatedConflict.event_title}`,
        message: `Dr. Evelyn Reed approved a schedule update for ${updatedConflict.event_title}. New slot: ${new_date || updatedConflict.suggested_date || 'Updated'} at ${new_start_time || updatedConflict.suggested_time || 'New Time'}.`,
        type: 'conflict_accepted',
        is_read: false,
        created_at: new Date().toISOString()
      });
    } else if (action === 'reject' && updatedConflict) {
      memoryNotifications.unshift({
        id: memoryNotifications.length + 1,
        user_id: updatedConflict.student_id,
        target_audience: 'Student',
        title: `Conflict Request Status: ${updatedConflict.event_title}`,
        message: `Your request for ${updatedConflict.event_title} was reviewed: ${professor_response || 'Declined due to facility constraints.'}`,
        type: 'conflict_rejected',
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    return res.status(200).json({
      message: `Conflict request marked as ${targetStatus}.`,
      conflict: updatedConflict
    });
  } catch (error) {
    next(error);
  }
}

function parseTimeToMinutes(t) {
  if (!t || typeof t !== 'string') return 0;
  const match = t.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();

  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;

  return h * 60 + m;
}

function formatMinutes24(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatMinutes12(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
}

function normalizeDate(d) {
  if (!d || typeof d !== 'string') return '';
  const trimmed = d.trim();
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return trimmed;
  const parsed = new Date(trimmed.replace(/(st|nd|rd|th)/i, ''));
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return trimmed;
}

/**
 * Controller: Check for scheduling conflicts (Pre-scheduling validation)
 * POST /api/conflicts/check
 */
async function checkScheduleConflict(req, res, next) {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body.' });
    }

    const { date, start_time, end_time, target_audience, exclude_event_id } = req.body;

    if (!date || !start_time || !end_time) {
      return res.status(400).json({
        error: 'Event date, start_time, and end_time are required to check conflicts.'
      });
    }

    const normDate = normalizeDate(date);
    const sProposed = parseTimeToMinutes(start_time);
    const eProposed = parseTimeToMinutes(end_time);

    if (eProposed <= sProposed) {
      return res.status(400).json({
        error: 'Invalid time window: end_time must be strictly after start_time.'
      });
    }

    const proposedAudience = (target_audience || 'All Students').trim();

    // Query persisted events
    let allEvents = [];
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('events')
        .select('*');
      if (!error && data && data.length > 0) {
        allEvents = data;
      } else {
        allEvents = memoryEvents;
      }
    } catch {
      allEvents = memoryEvents;
    }

    // Filter events matching the target date
    const dateEvents = allEvents.filter(e => {
      if (exclude_event_id && String(e.id) === String(exclude_event_id)) return false;
      return normalizeDate(e.date) === normDate;
    });

    // Determine relevant events based on audience and participants
    const relevantEvents = dateEvents.filter(e => {
      const evAudience = (e.target_audience || 'All Students').trim();
      // If proposed audience is 'All Students', any student event on that day is relevant
      if (proposedAudience === 'All Students' || evAudience === 'All Students') {
        return true;
      }
      // If specific audience matches exactly or overlaps
      if (proposedAudience.toLowerCase() === evAudience.toLowerCase()) {
        return true;
      }
      // Check substring matches e.g. 'CS-302 CSA' vs 'CS-302' or 'Year 3'
      if (proposedAudience.toLowerCase().includes(evAudience.toLowerCase()) || 
          evAudience.toLowerCase().includes(proposedAudience.toLowerCase())) {
        return true;
      }
      // Student personal commitment
      if (!e.is_official) {
        return true;
      }
      return false;
    });

    // Evaluate strict interval overlap: overlapStart < overlapEnd
    const conflicts = [];
    for (const ev of relevantEvents) {
      const sEv = parseTimeToMinutes(ev.start_time);
      const eEv = parseTimeToMinutes(ev.end_time);

      const overlapStart = Math.max(sProposed, sEv);
      const overlapEnd = Math.min(eProposed, eEv);

      if (overlapStart < overlapEnd) {
        const overlapMinutes = overlapEnd - overlapStart;
        conflicts.push({
          eventId: ev.id,
          title: ev.title,
          date: ev.date,
          startTime: ev.start_time,
          endTime: ev.end_time,
          venue: ev.venue || 'Campus Facility',
          organizer: ev.published_by || (ev.is_official ? 'Faculty Member' : 'Student'),
          targetAudience: ev.target_audience || 'All Students',
          isOfficial: Boolean(ev.is_official),
          userId: ev.user_id,
          affectedStudents: [
            ev.user_id && ev.user_id !== 'anon' ? ev.user_id : (ev.target_audience || 'Cohort Students')
          ],
          overlapStart: formatMinutes24(overlapStart),
          overlapEnd: formatMinutes24(overlapEnd),
          overlapMinutes,
          description: `${overlapMinutes} min overlap: Proposed session (${start_time}–${end_time}) overlaps with "${ev.title}" (${ev.start_time}–${ev.end_time})`
        });
      }
    }

    // Dynamic conflict-free alternative slot generation based on actual saved schedule
    const duration = eProposed - sProposed;
    const suggestedSlots = [];

    // Scan standard academic hours: 09:00 (540m) to 17:00 (1020m)
    for (let candidateStart = 540; candidateStart + duration <= 1020; candidateStart += 30) {
      const candidateEnd = candidateStart + duration;

      // Skip the proposed slot itself
      if (candidateStart === sProposed && candidateEnd === eProposed) continue;

      // Check if candidate slot clashes with ANY relevant event
      const clashes = relevantEvents.some(ev => {
        const sEv = parseTimeToMinutes(ev.start_time);
        const eEv = parseTimeToMinutes(ev.end_time);
        return Math.max(candidateStart, sEv) < Math.min(candidateEnd, eEv);
      });

      if (!clashes) {
        suggestedSlots.push({
          date: normDate,
          startTime: formatMinutes24(candidateStart),
          endTime: formatMinutes24(candidateEnd),
          displayTime: `${formatMinutes12(candidateStart)} – ${formatMinutes12(candidateEnd)}`,
          durationMinutes: duration,
          reason: `Zero schedule clashes detected for ${proposedAudience}`
        });
        if (suggestedSlots.length >= 4) break;
      }
    }

    return res.status(200).json({
      has_conflict: conflicts.length > 0,
      conflict_count: conflicts.length,
      conflicts,
      suggested_slots: suggestedSlots
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  checkScheduleConflict,
  submitConflictRequest,
  getConflictRequests,
  reviewConflictRequest,
  memoryConflicts
};
