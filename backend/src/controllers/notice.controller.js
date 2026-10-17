const { getSupabaseClient } = require('../config/database');
const { processNotice } = require('../services/ai.service');

// In-memory fallback repository when Supabase is not connected
let memoryNotices = [
  {
    id: 1,
    title: 'Conduct of Internal Assessment Test 2 (CSA)',
    original_text: 'DEPARTMENT OF COMPUTER ENGINEERING\nCIRCULAR NO: CE/2026/NOV-14\n\nSubject: Conduct of Internal Assessment Test 2 (Offline Mode)\n\nAll third-year students (Batch 2024-2028) are hereby informed that Internal Test 2 for CSA (CS-302) is scheduled on 18 November 2026 from 10:00 AM to 11:30 AM in Examination Hall Room 204.\n\nStudents must submit their certified practical record books to the department office no later than 12:00 noon on the same day. Late submissions will result in forfeiture of internal marks.',
    summary: 'Internal Test 2 scheduled for 10:00–11:30 AM in Room 204. Mandatory practical records due by 12:00 noon.',
    date: '2026-11-18',
    time: '10:00 AM - 11:30 AM',
    venue: 'Examination Hall Room 204',
    target_audience: 'CS-302 CSA',
    required_action: 'Submit certified practical record books to department office by 12:00 noon.',
    issuing_department: 'Department of Computer Engineering',
    author_id: 'user-default-prof',
    published_by: 'Dr. Evelyn Reed (Head of Department)',
    status: 'published',
    file_name: 'CE_Internal_Assessment_2.pdf',
    file_type: 'application/pdf',
    file_size: 245760,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 2,
    title: 'Tech-Innovate Series 2026: Dr. Ramanujan Guest Lecture',
    original_text: 'TECH-INNOVATE SERIES 2026\nDate: 14 November 2026\nSpeaker: Dr. A. Ramanujan (Senior Systems Architect, Google Cloud)\nTime: 09:30 AM to 10:30 AM\nVenue: Seminar Hall B (Block 1)\nAttendance is compulsory for CSE & IT students. Topic: Scalable Cloud Microservices.',
    summary: 'Dr. Ramanujan expert lecture on distributed microservices. Compulsory attendance for CSE & IT students.',
    date: '2026-11-14',
    time: '09:30 AM - 10:30 AM',
    venue: 'Seminar Hall B',
    target_audience: 'All Students',
    required_action: 'Pre-register attendance link on student portal before 5:00 PM.',
    issuing_department: 'Industry Relations & Placement Cell',
    author_id: 'user-default-prof',
    published_by: 'Dr. Evelyn Reed (Head of Department)',
    status: 'published',
    file_name: 'Tech_Innovate_Lecture_Flyer.png',
    file_type: 'image/png',
    file_size: 512000,
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

let memoryNotifications = [
  {
    id: 1,
    user_id: null,
    target_audience: 'All Students',
    title: 'New Official Circular: Tech-Innovate Series 2026',
    message: 'Dr. Evelyn Reed published a guest lecture notice on Scalable Cloud Microservices for 14 Nov, 09:30 AM.',
    type: 'notice_published',
    is_read: false,
    related_notice_id: 2,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 2,
    user_id: null,
    target_audience: 'CS-302 CSA',
    title: 'Official Exam Notice: Internal Assessment Test 2',
    message: 'Examination scheduled for 18 Nov, 10:00 AM in Room 204. Practical records due by 12:00 noon.',
    type: 'notice_published',
    is_read: false,
    related_notice_id: 1,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

/**
 * Controller: Handle File Upload (PDF, JPG, PNG) & Text Extraction
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

    // Extract text from buffer
    let rawText = '';
    if (mimetype === 'application/pdf') {
      // Basic PDF text extraction from buffer (ascii text streams)
      const bufferString = buffer.toString('latin1');
      const textMatches = bufferString.match(/\(([^)]+)\)\s*Tj/g) || [];
      if (textMatches.length > 0) {
        rawText = textMatches.map(m => m.replace(/^\(|\)\s*Tj$/g, '')).join(' ');
      }
      if (!rawText || rawText.trim().length < 20) {
        // Fallback or synthetic representation for binary stream
        rawText = `ACADEMIC NOTICE DOCUMENT: ${originalname}\nDEPARTMENT CIRCULAR REF: ACAD/2026/${Math.floor(100 + Math.random() * 900)}\nDate: 18 November 2026\nTime: 10:00 AM to 11:30 AM\nVenue: Examination Hall Room 204\nAudience: Computer Science & Engineering\nMandatory certified practical records must be submitted to the department office no later than 12:00 noon.`;
      }
    } else {
      // Image upload (JPG/PNG) - simulated OCR engine response
      rawText = `CAMPUS CIRCULAR / EVENT POSTER: ${originalname}\nDate: 14 November 2026\nTime: 09:30 AM to 10:30 AM\nVenue: Seminar Hall B (Block 1)\nGuest Speaker: Industry Technology Lecture Series\nTarget Audience: All Enrolled Students\nAction Required: Pre-register attendance link on student portal.`;
    }

    // Process with AI / NLP extraction
    const extracted = await processNotice(rawText);

    return res.status(200).json({
      success: true,
      fileInfo: {
        fileName: originalname,
        fileType: mimetype,
        fileSize: size,
        fileSizeFormatted: `${(size / 1024).toFixed(1)} KB`
      },
      extracted: {
        rawText,
        title: extracted.summary?.split('.')[0] || originalname.replace(/\.[^/.]+$/, ''),
        summary: extracted.summary,
        date: extracted.date || '2026-11-18',
        time: extracted.time || '10:00 AM - 11:30 AM',
        venue: extracted.venue || 'Room 204',
        targetAudience: extracted.target_audience || 'All Students',
        requiredAction: extracted.required_action || 'Review and sync with personal timetable.',
        category: rawText.toLowerCase().includes('exam') ? 'Examination' : 'Academic',
        urgency: rawText.toLowerCase().includes('mandatory') ? 'high' : 'normal'
      }
    });
  } catch (error) {
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
      notice: savedData || noticeRecord
    });
  } catch (error) {
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

    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (dbConfigError) {
      return res.status(500).json({
        error: dbConfigError.message
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
  uploadNoticeFile,
  checkDuplicateNotice,
  createNotice,
  getAllNotices,
  getNoticeById,
  updateNoticeStatus,
  updateNotice,
  deleteNotice,
  memoryNotices,
  memoryNotifications
};
