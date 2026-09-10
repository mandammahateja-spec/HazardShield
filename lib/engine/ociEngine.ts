import { HazardZone } from '@/data/hazardZones';

export interface InfrastructureParameters {
  waterLpcd: number;           // Liters Per Capita per Day (Standard: 135)
  roadWidthMeters: number;     // Effective evacuation corridor width (meters)
  targetEvacHours: number;     // Allowable evacuation time window (hours)
  powerPerCapitaKw: number;    // Peak power demand per person (kW, default 0.35)
  sewerGenRatio: number;       // Ratio of water entering sewer system (default 0.8)
}

export interface ZoneInfrastructureProfile {
  zoneId: string;
  rcc: number;                 // Resource / Land carrying capacity (persons)
  waterSupplyMld: number;      // Million Liters per Day available
  sewerTreatmentMld: number;   // Sewage treatment MLD available
  powerSubstationMw: number;   // Grid substation peak capacity (MW)
  laneCount: number;           // Arterial lanes available
  baseEvacFlowRatePeopleHr: number; // Max safe hourly flow through chokepoints
}

export interface OciCalculationResult {
  zoneId: string;
  pActual: number;
  rcc: number;
  cWater: number;
  cSewer: number;
  cPower: number;
  cTransport: number;
  cEvac: number;
  ecc: number;                 // min of all capacities
  oci: number;                 // P_actual / ECC
  isOvercapacity: boolean;     // oci > 1.0
  limitingFactor: 'RCC' | 'Water' | 'Sewer' | 'Power' | 'Transport' | 'Evacuation';
  limitingFactorDescription: string;
  populationDeficit: number;   // P_actual - ECC (if > 0)
  percentOvercapacity: number; // (OCI - 1) * 100
}

export const DEFAULT_INFRASTRUCTURE_PARAMS: InfrastructureParameters = {
  waterLpcd: 135,
  roadWidthMeters: 7.0,
  targetEvacHours: 4.5,
  powerPerCapitaKw: 0.35,
  sewerGenRatio: 0.80,
};

// Base municipal infrastructure inventories for each monitored zone
export const ZONE_INFRASTRUCTURE_PROFILES: Record<string, ZoneInfrastructureProfile> = {
  zone_001: {
    zoneId: 'zone_001',
    rcc: 9000,
    waterSupplyMld: 1.4, // C_water = 1.4e6 / 135 = 10,370
    sewerTreatmentMld: 1.1, // C_sewer = 1.1e6 / 108 = 10,185
    powerSubstationMw: 4.2, // C_power = 4200 / 0.35 = 12,000
    laneCount: 2,
    baseEvacFlowRatePeopleHr: 1800, // C_evac = 1800 * 4.5 = 8,100 (Bottleneck!)
  },
  zone_002: {
    zoneId: 'zone_002',
    rcc: 8500,
    waterSupplyMld: 1.2,
    sewerTreatmentMld: 0.95,
    powerSubstationMw: 5.5,
    laneCount: 2,
    baseEvacFlowRatePeopleHr: 1600,
  },
  zone_003: {
    zoneId: 'zone_003',
    rcc: 10500,
    waterSupplyMld: 1.6,
    sewerTreatmentMld: 1.3,
    powerSubstationMw: 3.8,
    laneCount: 2,
    baseEvacFlowRatePeopleHr: 2400,
  },
  zone_004: {
    zoneId: 'zone_004',
    rcc: 9500,
    waterSupplyMld: 1.5,
    sewerTreatmentMld: 1.2,
    powerSubstationMw: 4.0,
    laneCount: 1.5,
    baseEvacFlowRatePeopleHr: 1400, // Very low bottleneck exit in delta
  },
  zone_005: {
    zoneId: 'zone_005',
    rcc: 8000,
    waterSupplyMld: 1.1,
    sewerTreatmentMld: 0.9,
    powerSubstationMw: 3.2,
    laneCount: 2,
    baseEvacFlowRatePeopleHr: 2000,
  },
  zone_006: {
    zoneId: 'zone_006',
    rcc: 5500,
    waterSupplyMld: 0.8,
    sewerTreatmentMld: 0.6,
    powerSubstationMw: 2.0,
    laneCount: 1,
    baseEvacFlowRatePeopleHr: 1100,
  },
  zone_007: {
    zoneId: 'zone_007',
    rcc: 8000,
    waterSupplyMld: 1.8,
    sewerTreatmentMld: 1.5,
    powerSubstationMw: 6.0,
    laneCount: 4,
    baseEvacFlowRatePeopleHr: 3600,
  },
  zone_008: {
    zoneId: 'zone_008',
    rcc: 9000,
    waterSupplyMld: 1.2,
    sewerTreatmentMld: 1.0,
    powerSubstationMw: 3.5,
    laneCount: 2,
    baseEvacFlowRatePeopleHr: 1750,
  },
};

