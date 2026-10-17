const express = require('express');
const router = express.Router();
const {
  createNotice,
  decodeNotice,
  getAllNotices,
  getNoticeById,
  updateNotice,
  deleteNotice
} = require('../controllers/notice.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// POST /api/notices/decode - Decode notice text into 13-field structured intelligence (sandbox & preview)
router.post('/decode', decodeNotice);

// Protect all private notice persistence & CRUD routes with authentication
router.use(requireAuth);

// POST /api/notices - Submit and process a new notice (AI extraction + persistence)
router.post('/', createNotice);

// GET /api/notices - Retrieve user's private decoded notices
router.get('/', getAllNotices);

// GET /api/notices/:id - Retrieve a specific notice by ID
router.get('/:id', getNoticeById);

// PUT /api/notices/:id - Update an existing notice by ID
router.put('/:id', updateNotice);

// DELETE /api/notices/:id - Delete a notice by ID
router.delete('/:id', deleteNotice);

module.exports = router;
