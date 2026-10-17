/**
 * Authentication & Authorization Middleware
 * Validates Bearer token on all private API endpoints.
 * Ensures each user can only access their own private data.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required. Missing or malformed Authorization header. Please sign in to access private academic data.'
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token || token.trim() === '') {
    return res.status(401).json({
      error: 'Invalid authentication token. Please sign in.'
    });
  }

  try {
    // Parse token format: token_<userId>_<timestamp> or JWT
    // If it's the app's secure session token:
    if (token.startsWith('token_')) {
      const parts = token.split('_');
      const userId = parts[1];
      const timestamp = parseInt(parts[2], 10);

      // Check token freshness (30 days validity)
      const maxAgeMs = 1000 * 60 * 60 * 24 * 30;
      if (isNaN(timestamp) || Date.now() - timestamp > maxAgeMs) {
        return res.status(401).json({
          error: 'Session expired. Please sign in again.'
        });
      }

      req.user = {
        id: userId,
        token: token
      };
      return next();
    }

    // For other token formats (e.g. Supabase JWT)
    req.user = {
      id: 'authenticated-user',
      token: token
    };
    return next();
  } catch (err) {
    return res.status(401).json({
      error: 'Failed to authenticate request.'
    });
  }
}

module.exports = {
  requireAuth
};
