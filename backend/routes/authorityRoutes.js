const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getHazardReports,
  verifyHazardReport,
  scoreZoneById,
  approveRelocation,
  dispatchAlert,
  exportReport
} = require('../controllers/authorityController');
const { verifyToken, requireRole, requireAuthorityLevel } = require('../middleware/auth');

// All authority routes require a valid JWT and authority role
router.use(verifyToken, requireRole('authority'));

// GET /api/authority/dashboard
router.get('/dashboard', getDashboard);

// GET /api/authority/hazard-reports (Requires DistrictAdmin or higher)
router.get('/hazard-reports', requireAuthorityLevel('DistrictAdmin'), getHazardReports);

// PATCH /api/authority/hazard-reports/:id/verify (Requires DistrictAdmin or higher)
router.patch('/hazard-reports/:id/verify', requireAuthorityLevel('DistrictAdmin'), verifyHazardReport);

// POST /api/authority/zones/:id/score (Authority level: Municipal+)
router.post('/zones/:id/score', scoreZoneById);

// PATCH /api/authority/relocation/:id/approve (Requires StateDMA or MHA)
router.patch('/relocation/:id/approve', requireAuthorityLevel('StateDMA'), approveRelocation);

// POST /api/authority/alerts/dispatch (Authority level: Municipal+)
router.post('/alerts/dispatch', dispatchAlert);

// GET /api/authority/reports/export (Authority level: Municipal+)
router.get('/reports/export', exportReport);

module.exports = router;
