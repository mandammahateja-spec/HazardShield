const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getRiskStatus,
  reportHazard,
  getRelocationStatus,
  getAlerts,
} = require('../controllers/communityController');
const { verifyToken } = require('../middleware/auth');

// All community routes are protected by JWT
router.use(verifyToken);

// GET /api/community/dashboard
router.get('/dashboard', getDashboard);

// GET /api/community/risk-status
router.get('/risk-status', getRiskStatus);

// POST /api/community/report-hazard
router.post('/report-hazard', reportHazard);

// GET /api/community/relocation-status
router.get('/relocation-status', getRelocationStatus);

// GET /api/community/alerts
router.get('/alerts', getAlerts);

module.exports = router;
