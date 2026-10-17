const { getSupabaseClient } = require('../config/database');

// Memory store fallback for events
let memoryEvents = [];

/**
 * Controller: Get all scheduled events
 * GET /api/events
 */
async function getAllEvents(req, res, next) {
  try {
    let events = [];
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });
      if (req.query?.date) {
        query = query.eq('date', req.query.date.trim());
      }
      const { data, error } = await query;
      if (!error && data) {
        events = data;
      } else {
        events = memoryEvents;
      }
    } catch {
      events = memoryEvents;
    }

    if (req.query?.date) {
      events = events.filter(e => e.date === req.query.date.trim());
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
      description, category, color, is_official, target_audience, published_by 
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
      published_by: published_by || (is_official ? (req.user?.name ? `${req.user.name}` : 'Dr. Evelyn Reed (Head of Department)') : (req.user?.name || req.user?.id || 'Student')),
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
        memoryEvents.push(data);
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
