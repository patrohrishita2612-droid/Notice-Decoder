const { getSupabaseClient } = require('../config/database');
const { processNotice, processNoticeFile } = require('../services/ai.service');

// In-memory fallback repository when Supabase is not connected
let memoryNotices = [];

let memoryNotifications = [];

/**
 * Controller: Handle File Upload (PDF, JPG, PNG) & AI Extraction
 * POST /api/notices/upload
 */
async function uploadNoticeFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded. Please upload a PDF, JPG, or PNG document.'
      });
    }

    const { originalname, mimetype, size, buffer } = req.file;

    // Check size <= 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (size > MAX_SIZE) {
      return res.status(400).json({
        error: `File size exceeds the 10MB limit. Uploaded size: ${(size / (1024 * 1024)).toFixed(2)}MB`
      });
    }

    // Validate mime type
    const validMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validMimes.includes(mimetype)) {
      return res.status(400).json({
        error: `Unsupported file type '${mimetype}'. Only PDF (.pdf) and images (.jpg, .jpeg, .png) are permitted.`
      });
    }

    const extraText = typeof req.body?.text === 'string' ? req.body.text.trim() : '';

    // Process natively with Gemini multimodal document extraction
    const extracted = await processNoticeFile(buffer, mimetype, extraText);

    return res.status(200).json({
      success: true,
      fileInfo: {
        fileName: originalname,
        fileType: mimetype,
        fileSize: size,
        fileSizeFormatted: `${(size / 1024).toFixed(1)} KB`
      },
      data: extracted,
      extracted: {
        rawText: extraText || `Document: ${originalname}`,
        title: extracted.title || extracted.summary?.split('.')[0] || originalname.replace(/\.[^/.]+$/, ''),
        summary: extracted.summary || '',
        date: extracted.event_date || extracted.date || null,
        time: extracted.time || (extracted.start_time ? (extracted.end_time ? `${extracted.start_time} - ${extracted.end_time}` : extracted.start_time) : null),
        venue: extracted.venue || null,
        targetAudience: extracted.target_audience || null,
        requiredAction: extracted.required_action || null,
        category: extracted.category || 'Academic',
        urgency: extracted.urgency || 'normal'
      }
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
 * Controller: AI notice decode from uploaded document/file (PDF, JPG, PNG)
 * POST /api/notices/decode-file
 */
async function decodeNoticeFile(req, res, next, options = {}) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded. Please upload a PDF, JPG, or PNG document.'
      });
    }

    const { originalname, mimetype, size, buffer } = req.file;

    // Check size <= 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (size > MAX_SIZE) {
      return res.status(400).json({
        error: `File size exceeds the 10MB limit. Uploaded size: ${(size / (1024 * 1024)).toFixed(2)}MB`
      });
    }

    const validMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validMimes.includes(mimetype)) {
      return res.status(400).json({
        error: `Unsupported file type '${mimetype}'. Only PDF (.pdf) and images (.jpg, .jpeg, .png) are permitted.`
      });
    }

    const extraText = typeof req.body?.text === 'string' ? req.body.text.trim() : '';

    const result = await processNoticeFile(buffer, mimetype, extraText, options);

    return res.status(200).json({
      success: true,
      message: 'Notice document decoded successfully.',
      fileInfo: {
        fileName: originalname,
        fileType: mimetype,
        fileSize: size
      },
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
 * Controller: Check for Duplicate Notice
 * POST /api/notices/check-duplicate
 */
async function checkDuplicateNotice(req, res, next) {
  try {
    const { title, date } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required to check duplicates.' });
    }

    const cleanTitle = title.trim().toLowerCase();
    const cleanDate = date ? date.trim() : null;

    // Check memory store or supabase
    let existingDuplicate = null;
    try {
      const supabase = getSupabaseClient();
      const { data } = await supabase.from('notices').select('*');
      if (data && data.length > 0) {
        existingDuplicate = data.find(n => 
          (n.title && n.title.toLowerCase().includes(cleanTitle)) ||
          (cleanDate && n.date === cleanDate && n.original_text.toLowerCase().includes(cleanTitle.slice(0, 10)))
        );
      }
    } catch {
      // Use memory notices
      existingDuplicate = memoryNotices.find(n => 
        (n.title && n.title.toLowerCase().includes(cleanTitle)) ||
        (cleanDate && n.date === cleanDate)
      );
    }

    if (existingDuplicate) {
      return res.status(200).json({
        isDuplicate: true,
        matchedNotice: existingDuplicate,
        message: `A notice with similar title or scheduled date already exists (${existingDuplicate.title} on ${existingDuplicate.date}).`
      });
    }

    return res.status(200).json({
      isDuplicate: false
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Create and process a new notice
 * POST /api/notices
 */
async function createNotice(req, res, next) {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body. Expected JSON.' });
    }

    const { 
      text, title, date, time, venue, 
      target_audience, required_action, issuing_department, 
      file_name, file_type, file_size, status 
    } = req.body;

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'Notice text is required.' });
    }

    const cleanText = text.trim();
    const processedData = await processNotice(cleanText);

    const isProfessor = req.user?.role === 'professor';
    const noticeRecord = {
      title: title || processedData.summary?.split('.')[0] || 'Campus Notice',
      original_text: cleanText,
      summary: processedData.summary,
      date: date || processedData.date || '2026-11-18',
      time: time || processedData.time || '10:00 AM',
      venue: venue || processedData.venue || 'Room 204',
      target_audience: target_audience || processedData.target_audience || 'All Students',
      required_action: required_action || processedData.required_action,
      issuing_department: issuing_department || (isProfessor ? 'Department of Computer Engineering' : 'Student Association'),
      author_id: req.user?.id || 'anon',
      published_by: isProfessor ? 'Dr. Evelyn Reed (Head of Department)' : 'Campus Member',
      status: status || 'published',
      file_name: file_name || null,
      file_type: file_type || null,
      file_size: file_size || null,
      created_at: new Date().toISOString()
    };

    let savedData = null;
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('notices')
        .insert([noticeRecord])
        .select()
        .single();
      if (!error && data) {
        savedData = data;
      }
    } catch {
      // In-memory fallback
      noticeRecord.id = memoryNotices.length + 1;
      memoryNotices.unshift(noticeRecord);
      savedData = noticeRecord;
    }

    if (!savedData) {
      noticeRecord.id = memoryNotices.length + 1;
      memoryNotices.unshift(noticeRecord);
      savedData = noticeRecord;
    }

    // If published by professor, also generate an alert notification for students
    if (isProfessor) {
      const notif = {
        id: memoryNotifications.length + 1,
        user_id: null,
        target_audience: noticeRecord.target_audience,
        title: `Official Circular: ${noticeRecord.title}`,
        message: `${noticeRecord.published_by} published an official circular for ${noticeRecord.target_audience}.`,
        type: 'notice_published',
        is_read: false,
        related_notice_id: savedData.id,
        created_at: new Date().toISOString()
      };
      memoryNotifications.unshift(notif);
    }

    return res.status(201).json({
      message: 'Notice processed and saved successfully.',
      notice: {
        ...savedData,
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
 * Controller: Get all notices (filtered by role/audience)
 * GET /api/notices
 */
async function getAllNotices(req, res, next) {
  try {
    let notices = [];
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        notices = data;
      } else {
        notices = memoryNotices;
      }
    } catch {
      notices = memoryNotices;
    }

    return res.status(200).json({
      notices: notices || []
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
      return res.status(400).json({ error: 'Notice ID is required in URL parameter.' });
    }

    let found = memoryNotices.find(n => String(n.id) === String(id));

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!error && data) found = data;
    } catch {
      // use memory
    }

    if (!found) {
      return res.status(404).json({ error: 'Notice not found.' });
    }

    return res.status(200).json({ notice: found });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Update Notice Status (e.g. withdraw notice) - Professor only
 * PATCH /api/notices/:id/status
 */
async function updateNoticeStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['published', 'draft', 'withdrawn'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'published', 'draft', or 'withdrawn'." });
    }

    let updated = null;
    const memIdx = memoryNotices.findIndex(n => String(n.id) === String(id));
    if (memIdx >= 0) {
      memoryNotices[memIdx].status = status;
      updated = memoryNotices[memIdx];
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('notices')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) updated = data;
    } catch {
      // use memory
    }

    return res.status(200).json({
      message: `Notice status updated to ${status}.`,
      notice: updated
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

    let updated = null;
    const memIdx = memoryNotices.findIndex(n => String(n.id) === String(id));
    if (memIdx >= 0) {
      memoryNotices[memIdx] = { ...memoryNotices[memIdx], ...updates };
      updated = memoryNotices[memIdx];
    }

    let supabase;
    try {
      supabase = getSupabaseClient();
      // 1. Check if the notice exists first
      const { data: existingNotice, error: findError } = await supabase
        .from('notices')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (existingNotice) {
        // 2. Perform the update
        const { data, error } = await supabase
          .from('notices')
          .update(updates)
          .eq('id', id)
          .select()
          .maybeSingle();

        if (data) {
          updated = data;
        }
      }
    } catch {
      // in-memory handled
    }

    if (!updated) {
      return res.status(404).json({
        error: 'Notice not found.'
      });
    }

    return res.status(200).json({
      message: 'Notice updated successfully.',
      notice: updated
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

    let deletedNotice = null;
    const memIdx = memoryNotices.findIndex(n => String(n.id) === String(id));
    if (memIdx >= 0) {
      deletedNotice = memoryNotices.splice(memIdx, 1)[0];
    }

    try {
      const supabase = getSupabaseClient();
      const { data: existingNotice } = await supabase
        .from('notices')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (existingNotice) {
        const { data } = await supabase
          .from('notices')
          .delete()
          .eq('id', id)
          .select()
          .maybeSingle();
        deletedNotice = data || existingNotice;
      }
    } catch {
      // in-memory handled
    }

    if (!deletedNotice) {
      return res.status(404).json({
        error: 'Notice not found.'
      });
    }

    return res.status(200).json({
      message: 'Notice deleted successfully.',
      deletedNotice
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadNoticeFile,
  checkDuplicateNotice,
  createNotice,
  getAllNotices,
  getNoticeById,
  updateNoticeStatus,
  updateNotice,
  deleteNotice,
  decodeNotice,
  decodeNoticeFile,
  memoryNotices,
  memoryNotifications
};
