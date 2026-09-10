const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for the /api/auth/login endpoint.
 * Allows 10 attempts per 15-minute window per IP.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 15 : 500,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too many login attempts. Please try again after 15 minutes.',
  },
  keyGenerator: (req) => {
    // Use X-Forwarded-For for Render/proxy deployments, fallback to IP
    return req.ip || req.connection.remoteAddress;
  },
});

/**
 * General API rate limiter.
 * 100 requests per 15 minutes per IP.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
});

module.exports = { loginLimiter, apiLimiter };
