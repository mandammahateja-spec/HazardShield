const jwt = require('jsonwebtoken');

/**
 * In-memory token blacklist.
 * Stores JTI (JWT ID) or raw tokens that have been invalidated via logout.
 * NOTE: In production, replace with Redis for persistence across restarts.
 */
const tokenBlacklist = new Set();

/**
 * Add a token to the blacklist.
 * @param {string} token — the raw JWT string
 */
const blacklistToken = (token) => {
  tokenBlacklist.add(token);
};

/**
 * Check if a token has been blacklisted.
 * @param {string} token — the raw JWT string
 * @returns {boolean}
 */
const isBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

/**
 * Middleware: verifyToken
 * Extracts and verifies the JWT from the Authorization header.
 * Attaches decoded user payload to req.user.
 * Rejects if token is missing, invalid, expired, or blacklisted.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  if (isBlacklisted(token)) {
    return res.status(401).json({
      success: false,
      error: 'Token has been invalidated. Please login again.',
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'hazardshield_jwt_secret_fallback_key_2026';
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    req.token = token; // Store for logout
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired. Please login again.',
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid token.',
    });
  }
};

/**
 * Middleware: verifyAdmin
 * Checks that the authenticated user has the "admin" or "authority" role.
 */
const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.',
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'authority') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin privileges required.',
    });
  }

  next();
};

/**
 * Middleware: requireRole
 * Gating by role: 'community' | 'authority'
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }

    // Normalize legacy 'admin'/'official' to 'authority'
    const userRole = (req.user.role === 'admin' || req.user.role === 'official') ? 'authority' : req.user.role;

    if (!allowedRoles.includes(userRole) && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires role: ${allowedRoles.join(' or ')}.`,
      });
    }

    next();
  };
};

/**
 * Authority Hierarchy Weights:
 * Municipal (1) <= DistrictAdmin (2) <= StateDMA (3) <= MHA (4)
 */
const AUTHORITY_LEVEL_WEIGHTS = {
  Municipal: 1,
  DistrictAdmin: 2,
  StateDMA: 3,
  MHA: 4,
};

/**
 * Middleware: requireAuthorityLevel
 * Enforces minimum authority clearance (e.g. DistrictAdmin for report verification, StateDMA for relocation approval).
 */
const requireAuthorityLevel = (minimumLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }

    // Legacy 'admin' is treated as highest authority (MHA)
    let userLevel = req.user.authorityLevel;
    if (req.user.role === 'admin') userLevel = 'MHA';
    if (req.user.role === 'official' && !userLevel) userLevel = 'DistrictAdmin';

    const minWeight = AUTHORITY_LEVEL_WEIGHTS[minimumLevel] || 1;
    const userWeight = AUTHORITY_LEVEL_WEIGHTS[userLevel] || 0;

    if (userWeight < minWeight) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires ${minimumLevel} authority level or higher. Your level: ${userLevel || 'None'}.`,
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  verifyAdmin,
  requireRole,
  requireAuthorityLevel,
  blacklistToken,
  isBlacklisted,
};

