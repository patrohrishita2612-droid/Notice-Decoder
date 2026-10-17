const express = require('express');
const router = express.Router();
const {
  checkScheduleConflict,
  submitConflictRequest,
  getConflictRequests,
  reviewConflictRequest
} = require('../controllers/conflict.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

// Protect all conflict routes with authentication
router.use(requireAuth);

// POST /api/conflicts/check - Pre-scheduling conflict detection against database records
router.post('/check', checkScheduleConflict);

// POST /api/conflicts - Students submit a conflict report / reschedule request
router.post('/', submitConflictRequest);

// GET /api/conflicts - Retrieve conflict requests (all for professor, own for student)
router.get('/', getConflictRequests);

// PATCH /api/conflicts/:id/review - Review and resolve conflict request (Professor only)
router.patch('/:id/review', requireRole('professor'), reviewConflictRequest);

module.exports = router;
