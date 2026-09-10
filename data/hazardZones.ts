export type HazardType = 'landslide' | 'flood' | 'coastal_erosion' | 'cloudburst' | 'earthquake' | 'cyclone';
export type RelocationTier = 'immediate' | 'short_term' | 'medium_term' | 'monitoring';

export interface HazardIntensity {
  value: number;
  unit: string;
  score: number; // 0-100
  metricName: string;
}

export interface PopulationVulnerability {
  sviScore: number; // 0-100
  kutchaHousingPercent: number;
  vulnerablePop: number;
  dependencyRatio: number;
}

export interface DisasterHistory {
  recurrenceCount: number;
  returnPeriodYears: number;
  pastEvents: string[];
  cumulativeDisplaced: number;
  lastMajorEventYear: number;
}

export interface RedZoneStatus {
  isRedZone: boolean;
  declaredDate: string;
  gazetteRef: string;
  unsuitableForHabitation: boolean;
  prohibitionClause: string;
}

export interface HazardZone {
  id: string;
  name: string;
  state: string;
  district: string;
  coordinates: [number, number]; // [lat, lng]
  hazardType: HazardType;
  riskLevel: 'high' | 'medium' | 'low';
  population: number;
  carryingCapacity: number;
  lastUpdated: string;
  urgencyScore: number;
  relocationTier: RelocationTier;
  timelineEstimate: string;
  reason: string;
  polygon?: [number, number][];
  hazardIntensity: HazardIntensity;
  populationVulnerability: PopulationVulnerability;
  disasterHistory: DisasterHistory;
  redZoneStatus: RedZoneStatus;
  limitingFactor?: string;
  recommendedCorridor?: string;
}