/**
 * Computes the Overcapacity Index (OCI) using the full environmental carrying capacity formula:
 * OCI = P_actual / ECC
 * where ECC = min(RCC, C_water, C_sewer, C_power, C_transport, C_evac)
 */
export function calculateZoneOci(
  zone: HazardZone,
  params: InfrastructureParameters = DEFAULT_INFRASTRUCTURE_PARAMS
): OciCalculationResult {
  const profile = ZONE_INFRASTRUCTURE_PROFILES[zone.id] || {
    zoneId: zone.id,
    rcc: zone.carryingCapacity || 8000,
    waterSupplyMld: 1.2,
    sewerTreatmentMld: 1.0,
    powerSubstationMw: 3.5,
    laneCount: 2,
    baseEvacFlowRatePeopleHr: 1800,
  };

  const pActual = zone.population;

  // 1. Physical / Resource Carrying Capacity
  const rcc = profile.rcc;

  // 2. Water Supply Capacity: (MLD * 1,000,000 L) / LPCD
  const cWater = Math.floor((profile.waterSupplyMld * 1000000) / Math.max(20, params.waterLpcd));

  // 3. Sewer Capacity: (MLD * 1,000,000 L) / (sewerGenRatio * LPCD)
  const sewerLpcd = Math.max(15, params.waterLpcd * params.sewerGenRatio);
  const cSewer = Math.floor((profile.sewerTreatmentMld * 1000000) / sewerLpcd);

  // 4. Power Grid Capacity: (MW * 1000 kW) / (kW per capita)
  const cPower = Math.floor((profile.powerSubstationMw * 1000) / Math.max(0.05, params.powerPerCapitaKw));

  // 5. Transport Corridor Capacity: based on road width (pedestrians + transit vehicles/hr)
  // ~1,200 people/hr capacity per 3.5m lane width over 4-hour surge
  const effectiveLanes = Math.max(0.5, params.roadWidthMeters / 3.5);
  const cTransport = Math.floor(effectiveLanes * 1250 * params.targetEvacHours);

  // 6. Evacuation Capacity: actual network flow rate * target evacuation time window
  // Scale flow rate dynamically if road width is adjusted relative to standard 7m
  const roadWidthScale = Math.min(2.0, Math.max(0.4, params.roadWidthMeters / 7.0));
  const cEvac = Math.floor(profile.baseEvacFlowRatePeopleHr * roadWidthScale * params.targetEvacHours);

  // ECC is the strict MINIMUM of all sub-capacities (the limiting ecological/civil bottleneck)
  const capacityMap = [
    { type: 'RCC' as const, value: rcc, desc: 'Physical Land & Terrain Carrying Capacity' },
    { type: 'Water' as const, value: cWater, desc: `Water Supply Deficit (${params.waterLpcd} LPCD standard)` },
    { type: 'Sewer' as const, value: cSewer, desc: 'Sewage Treatment Plant Saturation' },
    { type: 'Power' as const, value: cPower, desc: 'Electrical Substation Peak Overload' },
    { type: 'Transport' as const, value: cTransport, desc: `Road Corridor Throughput (${params.roadWidthMeters}m width)` },
    { type: 'Evacuation' as const, value: cEvac, desc: `Evacuation Route Chokepoints (${params.targetEvacHours}h safe window)` },
  ];

  capacityMap.sort((a, b) => a.value - b.value);
  const lowest = capacityMap[0];
  const ecc = lowest.value;

  const rawOci = pActual / ecc;
  const oci = Math.round(rawOci * 100) / 100;
  const isOvercapacity = oci > 1.0;
  const populationDeficit = Math.max(0, pActual - ecc);
  const percentOvercapacity = Math.max(0, Math.round((oci - 1.0) * 100));

  return {
    zoneId: zone.id,
    pActual,
    rcc,
    cWater,
    cSewer,
    cPower,
    cTransport,
    cEvac,
    ecc,
    oci,
    isOvercapacity,
    limitingFactor: lowest.type,
    limitingFactorDescription: lowest.desc,
    populationDeficit,
    percentOvercapacity,
  };
}

/**
 * Calculates OCI for all zones.
 */
export function calculateAllZonesOci(
  zones: HazardZone[],
  params: InfrastructureParameters = DEFAULT_INFRASTRUCTURE_PARAMS
): Record<string, OciCalculationResult> {
  const result: Record<string, OciCalculationResult> = {};
  for (const zone of zones) {
    result[zone.id] = calculateZoneOci(zone, params);
  }
  return result;
}
