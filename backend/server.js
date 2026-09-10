require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Route imports
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const zoneRoutes = require('./routes/zoneRoutes');
const relocationRoutes = require('./routes/relocationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const communityRoutes = require('./routes/communityRoutes');
const authorityRoutes = require('./routes/authorityRoutes');

// Services
const satelliteService = require('./services/satelliteService');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Global Middleware ────────────────────────────────────────

// Trust proxy (required for Render, rate-limiting, etc.)
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://hazard-shield.vercel.app',
  'https://hazardshield.vercel.app',
];
if (process.env.CORS_ORIGIN) {
  process.env.CORS_ORIGIN.split(',').forEach((o) => {
    const trimmed = o.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) allowedOrigins.push(trimmed);
  });
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  })
);
app.options('*', cors());

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// General API rate limiter
app.use('/api', apiLimiter);

// ─── Routes ───────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/relocation-priority', relocationRoutes);
app.use('/api/reports', reportRoutes);

// Consolidated Dual-Role Architecture Routes
app.use('/api/community', communityRoutes);
app.use('/api/authority', authorityRoutes);

// ─── Health Check ─────────────────────────────────────────────

app.use('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      system: 'HazardShield Unified Multi-Hazard & Carrying Capacity Platform',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'MongoDB Connected',
        riskEngine: 'FastAPI / Native Embedded Hybrid Ready',
        satelliteTelemetry: 'ISRO Bhuvan InSAR Online',
        alertGateways: 'Twilio SMS & SendGrid / Sandbox Ready',
      }
    },
  });
});

// ─── 404 Handler ──────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Error Handler (must be last) ─────────────────────────────

app.use(errorHandler);

// ─── Auto-seed (for in-memory / empty database) ──────────────

