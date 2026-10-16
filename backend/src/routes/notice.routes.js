const express = require('express');
const router = express.Router();
const {
  createNotice,
  getAllNotices,
  getNoticeById
} = require('../controllers/notice.controller');

// POST /api/notices - Submit and process a new notice
router.post('/', createNotice);

// GET /api/notices - Retrieve all notices
router.get('/', getAllNotices);

// GET /api/notices/:id - Retrieve a specific notice by ID
router.get('/:id', getNoticeById);

module.exports = router;
