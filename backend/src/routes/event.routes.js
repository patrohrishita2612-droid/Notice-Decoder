const express = require('express');
const router = express.Router();
const { getAllEvents, createEvent } = require('../controllers/event.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// Protect all event routes with authentication
router.use(requireAuth);

// GET /api/events - Retrieve user's private events
router.get('/', getAllEvents);

// POST /api/events - Create a new event for authenticated user
router.post('/', createEvent);

module.exports = router;
