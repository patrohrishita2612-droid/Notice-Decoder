const { getSupabaseClient } = require('../config/database');
const { processNotice } = require('../services/ai.service');

/**
 * Controller: Create and process a new notice
 * POST /api/notices
 */
async function createNotice(req, res, next) {
  try {
    // 1. Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        error: 'Invalid request body. Expected JSON.'
      });
    }

    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({
        error: 'Notice text is required.'
      });
    }

    const cleanText = text.trim();

    // 2. Process the notice text (using AI service interface)
    const processedData = await processNotice(cleanText);

    // 3. Connect to Supabase
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (dbConfigError) {
      return res.status(500).json({
        error: dbConfigError.message
      });
    }

    // 4. Save to Supabase 'notices' table
    const { data, error } = await supabase
      .from('notices')
      .insert([
        {
          original_text: cleanText,
          summary: processedData.summary,
          date: processedData.date,
          time: processedData.time,
          venue: processedData.venue,
          target_audience: processedData.target_audience,
          required_action: processedData.required_action
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase Insert Error:', error.message);
      return res.status(500).json({
        error: `Database error: ${error.message}`
      });
    }

    // 5. Return success response
    return res.status(201).json({
      message: 'Notice processed and saved successfully.',
      notice: data
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Get all notices
 * GET /api/notices
 */
async function getAllNotices(req, res, next) {
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
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Fetch Error:', error.message);
      return res.status(500).json({
        error: `Database error: ${error.message}`
      });
    }

    return res.status(200).json({
      notices: data || []
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Get a single notice by ID
 * GET /api/notices/:id
 */
async function getNoticeById(req, res, next) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Notice ID is required in URL parameter.'
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
      .from('notices')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Supabase Fetch Error:', error.message);
      return res.status(500).json({
        error: `Database error: ${error.message}`
      });
    }

    if (!data) {
      return res.status(404).json({
        error: 'Notice not found.'
      });
    }

    return res.status(200).json({
      notice: data
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createNotice,
  getAllNotices,
  getNoticeById
};
