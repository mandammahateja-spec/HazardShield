const Zone = require('../models/Zone');

/**
 * GET /api/zones
 * Returns a list of all hazard zones with optional filters.
 * Query params: hazardType, riskLevel, page, limit
 */
const getZones = async (req, res, next) => {
  try {
    const { hazardType, riskLevel, page = 1, limit = 50 } = req.query;

    // Build filter object
    const filter = {};
    if (hazardType) filter.hazardType = hazardType;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (req.query.redZone === 'true') filter['redZoneStatus.isRedZone'] = true;
    if (req.query.relocationTier) filter.relocationTier = req.query.relocationTier;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [zones, total] = await Promise.all([
      Zone.find(filter)
        .select('-riskHistory') // Exclude history from list view for performance
        .sort({ riskScore: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Zone.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: zones,
      count: total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/zones/:id
 * Returns full detail for a single zone, including coordinates and risk history.
 */
const getZoneById = async (req, res, next) => {
  try {
    const zone = await Zone.findById(req.params.id).lean();

    if (!zone) {
      return res.status(404).json({
        success: false,
        error: 'Zone not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: zone,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getZones, getZoneById };
