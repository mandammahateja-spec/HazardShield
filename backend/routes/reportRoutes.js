const express = require('express');
const router = express.Router();
const { exportReport } = require('../controllers/reportController');
const { verifyToken } = require('../middleware/auth');
const { validate, reportQuerySchema } = require('../middleware/validation');

// All report routes require authentication
router.use(verifyToken);

// GET /api/reports/export?format=csv|pdf
router.get('/export', validate(reportQuerySchema, 'query'), exportReport);

module.exports = router;
