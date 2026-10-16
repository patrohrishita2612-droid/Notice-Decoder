const express = require('express');
const router = express.Router();
const { getAllEvents, createEvent } = require('../controllers/event.controller');

// GET /api/events - Retrieve all events
router.get('/', getAllEvents);

// POST /api/events - Create a new event
router.post('/', createEvent);

module.exports = router;
