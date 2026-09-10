/**
 * Community-Side Controller
 * Serves citizen workflows: local dashboard, risk status, citizen hazard reporting,
 * active relocation guidance, and community alert inbox.
 */

const Zone = require('../models/Zone');
const HazardReport = require('../models/HazardReport');
const RelocationPlan = require('../models/RelocationPlan');
const Alert = require('../models/Alert');
const User = require('../models/User');
const { getZoneRainfall } = require('../services/weatherService');

/**
 * GET /api/community/dashboard
 * Returns summary of zones and environmental indicators relevant to user's registered location.
 */
const getDashboard = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const zoneId = user?.assignedZoneId || req.user.assignedZoneId || 'zone_001';

    // Find citizen's primary zone
    let primaryZone = await Zone.findOne({
      $or: [{ id: zoneId }, { _id: zoneId.match(/^[0-9a-fA-F]{24}$/) ? zoneId : null }, { zoneName: new RegExp(zoneId, 'i') }],
    });

    if (!primaryZone) {
      primaryZone = await Zone.findOne(); // Fallback to first zone
    }

    // Get live weather readings for citizen's location
    const coords = primaryZone?.coordinates?.coordinates?.[0]?.[0] || [72.8777, 19.0760];
    const weather = await getZoneRainfall(coords[1], coords[0]);

    // Check active relocation plan
    const activePlan = primaryZone
      ? await RelocationPlan.findOne({ zoneId: primaryZone._id, status: { $in: ['approved', 'in_progress'] } })
      : null;

    // Check recent alerts
    const recentAlerts = await Alert.find({ zoneId: primaryZone?._id?.toString() || zoneId })
      .sort({ createdAt: -1 })
      .limit(3);

    res.status(200).json({
      success: true,
      data: {
        citizen: {
          name: user?.name,
          email: user?.email,
          phone: user?.phone,
          district: user?.location?.district,
          assignedZone: primaryZone?.zoneName || zoneId,
        },
        zone: primaryZone,
        weather,
        relocationActive: !!activePlan,
        relocationStatus: activePlan?.status || 'none',
        recentAlertsCount: recentAlerts.length,
        recentAlerts,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/community/risk-status
 * View current red/yellow/green status for citizen's zone.
 */
const getRiskStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const zoneId = user?.assignedZoneId || req.user.assignedZoneId || 'zone_001';

    const zone = await Zone.findOne({
      $or: [{ id: zoneId }, { _id: zoneId.match(/^[0-9a-fA-F]{24}$/) ? zoneId : null }, { zoneName: new RegExp(zoneId, 'i') }],
    }) || await Zone.findOne();

    if (!zone) {
      return res.status(404).json({ success: false, error: 'Zone data not found.' });
    }

    let advisory = 'Normal civil activities. Maintain general safety awareness.';
    if (zone.riskLevel === 'red') {
      advisory = 'CRITICAL ALERT: Dynamic Risk Score exceeds 70%. Follow designated civil evacuation routes to relief centers.';
    } else if (zone.riskLevel === 'yellow') {
      advisory = 'AMBER ADVISORY: Potential localized inundation or seismic strain. Keep emergency communication channels open.';
    }

    res.status(200).json({
      success: true,
      data: {
        zoneId: zone._id,
        zoneName: zone.zoneName,
        hazardType: zone.hazardType,
        riskLevel: zone.riskLevel, // 'red' | 'yellow' | 'green'
        riskScore: zone.riskScore,
        drsScore: zone.drsScore || zone.riskScore,
        overcapacityIndex: zone.overcapacityIndex || 0,
        isOvercapacity: (zone.overcapacityIndex || 0) > 1.0,
        advisory,
        lastUpdated: zone.lastUpdated,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/community/report-hazard
 * Citizen submits a local hazard concern (stored as pending_review).
 */
const reportHazard = async (req, res, next) => {
  try {
    const { title, description, photoUrl, location, hazardType, zoneId } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Title and description are required for a hazard report.',
      });
    }

    const user = await User.findById(req.user.id);
    const targetZoneId = zoneId || user?.assignedZoneId || 'zone_001';

    const report = await HazardReport.create({
      citizenId: req.user.id,
      citizenName: user?.name || req.user.name || 'Anonymous Citizen',
      zoneId: targetZoneId,
      title,
      description,
      photoUrl: photoUrl || '',
      location: {
        latitude: location?.latitude || user?.location?.latitude || 19.0760,
        longitude: location?.longitude || user?.location?.longitude || 72.8777,
        address: location?.address || user?.location?.address || 'Community Ward',
      },
      hazardType: hazardType || 'flood',
      status: 'pending_review',
    });

    res.status(201).json({
      success: true,
      data: {
        report,
        message: 'Hazard concern submitted successfully. Transmitted to District Disaster Management Authority for verification.',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/community/relocation-status
 * Check if citizen's zone has an active relocation plan and view guidance.
 */
const getRelocationStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const zoneId = user?.assignedZoneId || req.user.assignedZoneId || 'zone_001';

    const zone = await Zone.findOne({
      $or: [{ id: zoneId }, { _id: zoneId.match(/^[0-9a-fA-F]{24}$/) ? zoneId : null }, { zoneName: new RegExp(zoneId, 'i') }],
    }) || await Zone.findOne();

    const plan = zone ? await RelocationPlan.findOne({ zoneId: zone._id }) : null;

    if (!plan || plan.status === 'draft') {
      return res.status(200).json({
        success: true,
        data: {
          hasActivePlan: false,
          status: 'none',
          message: `No active relocation order for ${zone?.zoneName || 'your zone'}. Normal residency applies.`,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        hasActivePlan: true,
        status: plan.status, // 'pending_approval' | 'approved' | 'in_progress' | 'completed'
        zoneName: zone.zoneName,
        urgencyScore: plan.urgencyScore,
        reason: plan.reason,
        suggestedShelterId: plan.suggestedShelterId || 'Designated High-Ground Community Relief Camp',
        targetSettlementSites: plan.targetSettlementSites || [],
        approvedAuthorityLevel: plan.approvedAuthorityLevel,
        approvedAt: plan.approvedAt,
        guidance: plan.status === 'approved' || plan.status === 'in_progress'
          ? 'OFFICIAL RELOCATION MANDATE: Please pack essential documents and medication. Transport buses stationed at Ward Community Center.'
          : 'Relocation planning under technical review by State Disaster Management Authority.',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/community/alerts
 * List of historical and active alerts sent to citizen's zone.
 */
const getAlerts = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const zoneId = user?.assignedZoneId || req.user.assignedZoneId || 'zone_001';

    const alerts = await Alert.find({
      $or: [{ zoneId }, { 'recipients.userId': req.user.id }],
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getRiskStatus,
  reportHazard,
  getRelocationStatus,
  getAlerts,
};
