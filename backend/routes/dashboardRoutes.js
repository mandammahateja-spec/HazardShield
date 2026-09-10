const express = require('express');
const router = express.Router();
const { getSummary } = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/auth');

// All dashboard routes require authentication
router.use(verifyToken);

// GET /api/dashboard/summary — Aggregate stats
router.get('/summary', getSummary);

module.exports = router;
