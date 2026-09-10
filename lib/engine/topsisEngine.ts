import { HazardZone } from '@/data/hazardZones';

export interface ResettlementCandidateSite {
  id: string;
  name: string;
  locationName: string;
  coordinates: [number, number];
  availableCapacity: number; // Headroom for incoming population
  slopeDegrees: number;      // Criteria 1: <15° is ideal (cost criterion, lower is better)
  hazardDistanceKm: number;  // Criteria 2: Distance from active flood/landslide line (benefit criterion, higher is better)
  roadDistanceKm: number;    // Criteria 3: Distance to arterial highway (cost criterion, lower is better)
  waterLpcdCapacity: number; // Criteria 4: Guaranteed water supply (benefit criterion, higher is better)
  healthCenterKm: number;    // Criteria 5: Distance to PHC/hospital (cost criterion, lower is better)
  landAcquisitionCostLakhPerAcre: number; // INR Lakh/acre
  rationale: string;
}

export interface TopsisRankedSite {
  site: ResettlementCandidateSite;
  rank: number;
  topsisScore: number;       // Relative closeness score (0.00 to 1.00)
  idealSeparation: number;   // Distance to ideal best S+
  nadirSeparation: number;   // Distance to ideal worst S-
  criteriaBreakdown: {
    name: string;
    value: string;
    scorePercent: number;    // 0 to 100 for visual bars
    isFavorable: boolean;
  }[];
  keyAdvantages: string[];
  keyChallenges: string[];
}

// Curated safe candidate resettlement sites in proximity to monitored sectors
export const CANDIDATE_RESETTLEMENT_SITES: Record<string, ResettlementCandidateSite[]> = {
  zone_001: [
    {
      id: 'site_101',
      name: 'Site Alpha - Highland Plateau',
      locationName: 'North Kurla Ridge Section 4',
      coordinates: [19.0880, 72.8620],
      availableCapacity: 9500,
      slopeDegrees: 6.5,
      hazardDistanceKm: 4.8,
      roadDistanceKm: 0.6,
      waterLpcdCapacity: 160,
      healthCenterKm: 1.2,
      landAcquisitionCostLakhPerAcre: 45,
      rationale: 'Elevated basalt bedrock with zero flooding history and direct bypass to Western Express.',
    },
    {
      id: 'site_102',
      name: 'Site Beta - Urban Extension Greenfield',
      locationName: 'Taloja Institutional Buffer',
      coordinates: [19.0620, 72.8400],
      availableCapacity: 14000,
      slopeDegrees: 4.0,
      hazardDistanceKm: 6.2,
      roadDistanceKm: 1.4,
      waterLpcdCapacity: 140,
      healthCenterKm: 2.8,
      landAcquisitionCostLakhPerAcre: 28,
      rationale: 'Flat parcel with large capacity headroom, moderate distance to arterial transit line.',
    },
    {
      id: 'site_103',
      name: 'Site Gamma - Valley Terrace East',
      locationName: 'Bhandup Foothill Step-2',
      coordinates: [19.0980, 72.8900],
      availableCapacity: 7200,
      slopeDegrees: 13.8,
      hazardDistanceKm: 2.1,
      roadDistanceKm: 2.2,
      waterLpcdCapacity: 120,
      healthCenterKm: 3.5,
      landAcquisitionCostLakhPerAcre: 22,
      rationale: 'Terraced slope near existing suburban amenities, but narrower road access.',
    },
  ],
  zone_004: [
    {
      id: 'site_401',
      name: 'Site Delta - Saltpan Reclaimed Mound',
      locationName: 'Kanjur Elevated Ring',
      coordinates: [19.1120, 72.9200],
      availableCapacity: 16000,
      slopeDegrees: 3.2,
      hazardDistanceKm: 5.5,
      roadDistanceKm: 0.8,
      waterLpcdCapacity: 175,
      healthCenterKm: 1.5,
      landAcquisitionCostLakhPerAcre: 50,
      rationale: 'Built on 5m raised stabilized fill outside storm surge reach with high-capacity municipal water mains.',
    },
    {
      id: 'site_402',
      name: 'Site Epsilon - Highground Forestry Edge',
      locationName: 'Mulund Uplands Sector 9',
      coordinates: [19.1240, 72.9450],
      availableCapacity: 8500,
      slopeDegrees: 9.0,
      hazardDistanceKm: 7.0,
      roadDistanceKm: 1.9,
      waterLpcdCapacity: 135,
      healthCenterKm: 2.2,
      landAcquisitionCostLakhPerAcre: 35,
      rationale: 'Well-drained upland terrain outside cyclone surge plain; requires spur road expansion.',
    },
  ],
};

