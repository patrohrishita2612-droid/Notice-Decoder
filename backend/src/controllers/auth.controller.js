const { getSupabaseClient } = require('../config/database');

/**
 * Controller: Register a new user using Supabase Auth
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        error: 'Invalid request body. Expected JSON.'
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long.'
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

    // Call Supabase built-in auth (never stores plaintext passwords)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password
    });

    if (error) {
      return res.status(400).json({
        error: error.message
      });
    }

    return res.status(201).json({
      message: 'User registered successfully. Check email for confirmation if enabled.',
      user: data.user
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Log in a user using Supabase Auth
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        error: 'Invalid request body. Expected JSON.'
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required.'
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    if (error) {
      return res.status(401).json({
        error: error.message
      });
    }

    return res.status(200).json({
      message: 'Login successful.',
      session: {
        access_token: data.session.access_token,
        token_type: data.session.token_type,
        expires_in: data.session.expires_in
      },
      user: data.user
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller: Get current user profile from token
 * GET /api/auth/me
 */
async function getProfile(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(200).json({
        message: 'Auth API is active and ready for Supabase Auth. Provide a Bearer token in the Authorization header to view profile.',
        authenticated: false
      });
    }

    const token = authHeader.split(' ')[1];

    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (dbConfigError) {
      return res.status(500).json({
        error: dbConfigError.message
      });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Invalid or expired token.',
        authenticated: false
      });
    }

    return res.status(200).json({
      authenticated: true,
      user
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getProfile
};
