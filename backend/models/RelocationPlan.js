const mongoose = require('mongoose');

const relocationPlanSchema = new mongoose.Schema(
  {
    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: [true, 'Zone reference is required'],
      index: true,
    },
    urgencyScore: {
      type: Number,
      required: [true, 'Urgency score is required'],
      min: [0, 'Urgency score cannot be negative'],
      max: [100, 'Urgency score cannot exceed 100'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'pending_approval', 'approved', 'in_progress', 'completed', 'rejected'],
        message: 'Invalid status',
      },
      default: 'pending_approval',
    },
    relocationTier: {
      type: String,
      enum: ['immediate', 'short_term', 'medium_term'],
      default: 'immediate',
      index: true,
    },
    timelineEstimate: {
      type: String,
      default: '< 30 Days',
    },
    reason: {
      type: String,
      required: [true, 'Reason for relocation is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    suggestedShelterId: {
      type: String,
      trim: true,
      default: null,
    },
    requiresVerifiedHazard: {
      type: Boolean,
      default: true,
    },
    targetSettlementSites: [
      {
        siteId: String,
        siteName: String,
        location: String,
        topsisScore: Number,
        availableCapacity: Number,
        slopeDegrees: Number,
        waterLpcd: Number,
        limitingFactor: String,
        suitabilityGrade: String,
      },
    ],
    sdmaActionDirectives: {
      type: [String],
      default: [],
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedByName: {
      type: String,
      default: '',
    },
    approvedAuthorityLevel: {
      type: String,
      enum: ['MHA', 'StateDMA', 'DistrictAdmin', 'Municipal', null],
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for sorting by urgency
relocationPlanSchema.index({ urgencyScore: -1 });
// Index for filtering by status
relocationPlanSchema.index({ status: 1 });

/**
 * Clean up JSON output.
 */
relocationPlanSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('RelocationPlan', relocationPlanSchema);
