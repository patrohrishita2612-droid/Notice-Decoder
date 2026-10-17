const express = require('express');
const router = express.Router();
const {
  createNotice,
  getAllNotices,
  getNoticeById,
  updateNotice,
  deleteNotice
} = require('../controllers/notice.controller');

// POST /api/notices - Submit and process a new notice
router.post('/', createNotice);

// GET /api/notices - Retrieve all notices
router.get('/', getAllNotices);

// GET /api/notices/:id - Retrieve a specific notice by ID
router.get('/:id', getNoticeById);

// PUT /api/notices/:id - Update an existing notice by ID
router.put('/:id', updateNotice);

// DELETE /api/notices/:id - Delete a notice by ID
router.delete('/:id', deleteNotice);

module.exports = router;