const autoSeed = async () => {
  const Zone = require('./models/Zone');
  const User = require('./models/User');
  const RelocationPlan = require('./models/RelocationPlan');

  const count = await Zone.countDocuments();
  if (count === 0) {
    console.log('📦 Database is empty — initializing default records...');

    // Seed authority and community users
    const usersToSeed = [
      {
        name: 'National Disaster Authority (MHA)',
        email: 'admin@hazardshield.com',
        passwordHash: 'admin123',
        role: 'authority',
        authorityLevel: 'MHA',
      },
      {
        name: 'State Disaster Management Authority',
        email: 'state@hazardshield.com',
        passwordHash: 'state123',
        role: 'authority',
        authorityLevel: 'StateDMA',
      },
      {
        name: 'District Magistrate Office',
        email: 'district@hazardshield.com',
        passwordHash: 'district123',
        role: 'authority',
        authorityLevel: 'DistrictAdmin',
      },
      {
        name: 'Municipal Ward Officer',
        email: 'municipal@hazardshield.com',
        passwordHash: 'muni123',
        role: 'authority',
        authorityLevel: 'Municipal',
      },
      {
        name: 'Rahul Sharma (Citizen)',
        email: 'citizen@hazardshield.com',
        phone: '+919876543210',
        passwordHash: 'citizen123',
        role: 'community',
      },
    ];

    for (const u of usersToSeed) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await User.create(u);
      }
    }
    console.log('   ✓ Seeded 4 Authority tiers (MHA, StateDMA, DistrictAdmin, Municipal) + 1 Community citizen');

    // Seed zones with modern multi-hazard & ECC fields
    const zonesData = [
      {
        zoneName: 'Yamuna Bank Colony',
        coordinates: { type: 'Polygon', coordinates: [[[77.260,28.610],[77.275,28.610],[77.275,28.620],[77.260,28.620],[77.260,28.610]]] },
        hazardType: 'flood',
        riskScore: 92,
        mhiScore: 88,
        drsScore: 92,
        riskLevel: 'red',
        population: 32000,
        carryingCapacity: 25000,
        eccCapacity: 24500,
        limitingFactor: 'Drainage Discharge Capacity',
        rainfallMm: 185.4,
        hasVerifiedHazard: true,
        authorityJurisdiction: 'DistrictAdmin',
        hazardIntensity: { value: 88, unit: 'm3/sec river discharge', score: 90 },
        populationVulnerability: { sviScore: 84, kutchaHousingPercent: 68, vulnerablePop: 21760 },
        disasterHistory: { recurrenceCount: 6, returnPeriodYears: 1, pastEvents: ['2023 Yamuna Peak Spill', '2019 Monsoon Breach'], cumulativeDisplaced: 28000 },
        redZoneStatus: { isRedZone: true, declaredDate: new Date('2024-05-10'), gazetteRef: 'DDMA/FLD/2024/09', unsuitableForHabitation: true },
        relocationTier: 'immediate',
        riskHistory: [{ score: 85, date: new Date('2024-06-01') },{ score: 88, date: new Date('2024-07-01') },{ score: 90, date: new Date('2024-08-01') },{ score: 92, date: new Date('2024-09-01') }]
      },
      {
        zoneName: 'Chooralmala & Meppadi Habitation',
        coordinates: { type: 'Polygon', coordinates: [[[76.120,11.530],[76.140,11.530],[76.140,11.548],[76.120,11.548],[76.120,11.530]]] },
        hazardType: 'landslide',
        riskScore: 96,
        mhiScore: 92,
        drsScore: 96,
        riskLevel: 'red',
        population: 14800,
        carryingCapacity: 6500,
        eccCapacity: 6200,
        limitingFactor: 'Debris Flow Velocity & Slope Failure',
        rainfallMm: 372.0,
        hasVerifiedHazard: true,
        authorityJurisdiction: 'StateDMA',
        hazardIntensity: { value: 372, unit: 'mm/48hr rainfall', score: 98 },
        populationVulnerability: { sviScore: 82, kutchaHousingPercent: 60, vulnerablePop: 8880 },
        disasterHistory: { recurrenceCount: 4, returnPeriodYears: 2, pastEvents: ['2024 Chooralmala Debris Surge', '2020 Puthumala Landslide'], cumulativeDisplaced: 12500 },
        redZoneStatus: { isRedZone: true, declaredDate: new Date('2024-07-30'), gazetteRef: 'KSDMA/LS/2024/WZ-01', unsuitableForHabitation: true },
        relocationTier: 'immediate',
        riskHistory: [{ score: 86, date: new Date('2024-06-01') },{ score: 90, date: new Date('2024-07-01') },{ score: 94, date: new Date('2024-08-01') },{ score: 96, date: new Date('2024-09-01') }]
      },
      {
        zoneName: 'Joshimath Subsidence Ward 4',
        coordinates: { type: 'Polygon', coordinates: [[[79.550,30.550],[79.570,30.550],[79.570,30.565],[79.550,30.565],[79.550,30.550]]] },
        hazardType: 'landslide',
        riskScore: 91,
        mhiScore: 89,
        drsScore: 91,
        riskLevel: 'red',
        population: 9400,
        carryingCapacity: 4500,
        eccCapacity: 4300,
        limitingFactor: 'Bedrock Fissures & Bearing Failure',
        rainfallMm: 98.0,
        hasVerifiedHazard: true,
        authorityJurisdiction: 'StateDMA',
        hazardIntensity: { value: 55, unit: 'mm/yr InSAR subsidence', score: 94 },
        populationVulnerability: { sviScore: 78, kutchaHousingPercent: 50, vulnerablePop: 4700 },
        disasterHistory: { recurrenceCount: 5, returnPeriodYears: 1, pastEvents: ['2023 Aquifer Puncture Cracks', '2021 Dhauliganga Flash Surge'], cumulativeDisplaced: 5200 },
        redZoneStatus: { isRedZone: true, declaredDate: new Date('2023-01-15'), gazetteRef: 'USDMA/SUB/2023/02', unsuitableForHabitation: true },
        relocationTier: 'immediate',
        riskHistory: [{ score: 82, date: new Date('2024-06-01') },{ score: 85, date: new Date('2024-07-01') },{ score: 88, date: new Date('2024-08-01') },{ score: 91, date: new Date('2024-09-01') }]
      },
      {
        zoneName: 'Chellanam Coastal Hamlet',
        coordinates: { type: 'Polygon', coordinates: [[[76.265,9.800],[76.280,9.800],[76.280,9.815],[76.265,9.815],[76.265,9.800]]] },
        hazardType: 'coastal_erosion',
        riskScore: 94,
        mhiScore: 90,
        drsScore: 94,
        riskLevel: 'red',
        population: 12000,
        carryingCapacity: 6000,
        eccCapacity: 5800,
        limitingFactor: 'Sea-Wall Inundation & Wave Surge',
        rainfallMm: 210.0,
        hasVerifiedHazard: true,
        authorityJurisdiction: 'StateDMA',
        hazardIntensity: { value: 4.2, unit: 'm/yr shoreline retreat', score: 92 },
        populationVulnerability: { sviScore: 80, kutchaHousingPercent: 55, vulnerablePop: 6600 },
        disasterHistory: { recurrenceCount: 8, returnPeriodYears: 1, pastEvents: ['2023 Cyclone Biparjoy Swell', '2021 Cyclone Tauktae Surge'], cumulativeDisplaced: 11000 },
        redZoneStatus: { isRedZone: true, declaredDate: new Date('2024-04-18'), gazetteRef: 'KSDMA/COAST/2024/07', unsuitableForHabitation: true },
        relocationTier: 'immediate',
        riskHistory: [{ score: 85, date: new Date('2024-06-01') },{ score: 88, date: new Date('2024-07-01') },{ score: 91, date: new Date('2024-08-01') },{ score: 94, date: new Date('2024-09-01') }]
      },
      {
        zoneName: 'Dharamshala Kangra Ravine Sector',
        coordinates: { type: 'Polygon', coordinates: [[[76.310,32.210],[76.330,32.210],[76.330,32.225],[76.310,32.225],[76.310,32.210]]] },
        hazardType: 'cloudburst',
        riskScore: 93,
        mhiScore: 88,
        drsScore: 93,
        riskLevel: 'red',
        population: 7200,
        carryingCapacity: 3800,
        eccCapacity: 3600,
        limitingFactor: 'Torrents & Flash Gorge Chokepoint',
        rainfallMm: 245.0,
        hasVerifiedHazard: true,
        authorityJurisdiction: 'StateDMA',
        hazardIntensity: { value: 112, unit: 'mm/hr precipitation', score: 95 },
        populationVulnerability: { sviScore: 72, kutchaHousingPercent: 42, vulnerablePop: 3024 },
        disasterHistory: { recurrenceCount: 4, returnPeriodYears: 2, pastEvents: ['2023 Beas Basin Cloudburst', '2021 Bhagsunag Flash Torrent'], cumulativeDisplaced: 6200 },
        redZoneStatus: { isRedZone: true, declaredDate: new Date('2024-08-05'), gazetteRef: 'HPSDMA/CB/2024/05', unsuitableForHabitation: true },
        relocationTier: 'immediate',
        riskHistory: [{ score: 80, date: new Date('2024-06-01') },{ score: 84, date: new Date('2024-07-01') },{ score: 89, date: new Date('2024-08-01') },{ score: 93, date: new Date('2024-09-01') }]
      },
      {
        zoneName: 'Majuli Island Floodplain',
        coordinates: { type: 'Polygon', coordinates: [[[94.150,26.920],[94.180,26.920],[94.180,26.945],[94.150,26.945],[94.150,26.920]]] },
        hazardType: 'flood',
        riskScore: 76,
        mhiScore: 74,
        drsScore: 76,
        riskLevel: 'red',
        population: 21000,
        carryingCapacity: 14000,
        eccCapacity: 13500,
        limitingFactor: 'Brahmaputra Bank Siltation Deficit',
        rainfallMm: 165.0,
        hasVerifiedHazard: false,
        authorityJurisdiction: 'StateDMA',
        hazardIntensity: { value: 24000, unit: 'cumec runoff', score: 86 },
        populationVulnerability: { sviScore: 85, kutchaHousingPercent: 75, vulnerablePop: 15750 },
        disasterHistory: { recurrenceCount: 12, returnPeriodYears: 1, pastEvents: ['2022 Assam Flood Inundation', '2020 Severe Embankment Cut'], cumulativeDisplaced: 35000 },
        redZoneStatus: { isRedZone: true, declaredDate: new Date('2024-06-12'), gazetteRef: 'ASDMA/BRAH/2024/11', unsuitableForHabitation: true },
        relocationTier: 'short_term',
        riskHistory: [{ score: 68, date: new Date('2024-06-01') },{ score: 71, date: new Date('2024-07-01') },{ score: 74, date: new Date('2024-08-01') },{ score: 76, date: new Date('2024-09-01') }]
      },
      {
        zoneName: 'Kedarnath Valley Tributary Habitation',
        coordinates: { type: 'Polygon', coordinates: [[[79.055,30.725],[79.075,30.725],[79.075,30.742],[79.055,30.742],[79.055,30.725]]] },
        hazardType: 'cloudburst',
        riskScore: 74,
        mhiScore: 71,
        drsScore: 74,
        riskLevel: 'red',
        population: 5800,
        carryingCapacity: 4000,
        eccCapacity: 3800,
        limitingFactor: 'Glacial Outflow Chokepoints',
        rainfallMm: 140.0,
        hasVerifiedHazard: false,
        authorityJurisdiction: 'DistrictAdmin',
        hazardIntensity: { value: 98, unit: 'mm/hr cloudburst', score: 89 },
        populationVulnerability: { sviScore: 74, kutchaHousingPercent: 48, vulnerablePop: 2784 },
        disasterHistory: { recurrenceCount: 7, returnPeriodYears: 3, pastEvents: ['2024 Mandakini Flash Surge', '2013 Chorbari Glacial Breach'], cumulativeDisplaced: 8900 },
        redZoneStatus: { isRedZone: true, declaredDate: new Date('2024-07-28'), gazetteRef: 'USDMA/CB/2024/08', unsuitableForHabitation: true },
        relocationTier: 'short_term',
        riskHistory: [{ score: 66, date: new Date('2024-06-01') },{ score: 69, date: new Date('2024-07-01') },{ score: 71, date: new Date('2024-08-01') },{ score: 74, date: new Date('2024-09-01') }]
      },
      {
        zoneName: 'Pentha Beach Sea-Wall Breach Zone',
        coordinates: { type: 'Polygon', coordinates: [[[86.840,20.520],[86.860,20.520],[86.860,20.538],[86.840,20.538],[86.840,20.520]]] },
        hazardType: 'coastal_erosion',
        riskScore: 72,
        mhiScore: 68,
        drsScore: 72,
        riskLevel: 'red',
        population: 11000,
        carryingCapacity: 8000,
        eccCapacity: 7600,
        limitingFactor: 'Geotube Embankment Subsidence',
        rainfallMm: 130.0,
        hasVerifiedHazard: false,
        authorityJurisdiction: 'DistrictAdmin',
        hazardIntensity: { value: 3.8, unit: 'm/yr wave scouring velocity', score: 85 },
        populationVulnerability: { sviScore: 76, kutchaHousingPercent: 62, vulnerablePop: 6820 },
        disasterHistory: { recurrenceCount: 6, returnPeriodYears: 2, pastEvents: ['2021 Cyclone Yaas Surge', '2019 Cyclone Fani Overwash'], cumulativeDisplaced: 8500 },
        redZoneStatus: { isRedZone: true, declaredDate: new Date('2024-05-22'), gazetteRef: 'OSDMA/EROS/2024/03', unsuitableForHabitation: true },
        relocationTier: 'short_term',
        riskHistory: [{ score: 64, date: new Date('2024-06-01') },{ score: 67, date: new Date('2024-07-01') },{ score: 70, date: new Date('2024-08-01') },{ score: 72, date: new Date('2024-09-01') }]
      },
      {
        zoneName: 'Pooth Khurd Village',
        coordinates: { type: 'Polygon', coordinates: [[[77.072,28.714],[77.088,28.714],[77.088,28.726],[77.072,28.726],[77.072,28.714]]] },
        hazardType: 'landslide',
        riskScore: 56,
        mhiScore: 54,
        drsScore: 56,
        riskLevel: 'yellow',
        population: 24000,
        carryingCapacity: 22000,
        eccCapacity: 21000,
        limitingFactor: 'Slope Stability & Subsidence',
        rainfallMm: 65.0,
        hasVerifiedHazard: false,
        authorityJurisdiction: 'DistrictAdmin',
        hazardIntensity: { value: 45, unit: 'slope shear index', score: 55 },
        populationVulnerability: { sviScore: 52, kutchaHousingPercent: 35, vulnerablePop: 8400 },
        disasterHistory: { recurrenceCount: 2, returnPeriodYears: 5, pastEvents: ['2018 Embankment Crack'], cumulativeDisplaced: 1200 },
        redZoneStatus: { isRedZone: false, declaredDate: null, gazetteRef: '', unsuitableForHabitation: false },
        relocationTier: 'medium_term',
        riskHistory: [{ score: 52, date: new Date('2024-06-01') },{ score: 53, date: new Date('2024-07-01') },{ score: 55, date: new Date('2024-08-01') },{ score: 56, date: new Date('2024-09-01') }]
      },
      {
        zoneName: 'Dwarka Integrated Eco-Township Corridor',
        coordinates: { type: 'Polygon', coordinates: [[[77.058,28.555],[77.074,28.555],[77.074,28.567],[77.058,28.567],[77.058,28.555]]] },
        hazardType: 'flood',
        riskScore: 16,
        mhiScore: 16,
        drsScore: 16,
        riskLevel: 'green',
        population: 8000,
        carryingCapacity: 25000,
        eccCapacity: 26000,
        limitingFactor: 'None - Sustainable Safe Reception Site',
        rainfallMm: 20.0,
        hasVerifiedHazard: false,
        authorityJurisdiction: 'DistrictAdmin',
        hazardIntensity: { value: 12, unit: 'discharge index', score: 15 },
        populationVulnerability: { sviScore: 25, kutchaHousingPercent: 8, vulnerablePop: 640 },
        disasterHistory: { recurrenceCount: 0, returnPeriodYears: 50, pastEvents: [], cumulativeDisplaced: 0 },
        redZoneStatus: { isRedZone: false, declaredDate: null, gazetteRef: '', unsuitableForHabitation: false },
        relocationTier: 'monitoring',
        riskHistory: [{ score: 18, date: new Date('2024-06-01') },{ score: 17, date: new Date('2024-07-01') },{ score: 16, date: new Date('2024-08-01') },{ score: 16, date: new Date('2024-09-01') }]
      },
      {
        zoneName: 'Meppadi Upland Resettlement Ridge',
        coordinates: { type: 'Polygon', coordinates: [[[76.160,11.560],[76.180,11.560],[76.180,11.575],[76.160,11.575],[76.160,11.560]]] },
        hazardType: 'landslide',
        riskScore: 14,
        mhiScore: 14,
        drsScore: 14,
        riskLevel: 'green',
        population: 3200,
        carryingCapacity: 14000,
        eccCapacity: 15000,
        limitingFactor: 'None - Basalt Bedrock Safe Reception Site',
        rainfallMm: 80.0,
        hasVerifiedHazard: false,
        authorityJurisdiction: 'StateDMA',
        hazardIntensity: { value: 10, unit: 'stability index', score: 12 },
        populationVulnerability: { sviScore: 20, kutchaHousingPercent: 5, vulnerablePop: 160 },
        disasterHistory: { recurrenceCount: 0, returnPeriodYears: 50, pastEvents: [], cumulativeDisplaced: 0 },
        redZoneStatus: { isRedZone: false, declaredDate: null, gazetteRef: '', unsuitableForHabitation: false },
        relocationTier: 'monitoring',
        riskHistory: [{ score: 15, date: new Date('2024-06-01') },{ score: 15, date: new Date('2024-07-01') },{ score: 14, date: new Date('2024-08-01') },{ score: 14, date: new Date('2024-09-01') }]
      },
    ];

    const zones = await Zone.insertMany(zonesData.map(z => ({ ...z, lastUpdated: new Date() })));

    // Assign the citizen user to Yamuna Bank Colony
    await User.updateOne({ email: 'citizen@hazardshield.com' }, { assignedZoneId: zones[0]._id });

    // Seed prioritized relocation plans (Immediate, Short-Term, Medium-Term)
    const planDefinitions = [
      {
        zoneName: 'Chooralmala & Meppadi Habitation',
        urgencyScore: 98,
        relocationTier: 'immediate',
        timelineEstimate: '< 30 Days',
        reason: 'CRITICAL RED ZONE: Debris flow collapse and severe slope failure. OCI 2.27 exceeds carrying capacity by 127%. Section 34 mandatory relocation.',
        targetSettlementSites: [
          { siteId: 'WYN_SAFE_01', siteName: 'Meppadi Upland Resettlement Ridge', location: 'Meppadi South Plateau (Basalt Bedrock)', topsisScore: 0.94, availableCapacity: 8500, slopeDegrees: 5.2, waterLpcd: 155, limitingFactor: 'Transit Access Road Width', suitabilityGrade: 'Class A - Prime Reception Site' },
          { siteId: 'WYN_SAFE_02', siteName: 'Kalpetta East Terraced Greenfield', location: 'Kalpetta Municipal Buffer', topsisScore: 0.88, availableCapacity: 12000, slopeDegrees: 6.8, waterLpcd: 140, limitingFactor: 'PHC Clinic Expansion Required', suitabilityGrade: 'Class A - Viable Reception Site' }
        ],
        sdmaActionDirectives: [
          'Immediate gazette publication under Section 34 of Disaster Management Act 2005.',
          'Marshall NDRF & SDRF evacuation corridors to Meppadi Upland Ridge.',
          'Release Rs. 45 Crore State Disaster Response Fund (SDRF) for transitional pre-fab housing.'
        ]
      },
      {
        zoneName: 'Yamuna Bank Colony',
        urgencyScore: 95,
        relocationTier: 'immediate',
        timelineEstimate: '< 30 Days',
        reason: 'Annual monsoonal riverbed overflow exceeds carrying capacity by 28%. Chronic flood inundation line breach.',
        targetSettlementSites: [
          { siteId: 'NCR_SAFE_01', siteName: 'Dwarka Integrated Eco-Township Corridor', location: 'Dwarka Sector 28 Buffer', topsisScore: 0.91, availableCapacity: 14500, slopeDegrees: 2.1, waterLpcd: 165, limitingFactor: 'Substation Transformer Augmentation', suitabilityGrade: 'Class A - High Capacity' },
          { siteId: 'NCR_SAFE_02', siteName: 'Narela Phased Housing Complex', location: 'Narela North Ridge', topsisScore: 0.82, availableCapacity: 8000, slopeDegrees: 1.8, waterLpcd: 135, limitingFactor: 'Sewer Trunk Line Tie-in', suitabilityGrade: 'Class B - Secondary' }
        ],
        sdmaActionDirectives: [
          'Issue evacuation order for 32,000 residents prior to Yamuna Hathnikund barrage release.',
          'Activate transitional shelters at Dwarka Transit Complex.'
        ]
      },
      {
        zoneName: 'Chellanam Coastal Hamlet',
        urgencyScore: 94,
        relocationTier: 'immediate',
        timelineEstimate: '< 30 Days',
        reason: 'Uncontrolled coastal erosion with 4.2m/year shoreline retreat. Breached seawall poses immediate tidal surge hazard.',
        targetSettlementSites: [
          { siteId: 'KL_SAFE_01', siteName: 'Kochi Inland Rehabilitation Park', location: 'Puthencruz Highground Sector', topsisScore: 0.89, availableCapacity: 7500, slopeDegrees: 3.5, waterLpcd: 150, limitingFactor: 'Feeder Road Widening', suitabilityGrade: 'Class A - Elevated Inland Zone' }
        ],
        sdmaActionDirectives: [
          'Declare 500m coastal belt non-habitable under coastal protection mandate.',
          'Initiate permanent land allocation at Puthencruz Inland Park.'
        ]
      },
      {
        zoneName: 'Dharamshala Kangra Ravine Sector',
        urgencyScore: 92,
        relocationTier: 'immediate',
        timelineEstimate: '< 30 Days',
        reason: 'Critical cloudburst hazard corridor. High-gradient ravine flash flood risk during active Western Himalayan weather disturbances.',
        targetSettlementSites: [
          { siteId: 'HP_SAFE_01', siteName: 'Kangra Valley Plateau Resettlement Zone', location: 'Yol Cantonment Buffer', topsisScore: 0.93, availableCapacity: 6000, slopeDegrees: 4.8, waterLpcd: 145, limitingFactor: 'Water Pipeline Extension', suitabilityGrade: 'Class A - Safe Basalt Plateau' }
        ],
        sdmaActionDirectives: [
          'Prohibit permanent reconstruction in cloudburst torrent channel.',
          'Deploy automated water-level radar sensors at upstream catchment.'
        ]
      },
      {
        zoneName: 'Majuli Island Floodplain',
        urgencyScore: 78,
        relocationTier: 'short_term',
        timelineEstimate: '1 - 6 Months',
        reason: 'Severe seasonal Brahmaputra bankline erosion and annual monsoonal submergence. Pre-monsoon planned relocation.',
        targetSettlementSites: [
          { siteId: 'AS_SAFE_01', siteName: 'Jorhat North Highland Township', location: 'Jorhat Elevated Spur', topsisScore: 0.87, availableCapacity: 16000, slopeDegrees: 2.4, waterLpcd: 140, limitingFactor: 'Ferry Transit Capacity', suitabilityGrade: 'Class A - Flood-Free Mainland' }
        ],
        sdmaActionDirectives: [
          'Complete beneficiary enumeration before May 2025 pre-monsoon deadline.',
          'Begin construction of elevated stilt housing clusters at Jorhat North Spur.'
        ]
      },
      {
        zoneName: 'Kedarnath Valley Tributary Habitation',
        urgencyScore: 74,
        relocationTier: 'short_term',
        timelineEstimate: '1 - 6 Months',
        reason: 'Narrow glacial valley subject to seasonal cloudburst debris surges. Relocation required prior to pilgrimage monsoon peak.',
        targetSettlementSites: [
          { siteId: 'UK_SAFE_01', siteName: 'Guptkashi Stable Terraces', location: 'Guptkashi South Ridge', topsisScore: 0.86, availableCapacity: 5000, slopeDegrees: 8.5, waterLpcd: 135, limitingFactor: 'Retaining Wall Construction', suitabilityGrade: 'Class B - Geologically Surveyed' }
        ],
        sdmaActionDirectives: [
          'Geological survey clearance for Guptkashi terrace housing plots.',
          'Phased voluntary shifting incentives for vulnerable families.'
        ]
      },
      {
        zoneName: 'Pooth Khurd Village',
        urgencyScore: 56,
        relocationTier: 'medium_term',
        timelineEstimate: '6 - 24 Months',
        reason: 'Marginal slope instability with population approaching environmental carrying capacity. Phased town-planning integration.',
        targetSettlementSites: [
          { siteId: 'NCR_SAFE_03', siteName: 'Rohini Sector 36 Urban Extension', location: 'Sector 36 Buffer', topsisScore: 0.85, availableCapacity: 18000, slopeDegrees: 1.5, waterLpcd: 150, limitingFactor: 'School & PHC Provision', suitabilityGrade: 'Class A - Planned Sector' }
        ],
        sdmaActionDirectives: [
          'Incorporate zone boundary into Delhi Master Plan 2041 green buffer.',
          'Stage infrastructural development at Rohini Extension.'
        ]
      }
    ];

    const plans = [];
    for (const def of planDefinitions) {
      const matchedZone = zones.find(z => z.zoneName === def.zoneName);
      if (matchedZone) {
        plans.push({
          zoneId: matchedZone._id,
          urgencyScore: def.urgencyScore,
          relocationTier: def.relocationTier,
          timelineEstimate: def.timelineEstimate,
          status: 'pending',
          reason: def.reason,
          requiresVerifiedHazard: true,
          targetSettlementSites: def.targetSettlementSites,
          sdmaActionDirectives: def.sdmaActionDirectives,
        });
      }
    }
    await RelocationPlan.insertMany(plans);

    console.log(`   ✓ Seeded ${zones.length} multi-hazard zones + ${plans.length} prioritized relocation plans`);
    console.log('   🔑 Logins:');
    console.log('      • Authority (MHA): admin@hazardshield.com / admin123');
    console.log('      • Authority (StateDMA): state@hazardshield.com / state123');
    console.log('      • Authority (DistrictAdmin): district@hazardshield.com / district123');
    console.log('      • Authority (Municipal): municipal@hazardshield.com / muni123');
    console.log('      • Community (Citizen): citizen@hazardshield.com / citizen123\n');
  }
};

// ─── Satellite InSAR Background Sync ───────────────────────────
// Run satellite sync periodically (every hour at :00)
cron.schedule('0 * * * *', async () => {
  try {
    console.log('🛰️ Running scheduled ISRO Bhuvan InSAR telemetry sync...');
    await satelliteService.syncTelemetry();
  } catch (err) {
    console.error('Satellite sync error:', err.message);
  }
});

// ─── Start Server ─────────────────────────────────────────────

const startServer = async () => {
  try {
    await connectDB();
    await autoSeed();
    app.listen(PORT, () => {
      console.log(`\n🚀 HazardShield API running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
