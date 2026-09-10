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
// Curated safe candidate resettlement sites in proximity to monitored sectors
export const CANDIDATE_RESETTLEMENT_SITES: Record<string, ResettlementCandidateSite[]> = {
  zone_wayanad: [
    {
      id: 'site_wyn_01',
      name: 'Site Alpha - Meppadi Upland Resettlement Ridge',
      locationName: 'Meppadi South Basalt Plateau',
      coordinates: [11.5675, 76.1700],
      availableCapacity: 8500,
      slopeDegrees: 5.2,
      hazardDistanceKm: 6.5,
      roadDistanceKm: 0.8,
      waterLpcdCapacity: 155,
      healthCenterKm: 1.4,
      landAcquisitionCostLakhPerAcre: 35,
      rationale: 'Elevated basalt bedrock with zero debris flow history; meets MoHUA 135 LPCD potable water norm with direct access to SH-59.',
    },
    {
      id: 'site_wyn_02',
      name: 'Site Beta - Kalpetta East Greenfield',
      locationName: 'Kalpetta Municipal Forest Buffer',
      coordinates: [11.6050, 76.0850],
      availableCapacity: 12000,
      slopeDegrees: 6.8,
      hazardDistanceKm: 9.2,
      roadDistanceKm: 1.2,
      waterLpcdCapacity: 140,
      healthCenterKm: 2.1,
      landAcquisitionCostLakhPerAcre: 42,
      rationale: 'Gentle terraced slope with large absorption headroom, outside active landslide susceptibility zones.',
    },
    {
      id: 'site_wyn_03',
      name: 'Site Gamma - Sulthan Bathery Foothill Terraces',
      locationName: 'Ambalavayal East Shelf',
      coordinates: [11.6180, 76.2100],
      availableCapacity: 6500,
      slopeDegrees: 8.5,
      hazardDistanceKm: 14.0,
      roadDistanceKm: 1.8,
      waterLpcdCapacity: 130,
      healthCenterKm: 3.2,
      landAcquisitionCostLakhPerAcre: 28,
      rationale: 'Far buffer clearance from Western Ghats escarpment; requires feeder road expansion.',
    },
  ],
  zone_yamuna: [
    {
      id: 'site_del_01',
      name: 'Site Delta - Dwarka Integrated Eco-Township',
      locationName: 'Dwarka Sector 28 Transit Corridor',
      coordinates: [28.5610, 77.0660],
      availableCapacity: 14500,
      slopeDegrees: 2.1,
      hazardDistanceKm: 18.5,
      roadDistanceKm: 0.4,
      waterLpcdCapacity: 165,
      healthCenterKm: 0.9,
      landAcquisitionCostLakhPerAcre: 65,
      rationale: 'Completely outside Yamuna flood envelope. High-capacity municipal water mains and direct metro feeder.',
    },
    {
      id: 'site_del_02',
      name: 'Site Epsilon - Narela Phased Housing Complex',
      locationName: 'Narela North Ridge Highground',
      coordinates: [28.8450, 77.0980],
      availableCapacity: 8000,
      slopeDegrees: 1.8,
      hazardDistanceKm: 22.0,
      roadDistanceKm: 1.2,
      waterLpcdCapacity: 135,
      healthCenterKm: 2.4,
      landAcquisitionCostLakhPerAcre: 38,
      rationale: 'Pre-existing public housing infrastructure; requires sewer trunk line augmentation.',
    },
  ],
  zone_chellanam: [
    {
      id: 'site_chl_01',
      name: 'Site Zeta - Kochi Inland Rehabilitation Park',
      locationName: 'Puthencruz Highground Sector',
      coordinates: [9.9700, 76.4150],
      availableCapacity: 7500,
      slopeDegrees: 3.5,
      hazardDistanceKm: 16.0,
      roadDistanceKm: 0.9,
      waterLpcdCapacity: 150,
      healthCenterKm: 1.6,
      landAcquisitionCostLakhPerAcre: 48,
      rationale: 'Elevated laterite soil terrain 16km inland from eroding coast; immune to tidal overwash and storm surge.',
    },
    {
      id: 'site_chl_02',
      name: 'Site Eta - Tripunithura Hilltop Expansion',
      locationName: 'Thiruvankulam East Buffer',
      coordinates: [9.9450, 76.3680],
      availableCapacity: 5500,
      slopeDegrees: 4.2,
      hazardDistanceKm: 12.5,
      roadDistanceKm: 1.5,
      waterLpcdCapacity: 140,
      healthCenterKm: 2.0,
      landAcquisitionCostLakhPerAcre: 52,
      rationale: 'Safe bedrock foundation above high tide lines with established power and healthcare grid access.',
    },
  ],
  zone_dharamshala: [
    {
      id: 'site_dha_01',
      name: 'Site Theta - Kangra Valley Plateau Zone',
      locationName: 'Yol Cantonment South Buffer',
      coordinates: [32.1750, 76.3550],
      availableCapacity: 6000,
      slopeDegrees: 4.8,
      hazardDistanceKm: 7.2,
      roadDistanceKm: 0.7,
      waterLpcdCapacity: 145,
      healthCenterKm: 1.8,
      landAcquisitionCostLakhPerAcre: 32,
      rationale: 'Broad valley terrace outside steep mountain ravines; immune to cloudburst flash funneling.',
    },
  ],
  zone_joshimath: [
    {
      id: 'site_jos_01',
      name: 'Site Iota - Pipalkoti Model Township',
      locationName: 'Pipalkoti Basalt Shelf',
      coordinates: [30.4300, 79.4300],
      availableCapacity: 5000,
      slopeDegrees: 6.2,
      hazardDistanceKm: 18.0,
      roadDistanceKm: 0.5,
      waterLpcdCapacity: 140,
      healthCenterKm: 1.5,
      landAcquisitionCostLakhPerAcre: 26,
      rationale: 'Firm quartz-gneiss bedrock surveyed by Geological Survey of India; zero subsidence movement observed.',
    },
  ],
  zone_majuli: [
    {
      id: 'site_maj_01',
      name: 'Site Kappa - Jorhat North Highland Township',
      locationName: 'Jorhat Elevated Spur Sector 3',
      coordinates: [26.7800, 94.2200],
      availableCapacity: 16000,
      slopeDegrees: 2.4,
      hazardDistanceKm: 14.5,
      roadDistanceKm: 0.6,
      waterLpcdCapacity: 140,
      healthCenterKm: 1.3,
      landAcquisitionCostLakhPerAcre: 30,
      rationale: 'Flood-free mainland location with established state highway and medical college hospital in close range.',
    },
  ],
  zone_kedarnath: [
    {
      id: 'site_ked_01',
      name: 'Site Lambda - Guptkashi Stable Terraces',
      locationName: 'Guptkashi South Ridge',
      coordinates: [30.5200, 79.0800],
      availableCapacity: 5000,
      slopeDegrees: 8.5,
      hazardDistanceKm: 22.0,
      roadDistanceKm: 1.1,
      waterLpcdCapacity: 135,
      healthCenterKm: 2.2,
      landAcquisitionCostLakhPerAcre: 24,
      rationale: 'Surveyed stable terrace above Mandakini flood levels; provides year-round emergency access.',
    },
  ],
  zone_pentha: [
    {
      id: 'site_pen_01',
      name: 'Site Mu - Kendrapara Inland Rehabilitation Hub',
      locationName: 'Marshaghai Elevated Ward',
      coordinates: [20.4800, 86.6800],
      availableCapacity: 9500,
      slopeDegrees: 1.9,
      hazardDistanceKm: 15.0,
      roadDistanceKm: 0.8,
      waterLpcdCapacity: 145,
      healthCenterKm: 1.7,
      landAcquisitionCostLakhPerAcre: 25,
      rationale: 'Safe inland agricultural buffer outside 500m CRZ wave erosion hazard zone.',
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
  const sites = candidates || CANDIDATE_RESETTLEMENT_SITES[zone.id] || CANDIDATE_RESETTLEMENT_SITES['zone_wayanad'] || CANDIDATE_RESETTLEMENT_SITES['zone_yamuna'];

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
