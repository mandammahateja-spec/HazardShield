const express = require('express');
const router = express.Router();
const {
  getRelocationPriority,
  approveRelocation,
} = require('../controllers/relocationController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const {
  validate,
  approveRelocationSchema,
} = require('../middleware/validation');

// All relocation routes require authentication
router.use(verifyToken);

// GET /api/relocation-priority — Zones ranked by urgency score
router.get('/', getRelocationPriority);

// PATCH /api/relocation-priority/:id/approve — Admin-only approval
router.patch(
  '/:id/approve',
  verifyAdmin,
  validate(approveRelocationSchema),
  approveRelocation
);

module.exports = router;
