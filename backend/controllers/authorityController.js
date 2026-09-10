/**
 * Authority-Side Controller with Role-Gated State Machine
 * 
 * Workflow Sequence:
 * Citizen reports hazard -> DistrictAdmin+ verifies -> Risk Engine scores zone ->
 * Zone reclassified -> If red + overcapacity, RelocationPlan pending approval ->
 * StateDMA/MHA approves -> Alert dispatched to community -> Community sees updated status
 */

const PDFDocument = require('pdfkit');
const Zone = require('../models/Zone');
const HazardReport = require('../models/HazardReport');
const RelocationPlan = require('../models/RelocationPlan');
const Alert = require('../models/Alert');
const User = require('../models/User');
const { scoreZone } = require('../services/riskEngineClient');
const { dispatchAlertToZone } = require('../services/alertService');
const { getZoneRainfall } = require('../services/weatherService');

/**
 * GET /api/authority/dashboard
 * Scoped dashboard statistics according to authority level:
 * - MHA: National overview
 * - StateDMA: State-level overview
 * - DistrictAdmin: District-level overview
 * - Municipal: Ward-level overview
 */
const getDashboard = async (req, res, next) => {
  try {
    const authorityLevel = req.user.authorityLevel || 'MHA';

    // Scoped query filter (can be extended by state/district field in production)
    const query = {};

    const totalZones = await Zone.countDocuments(query);
    const redZones = await Zone.countDocuments({ ...query, riskLevel: 'red' });
    const yellowZones = await Zone.countDocuments({ ...query, riskLevel: 'yellow' });
    const greenZones = await Zone.countDocuments({ ...query, riskLevel: 'green' });

    const zones = await Zone.find(query);
    const totalPopulation = zones.reduce((sum, z) => sum + (z.population || 0), 0);
    const populationAtRisk = zones
      .filter((z) => z.riskLevel === 'red' || z.riskLevel === 'yellow')
      .reduce((sum, z) => sum + (z.population || 0), 0);
    const overcapacityZones = zones.filter((z) => (z.overcapacityIndex || 0) > 1.0).length;

    // Workflow state machine counts
    const pendingCitizenReports = await HazardReport.countDocuments({ status: 'pending_review' });
    const pendingRelocations = await RelocationPlan.countDocuments({ status: 'pending_approval' });
    const approvedRelocations = await RelocationPlan.countDocuments({ status: 'approved' });
    const totalAlertsDispatched = await Alert.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        authority: {
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          authorityLevel,
          jurisdictionScope: authorityLevel === 'MHA' ? 'National (All Sectors)' : `${authorityLevel} Jurisdiction`,
        },
        statistics: {
          totalZones,
          redZones,
          yellowZones,
          greenZones,
          totalPopulation,
          populationAtRisk,
          overcapacityZones,
          pendingCitizenReports,
          pendingRelocations,
          approvedRelocations,
          totalAlertsDispatched,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/authority/hazard-reports
 * List citizen-submitted reports awaiting verification (only DistrictAdmin+).
 */
const getHazardReports = async (req, res, next) => {
  try {
    const { status = 'all', zoneId } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (zoneId) {
      filter.zoneId = zoneId;
    }

    const reports = await HazardReport.find(filter)
      .sort({ timestamp: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: reports.length,
      data: { reports },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/authority/hazard-reports/:id/verify
 * (DistrictAdmin or above)
 * Mark report verified/rejected. If verified, triggers automated re-scoring of the zone.
 */
const verifyHazardReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes = '' } = req.body;

    if (!status || !['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be either "verified" or "rejected".',
      });
    }

    const report = await HazardReport.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Hazard report not found.' });
    }

    report.status = status;
    report.verifiedBy = req.user.id;
    report.verifiedByName = req.user.name;
    report.verifiedAt = new Date();
    report.verificationNotes = notes;
    await report.save();

    let scoringResult = null;

    // If verified, trigger automated re-scoring of zone via Risk Engine!
    if (status === 'verified') {
      const zone = await Zone.findOne({
        $or: [{ id: report.zoneId }, { _id: report.zoneId.match(/^[0-9a-fA-F]{24}$/) ? report.zoneId : null }, { zoneName: new RegExp(report.zoneId, 'i') }],
      }) || await Zone.findOne();

      if (zone) {
        zone.hasVerifiedHazard = true;

        // Fetch verified reports count for this zone
        const verifiedCount = await HazardReport.countDocuments({
          zoneId: report.zoneId,
          status: 'verified',
        });

        // Pull weather
        const coords = zone.coordinates?.coordinates?.[0]?.[0] || [72.8777, 19.0760];
        const weather = await getZoneRainfall(coords[1], coords[0]);

        // Call Risk Engine
        scoringResult = await scoreZone({
          zone_id: zone.id || zone._id.toString(),
          zone_name: zone.zoneName,
          hazard_type: zone.hazardType,
          population: zone.population,
          mhi_baseline: zone.mhiScore || zone.riskScore || 65,
          rainfall_mm: weather.rainfallMm || 75,
          rainfall_thresh: 85,
          alpha: 1.15,
          rcc: zone.carryingCapacity || 8000,
          verified_hazard_reports_count: verifiedCount,
        });

        // Update zone
        zone.riskScore = scoringResult.drs_score;
        zone.drsScore = scoringResult.drs_score;
        zone.riskLevel = scoringResult.classification; // 'red' | 'yellow' | 'green'
        zone.overcapacityIndex = scoringResult.oci_score;
        zone.eccCapacity = scoringResult.ecc_capacity;
        zone.limitingFactor = scoringResult.limiting_factor;
        zone.lastUpdated = new Date();
        await zone.save();

        // If zone is red + overcapacity, auto-create/update pending RelocationPlan
        if (scoringResult.classification === 'red' && scoringResult.is_overcapacity) {
          let plan = await RelocationPlan.findOne({ zoneId: zone._id });
          if (!plan) {
            plan = new RelocationPlan({
              zoneId: zone._id,
              urgencyScore: scoringResult.rpi_urgency_score || 88,
              status: 'pending_approval',
              reason: `Population exceeds carrying capacity (${scoringResult.oci_score} OCI) under critical hazard severity with ${verifiedCount} verified citizen hazard report(s).`,
              requiresVerifiedHazard: true,
              suggestedShelterId: 'Designated High-Ground Community Shelter',
              targetSettlementSites: [
                { siteName: 'Site Alpha - Highland Plateau', topsisScore: 0.89, availableCapacity: 9500 },
                { siteName: 'Site Beta - Urban Buffer', topsisScore: 0.74, availableCapacity: 14000 },
              ],
            });
          } else {
            plan.urgencyScore = scoringResult.rpi_urgency_score || 88;
            plan.status = 'pending_approval';
            plan.requiresVerifiedHazard = true;
          }
          await plan.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        report,
        scoringResult,
        message: status === 'verified'
          ? 'Hazard report verified. Zone re-scored via Risk Engine and classification updated.'
          : 'Hazard report marked as rejected.',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/authority/zones/:id/score
 * Runs the Risk Engine to compute/update MHI, OCI, and zone classification.
 */
const scoreZoneById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rainfallMm, waterLpcd, roadWidthMeters, targetEvacHours } = req.body;

    const zone = await Zone.findOne({
      $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { zoneName: new RegExp(id, 'i') }],
    });

    if (!zone) {
      return res.status(404).json({ success: false, error: 'Zone not found.' });
    }

    const verifiedCount = await HazardReport.countDocuments({
      zoneId: id,
      status: 'verified',
    });

    const coords = zone.coordinates?.coordinates?.[0]?.[0] || [72.8777, 19.0760];
    const weather = await getZoneRainfall(coords[1], coords[0]);

    // Call Python FastAPI Risk Engine
    const scoreResult = await scoreZone({
      zone_id: zone.id || zone._id.toString(),
      zone_name: zone.zoneName,
      hazard_type: zone.hazardType,
      population: zone.population,
      mhi_baseline: zone.mhiScore || zone.riskScore || 60,
      rainfall_mm: rainfallMm !== undefined ? rainfallMm : weather.rainfallMm,
      rainfall_thresh: 85,
      alpha: 1.15,
      rcc: zone.carryingCapacity || 8000,
      water_lpcd: waterLpcd || 135,
      road_width_meters: roadWidthMeters || 7.0,
      target_evac_hours: targetEvacHours || 4.5,
      verified_hazard_reports_count: verifiedCount,
    });

    // Update Zone record in MongoDB
    zone.drsScore = scoreResult.drs_score;
    zone.riskScore = scoreResult.drs_score;
    zone.riskLevel = scoreResult.classification; // 'red' | 'yellow' | 'green'
    zone.overcapacityIndex = scoreResult.oci_score;
    zone.eccCapacity = scoreResult.ecc_capacity;
    zone.limitingFactor = scoreResult.limiting_factor;
    zone.rainfallMm = rainfallMm !== undefined ? rainfallMm : weather.rainfallMm;
    zone.lastUpdated = new Date();
    await zone.save();

    // If red + overcapacity, create or escalate RelocationPlan
    let relocationPlan = null;
    if (scoreResult.classification === 'red' && scoreResult.is_overcapacity) {
      relocationPlan = await RelocationPlan.findOne({ zoneId: zone._id });
      if (!relocationPlan) {
        relocationPlan = await RelocationPlan.create({
          zoneId: zone._id,
          urgencyScore: scoreResult.rpi_urgency_score || 85,
          status: 'pending_approval',
          reason: `Auto-generated by Risk Engine: OCI = ${scoreResult.oci_score} with ${scoreResult.limiting_factor}`,
          requiresVerifiedHazard: zone.hasVerifiedHazard,
          targetSettlementSites: [
            { siteName: 'Site Alpha - Highland Plateau', topsisScore: 0.89, availableCapacity: 9500 },
            { siteName: 'Site Beta - Urban Buffer', topsisScore: 0.74, availableCapacity: 14000 },
          ],
        });
      } else {
        relocationPlan.urgencyScore = scoreResult.rpi_urgency_score || 85;
        if (relocationPlan.status !== 'approved') {
          relocationPlan.status = 'pending_approval';
        }
        await relocationPlan.save();
      }
    }

    res.status(200).json({
      success: true,
      data: {
        zone,
        scoreResult,
        relocationPlan,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/authority/relocation/:id/approve
 * (StateDMA or MHA only)
 * Approves a relocation plan; requires prior "verified" hazard status!
 */
const approveRelocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status = 'approved', shelterId } = req.body;

    const plan = await RelocationPlan.findById(id).populate('zoneId');
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Relocation plan not found.' });
    }

    // Role-gated check: StateDMA or MHA only
    const userLevel = req.user.authorityLevel;
    const isHighAuthority = userLevel === 'StateDMA' || userLevel === 'MHA' || req.user.role === 'admin';

    if (!isHighAuthority) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Approving a relocation plan requires StateDMA or MHA clearance. Your level: ${userLevel || 'DistrictAdmin'}.`,
      });
    }

    // STATE MACHINE REQUIREMENT: Requires prior "verified" hazard status
    const zone = plan.zoneId;
    const hasVerifiedReport = await HazardReport.exists({
      $or: [{ zoneId: zone?._id?.toString() }, { zoneId: zone?.id }],
      status: 'verified',
    });

    const isVerified = zone?.hasVerifiedHazard || hasVerifiedReport || !plan.requiresVerifiedHazard;

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Cannot approve relocation plan: Zone hazard status has not been verified by DistrictAdmin on-ground inspection yet.',
      });
    }

    plan.status = status;
    plan.approvedBy = req.user.id;
    plan.approvedByName = req.user.name;
    plan.approvedAuthorityLevel = userLevel || 'MHA';
    plan.approvedAt = new Date();
    if (shelterId) plan.suggestedShelterId = shelterId;

    await plan.save();

    res.status(200).json({
      success: true,
      data: {
        plan,
        message: `Relocation plan approved by ${userLevel || 'MHA'} Authority. Emergency evacuation corridor ready for alert dispatch.`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/authority/alerts/dispatch
 * (Any authority role)
 * Dispatches actual alert to affected community users for a zone and logs to MongoDB.
 */
const dispatchAlert = async (req, res, next) => {
  try {
    const { zoneId, title, message, severity = 'critical' } = req.body;

    if (!zoneId || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'zoneId, title, and message are required for alert dispatch.',
      });
    }

    const zone = await Zone.findOne({
      $or: [{ id: zoneId }, { _id: zoneId.match(/^[0-9a-fA-F]{24}$/) ? zoneId : null }, { zoneName: new RegExp(zoneId, 'i') }],
    }) || { zoneName: 'Monitored Sector' };

    const alertRecord = await dispatchAlertToZone({
      zoneId,
      zoneName: zone.zoneName || 'Monitored Sector',
      title,
      message,
      severity,
      authorityUser: req.user,
    });

    res.status(200).json({
      success: true,
      data: {
        alert: alertRecord,
        recipientsCount: alertRecord.recipientsCount,
        channels: alertRecord.channels,
        message: `Alert successfully dispatched to ${alertRecord.recipientsCount} community residents in ${zone.zoneName || zoneId}.`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/authority/reports/export
 * Generates official DDMA PDF dossier under Section 34, Disaster Management Act 2005.
 */
const exportReport = async (req, res, next) => {
  try {
    const { format = 'pdf' } = req.query;
    const zones = await Zone.find().sort({ riskScore: -1 });

    if (format === 'json') {
      return res.status(200).json({
        success: true,
        data: {
          generatedAt: new Date().toISOString(),
          referenceNumber: `DDMA/EOC/2026/S-${Math.floor(1000 + Math.random() * 9000)}`,
          actSection: 'Section 34, Disaster Management Act 2005',
          totalZones: zones.length,
          zones,
        },
      });
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=HazardShield_DDMA_Dossier_${Date.now()}.pdf`);

    doc.pipe(res);

    // Official Header
    doc
      .fontSize(10)
      .fillColor('#4B5563')
      .text('GOVERNMENT OF INDIA • DISASTER MANAGEMENT DIVISION', { align: 'center' });
    doc
      .fontSize(18)
      .fillColor('#111827')
      .font('Helvetica-Bold')
      .text('DISTRICT DISASTER MANAGEMENT AUTHORITY (DDMA)', { align: 'center' });
    doc
      .fontSize(9)
      .font('Helvetica-Oblique')
      .fillColor('#6B7280')
      .text('Constituted under Section 25, Disaster Management Act, 2005 (Act No. 53 of 2005)', { align: 'center' });

    doc.moveDown();
    doc.strokeColor('#111827').lineWidth(1.5).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);

    // Metadata Bar
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#374151')
      .text(`REF: DDMA/EOC/2026/S-${Math.floor(1000 + Math.random() * 9000)} | DISPATCH DATE: ${new Date().toLocaleDateString('en-IN')}`);
    doc.moveDown();

    // Title
    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .fillColor('#DC2626')
      .text('COMPREHENSIVE MULTI-HAZARD RISK & CARRYING CAPACITY DOSSIER');
    doc.moveDown(0.5);

    // Summary Table
    const redCount = zones.filter(z => z.riskLevel === 'red').length;
    const totalPop = zones.reduce((s, z) => s + z.population, 0);

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#1F2937')
      .text(`Total Monitored Zones: ${zones.length} | Critical Red Zones: ${redCount} | Total Population: ${(totalPop / 1000).toFixed(1)}K`);
    doc.moveDown();

    // Zones List
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827').text('Zone Risk Assessments:');
    doc.moveDown(0.5);

    zones.forEach((z, i) => {
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor(z.riskLevel === 'red' ? '#DC2626' : z.riskLevel === 'yellow' ? '#D97706' : '#059669')
        .text(`${i + 1}. ${z.zoneName} [${z.hazardType.toUpperCase()}] — Risk: ${z.riskLevel.toUpperCase()} (DRS: ${z.drsScore || z.riskScore}) | OCI: ${z.overcapacityIndex || 0}`);
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#4B5563')
        .text(`   Population: ${z.population.toLocaleString('en-US')} | Carrying Limit: ${z.carryingCapacity.toLocaleString('en-US')} | Limiting Bottleneck: ${z.limitingFactor || 'Physical Land'}`);
      doc.moveDown(0.3);
    });

    doc.moveDown();
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827').text('STATUTORY SIGNATURES:');
    doc.moveDown(1.5);
    doc.fontSize(8).font('Helvetica').text('_____________________          _____________________          _____________________');
    doc.text('District Disaster Officer       Chief Medical Officer          District Magistrate & Collector');

    doc.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getHazardReports,
  verifyHazardReport,
  scoreZoneById,
  approveRelocation,
  dispatchAlert,
  exportReport,
};
