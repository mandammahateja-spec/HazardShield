/**
 * Satellite Ingestion Service (ISRO Bhuvan / NRSC Mock Ingestion)
 * Simulates periodic satellite radar interferometry (InSAR) and inundation mapping feeds.
 */

const Zone = require('../models/Zone');

/**
 * Simulates receiving a batch of radar deformation & flood extent data from ISRO Bhuvan / NRSC.
 */
async function syncSatelliteData() {
  try {
    const zones = await Zone.find();
    console.log(`🛰️ [SatelliteService] Syncing ISRO Bhuvan InSAR feeds for ${zones.length} zones...`);

    const updates = [];

    for (const zone of zones) {
      // Small simulated diurnal deformation / subsidence delta (-2mm to +2mm)
      const deformationDeltaMm = (Math.random() * 4 - 2).toFixed(1);
      
      // Update risk history and refresh lastUpdated
      const newScore = Math.min(100, Math.max(10, Math.round(zone.riskScore + (Math.random() * 2 - 1))));
      zone.riskScore = newScore;
      zone.riskHistory.push({ score: newScore, date: new Date() });
      if (zone.riskHistory.length > 20) zone.riskHistory.shift();

      updates.push(zone.save());
    }

    await Promise.all(updates);
    console.log('✅ [SatelliteService] ISRO Bhuvan satellite ingestion completed successfully.');
    return { success: true, count: zones.length };
  } catch (err) {
    console.error(`❌ [SatelliteService] Sync error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

module.exports = {
  syncSatelliteData,
  syncTelemetry: syncSatelliteData,
};
