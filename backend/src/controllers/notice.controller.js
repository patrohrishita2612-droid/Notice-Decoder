const { getSupabaseClient } = require('../config/database');
const { isSupabaseConfigured } = require('../config/env');
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

    // 2. Process the notice text (using Member 1 AI service)
    const processedData = await processNotice(cleanText);

    // 3. Connect to Supabase if configured
    if (!isSupabaseConfigured()) {
      return res.status(201).json({
        message: 'Notice processed successfully (database not configured, record in-memory).',
        notice: {
          id: Date.now(),
          original_text: cleanText,
          summary: processedData.summary,
          date: processedData.date,
          time: processedData.time,
          venue: processedData.venue,
          target_audience: processedData.target_audience,
          required_action: processedData.required_action,
          created_at: new Date().toISOString(),
          ...processedData
        },
        analysis: processedData
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
      notice: {
        ...data,
        ...processedData
      },
      analysis: processedData
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        error: error.message,
        details: error.details
      });
    }
    next(error);
  }
}

/**
 * Controller: Pure AI notice decode (without mandatory database insertion)
 * POST /api/notices/decode
 */
async function decodeNotice(req, res, next) {
  try {
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
    const result = await processNotice(cleanText);

    return res.status(200).json({
      message: 'Notice decoded successfully.',
      data: result
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        error: error.message,
        details: error.details
      });
    }
    next(error);
  }
}

/**
 * Controller: Get all notices
 * GET /api/notices
 */
async function getAllNotices(req, res, next) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(200).json({
        notices: []
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

    if (!isSupabaseConfigured()) {
      return res.status(404).json({
        error: 'Notice not found.'
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

/**
 * Controller: Update an existing notice by ID
 * PUT /api/notices/:id
 */
async function updateNotice(req, res, next) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Notice ID is required in URL parameter.'
      });
    }

    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'Request body cannot be empty.'
      });
    }

    // Prepare fields to update
    const updates = {};

    // If 'text' is sent, re-extract and update original text and extracted metadata
    if (req.body.text && typeof req.body.text === 'string' && req.body.text.trim() !== '') {
      const cleanText = req.body.text.trim();
      const processedData = await processNotice(cleanText);

      updates.original_text = cleanText;
      updates.summary = req.body.summary || processedData.summary;
      updates.date = req.body.date || processedData.date;
      updates.time = req.body.time || processedData.time;
      updates.venue = req.body.venue || processedData.venue;
      updates.target_audience = req.body.target_audience || processedData.target_audience;
      updates.required_action = req.body.required_action || processedData.required_action;
    } else {
      // Allow updating individual fields directly
      if (req.body.original_text !== undefined) updates.original_text = req.body.original_text;
      if (req.body.summary !== undefined) updates.summary = req.body.summary;
      if (req.body.date !== undefined) updates.date = req.body.date;
      if (req.body.time !== undefined) updates.time = req.body.time;
      if (req.body.venue !== undefined) updates.venue = req.body.venue;
      if (req.body.target_audience !== undefined) updates.target_audience = req.body.target_audience;
      if (req.body.required_action !== undefined) updates.required_action = req.body.required_action;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'No valid notice fields provided to update.'
      });
    }

    if (!isSupabaseConfigured()) {
      return res.status(200).json({
        message: 'Notice updated successfully (in-memory).',
        notice: { id, ...updates, updated_at: new Date().toISOString() }
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

    // 1. Check if the notice exists first
    const { data: existingNotice, error: findError } = await supabase
      .from('notices')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (findError) {
      console.error('Supabase Query Error:', findError.message);
      return res.status(500).json({
        error: `Database error: ${findError.message}`
      });
    }

    if (!existingNotice) {
      return res.status(404).json({
        error: 'Notice not found.'
      });
    }

    // 2. Perform the update
    const { data, error } = await supabase
      .from('notices')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase Update Error:', error.message);
      return res.status(500).json({
        error: `Database error: ${error.message}`
      });
    }

    if (!data) {
      // Row exists but was not updated, which happens if Supabase RLS update policy is missing
      return res.status(403).json({
        error: 'Notice exists but could not be updated. Ensure your Supabase RLS policy allows UPDATE on the notices table (run: CREATE POLICY "Allow public update notices" ON notices FOR UPDATE USING (true) WITH CHECK (true); in Supabase SQL editor).'
      });
    }

    return res.status(200).json({
      message: 'Notice updated successfully.',
      notice: data
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        error: error.message,
        details: error.details
      });
    }
    next(error);
  }
}

/**
 * Controller: Delete a notice by ID
 * DELETE /api/notices/:id
 */
async function deleteNotice(req, res, next) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Notice ID is required in URL parameter.'
      });
    }

    if (!isSupabaseConfigured()) {
      return res.status(200).json({
        message: 'Notice deleted successfully (in-memory).',
        deletedNotice: { id }
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

    // 1. Check if the notice exists first
    const { data: existingNotice, error: findError } = await supabase
      .from('notices')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (findError) {
      console.error('Supabase Query Error:', findError.message);
      return res.status(500).json({
        error: `Database error: ${findError.message}`
      });
    }

    if (!existingNotice) {
      return res.status(404).json({
        error: 'Notice not found.'
      });
    }

    // 2. Perform the delete
    const { data, error } = await supabase
      .from('notices')
      .delete()
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase Delete Error:', error.message);
      return res.status(500).json({
        error: `Database error: ${error.message}`
      });
    }

    return res.status(200).json({
      message: 'Notice deleted successfully.',
      deletedNotice: data || existingNotice
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createNotice,
  getAllNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
  decodeNotice
};
