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

// Environmental calibration parameters per zone
export const ZONE_DRS_CALIBRATION: Record<string, ZoneDrsParameters> = {
  zone_wayanad: { mhi: 92, rThresh: 80, alpha: 1.40, soilSaturation: 0.88 }, // Landslide
  zone_yamuna: { mhi: 88, rThresh: 75, alpha: 1.25, soilSaturation: 0.80 }, // Flood
  zone_chellanam: { mhi: 90, rThresh: 70, alpha: 1.30, soilSaturation: 0.85 }, // Coastal Erosion
  zone_dharamshala: { mhi: 89, rThresh: 65, alpha: 1.45, soilSaturation: 0.75 }, // Cloudburst
  zone_joshimath: { mhi: 88, rThresh: 90, alpha: 1.20, soilSaturation: 0.70 }, // Landslide / Subsidence
  zone_majuli: { mhi: 74, rThresh: 85, alpha: 1.15, soilSaturation: 0.75 }, // Flood
  zone_kedarnath: { mhi: 72, rThresh: 60, alpha: 1.35, soilSaturation: 0.65 }, // Cloudburst
  zone_pentha: { mhi: 70, rThresh: 80, alpha: 1.10, soilSaturation: 0.68 }, // Coastal Erosion
  zone_poothkhurd: { mhi: 54, rThresh: 100, alpha: 0.95, soilSaturation: 0.50 }, // Landslide / Marginal
  zone_dwarka_safe: { mhi: 16, rThresh: 150, alpha: 0.50, soilSaturation: 0.25 }, // Safe Reception
  zone_meppadi_safe: { mhi: 14, rThresh: 180, alpha: 0.45, soilSaturation: 0.20 }, // Safe Reception
};

/**
 * Calculates the Dynamic Risk Score (DRS) for a specific zone under simulated 72h rainfall.
 * Formula: DRS = MHI * [1 + alpha * ((R_cum - R_thresh) / R_thresh)]
 */
export function calculateZoneDrs(
  zone: HazardZone,
  rainfallMm: number
): ZoneDynamicRisk {
  // Compute baseline MHI from 3-pillar evidence if available
  let computedMhi = 50;
  if (zone.hazardIntensity && zone.populationVulnerability && zone.disasterHistory) {
    const dScore = Math.min(100, zone.disasterHistory.recurrenceCount * 12);
    computedMhi = (0.40 * zone.hazardIntensity.score) + (0.35 * zone.populationVulnerability.sviScore) + (0.25 * dScore);
  } else if (zone.urgencyScore > 0) {
    computedMhi = zone.urgencyScore * 0.9;
  }

  const cal = ZONE_DRS_CALIBRATION[zone.id] || {
    mhi: computedMhi,
    rThresh: 85,
    alpha: 1.1,
    soilSaturation: 0.6,
  };

  const effectiveMhi = cal.mhi || computedMhi;

  let drs: number;

  if (rainfallMm <= 0) {
    drs = effectiveMhi;
  } else if (rainfallMm <= cal.rThresh) {
    // Sub-threshold rainfall: mild proportional moisture accumulation
    const subFactor = (rainfallMm / cal.rThresh) * 0.12 * cal.alpha;
    drs = effectiveMhi * (1 + subFactor);
  } else {
    // Formula: DRS = MHI * [1 + alpha * ((R_cum - R_thresh) / R_thresh)]
    const surgeRatio = (rainfallMm - cal.rThresh) / cal.rThresh;
    drs = effectiveMhi * (1 + cal.alpha * surgeRatio);
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
