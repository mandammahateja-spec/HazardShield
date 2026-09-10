import { HazardZone } from '@/data/hazardZones';

export interface ZoneDrsParameters {
  mhi: number;          // Baseline Multi-Hazard Index (0 - 100)
  rThresh: number;      // 72h Rainfall threshold (mm)
  alpha: number;        // Terrain sensitivity coefficient
  soilSaturation: number; // Current antecedent soil moisture (0 - 1)
}

export interface ZoneDynamicRisk {
  zoneId: string;
  baselineScore: number;
  simulatedRainfallMm: number;
  drs: number;          // Dynamic Risk Score (0 - 100)
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  riskColor: string;
  percentageChange: number;
  thresholdExceeded: boolean;
  evacuationUrgent: boolean;
}

// Default environmental calibration parameters per zone
export const ZONE_DRS_CALIBRATION: Record<string, ZoneDrsParameters> = {
  zone_001: { mhi: 78, rThresh: 85, alpha: 1.15, soilSaturation: 0.72 }, // Coastal Settlement Alpha (Flood)
  zone_002: { mhi: 74, rThresh: 140, alpha: 0.85, soilSaturation: 0.45 }, // Highland Industrial (Earthquake)
  zone_003: { mhi: 55, rThresh: 95, alpha: 1.30, soilSaturation: 0.68 }, // Valley Settlement Beta (Landslide)
  zone_004: { mhi: 82, rThresh: 75, alpha: 1.25, soilSaturation: 0.80 }, // Mangrove Delta (Cyclone/Storm Surge)
  zone_005: { mhi: 42, rThresh: 110, alpha: 1.05, soilSaturation: 0.50 }, // Urban Extension (Flood)
  zone_006: { mhi: 26, rThresh: 180, alpha: 0.70, soilSaturation: 0.30 }, // Mountain Village Cluster (Seismic)
  zone_007: { mhi: 30, rThresh: 160, alpha: 0.75, soilSaturation: 0.35 }, // Tech Park Area (Flood Safe)
  zone_008: { mhi: 48, rThresh: 90, alpha: 1.20, soilSaturation: 0.62 }, // Riverside Community (Landslide)
};

/**
 * Calculates the Dynamic Risk Score (DRS) for a specific zone under simulated 72h rainfall.
 * Formula: DRS = MHI * [1 + alpha * ((R_cum - R_thresh) / R_thresh)]
 */
export function calculateZoneDrs(
  zone: HazardZone,
  rainfallMm: number
): ZoneDynamicRisk {
  const cal = ZONE_DRS_CALIBRATION[zone.id] || {
    mhi: zone.urgencyScore > 0 ? zone.urgencyScore * 0.85 : 50,
    rThresh: 100,
    alpha: 1.0,
    soilSaturation: 0.5,
  };

  let drs: number;

  if (rainfallMm <= 0) {
    drs = cal.mhi;
  } else if (rainfallMm <= cal.rThresh) {
    // Sub-threshold rainfall: mild proportional moisture accumulation
    const subFactor = (rainfallMm / cal.rThresh) * 0.12 * cal.alpha;
    drs = cal.mhi * (1 + subFactor);
  } else {
    // Formula: DRS = MHI * [1 + alpha * ((R_cum - R_thresh) / R_thresh)]
    const surgeRatio = (rainfallMm - cal.rThresh) / cal.rThresh;
    drs = cal.mhi * (1 + cal.alpha * surgeRatio);
  }

  // Bound score between 5 and 100
  drs = Math.min(100, Math.max(5, Math.round(drs * 10) / 10));

  // Determine risk category & color
  let riskLevel: 'critical' | 'high' | 'medium' | 'low';
  let riskColor: string;

  if (drs >= 85) {
    riskLevel = 'critical';
    riskColor = '#B91C1C'; // Deep Crimson
  } else if (drs >= 70) {
    riskLevel = 'high';
    riskColor = '#DC2626'; // Red
  } else if (drs >= 45) {
    riskLevel = 'medium';
    riskColor = '#F59E0B'; // Amber
  } else {
    riskLevel = 'low';
    riskColor = '#10B981'; // Emerald Green
  }

  const percentageChange = Math.round(((drs - cal.mhi) / cal.mhi) * 100);

  return {
    zoneId: zone.id,
    baselineScore: cal.mhi,
    simulatedRainfallMm: rainfallMm,
    drs,
    riskLevel,
    riskColor,
    percentageChange,
    thresholdExceeded: rainfallMm > cal.rThresh,
    evacuationUrgent: drs >= 75,
  };
}

/**
 * Calculates DRS for all zones and returns them mapped by zone ID.
 */
export function calculateAllZonesDrs(
  zones: HazardZone[],
  rainfallMm: number
): Record<string, ZoneDynamicRisk> {
  const result: Record<string, ZoneDynamicRisk> = {};
  for (const zone of zones) {
    result[zone.id] = calculateZoneDrs(zone, rainfallMm);
  }
  return result;
}
