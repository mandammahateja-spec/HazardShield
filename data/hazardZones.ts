export interface HazardZone {
  id: string;
  name: string;
  coordinates: [number, number];
  hazardType: 'earthquake' | 'flood' | 'landslide' | 'cyclone';
  riskLevel: 'high' | 'medium' | 'low';
  population: number;
  carryingCapacity: number;
  lastUpdated: string;
  urgencyScore: number;
  reason: string;
  polygon?: [number, number][];
}

export const hazardZonesData: HazardZone[] = [
  {
    id: 'zone_001',
    name: 'Coastal Settlement Alpha',
    coordinates: [19.0760, 72.8777],
    hazardType: 'flood',
    riskLevel: 'high',
    population: 15000,
    carryingCapacity: 8000,
    lastUpdated: '2024-09-03',
    urgencyScore: 95,
    reason: 'Population exceeds carrying capacity by 87%',
    polygon: [
      [19.0700, 72.8700],
      [19.0820, 72.8700],
      [19.0820, 72.8850],
      [19.0700, 72.8850],
    ],
  },
  {
    id: 'zone_002',
    name: 'Highland Industrial Zone',
    coordinates: [19.1200, 72.8450],
    hazardType: 'earthquake',
    riskLevel: 'high',
    population: 12500,
    carryingCapacity: 7000,
    lastUpdated: '2024-09-02',
    urgencyScore: 88,
    reason: 'Seismic zone with dense population',
    polygon: [
      [19.1100, 72.8350],
      [19.1300, 72.8350],
      [19.1300, 72.8550],
      [19.1100, 72.8550],
    ],
  },
  {
    id: 'zone_003',
    name: 'Valley Settlement Beta',
    coordinates: [19.0500, 72.9000],
    hazardType: 'landslide',
    riskLevel: 'medium',
    population: 8500,
    carryingCapacity: 10000,
    lastUpdated: '2024-09-03',
    urgencyScore: 62,
    reason: 'Geological instability in monsoon season',
    polygon: [
      [19.0400, 72.8900],
      [19.0600, 72.8900],
      [19.0600, 72.9100],
      [19.0400, 72.9100],
    ],
  },
  {
    id: 'zone_004',
    name: 'Mangrove Delta Region',
    coordinates: [19.0900, 72.9300],
    hazardType: 'cyclone',
    riskLevel: 'high',
    population: 18000,
    carryingCapacity: 9000,
    lastUpdated: '2024-09-01',
    urgencyScore: 92,
    reason: 'Cyclone-prone with overcrowded settlements',
    polygon: [
      [19.0800, 72.9200],
      [19.1000, 72.9200],
      [19.1000, 72.9400],
      [19.0800, 72.9400],
    ],
  },
  {
    id: 'zone_005',
    name: 'Urban Extension Zone',
    coordinates: [19.0350, 72.8600],
    hazardType: 'flood',
    riskLevel: 'medium',
    population: 6000,
    carryingCapacity: 7500,
    lastUpdated: '2024-09-03',
    urgencyScore: 45,
    reason: 'Near riverbed with seasonal flooding risk',
    polygon: [
      [19.0250, 72.8500],
      [19.0450, 72.8500],
      [19.0450, 72.8700],
      [19.0250, 72.8700],
    ],
  },
  {
    id: 'zone_006',
    name: 'Mountain Village Cluster',
    coordinates: [19.1450, 72.8300],
    hazardType: 'earthquake',
    riskLevel: 'low',
    population: 3200,
    carryingCapacity: 5000,
    lastUpdated: '2024-09-02',
    urgencyScore: 28,
    reason: 'Low hazard risk with moderate population',
    polygon: [
      [19.1350, 72.8200],
      [19.1550, 72.8200],
      [19.1550, 72.8400],
      [19.1350, 72.8400],
    ],
  },
  {
    id: 'zone_007',
    name: 'Tech Park Area',
    coordinates: [19.0650, 72.8250],
    hazardType: 'flood',
    riskLevel: 'low',
    population: 4500,
    carryingCapacity: 6500,
    lastUpdated: '2024-09-03',
    urgencyScore: 32,
    reason: 'Well-developed infrastructure with low risk',
    polygon: [
      [19.0550, 72.8150],
      [19.0750, 72.8150],
      [19.0750, 72.8350],
      [19.0550, 72.8350],
    ],
  },
  {
    id: 'zone_008',
    name: 'Riverside Community',
    coordinates: [19.1100, 72.8850],
    hazardType: 'landslide',
    riskLevel: 'medium',
    population: 7200,
    carryingCapacity: 8500,
    lastUpdated: '2024-09-01',
    urgencyScore: 51,
    reason: 'Steep terrain with moderate instability',
    polygon: [
      [19.1000, 72.8750],
      [19.1200, 72.8750],
      [19.1200, 72.8950],
      [19.1000, 72.8950],
    ],
  },
];

export const mockReports = [
  {
    id: 'report_001',
    date: '2024-09-03',
    title: 'Weekly Hazard Assessment Report',
    zones: 8,
    highRiskZones: 3,
    totalPopulation: 74900,
    populationAtRisk: 45500,
  },
  {
    id: 'report_002',
    date: '2024-08-27',
    title: 'Monthly Risk Review',
    zones: 8,
    highRiskZones: 3,
    totalPopulation: 74900,
    populationAtRisk: 45500,
  },
];
