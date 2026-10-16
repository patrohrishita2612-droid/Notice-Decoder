const { getSupabaseClient } = require('../config/database');

/**
 * Controller: Get all scheduled events
 * GET /api/events
 */
async function getAllEvents(req, res, next) {
  try {
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (dbConfigError) {
      return res.status(500).json({
        error: dbConfigError.message
      });
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      // If table doesn't exist yet, provide helpful message
      if (error.code === '42P01') {
        return res.status(200).json({
          events: [],
          message: "Note: The 'events' table is not yet created in Supabase. Run the schema SQL script to enable it."
        });
      }
      return res.status(500).json({
        error: `Database error: ${error.message}`
      });
    }

    return res.status(200).json({
      events: data || []
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
      return res.status(400).json({
        error: 'Invalid request body. Expected JSON.'
      });
    }

    const { title, date, time, venue, description } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        error: 'Event title is required.'
      });
    }

    if (!date || typeof date !== 'string' || date.trim() === '') {
      return res.status(400).json({
        error: 'Event date is required.'
      });
    }

    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (dbConfigError) {
      return res.status(500).json({
        error: dbConfigError.message
      });
    }

    const { data, error } = await supabase
      .from('events')
      .insert([
        {
          title: title.trim(),
          date: date.trim(),
          time: (time && typeof time === 'string') ? time.trim() : null,
          venue: (venue && typeof venue === 'string') ? venue.trim() : null,
          description: (description && typeof description === 'string') ? description.trim() : null
        }
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: `Database error: ${error.message}`
      });
    }

    return res.status(201).json({
      message: 'Event created successfully.',
      event: data
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllEvents,
  createEvent
};
