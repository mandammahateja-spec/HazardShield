const Zone = require('../models/Zone');
const RelocationPlan = require('../models/RelocationPlan');

/**
 * GET /api/dashboard/summary
 * Returns aggregate stats for the dashboard.
 */
const getSummary = async (req, res, next) => {
  try {
    const [
      totalZones,
      highRiskZones,
      populationAggregation,
      pendingRelocations,
    ] = await Promise.all([
      Zone.countDocuments(),
      Zone.countDocuments({ riskLevel: 'red' }),
      Zone.aggregate([
        {
          $group: {
            _id: null,
            totalPopulation: { $sum: '$population' },
            populationAtRisk: {
              $sum: {
                $cond: [{ $eq: ['$riskLevel', 'red'] }, '$population', 0],
              },
            },
          },
        },
      ]),
      RelocationPlan.countDocuments({ status: 'pending' }),
    ]);

    const stats = populationAggregation[0] || {
      totalPopulation: 0,
      populationAtRisk: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        totalZones,
        highRiskZones,
        totalPopulation: stats.totalPopulation,
        populationAtRisk: stats.populationAtRisk,
        pendingRelocations,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSummary };
