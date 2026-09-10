const express = require('express');
const router = express.Router();
const { register, login, logout } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const {
  validate,
  registerSchema,
  loginSchema,
} = require('../middleware/validation');

// POST /api/auth/register — Create admin/official account
router.post('/register', validate(registerSchema), register);

// POST /api/auth/login — Validate credentials, return JWT (rate-limited)
router.post('/login', loginLimiter, validate(loginSchema), login);

// POST /api/auth/logout — Invalidate token (requires auth)
router.post('/logout', verifyToken, logout);

module.exports = router;
