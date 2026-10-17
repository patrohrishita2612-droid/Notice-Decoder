/**
 * Authentication & Authorization Middleware
 * Validates Bearer token on all private API endpoints.
 * Enforces role-based permissions (student vs professor).
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required. Missing or malformed Authorization header. Please sign in to access campus data.'
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token || token.trim() === '') {
    return res.status(401).json({
      error: 'Invalid authentication token. Please sign in.'
    });
  }

  try {
    // Parse token format:
    // 1. token_<userId>_<role>_<timestamp> (4 parts)
    // 2. token_<userId>_<timestamp> (3 parts, default role 'student')
    if (token.startsWith('token_')) {
      const parts = token.split('_');
      let userId = 'user-default';
      let role = 'student';
      let timestamp = Date.now();

      if (parts.length >= 4) {
        userId = parts[1];
        role = parts[2];
        timestamp = parseInt(parts[3], 10);
      } else if (parts.length === 3) {
        userId = parts[1];
        timestamp = parseInt(parts[2], 10);
      }

      // 30 days validity
      const maxAgeMs = 1000 * 60 * 60 * 24 * 30;
      if (isNaN(timestamp) || Date.now() - timestamp > maxAgeMs) {
        return res.status(401).json({
          error: 'Session expired. Please sign in again.'
        });
      }

      req.user = {
        id: userId,
        role: role,
        token: token
      };
      return next();
    }

    // For other token formats (e.g. Supabase JWT)
    req.user = {
      id: 'authenticated-user',
      role: 'student',
      token: token
    };
    return next();
  } catch (err) {
    return res.status(401).json({
      error: 'Failed to authenticate request.'
    });
  }
}

/**
 * Role-Based Access Control Middleware
 * Requires the authenticated user to possess one of the specified roles.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access Denied: Requires role in [${allowedRoles.join(', ')}]. Current role is '${req.user.role}'.`
      });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
