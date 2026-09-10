const mongoose = require('mongoose');

let mongoServer = null;

/**
 * Connect to MongoDB.
 *
 * Strategy:
 * 1. If MONGO_URI is set and reachable → connect to it (production / local MongoDB).
 * 2. If connection fails or MONGO_URI is the default localhost → fall back to
 *    mongodb-memory-server (zero-install dev experience).
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  // Try external MongoDB first
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (externalError) {
    console.warn(
      `⚠️  Could not connect to MongoDB at ${uri}: ${externalError.message}`
    );
    console.log('🔄 Falling back to in-memory MongoDB...');
  }

  // Fallback: in-memory MongoDB
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create({
      instance: { launchTimeout: 120000 },
    });
    const memUri = mongoServer.getUri();
    const conn = await mongoose.connect(memUri);
    console.log(`✅ In-memory MongoDB started: ${memUri}`);
    console.log(
      '   ⚠️  Data will be lost on server restart. Install MongoDB for persistence.'
    );
    return conn;
  } catch (memError) {
    console.error('❌ Failed to start in-memory MongoDB:', memError.message);
    console.error(
      '💡 Install MongoDB locally or provide a valid MONGO_URI in .env'
    );
    process.exit(1);
  }
};

/**
 * Gracefully stop the in-memory server (if running).
 */
const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
};

module.exports = { connectDB, disconnectDB };
