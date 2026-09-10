/**
 * HazardShield — Database Seed Script
 *
 * Populates MongoDB with:
 * - 1 default admin account (admin@hazardshield.com / admin123)
 * - 15 realistic hazard zones (mix of red/yellow/green, multiple hazard types)
 * - Relocation plans for all red + some yellow zones
 *
 * Usage: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const Admin = require('../models/Admin');
const Zone = require('../models/Zone');
const RelocationPlan = require('../models/RelocationPlan');

// ─── Seed Data ────────────────────────────────────────────────

const adminData = {
  name: 'System Administrator',
  email: 'admin@hazardshield.com',
  passwordHash: 'admin123', // Will be hashed by pre-save hook
  role: 'admin',
};

const zonesData = [
  // ─── RED ZONES (5) ──────────────────────────────────────
  {
    zoneName: 'Yamuna Bank Colony',
    coordinates: {
      type: 'Polygon',
      coordinates: [[[77.260, 28.610], [77.275, 28.610], [77.275, 28.620], [77.260, 28.620], [77.260, 28.610]]],
    },
    hazardType: 'flood',
    riskScore: 92,
    riskLevel: 'red',
    population: 32000,
    carryingCapacity: 25000,
    riskHistory: [
      { score: 85, date: new Date('2024-06-01') },
      { score: 88, date: new Date('2024-07-01') },
      { score: 90, date: new Date('2024-08-01') },
      { score: 92, date: new Date('2024-09-01') },
    ],
  },
  {
    zoneName: 'Rohini Sector 15',
    coordinates: {
      type: 'Polygon',
      coordinates: [[[77.060, 28.735], [77.076, 28.735], [77.076, 28.746], [77.060, 28.746], [77.060, 28.735]]],
    },
    hazardType: 'flood',
    riskScore: 87,
    riskLevel: 'red',
    population: 45000,
    carryingCapacity: 35000,
    riskHistory: [
      { score: 78, date: new Date('2024-06-01') },
      { score: 82, date: new Date('2024-07-01') },
      { score: 85, date: new Date('2024-08-01') },
      { score: 87, date: new Date('2024-09-01') },
    ],
  },
  {
    zoneName: 'Narela Industrial Belt',
    coordinates: {
      type: 'Polygon',
      coordinates: [[[77.090, 28.840], [77.105, 28.840], [77.105, 28.852], [77.090, 28.852], [77.090, 28.840]]],
    },
    hazardType: 'cyclone',
    riskScore: 78,
    riskLevel: 'red',
    population: 52000,
    carryingCapacity: 40000,
    riskHistory: [
      { score: 70, date: new Date('2024-06-01') },
      { score: 74, date: new Date('2024-07-01') },
      { score: 76, date: new Date('2024-08-01') },
      { score: 78, date: new Date('2024-09-01') },
    ],
  },
  {
    zoneName: 'Pooth Khurd Village',
    coordinates: {
      type: 'Polygon',
      coordinates: [[[77.072, 28.714], [77.088, 28.714], [77.088, 28.726], [77.072, 28.726], [77.072, 28.714]]],
    },
    hazardType: 'landslide',
    riskScore: 75,
    riskLevel: 'red',
    population: 24000,
    carryingCapacity: 20000,
    riskHistory: [
      { score: 68, date: new Date('2024-06-01') },
      { score: 71, date: new Date('2024-07-01') },
      { score: 73, date: new Date('2024-08-01') },
      { score: 75, date: new Date('2024-09-01') },
    ],
  },
  {
    zoneName: 'Coastal Settlement Alpha (Mumbai)',
    coordinates: {
      type: 'Polygon',
      coordinates: [[[72.870, 19.070], [72.885, 19.070], [72.885, 19.082], [72.870, 19.082], [72.870, 19.070]]],
    },
    hazardType: 'cyclone',
    riskScore: 95,
    riskLevel: 'red',
    population: 18000,
    carryingCapacity: 9000,
    riskHistory: [
      { score: 88, date: new Date('2024-06-01') },
      { score: 91, date: new Date('2024-07-01') },
      { score: 93, date: new Date('2024-08-01') },
      { score: 95, date: new Date('2024-09-01') },
    ],
  },

  // ─── YELLOW ZONES (5) ───────────────────────────────────
  {
    zoneName: 'Burari Village',
    coordinates: {
      type: 'Polygon',
      coordinates: [[[77.193, 28.746], [77.209, 28.746], [77.209, 28.758], [77.193, 28.758], [77.193, 28.746]]],
    },
    hazardType: 'flood',
    riskScore: 62,
    riskLevel: 'yellow',
    population: 28000,
    carryingCapacity: 30000,
    riskHistory: [
      { score: 55, date: new Date('2024-06-01') },
      { score: 58, date: new Date('2024-07-01') },
      { score: 60, date: new Date('2024-08-01') },
      { score: 62, date: new Date('2024-09-01') },
    ],
  },
  {
    zoneName: 'Majnu Ka Tilla',
    coordinates: {
      type: 'Polygon',
      coordinates: [[[77.205, 28.698], [77.220, 28.698], [77.220, 28.710], [77.205, 28.710], [77.205, 28.698]]],
    },
    hazardType: 'landslide',
    riskScore: 58,
    riskLevel: 'yellow',
    population: 18000,
    carryingCapacity: 22000,
    riskHistory: [
      { score: 50, date: new Date('2024-06-01') },
      { score: 53, date: new Date('2024-07-01') },
      { score: 56, date: new Date('2024-08-01') },
      { score: 58, date: new Date('2024-09-01') },
    ],
  },
  {
    zoneName: 'Bawana Industrial Area',
    coordinates: {
      type: 'Polygon',
      coordinates: [[[77.044, 28.789], [77.060, 28.789], [77.060, 28.801], [77.044, 28.801], [77.044, 28.789]]],
    },
    hazardType: 'flood',
    riskScore: 55,
    riskLevel: 'yellow',
    population: 22000,
    carryingCapacity: 28000,
    riskHistory: [
      { score: 48, date: new Date('2024-06-01') },
      { score: 51, date: new Date('2024-07-01') },
      { score: 53, date: new Date('2024-08-01') },
      { score: 55, date: new Date('2024-09-01') },
    ],
  },
  {
    zoneName: 'Karawal Nagar',
    coordinates: {
      type: 'Polygon',
      coordinates: [[[77.267, 28.709], [77.283, 28.709], [77.283, 28.721], [77.267, 28.721], [77.267, 28.709]]],
    },
    hazardType: 'earthquake',
    riskScore: 60,
    riskLevel: 'yellow',
    population: 38000,
    carryingCapacity: 40000,
    riskHistory: [
      { score: 52, date: new Date('2024-06-01') },
      { score: 55, date: new Date('2024-07-01') },
      { score: 58, date: new Date('2024-08-01') },
      { score: 60, date: new Date('2024-09-01') },
    ],
  },
  {
    zoneName: 'Najafgarh Basin',
    coordinates: {
      type: 'Polygon',
      coordinates: [[[76.972, 28.604], [76.988, 28.604], [76.988, 28.616], [76.972, 28.616], [76.972, 28.604]]],
    },
    hazardType: 'drought',
    riskScore: 48,
    riskLevel: 'yellow',
    population: 35000,
    carryingCapacity: 35000,
    riskHistory: [
      { score: 42, date: new Date('2024-06-01') },
      { score: 44, date: new Date('2024-07-01') },
      { score: 46, date: new Date('2024-08-01') },
      { score: 48, date: new Date('2024-09-01') },
    ],
  },

  // ─── GREEN ZONES (5) ────────────────────────────────────
  {
    zoneName: 'Wazirpur Industrial',
    coordinates: {
      type: 'Polygon',
      coordinates: [[[77.154, 28.693], [77.170, 28.693], [77.170, 28.705], [77.154, 28.705], [77.154, 28.693]]],
    },
    hazardType: 'earthquake',
    riskScore: 28,
    riskLevel: 'green',
    population: 15000,
    carryingCapacity: 25000,
    riskHistory: [
      { score: 30, date: new Date('2024-06-01') },
      { score: 29, date: new Date('2024-07-01') },
      { score: 28, date: new Date('2024-08-01') },
      { score: 28, date: new Date('2024-09-01') },
    ],
  },
  {
    zoneName: 'Alipur Rural Zone',
    coordinates: {
      type: 'Polygon',
      coordinates: [[[77.142, 28.794], [77.158, 28.794], [77.158, 28.806], [77.142, 28.806], [77.142, 28.794]]],
    },
    hazardType: 'flood',
    riskScore: 32,
    riskLevel: 'green',
    population: 12000,
    carryingCapacity: 20000,
    riskHistory: [
      { score: 35, date: new Date('2024-06-01') },
      { score: 34, date: new Date('2024-07-01') },
      { score: 33, date: new Date('2024-08-01') },
      { score: 32, date: new Date('2024-09-01') },
    ],
  },
  {
    zoneName: 'Sultanpuri Extension',
    coordinates: {
      type: 'Polygon',
      coordinates: [[[77.063, 28.676], [77.079, 28.676], [77.079, 28.688], [77.063, 28.688], [77.063, 28.676]]],
    },
    hazardType: 'earthquake',
    riskScore: 22,
    riskLevel: 'green',
    population: 19000,
    carryingCapacity: 25000,
    riskHistory: [
      { score: 25, date: new Date('2024-06-01') },
      { score: 24, date: new Date('2024-07-01') },
      { score: 23, date: new Date('2024-08-01') },
      { score: 22, date: new Date('2024-09-01') },
    ],
  },
  {
    zoneName: 'Dwarka Sector 21',
    coordinates: {
      type: 'Polygon',
      coordinates: [[[77.058, 28.555], [77.074, 28.555], [77.074, 28.567], [77.058, 28.567], [77.058, 28.555]]],
    },
    hazardType: 'flood',
    riskScore: 18,
    riskLevel: 'green',
    population: 8000,
    carryingCapacity: 15000,
    riskHistory: [
      { score: 20, date: new Date('2024-06-01') },
      { score: 19, date: new Date('2024-07-01') },
      { score: 18, date: new Date('2024-08-01') },
      { score: 18, date: new Date('2024-09-01') },
    ],
  },
  {
    zoneName: 'Greater Noida Tech Corridor',
    coordinates: {
      type: 'Polygon',
      coordinates: [[[77.490, 28.470], [77.506, 28.470], [77.506, 28.482], [77.490, 28.482], [77.490, 28.470]]],
    },
    hazardType: 'earthquake',
    riskScore: 15,
    riskLevel: 'green',
    population: 10000,
    carryingCapacity: 30000,
    riskHistory: [
      { score: 18, date: new Date('2024-06-01') },
      { score: 17, date: new Date('2024-07-01') },
      { score: 16, date: new Date('2024-08-01') },
      { score: 15, date: new Date('2024-09-01') },
    ],
  },
];

// Relocation reasons mapped to zone characteristics
const relocationReasons = {
  'Yamuna Bank Colony': 'Annual monsoon flooding exceeds carrying capacity by 28%. Immediate relocation of 7,000 residents recommended.',
  'Rohini Sector 15': 'Population exceeds carrying capacity by 29%. Flood drainage infrastructure critically stressed.',
  'Narela Industrial Belt': 'Cyclone exposure with overcrowded settlements. 12,000 residents in temporary structures.',
  'Pooth Khurd Village': 'Landslide-prone terrain. Population 20% above safe carrying capacity. Geological survey confirms instability.',
  'Coastal Settlement Alpha (Mumbai)': 'Severe cyclone corridor. Population double the safe carrying capacity. No storm shelter infrastructure.',
  'Burari Village': 'Seasonal flooding risk with population approaching capacity limit. Precautionary relocation for 3,000 residents.',
  'Karawal Nagar': 'Seismic Zone IV with aging building stock. Population at 95% of structural carrying capacity.',
  'Najafgarh Basin': 'Prolonged drought conditions affecting water table. At-limit population straining water resources.',
};

const shelterMapping = {
  'Yamuna Bank Colony': 'Geeta Colony Relief Camp',
  'Rohini Sector 15': 'Rohini Community Center',
  'Narela Industrial Belt': 'Narela Sports Complex',
  'Pooth Khurd Village': 'Bawana Community Hall',
  'Coastal Settlement Alpha (Mumbai)': 'Andheri Emergency Shelter',
  'Burari Village': 'ISBT Transit Camp',
  'Karawal Nagar': 'Seelampur Relief Center',
  'Najafgarh Basin': 'Najafgarh Community Hall',
};

// ─── Seed Function ────────────────────────────────────────────

async function seed() {
  try {
    // Connect to MongoDB (falls back to in-memory if no local MongoDB)
    console.log('🔗 Connecting to MongoDB...');
    await connectDB();

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      Admin.deleteMany({}),
      Zone.deleteMany({}),
      RelocationPlan.deleteMany({}),
    ]);
    console.log('   ✓ All collections cleared\n');

    // Create admin account
    console.log('👤 Creating default admin account...');
    const admin = await Admin.create(adminData);
    console.log(`   ✓ Admin created: ${admin.email} (role: ${admin.role})\n`);

    // Create zones
    console.log('🗺️  Creating hazard zones...');
    const zones = await Zone.insertMany(
      zonesData.map((z) => ({
        ...z,
        lastUpdated: new Date(),
      }))
    );
    console.log(`   ✓ ${zones.length} zones created\n`);

    // Create relocation plans for red zones + some yellow zones
    console.log('📋 Creating relocation plans...');
    const relocationPlans = [];

    for (const zone of zones) {
      const reason = relocationReasons[zone.zoneName];
      if (reason) {
        relocationPlans.push({
          zoneId: zone._id,
          urgencyScore: zone.riskScore + (zone.overcapacityIndex > 1 ? 5 : 0),
          status: 'pending',
          reason,
          suggestedShelterId: shelterMapping[zone.zoneName] || null,
        });
      }
    }

    const createdPlans = await RelocationPlan.insertMany(relocationPlans);
    console.log(`   ✓ ${createdPlans.length} relocation plans created\n`);

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('  📊 Seed Summary');
    console.log('═══════════════════════════════════════');
    console.log(`  Admin accounts:    1`);
    console.log(`  Total zones:       ${zones.length}`);
    console.log(`    Red (high):      ${zones.filter((z) => z.riskLevel === 'red').length}`);
    console.log(`    Yellow (medium): ${zones.filter((z) => z.riskLevel === 'yellow').length}`);
    console.log(`    Green (low):     ${zones.filter((z) => z.riskLevel === 'green').length}`);
    console.log(`  Relocation plans:  ${createdPlans.length}`);
    console.log('═══════════════════════════════════════');
    console.log('\n🔑 Default login credentials:');
    console.log('   Email:    admin@hazardshield.com');
    console.log('   Password: admin123\n');
    console.log('✅ Seed completed successfully!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
