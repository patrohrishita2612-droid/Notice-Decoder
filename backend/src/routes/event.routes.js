const express = require('express');
const router = express.Router();
const { 
  getAllEvents, 
  createEvent, 
  updateEvent, 
  deleteEvent 
} = require('../controllers/event.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// Protect all event routes with authentication
router.use(requireAuth);

// GET /api/events - Retrieve calendar events
router.get('/', getAllEvents);

// POST /api/events - Create a new event
router.post('/', createEvent);

// PUT /api/events/:id - Update an event (Students blocked from modifying official events)
router.put('/:id', updateEvent);

// DELETE /api/events/:id - Delete an event (Students blocked from deleting official events)
router.delete('/:id', deleteEvent);

module.exports = router;