export const hazardZonesData: HazardZone[] = [
  {
    id: 'zone_wayanad',
    name: 'Chooralmala & Meppadi Habitation',
    state: 'Kerala',
    district: 'Wayanad',
    coordinates: [11.5380, 76.1300],
    hazardType: 'landslide',
    riskLevel: 'high',
    population: 14800,
    carryingCapacity: 6500,
    lastUpdated: '2024-09-08',
    urgencyScore: 98,
    relocationTier: 'immediate',
    timelineEstimate: '< 30 Days',
    reason: 'Critical debris flow collapse and severe slope shear failure. Overcapacity by 127%. Declared Red Zone.',
    polygon: [
      [11.5300, 76.1200],
      [11.5480, 76.1200],
      [11.5480, 76.1400],
      [11.5300, 76.1400],
    ],
    hazardIntensity: {
      value: 372,
      unit: 'mm/48hr rainfall',
      score: 98,
      metricName: 'Extreme Monsoonal Rainfall & Saturated Soil Shear',
    },
    populationVulnerability: {
      sviScore: 82,
      kutchaHousingPercent: 60,
      vulnerablePop: 8880,
      dependencyRatio: 44,
    },
    disasterHistory: {
      recurrenceCount: 4,
      returnPeriodYears: 2,
      pastEvents: ['2024 Chooralmala Debris Surge', '2020 Puthumala Landslide'],
      cumulativeDisplaced: 12500,
      lastMajorEventYear: 2024,
    },
    redZoneStatus: {
      isRedZone: true,
      declaredDate: '2024-07-30',
      gazetteRef: 'KSDMA/LS/2024/WZ-01',
      unsuitableForHabitation: true,
      prohibitionClause: 'Section 34(b) Disaster Management Act 2005 - Total Inhabitant Relocation Mandated',
    },
    limitingFactor: 'Debris Flow Velocity & Slope Stability',
    recommendedCorridor: 'Meppadi Upland Resettlement Ridge (Safe Corridor A)',
  },
  {
    id: 'zone_yamuna',
    name: 'Yamuna Bank Floodplain Settlement',
    state: 'Delhi (NCT)',
    district: 'East Delhi',
    coordinates: [28.6150, 77.2680],
    hazardType: 'flood',
    riskLevel: 'high',
    population: 32000,
    carryingCapacity: 25000,
    lastUpdated: '2024-09-07',
    urgencyScore: 95,
    relocationTier: 'immediate',
    timelineEstimate: '< 30 Days',
    reason: 'Severe riverbed overtopping breaches active flood protection embankments. Chronic flood line breach.',
    polygon: [
      [28.6100, 77.2600],
      [28.6200, 77.2600],
      [28.6200, 77.2750],
      [28.6100, 77.2750],
    ],
    hazardIntensity: {
      value: 208.66,
      unit: 'meters river gauge (Danger: 205.33m)',
      score: 92,
      metricName: 'Hathnikund Peak Discharge Runoff',
    },
    populationVulnerability: {
      sviScore: 84,
      kutchaHousingPercent: 68,
      vulnerablePop: 21760,
      dependencyRatio: 48,
    },
    disasterHistory: {
      recurrenceCount: 6,
      returnPeriodYears: 1,
      pastEvents: ['2023 Yamuna Peak Spill (208.66m)', '2019 Monsoon Breach'],
      cumulativeDisplaced: 28000,
      lastMajorEventYear: 2023,
    },
    redZoneStatus: {
      isRedZone: true,
      declaredDate: '2024-05-10',
      gazetteRef: 'DDMA/FLD/2024/09',
      unsuitableForHabitation: true,
      prohibitionClause: 'National Green Tribunal Riverbed Inhabitation Prohibition Order 2015',
    },
    limitingFactor: 'Drainage Discharge Capacity',
    recommendedCorridor: 'Dwarka Integrated Eco-Township Corridor',
  },
  {
    id: 'zone_chellanam',
    name: 'Chellanam Coastal Hamlet',
    state: 'Kerala',
    district: 'Ernakulam',
    coordinates: [9.8080, 76.2720],
    hazardType: 'coastal_erosion',
    riskLevel: 'high',
    population: 12000,
    carryingCapacity: 6000,
    lastUpdated: '2024-09-06',
    urgencyScore: 94,
    relocationTier: 'immediate',
    timelineEstimate: '< 30 Days',
    reason: 'Uncontrolled coastal erosion with 4.2m/year shoreline retreat. Chronic tidal overwash.',
    polygon: [
      [9.8000, 76.2650],
      [9.8150, 76.2650],
      [9.8150, 76.2800],
      [9.8000, 76.2800],
    ],
    hazardIntensity: {
      value: 4.2,
      unit: 'meters/year shoreline loss',
      score: 92,
      metricName: 'Wave Energy & Sea-Wall Inundation Scour',
    },
    populationVulnerability: {
      sviScore: 80,
      kutchaHousingPercent: 55,
      vulnerablePop: 6600,
      dependencyRatio: 42,
    },
    disasterHistory: {
      recurrenceCount: 8,
      returnPeriodYears: 1,
      pastEvents: ['2023 Cyclone Biparjoy Swell', '2021 Cyclone Tauktae Surge'],
      cumulativeDisplaced: 11000,
      lastMajorEventYear: 2023,
    },
    redZoneStatus: {
      isRedZone: true,
      declaredDate: '2024-04-18',
      gazetteRef: 'KSDMA/COAST/2024/07',
      unsuitableForHabitation: true,
      prohibitionClause: 'Coastal Regulation Zone (CRZ-IA) Non-Habitable Hazard Line',
    },
    limitingFactor: 'Sea-Wall Inundation & Wave Surge',
    recommendedCorridor: 'Kochi Inland Rehabilitation Park (Puthencruz Sector)',
  },
  {
    id: 'zone_dharamshala',
    name: 'Dharamshala Kangra Ravine Sector',
    state: 'Himachal Pradesh',
    district: 'Kangra',
    coordinates: [32.2180, 76.3200],
    hazardType: 'cloudburst',
    riskLevel: 'high',
    population: 7200,
    carryingCapacity: 3800,
    lastUpdated: '2024-09-05',
    urgencyScore: 93,
    relocationTier: 'immediate',
    timelineEstimate: '< 30 Days',
    reason: 'High-velocity cloudburst ravine path. Funneling flash torrents threaten habitations on steep banks.',
    polygon: [
      [32.2100, 76.3100],
      [32.2250, 76.3100],
      [32.2250, 76.3300],
      [32.2100, 76.3300],
    ],
    hazardIntensity: {
      value: 112,
      unit: 'mm/hour cloudburst intensity',
      score: 95,
      metricName: 'Sudden Orograpic Convective Precipitation',
    },
    populationVulnerability: {
      sviScore: 72,
      kutchaHousingPercent: 42,
      vulnerablePop: 3024,
      dependencyRatio: 38,
    },
    disasterHistory: {
      recurrenceCount: 4,
      returnPeriodYears: 2,
      pastEvents: ['2023 Beas Basin Cloudburst', '2021 Bhagsunag Flash Torrent'],
      cumulativeDisplaced: 6200,
      lastMajorEventYear: 2023,
    },
    redZoneStatus: {
      isRedZone: true,
      declaredDate: '2024-08-05',
      gazetteRef: 'HPSDMA/CB/2024/05',
      unsuitableForHabitation: true,
      prohibitionClause: 'Section 34 DM Act Flash Flood Ravine Demarcation',
    },
    limitingFactor: 'Flash Flood Gorge Chokepoint',
    recommendedCorridor: 'Kangra Valley Plateau Resettlement Zone (Yol Buffer)',
  },
  {
    id: 'zone_joshimath',
    name: 'Joshimath Subsidence Ward 4',
    state: 'Uttarakhand',
    district: 'Chamoli',
    coordinates: [30.5580, 79.5600],
    hazardType: 'landslide',
    riskLevel: 'high',
    population: 9400,
    carryingCapacity: 4500,
    lastUpdated: '2024-09-04',
    urgencyScore: 91,
    relocationTier: 'immediate',
    timelineEstimate: '< 30 Days',
    reason: 'Deep-seated tectonic slope subsidence with active bedrock fissures. Unsuitable for permanent structures.',
    polygon: [
      [30.5500, 79.5500],
      [30.5650, 79.5500],
      [30.5650, 79.5700],
      [30.5500, 79.5700],
    ],
    hazardIntensity: {
      value: 55,
      unit: 'mm/year InSAR subsidence velocity',
      score: 94,
      metricName: 'Interferometric Synthetic Aperture Radar (InSAR) Subsidence Rate',
    },
    populationVulnerability: {
      sviScore: 78,
      kutchaHousingPercent: 50,
      vulnerablePop: 4700,
      dependencyRatio: 40,
    },
    disasterHistory: {
      recurrenceCount: 5,
      returnPeriodYears: 1,
      pastEvents: ['2023 Aquifer Puncture Cracks', '2021 Dhauliganga Flash Surge'],
      cumulativeDisplaced: 5200,
      lastMajorEventYear: 2023,
    },
    redZoneStatus: {
      isRedZone: true,
      declaredDate: '2023-01-15',
      gazetteRef: 'USDMA/SUB/2023/02',
      unsuitableForHabitation: true,
      prohibitionClause: 'Central Building Research Institute (CBRI) Unsafe Habitation Evacuation Notice',
    },
    limitingFactor: 'Bedrock Fissures & Bearing Failure',
    recommendedCorridor: 'Pipalkoti Resettlement Model Township',
  },
  {
    id: 'zone_majuli',
    name: 'Majuli River Island Floodplain',
    state: 'Assam',
    district: 'Majuli',
    coordinates: [26.9320, 94.1650],
    hazardType: 'flood',
    riskLevel: 'high',
    population: 21000,
    carryingCapacity: 14000,
    lastUpdated: '2024-09-02',
    urgencyScore: 78,
    relocationTier: 'short_term',
    timelineEstimate: '1 - 6 Months',
    reason: 'Severe annual Brahmaputra bankline erosion and monsoonal submergence. Pre-monsoon planned relocation.',
    polygon: [
      [26.9200, 94.1500],
      [26.9450, 94.1500],
      [26.9450, 94.1800],
      [26.9200, 94.1800],
    ],
    hazardIntensity: {
      value: 24000,
      unit: 'cumec runoff',
      score: 86,
      metricName: 'Brahmaputra Peak Monsoon Discharge',
    },
    populationVulnerability: {
      sviScore: 85,
      kutchaHousingPercent: 75,
      vulnerablePop: 15750,
      dependencyRatio: 46,
    },
    disasterHistory: {
      recurrenceCount: 12,
      returnPeriodYears: 1,
      pastEvents: ['2022 Assam Flood Inundation', '2020 Severe Embankment Cut'],
      cumulativeDisplaced: 35000,
      lastMajorEventYear: 2024,
    },
    redZoneStatus: {
      isRedZone: true,
      declaredDate: '2024-06-12',
      gazetteRef: 'ASDMA/BRAH/2024/11',
      unsuitableForHabitation: true,
      prohibitionClause: 'Assam River Island Safety Accord - Pre-Monsoon Evacuation Protocol',
    },
    limitingFactor: 'Brahmaputra Bank Siltation Deficit',
    recommendedCorridor: 'Jorhat North Highland Township',
  },
  {
    id: 'zone_kedarnath',
    name: 'Kedarnath Valley Tributary Habitation',
    state: 'Uttarakhand',
    district: 'Rudraprayag',
    coordinates: [30.7330, 79.0650],
    hazardType: 'cloudburst',
    riskLevel: 'high',
    population: 5800,
    carryingCapacity: 4000,
    lastUpdated: '2024-09-01',
    urgencyScore: 74,
    relocationTier: 'short_term',
    timelineEstimate: '1 - 6 Months',
    reason: 'Narrow glacial gorge susceptible to cloudburst debris surges. Short-term relocation ahead of seasonal rains.',
    polygon: [
      [30.7250, 79.0550],
      [30.7420, 79.0550],
      [30.7420, 79.0750],
      [30.7250, 79.0750],
    ],
    hazardIntensity: {
      value: 98,
      unit: 'mm/hour cloudburst rate',
      score: 89,
      metricName: 'High-Altitude Flash Cloudburst Discharge',
    },
    populationVulnerability: {
      sviScore: 74,
      kutchaHousingPercent: 48,
      vulnerablePop: 2784,
      dependencyRatio: 36,
    },
    disasterHistory: {
      recurrenceCount: 7,
      returnPeriodYears: 3,
      pastEvents: ['2024 Mandakini Flash Surge', '2013 Chorbari Glacial Breach'],
      cumulativeDisplaced: 8900,
      lastMajorEventYear: 2024,
    },
    redZoneStatus: {
      isRedZone: true,
      declaredDate: '2024-07-28',
      gazetteRef: 'USDMA/CB/2024/08',
      unsuitableForHabitation: true,
      prohibitionClause: 'Section 34 Mandakini Fluvial Flood Plain Restriction',
    },
    limitingFactor: 'Glacial Outflow Chokepoints',
    recommendedCorridor: 'Guptkashi Stable Terraces (Class B Site)',
  },
  {
    id: 'zone_pentha',
    name: 'Pentha Beach Sea-Wall Breach Zone',
    state: 'Odisha',
    district: 'Kendrapara',
    coordinates: [20.5290, 86.8500],
    hazardType: 'coastal_erosion',
    riskLevel: 'high',
    population: 11000,
    carryingCapacity: 8000,
    lastUpdated: '2024-09-03',
    urgencyScore: 72,
    relocationTier: 'short_term',
    timelineEstimate: '1 - 6 Months',
    reason: 'Geotube seawall structural failure from chronic cyclonic storm surge. Pre-emptive resettlement scheduled.',
    polygon: [
      [20.5200, 86.8400],
      [20.5380, 86.8400],
      [20.5380, 86.8600],
      [20.5200, 86.8600],
    ],
    hazardIntensity: {
      value: 3.8,
      unit: 'meters/year wave scouring',
      score: 85,
      metricName: 'Bay of Bengal Cyclonic Wave Energy',
    },
    populationVulnerability: {
      sviScore: 76,
      kutchaHousingPercent: 62,
      vulnerablePop: 6820,
      dependencyRatio: 41,
    },
    disasterHistory: {
      recurrenceCount: 6,
      returnPeriodYears: 2,
      pastEvents: ['2021 Cyclone Yaas Surge', '2019 Cyclone Fani Overwash'],
      cumulativeDisplaced: 8500,
      lastMajorEventYear: 2021,
    },
    redZoneStatus: {
      isRedZone: true,
      declaredDate: '2024-05-22',
      gazetteRef: 'OSDMA/EROS/2024/03',
      unsuitableForHabitation: true,
      prohibitionClause: 'Odisha State Coastal Disaster Mitigation Mandate',
    },
    limitingFactor: 'Geotube Embankment Subsidence',
    recommendedCorridor: 'Kendrapara Inland Rehabilitation Hub',
  },
  {
    id: 'zone_poothkhurd',
    name: 'Pooth Khurd Settlement',
    state: 'Delhi (NCT)',
    district: 'North West Delhi',
    coordinates: [28.7200, 77.0800],
    hazardType: 'landslide',
    riskLevel: 'medium',
    population: 24000,
    carryingCapacity: 22000,
    lastUpdated: '2024-09-03',
    urgencyScore: 56,
    relocationTier: 'medium_term',
    timelineEstimate: '6 - 24 Months',
    reason: 'Marginal ridge slope instability and population reaching ecological carrying capacity.',
    polygon: [
      [28.7140, 77.0720],
      [28.7260, 77.0720],
      [28.7260, 77.0880],
      [28.7140, 77.0880],
    ],
    hazardIntensity: {
      value: 45,
      unit: 'slope shear index',
      score: 55,
      metricName: 'Low-Gradient Terrain Shear',
    },
    populationVulnerability: {
      sviScore: 52,
      kutchaHousingPercent: 35,
      vulnerablePop: 8400,
      dependencyRatio: 30,
    },
    disasterHistory: {
      recurrenceCount: 2,
      returnPeriodYears: 5,
      pastEvents: ['2018 Embankment Crack'],
      cumulativeDisplaced: 1200,
      lastMajorEventYear: 2018,
    },
    redZoneStatus: {
      isRedZone: false,
      declaredDate: '',
      gazetteRef: '',
      unsuitableForHabitation: false,
      prohibitionClause: '',
    },
    limitingFactor: 'Slope Stability & Subsidence',
    recommendedCorridor: 'Rohini Sector 36 Urban Extension',
  },
  {
    id: 'zone_dwarka_safe',
    name: 'Dwarka Integrated Eco-Township Corridor',
    state: 'Delhi (NCT)',
    district: 'South West Delhi',
    coordinates: [28.5610, 77.0660],
    hazardType: 'flood',
    riskLevel: 'low',
    population: 8000,
    carryingCapacity: 25000,
    lastUpdated: '2024-09-01',
    urgencyScore: 16,
    relocationTier: 'monitoring',
    timelineEstimate: 'Stable / Monitoring',
    reason: 'Designated safe reception site. Natural stormwater channels and high reception headroom.',
    polygon: [
      [28.5550, 77.0580],
      [28.5670, 77.0580],
      [28.5670, 77.0740],
      [28.5550, 77.0740],
    ],
    hazardIntensity: {
      value: 12,
      unit: 'discharge index',
      score: 15,
      metricName: 'Adequate Storm Drainage Gradient',
    },
    populationVulnerability: {
      sviScore: 25,
      kutchaHousingPercent: 8,
      vulnerablePop: 640,
      dependencyRatio: 22,
    },
    disasterHistory: {
      recurrenceCount: 0,
      returnPeriodYears: 50,
      pastEvents: [],
      cumulativeDisplaced: 0,
      lastMajorEventYear: 0,
    },
    redZoneStatus: {
      isRedZone: false,
      declaredDate: '',
      gazetteRef: '',
      unsuitableForHabitation: false,
      prohibitionClause: '',
    },
    limitingFactor: 'None - Prime Reception Zone',
    recommendedCorridor: 'N/A (Recipient Zone)',
  },
  {
    id: 'zone_meppadi_safe',
    name: 'Meppadi Upland Resettlement Ridge',
    state: 'Kerala',
    district: 'Wayanad',
    coordinates: [11.5675, 76.1700],
    hazardType: 'landslide',
    riskLevel: 'low',
    population: 3200,
    carryingCapacity: 14000,
    lastUpdated: '2024-09-01',
    urgencyScore: 14,
    relocationTier: 'monitoring',
    timelineEstimate: 'Stable / Monitoring',
    reason: 'Designated safe basalt plateau with 5.2° slope and zero landslide history. 10,800 headroom capacity.',
    polygon: [
      [11.5600, 76.1600],
      [11.5750, 76.1600],
      [11.5750, 76.1800],
      [11.5600, 76.1800],
    ],
    hazardIntensity: {
      value: 10,
      unit: 'stability index',
      score: 12,
      metricName: 'Basalt Bedrock Ground Stability',
    },
    populationVulnerability: {
      sviScore: 20,
      kutchaHousingPercent: 5,
      vulnerablePop: 160,
      dependencyRatio: 20,
    },
    disasterHistory: {
      recurrenceCount: 0,
      returnPeriodYears: 50,
      pastEvents: [],
      cumulativeDisplaced: 0,
      lastMajorEventYear: 0,
    },
    redZoneStatus: {
      isRedZone: false,
      declaredDate: '',
      gazetteRef: '',
      unsuitableForHabitation: false,
      prohibitionClause: '',
    },
    limitingFactor: 'None - Prime Reception Zone',
    recommendedCorridor: 'N/A (Recipient Zone)',
  }
];

export interface MockReport {
  id: string;
  title: string;
  date: string;
  zones: number;
  highRiskZones: number;
  format: string;
}

export const mockReports: MockReport[] = [
  {
    id: 'rep_001',
    title: 'SDMA Multi-Hazard Red Zone Gazette & Resettlement Audit',
    date: '2024-09-08',
    zones: 11,
    highRiskZones: 8,
    format: 'PDF',
  },
  {
    id: 'rep_002',
    title: 'Wayanad & Joshimath Slope Stability & InSAR Analysis',
    date: '2024-09-05',
    zones: 4,
    highRiskZones: 3,
    format: 'PDF',
  },
  {
    id: 'rep_003',
    title: 'Coastal Erosion & Cloudburst Evacuation Corridor Dossier',
    date: '2024-09-01',
    zones: 6,
    highRiskZones: 5,
    format: 'CSV',
  },
];
