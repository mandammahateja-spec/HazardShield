const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const Zone = require('../models/Zone');
const RelocationPlan = require('../models/RelocationPlan');

/**
 * GET /api/reports/export?format=csv|pdf
 * Generates and returns a downloadable report of current risk zones
 * and relocation priorities.
 */
const exportReport = async (req, res, next) => {
  try {
    const { format } = req.query;

    // Fetch all data needed for the report
    const [zones, plans] = await Promise.all([
      Zone.find()
        .select('zoneName hazardType riskScore riskLevel population carryingCapacity overcapacityIndex lastUpdated')
        .sort({ riskScore: -1 })
        .lean(),
      RelocationPlan.find()
        .populate({
          path: 'zoneId',
          select: 'zoneName hazardType riskLevel',
        })
        .sort({ urgencyScore: -1 })
        .lean(),
    ]);

    if (format === 'pdf') {
      return generatePDF(res, zones, plans);
    }

    // Default: CSV
    return generateCSV(res, zones, plans);
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a CSV report and stream it to the response.
 */
function generateCSV(res, zones, plans) {
  // Prepare zones data
  const zoneRows = zones.map((z) => ({
    'Zone Name': z.zoneName,
    'Hazard Type': z.hazardType,
    'Risk Score': z.riskScore,
    'Risk Level': z.riskLevel,
    'Population': z.population,
    'Carrying Capacity': z.carryingCapacity,
    'Overcapacity Index': z.overcapacityIndex,
    'Last Updated': new Date(z.lastUpdated).toISOString().split('T')[0],
  }));

  // Prepare relocation data
  const relocationRows = plans.map((p) => ({
    'Zone Name': p.zoneId ? p.zoneId.zoneName : 'N/A',
    'Hazard Type': p.zoneId ? p.zoneId.hazardType : 'N/A',
    'Urgency Score': p.urgencyScore,
    'Status': p.status,
    'Reason': p.reason,
  }));

  // Build CSV sections
  const zoneParser = new Parser();
  const relocationParser = new Parser();

  const zoneCsv = zoneParser.parse(zoneRows);
  const relocationCsv = relocationParser.parse(relocationRows);

  const fullCsv = [
    '=== HAZARD ZONES REPORT ===',
    `Generated: ${new Date().toISOString()}`,
    '',
    '--- Risk Zones ---',
    zoneCsv,
    '',
    '--- Relocation Priorities ---',
    relocationCsv,
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=hazardshield_report_${Date.now()}.csv`
  );
  res.status(200).send(fullCsv);
}

/**
 * Generate a PDF report and stream it to the response.
 */
function generatePDF(res, zones, plans) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=hazardshield_report_${Date.now()}.pdf`
  );

  doc.pipe(res);

  // ─── Title ──────────────────────────────────────────────
  doc
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('HazardShield — Risk Assessment Report', { align: 'center' });

  doc
    .fontSize(10)
    .font('Helvetica')
    .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });

  doc.moveDown(2);

  // ─── Summary ────────────────────────────────────────────
  const totalZones = zones.length;
  const redZones = zones.filter((z) => z.riskLevel === 'red').length;
  const yellowZones = zones.filter((z) => z.riskLevel === 'yellow').length;
  const greenZones = zones.filter((z) => z.riskLevel === 'green').length;
  const totalPop = zones.reduce((sum, z) => sum + z.population, 0);
  const popAtRisk = zones
    .filter((z) => z.riskLevel === 'red')
    .reduce((sum, z) => sum + z.population, 0);

  doc.fontSize(14).font('Helvetica-Bold').text('Summary');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text(`Total Zones Monitored: ${totalZones}`);
  doc.text(`High Risk (Red): ${redZones}  |  Medium (Yellow): ${yellowZones}  |  Low (Green): ${greenZones}`);
  doc.text(`Total Population: ${totalPop.toLocaleString()}`);
  doc.text(`Population at Risk: ${popAtRisk.toLocaleString()}`);
  doc.text(`Pending Relocations: ${plans.filter((p) => p.status === 'pending').length}`);

  doc.moveDown(1.5);

  // ─── Zones Table ────────────────────────────────────────
  doc.fontSize(14).font('Helvetica-Bold').text('Hazard Zones');
  doc.moveDown(0.5);

  // Table header
  const tableTop = doc.y;
  const colWidths = [140, 75, 55, 50, 70, 70, 40];
  const headers = ['Zone Name', 'Hazard', 'Risk', 'Score', 'Population', 'Capacity', 'OCI'];

  doc.fontSize(8).font('Helvetica-Bold');
  let xPos = 50;
  headers.forEach((header, i) => {
    doc.text(header, xPos, tableTop, { width: colWidths[i], align: 'left' });
    xPos += colWidths[i];
  });

  doc
    .moveTo(50, tableTop + 12)
    .lineTo(550, tableTop + 12)
    .stroke();

  // Table rows
  doc.font('Helvetica').fontSize(8);
  let yPos = tableTop + 18;

  zones.forEach((zone) => {
    if (yPos > 740) {
      doc.addPage();
      yPos = 50;
    }

    xPos = 50;
    const row = [
      zone.zoneName,
      zone.hazardType,
      zone.riskLevel,
      zone.riskScore.toString(),
      zone.population.toLocaleString(),
      zone.carryingCapacity.toLocaleString(),
      zone.overcapacityIndex.toString(),
    ];

    row.forEach((cell, i) => {
      doc.text(cell, xPos, yPos, { width: colWidths[i], align: 'left' });
      xPos += colWidths[i];
    });

    yPos += 14;
  });

  doc.moveDown(2);

  // ─── Relocation Priorities ──────────────────────────────
  if (doc.y > 650) doc.addPage();

  doc.fontSize(14).font('Helvetica-Bold').text('Relocation Priorities', 50);
  doc.moveDown(0.5);

  const relTableTop = doc.y;
  const relColWidths = [140, 60, 55, 60, 185];
  const relHeaders = ['Zone', 'Urgency', 'Status', 'Hazard', 'Reason'];

  doc.fontSize(8).font('Helvetica-Bold');
  xPos = 50;
  relHeaders.forEach((header, i) => {
    doc.text(header, xPos, relTableTop, { width: relColWidths[i], align: 'left' });
    xPos += relColWidths[i];
  });

  doc
    .moveTo(50, relTableTop + 12)
    .lineTo(550, relTableTop + 12)
    .stroke();

  doc.font('Helvetica').fontSize(8);
  yPos = relTableTop + 18;

  plans.forEach((plan) => {
    if (yPos > 740) {
      doc.addPage();
      yPos = 50;
    }

    xPos = 50;
    const row = [
      plan.zoneId ? plan.zoneId.zoneName : 'N/A',
      plan.urgencyScore.toString(),
      plan.status,
      plan.zoneId ? plan.zoneId.hazardType : 'N/A',
      plan.reason,
    ];

    row.forEach((cell, i) => {
      doc.text(cell, xPos, yPos, { width: relColWidths[i], align: 'left' });
      xPos += relColWidths[i];
    });

    yPos += 14;
  });

  // ─── Footer ─────────────────────────────────────────────
  doc
    .fontSize(8)
    .font('Helvetica')
    .text(
      'HazardShield — AI-Powered Geospatial Hazard Zone Management',
      50,
      760,
      { align: 'center', width: 500 }
    );

  doc.end();
}

module.exports = { exportReport };