/**
 * Executes multi-criteria TOPSIS scoring on candidate resettlement sites for a target zone.
 */
export function rankResettlementSitesTopsis(
  zone: HazardZone,
  candidates?: ResettlementCandidateSite[]
): TopsisRankedSite[] {
  const sites = candidates || CANDIDATE_RESETTLEMENT_SITES[zone.id] || CANDIDATE_RESETTLEMENT_SITES['zone_001'];

  if (!sites || sites.length === 0) return [];

  // Weights for criteria (Sum = 1.0)
  // Hazard Safety: 30%, Slope: 20%, Water: 20%, Road Access: 15%, Health Access: 15%
  const weights = {
    slope: 0.20,
    hazardDist: 0.30,
    roadDist: 0.15,
    water: 0.20,
    healthDist: 0.15,
  };

  // 1. Calculate norm denominators
  let sumSqSlope = 0;
  let sumSqHazard = 0;
  let sumSqRoad = 0;
  let sumSqWater = 0;
  let sumSqHealth = 0;

  for (const s of sites) {
    sumSqSlope += s.slopeDegrees ** 2;
    sumSqHazard += s.hazardDistanceKm ** 2;
    sumSqRoad += s.roadDistanceKm ** 2;
    sumSqWater += s.waterLpcdCapacity ** 2;
    sumSqHealth += s.healthCenterKm ** 2;
  }

  const normSlope = Math.sqrt(sumSqSlope) || 1;
  const normHazard = Math.sqrt(sumSqHazard) || 1;
  const normRoad = Math.sqrt(sumSqRoad) || 1;
  const normWater = Math.sqrt(sumSqWater) || 1;
  const normHealth = Math.sqrt(sumSqHealth) || 1;

  // 2. Weighted normalized values
  const weighted = sites.map((s) => ({
    site: s,
    vSlope: (s.slopeDegrees / normSlope) * weights.slope,
    vHazard: (s.hazardDistanceKm / normHazard) * weights.hazardDist,
    vRoad: (s.roadDistanceKm / normRoad) * weights.roadDist,
    vWater: (s.waterLpcdCapacity / normWater) * weights.water,
    vHealth: (s.healthCenterKm / normHealth) * weights.healthDist,
  }));

  // 3. Determine Ideal Best (A+) and Ideal Worst (A-)
  // Slope: lower is best
  // HazardDist: higher is best
  // RoadDist: lower is best
  // Water: higher is best
  // HealthDist: lower is best
  const idealBest = {
    slope: Math.min(...weighted.map((w) => w.vSlope)),
    hazard: Math.max(...weighted.map((w) => w.vHazard)),
    road: Math.min(...weighted.map((w) => w.vRoad)),
    water: Math.max(...weighted.map((w) => w.vWater)),
    health: Math.min(...weighted.map((w) => w.vHealth)),
  };

  const idealWorst = {
    slope: Math.max(...weighted.map((w) => w.vSlope)),
    hazard: Math.min(...weighted.map((w) => w.vHazard)),
    road: Math.max(...weighted.map((w) => w.vRoad)),
    water: Math.min(...weighted.map((w) => w.vWater)),
    health: Math.max(...weighted.map((w) => w.vHealth)),
  };

  // 4. Calculate Euclidean distances S+ and S-
  const scored = weighted.map((w) => {
    const sPlus = Math.sqrt(
      (w.vSlope - idealBest.slope) ** 2 +
      (w.vHazard - idealBest.hazard) ** 2 +
      (w.vRoad - idealBest.road) ** 2 +
      (w.vWater - idealBest.water) ** 2 +
      (w.vHealth - idealBest.health) ** 2
    );

    const sMinus = Math.sqrt(
      (w.vSlope - idealWorst.slope) ** 2 +
      (w.vHazard - idealWorst.hazard) ** 2 +
      (w.vRoad - idealWorst.road) ** 2 +
      (w.vWater - idealWorst.water) ** 2 +
      (w.vHealth - idealWorst.health) ** 2
    );

    // Closeness C_i = S- / (S+ + S-)
    const totalDist = sPlus + sMinus;
    const topsisScore = totalDist > 0 ? Math.round((sMinus / totalDist) * 100) / 100 : 0.5;

    const s = w.site;
    const criteriaBreakdown = [
      {
        name: 'Terrain Gradient (Slope)',
        value: `${s.slopeDegrees}° (<15° Safe)`,
        scorePercent: Math.max(10, Math.min(100, Math.round((1 - s.slopeDegrees / 20) * 100))),
        isFavorable: s.slopeDegrees <= 10,
      },
      {
        name: 'Hazard Buffer Clearance',
        value: `${s.hazardDistanceKm} km outside hazard zone`,
        scorePercent: Math.max(10, Math.min(100, Math.round((s.hazardDistanceKm / 8) * 100))),
        isFavorable: s.hazardDistanceKm >= 4.0,
      },
      {
        name: 'Road Network Proximity',
        value: `${s.roadDistanceKm} km to arterial highway`,
        scorePercent: Math.max(10, Math.min(100, Math.round((1 - s.roadDistanceKm / 3) * 100))),
        isFavorable: s.roadDistanceKm <= 1.0,
      },
      {
        name: 'Potable Water Assurance',
        value: `${s.waterLpcdCapacity} LPCD (${s.waterLpcdCapacity >= 135 ? 'Meets' : 'Below'} MoHUA norm)`,
        scorePercent: Math.max(10, Math.min(100, Math.round((s.waterLpcdCapacity / 180) * 100))),
        isFavorable: s.waterLpcdCapacity >= 135,
      },
      {
        name: 'Emergency Healthcare Access',
        value: `${s.healthCenterKm} km to Primary Health Centre`,
        scorePercent: Math.max(10, Math.min(100, Math.round((1 - s.healthCenterKm / 5) * 100))),
        isFavorable: s.healthCenterKm <= 2.0,
      },
    ];

    const keyAdvantages: string[] = [];
    const keyChallenges: string[] = [];

    if (s.slopeDegrees < 8) keyAdvantages.push(`Gentle ${s.slopeDegrees}° terrain minimizes landslide cut-and-fill`);
    if (s.hazardDistanceKm > 4.5) keyAdvantages.push(`Substantial ${s.hazardDistanceKm}km buffer beyond hazard footprint`);
    if (s.waterLpcdCapacity >= 140) keyAdvantages.push(`High water security: ${s.waterLpcdCapacity} LPCD exceeds MoHUA benchmarks`);

    if (s.roadDistanceKm > 1.2) keyChallenges.push(`Requires ${s.roadDistanceKm}km transit feeder road upgrading`);
    if (s.slopeDegrees > 12) keyChallenges.push(`Steeper terracing required (${s.slopeDegrees}° slope)`);
    if (s.healthCenterKm > 2.5) keyChallenges.push(`PHC healthcare dispatch distance exceeds 2.5km`);

    return {
      site: s,
      rank: 0,
      topsisScore,
      idealSeparation: Math.round(sPlus * 1000) / 1000,
      nadirSeparation: Math.round(sMinus * 1000) / 1000,
      criteriaBreakdown,
      keyAdvantages,
      keyChallenges,
    };
  });

  // Sort descending by TOPSIS score
  scored.sort((a, b) => b.topsisScore - a.topsisScore);

  // Assign ranks
  scored.forEach((item, index) => {
    item.rank = index + 1;
  });

  return scored;
}
