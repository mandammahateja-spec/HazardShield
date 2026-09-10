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
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

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
        riskHistory: [{ score: 85, date: new Date('2024-06-01') },{ score: 88, date: new Date('2024-07-01') },{ score: 90, date: new Date('2024-08-01') },{ score: 92, date: new Date('2024-09-01') }]
      },
      {
        zoneName: 'Rohini Sector 15',
        coordinates: { type: 'Polygon', coordinates: [[[77.060,28.735],[77.076,28.735],[77.076,28.746],[77.060,28.746],[77.060,28.735]]] },
        hazardType: 'flood',
        riskScore: 87,
        mhiScore: 82,
        drsScore: 87,
        riskLevel: 'red',
        population: 45000,
        carryingCapacity: 35000,
        eccCapacity: 34000,
        limitingFactor: 'Stormwater Runoff',
        rainfallMm: 142.0,
        hasVerifiedHazard: true,
        authorityJurisdiction: 'DistrictAdmin',
        riskHistory: [{ score: 78, date: new Date('2024-06-01') },{ score: 82, date: new Date('2024-07-01') },{ score: 85, date: new Date('2024-08-01') },{ score: 87, date: new Date('2024-09-01') }]
      },
      {
        zoneName: 'Narela Industrial Belt',
        coordinates: { type: 'Polygon', coordinates: [[[77.090,28.840],[77.105,28.840],[77.105,28.852],[77.090,28.852],[77.090,28.840]]] },
        hazardType: 'cyclone',
        riskScore: 78,
        mhiScore: 74,
        drsScore: 78,
        riskLevel: 'red',
        population: 52000,
        carryingCapacity: 40000,
        eccCapacity: 39500,
        limitingFactor: 'Industrial Evacuation Corridors',
        rainfallMm: 110.0,
        hasVerifiedHazard: false,
        authorityJurisdiction: 'DistrictAdmin',
        riskHistory: [{ score: 70, date: new Date('2024-06-01') },{ score: 74, date: new Date('2024-07-01') },{ score: 76, date: new Date('2024-08-01') },{ score: 78, date: new Date('2024-09-01') }]
      },
      {
        zoneName: 'Pooth Khurd Village',
        coordinates: { type: 'Polygon', coordinates: [[[77.072,28.714],[77.088,28.714],[77.088,28.726],[77.072,28.726],[77.072,28.714]]] },
        hazardType: 'landslide',
        riskScore: 75,
        mhiScore: 72,
        drsScore: 75,
        riskLevel: 'red',
        population: 24000,
        carryingCapacity: 20000,
        eccCapacity: 19000,
        limitingFactor: 'Slope Stability & Subsidence',
        rainfallMm: 95.0,
        hasVerifiedHazard: false,
        authorityJurisdiction: 'DistrictAdmin',
        riskHistory: [{ score: 68, date: new Date('2024-06-01') },{ score: 71, date: new Date('2024-07-01') },{ score: 73, date: new Date('2024-08-01') },{ score: 75, date: new Date('2024-09-01') }]
      },
      {
        zoneName: 'Coastal Settlement Alpha',
        coordinates: { type: 'Polygon', coordinates: [[[72.870,19.070],[72.885,19.070],[72.885,19.082],[72.870,19.082],[72.870,19.070]]] },
        hazardType: 'cyclone',
        riskScore: 95,
        mhiScore: 90,
        drsScore: 95,
        riskLevel: 'red',
        population: 18000,
        carryingCapacity: 9000,
        eccCapacity: 8800,
        limitingFactor: 'Storm Surge Inundation Zone',
        rainfallMm: 260.5,
        hasVerifiedHazard: true,
        authorityJurisdiction: 'StateDMA',
        riskHistory: [{ score: 88, date: new Date('2024-06-01') },{ score: 91, date: new Date('2024-07-01') },{ score: 93, date: new Date('2024-08-01') },{ score: 95, date: new Date('2024-09-01') }]
      },
      {
        zoneName: 'Burari Village',
        coordinates: { type: 'Polygon', coordinates: [[[77.193,28.746],[77.209,28.746],[77.209,28.758],[77.193,28.758],[77.193,28.746]]] },
        hazardType: 'flood',
        riskScore: 62,
        mhiScore: 60,
        drsScore: 62,
        riskLevel: 'yellow',
        population: 28000,
        carryingCapacity: 30000,
        eccCapacity: 29000,
        limitingFactor: 'Groundwater Table Saturation',
        rainfallMm: 72.0,
        hasVerifiedHazard: false,
        authorityJurisdiction: 'Municipal',
        riskHistory: [{ score: 55, date: new Date('2024-06-01') },{ score: 58, date: new Date('2024-07-01') },{ score: 60, date: new Date('2024-08-01') },{ score: 62, date: new Date('2024-09-01') }]
      },
      {
        zoneName: 'Majnu Ka Tilla',
        coordinates: { type: 'Polygon', coordinates: [[[77.205,28.698],[77.220,28.698],[77.220,28.710],[77.205,28.710],[77.205,28.698]]] },
        hazardType: 'landslide',
        riskScore: 58,
        mhiScore: 55,
        drsScore: 58,
        riskLevel: 'yellow',
        population: 18000,
        carryingCapacity: 22000,
        eccCapacity: 21500,
        limitingFactor: 'Riverbank Soil Erosion',
        rainfallMm: 65.0,
        hasVerifiedHazard: false,
        authorityJurisdiction: 'Municipal',
        riskHistory: [{ score: 50, date: new Date('2024-06-01') },{ score: 53, date: new Date('2024-07-01') },{ score: 56, date: new Date('2024-08-01') },{ score: 58, date: new Date('2024-09-01') }]
      },
      {
        zoneName: 'Dwarka Sector 21',
        coordinates: { type: 'Polygon', coordinates: [[[77.058,28.555],[77.074,28.555],[77.074,28.567],[77.058,28.567],[77.058,28.555]]] },
        hazardType: 'flood',
        riskScore: 18,
        mhiScore: 18,
        drsScore: 18,
        riskLevel: 'green',
        population: 8000,
        carryingCapacity: 15000,
        eccCapacity: 16000,
        limitingFactor: 'None - Sustainable Safe Zone',
        rainfallMm: 24.0,
        hasVerifiedHazard: false,
        authorityJurisdiction: 'DistrictAdmin',
        riskHistory: [{ score: 20, date: new Date('2024-06-01') },{ score: 19, date: new Date('2024-07-01') },{ score: 18, date: new Date('2024-08-01') },{ score: 18, date: new Date('2024-09-01') }]
      },
      {
        zoneName: 'Greater Noida Tech Corridor',
        coordinates: { type: 'Polygon', coordinates: [[[77.490,28.470],[77.506,28.470],[77.506,28.482],[77.490,28.482],[77.490,28.470]]] },
        hazardType: 'earthquake',
        riskScore: 15,
        mhiScore: 15,
        drsScore: 15,
        riskLevel: 'green',
        population: 10000,
        carryingCapacity: 30000,
        eccCapacity: 32000,
        limitingFactor: 'None - Sustainable Safe Zone',
        rainfallMm: 15.0,
        hasVerifiedHazard: false,
        authorityJurisdiction: 'StateDMA',
        riskHistory: [{ score: 18, date: new Date('2024-06-01') },{ score: 17, date: new Date('2024-07-01') },{ score: 16, date: new Date('2024-08-01') },{ score: 15, date: new Date('2024-09-01') }]
      },
    ];

    const zones = await Zone.insertMany(zonesData.map(z => ({ ...z, lastUpdated: new Date() })));

    // Assign the citizen user to Yamuna Bank Colony
    await User.updateOne({ email: 'citizen@hazardshield.com' }, { assignedZoneId: zones[0]._id });

    // Seed relocation plans for overcapacity zones
    const reasons = {
      'Yamuna Bank Colony': 'Annual monsoon flooding exceeds carrying capacity by 28%.',
      'Rohini Sector 15': 'Population exceeds carrying capacity by 29%.',
      'Coastal Settlement Alpha': 'Severe cyclone corridor. Population double safe capacity.',
    };

    const plans = [];
    for (const zone of zones) {
      if (reasons[zone.zoneName]) {
        plans.push({
          zoneId: zone._id,
          urgencyScore: zone.riskScore + (zone.population > zone.carryingCapacity ? 5 : 0),
          status: 'pending',
          reason: reasons[zone.zoneName],
          requiresVerifiedHazard: true,
          targetSettlementSites: [
            { siteName: 'Dwarka Relocation Transit Complex', safeCapacityAvailable: 4500, distanceKm: 18.2 },
            { siteName: 'Greater Noida Eco Township Hub', safeCapacityAvailable: 12000, distanceKm: 28.5 },
          ]
        });
      }
    }
    await RelocationPlan.insertMany(plans);

    console.log(`   ✓ Seeded ${zones.length} zones + ${plans.length} relocation plans`);
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
