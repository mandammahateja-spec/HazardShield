const RelocationPlan = require('../models/RelocationPlan');

/**
 * GET /api/relocation-priority
 * Returns zones ranked by urgency score (descending).
 * Populates zone details from the Zone collection.
 */
const getRelocationPriority = async (req, res, next) => {
  try {
    const plans = await RelocationPlan.find()
      .populate({
        path: 'zoneId',
        select: 'zoneName hazardType riskLevel riskScore population carryingCapacity overcapacityIndex',
      })
      .populate({
        path: 'approvedBy',
        select: 'name email',
      })
      .sort({ urgencyScore: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: plans,
      count: plans.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/relocation-priority/:id/approve
 * Marks a relocation plan as approved (admin only).
 * Updates status and records who approved it.
 */
const approveRelocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const plan = await RelocationPlan.findById(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Relocation plan not found.',
      });
    }

    // Prevent re-approving a completed plan
    if (plan.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify a completed relocation plan.',
      });
    }

    plan.status = status || 'approved';
    plan.approvedBy = req.user.id;
    plan.approvedAt = new Date();
    await plan.save();

    // Re-fetch with populated fields for the response
    const updatedPlan = await RelocationPlan.findById(id)
      .populate({
        path: 'zoneId',
        select: 'zoneName hazardType riskLevel riskScore population',
      })
      .populate({
        path: 'approvedBy',
        select: 'name email',
      })
      .lean();

    res.status(200).json({
      success: true,
      data: updatedPlan,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRelocationPriority, approveRelocation };
