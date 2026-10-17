const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead
} = require('../controllers/notification.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// Protect all notification routes with authentication
router.use(requireAuth);

// GET /api/notifications - Get alerts for current student/user
router.get('/', getNotifications);

// PATCH /api/notifications/:id/read - Mark individual alert as read
router.patch('/:id/read', markAsRead);

// POST /api/notifications/mark-all-read - Mark all alerts as read
router.post('/mark-all-read', markAllAsRead);

module.exports = router;
