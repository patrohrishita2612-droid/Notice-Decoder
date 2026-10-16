const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile
} = require('../controllers/auth.controller');

// POST /api/auth/register - Register user via Supabase Auth
router.post('/register', register);

// POST /api/auth/login - Login user via Supabase Auth
router.post('/login', login);

// GET /api/auth/me - Check current user session/profile
router.get('/me', getProfile);

module.exports = router;
