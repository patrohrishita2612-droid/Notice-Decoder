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

module.exports = {
  submitConflictRequest,
  getConflictRequests,
  reviewConflictRequest,
  memoryConflicts
};
