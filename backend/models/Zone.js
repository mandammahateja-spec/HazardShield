const mongoose = require('mongoose');

const riskHistoryEntrySchema = new mongoose.Schema(
  {
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: false }
);

const zoneSchema = new mongoose.Schema(
  {
    zoneName: {
      type: String,
      required: [true, 'Zone name is required'],
      trim: true,
      maxlength: [200, 'Zone name cannot exceed 200 characters'],
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Polygon'],
        default: 'Polygon',
      },
      coordinates: {
        type: [[[Number]]], // Array of arrays of [lng, lat] pairs
        required: [true, 'Polygon coordinates are required'],
      },
    },
    hazardType: {
      type: String,
      required: [true, 'Hazard type is required'],
      enum: {
        values: ['earthquake', 'flood', 'landslide', 'cyclone', 'drought'],
        message: 'Hazard type must be one of: earthquake, flood, landslide, cyclone, drought',
      },
    },
    riskScore: {
      type: Number,
      required: [true, 'Risk score is required'],
      min: [0, 'Risk score cannot be negative'],
      max: [100, 'Risk score cannot exceed 100'],
    },
    riskLevel: {
      type: String,
      required: [true, 'Risk level is required'],
      enum: {
        values: ['red', 'yellow', 'green'],
        message: 'Risk level must be one of: red, yellow, green',
      },
    },
    population: {
      type: Number,
      required: [true, 'Population is required'],
      min: [0, 'Population cannot be negative'],
    },
    carryingCapacity: {
      type: Number,
      required: [true, 'Carrying capacity is required'],
      min: [1, 'Carrying capacity must be at least 1'],
    },
    overcapacityIndex: {
      type: Number,
      default: 0,
    },
    mhiScore: {
      type: Number,
      default: 50,
    },
    drsScore: {
      type: Number,
      default: 50,
    },
    eccCapacity: {
      type: Number,
      default: 8000,
    },
    rainfallMm: {
      type: Number,
      default: 0,
    },
    hasVerifiedHazard: {
      type: Boolean,
      default: false,
    },
    authorityJurisdiction: {
      type: String,
      enum: ['MHA', 'StateDMA', 'DistrictAdmin', 'Municipal'],
      default: 'DistrictAdmin',
    },
    limitingFactor: {
      type: String,
      default: 'Physical Land (RCC)',
    },
    riskHistory: {
      type: [riskHistoryEntrySchema],
      default: [],
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for geospatial queries
zoneSchema.index({ coordinates: '2dsphere' });

// Compound indexes for common filter queries
zoneSchema.index({ hazardType: 1, riskLevel: 1 });
zoneSchema.index({ riskLevel: 1 });

/**
 * Pre-save hook: compute overcapacityIndex = population / carryingCapacity.
 */
zoneSchema.pre('save', function (next) {
  if (this.population != null && this.carryingCapacity != null) {
    this.overcapacityIndex = parseFloat(
      (this.population / this.carryingCapacity).toFixed(2)
    );
  }
  next();
});

/**
 * Clean up JSON output.
 */
zoneSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Zone', zoneSchema);
