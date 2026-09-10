const express = require('express');
const router = express.Router();
const { getZones, getZoneById } = require('../controllers/zoneController');
const { verifyToken } = require('../middleware/auth');
const { validate, zoneQuerySchema } = require('../middleware/validation');

// All zone routes require authentication
router.use(verifyToken);

// GET /api/zones — List all zones with optional filters
router.get('/', validate(zoneQuerySchema, 'query'), getZones);

// GET /api/zones/:id — Single zone detail
router.get('/:id', getZoneById);

module.exports = router;
