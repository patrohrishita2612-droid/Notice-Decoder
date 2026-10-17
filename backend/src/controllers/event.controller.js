const { getSupabaseClient } = require('../config/database');

// Memory store fallback for events
let memoryEvents = [
  {
    id: 1,
    title: 'Meeting',
    date: '2026-11-13',
    start_time: '09:30',
    end_time: '10:30',
    venue: 'Seminar Hall B',
    description: 'Faculty and student coordinators briefing for tech symposium.',
    category: 'Meeting',
    color: 'cyan',
    is_official: false,
    user_id: 'user-default-1'
  },
  {
    id: 2,
    title: 'Lecture: CS-302 CSA',
    date: '2026-11-13',
    start_time: '10:00',
    end_time: '11:00',
    venue: 'Room 204',
    description: 'Computer System Architecture weekly regular lecture by Dr. S. Mehta.',
    category: 'Lecture',
    color: 'blue',
    is_official: true,
    published_by: 'Dr. Evelyn Reed (Head of Department)',
    target_audience: 'CS-302 CSA',
    source_notice_id: 1
  },
  {
    id: 3,
    title: 'Practical Record Books Due',
    date: '2026-11-13',
    start_time: '12:00',
    end_time: '12:30',
    venue: 'Department Office',
    description: 'Mandatory deposit of certified practical journals for internal assessment.',
    category: 'Deadline',
    color: 'rose',
    is_official: true,
    published_by: 'Dr. Evelyn Reed (Head of Department)',
    target_audience: 'CS-302 CSA',
    source_notice_id: 1
  },
  {
    id: 4,
    title: 'Guest Lecture: Microservices',
    date: '2026-11-14',
    start_time: '09:30',
    end_time: '10:30',
    venue: 'Seminar Hall B',
    description: 'Dr. A. Ramanujan (Google Cloud) expert session on scalable cloud microservices.',
    category: 'Guest Lecture',
    color: 'forest',
    is_official: true,
    published_by: 'Dr. Evelyn Reed (Head of Department)',
    target_audience: 'All Students',
    source_notice_id: 2
  },
  {
    id: 5,
    title: 'Project Phase 1 Review',
    date: '2026-11-14',
    start_time: '11:30',
    end_time: '12:30',
    venue: 'Project Lab 3',
    description: 'Capstone project progress review with faculty evaluation committee.',
    category: 'Academic',
    color: 'amber',
    is_official: true,
    published_by: 'Dr. Evelyn Reed (Head of Department)',
    target_audience: 'All Students'
  }
];

/**
 * Controller: Get all scheduled events
 * GET /api/events
 */
async function getAllEvents(req, res, next) {
  try {
    let events = [];
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });
      if (!error && data) {
        events = data;
      } else {
        events = memoryEvents;
      }
    } catch {
      events = memoryEvents;
    }

    return res.status(200).json({
      events: events || []
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Create a new calendar event
 * POST /api/events
 */
async function createEvent(req, res, next) {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body. Expected JSON.' });
    }

    const { 
      title, date, start_time, end_time, venue, 
      description, category, color, is_official, target_audience 
    } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'Event title and date are required.' });
    }

    const isProfessor = req.user?.role === 'professor';

    // Only professors can designate events as official
    if (is_official && !isProfessor) {
      return res.status(403).json({
        error: 'Forbidden: Students cannot create official campus events.'
      });
    }

    const newEvent = {
      id: memoryEvents.length + 1,
      title: title.trim(),
      date: date.trim(),
      start_time: start_time || '10:00',
      end_time: end_time || '11:00',
      venue: venue || 'Main Campus Facility',
      description: description || '',
      category: category || 'Academic',
      color: color || (is_official ? 'blue' : 'cyan'),
      is_official: Boolean(is_official && isProfessor),
      published_by: is_official ? 'Dr. Evelyn Reed (Head of Department)' : req.user?.id,
      target_audience: target_audience || 'All Students',
      user_id: req.user?.id || 'anon',
      created_at: new Date().toISOString()
    };

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('events')
        .insert([newEvent])
        .select()
        .single();
      if (!error && data) {
        return res.status(201).json({ message: 'Event created successfully.', event: data });
      }
    } catch {
      // Memory fallback
    }

    memoryEvents.push(newEvent);
    return res.status(201).json({
      message: 'Event created successfully.',
      event: newEvent
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Update an existing event
 * PUT /api/events/:id
 */
async function updateEvent(req, res, next) {
  try {
    const { id } = req.params;
    const isProfessor = req.user?.role === 'professor';

    // Check if event exists and if it is official
    const existing = memoryEvents.find(e => String(e.id) === String(id));

    if (existing && existing.is_official && !isProfessor) {
      return res.status(403).json({
        error: 'Permission Denied: Official campus events cannot be edited or rescheduled by students. Please submit a Schedule Conflict Request instead.'
      });
    }

    const { title, date, start_time, end_time, venue, description, category, color } = req.body;

    let updated = null;
    const memIdx = memoryEvents.findIndex(e => String(e.id) === String(id));
    if (memIdx >= 0) {
      memoryEvents[memIdx] = {
        ...memoryEvents[memIdx],
        ...(title && { title }),
        ...(date && { date }),
        ...(start_time && { start_time }),
        ...(end_time && { end_time }),
        ...(venue && { venue }),
        ...(description && { description }),
        ...(category && { category }),
        ...(color && { color }),
        updated_at: new Date().toISOString()
      };
      updated = memoryEvents[memIdx];
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('events')
        .update({
          ...(title && { title }),
          ...(date && { date }),
          ...(start_time && { start_time }),
          ...(end_time && { end_time }),
          ...(venue && { venue }),
          ...(description && { description }),
          ...(category && { category }),
          ...(color && { color }),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) updated = data;
    } catch {
      // Memory fallback
    }

    return res.status(200).json({
      message: 'Event updated successfully.',
      event: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Delete an event
 * DELETE /api/events/:id
 */
async function deleteEvent(req, res, next) {
  try {
    const { id } = req.params;
    const isProfessor = req.user?.role === 'professor';

    const existing = memoryEvents.find(e => String(e.id) === String(id));
    if (existing && existing.is_official && !isProfessor) {
      return res.status(403).json({
        error: 'Permission Denied: Official campus events cannot be deleted by students.'
      });
    }

    memoryEvents = memoryEvents.filter(e => String(e.id) !== String(id));

    try {
      const supabase = getSupabaseClient();
      await supabase.from('events').delete().eq('id', id);
    } catch {
      // Memory fallback
    }

    return res.status(200).json({
      message: 'Event deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  memoryEvents
};
