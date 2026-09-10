const mongoose = require('mongoose');

const hazardReportSchema = new mongoose.Schema(
  {
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    citizenName: {
      type: String,
      required: true,
      trim: true,
    },
    zoneId: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    photoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String, default: '' },
    },
    hazardType: {
      type: String,
      enum: ['flood', 'landslide', 'earthquake', 'cyclone', 'subsidence', 'other'],
      default: 'flood',
    },
    status: {
      type: String,
      enum: {
        values: ['pending_review', 'verified', 'rejected'],
        message: 'Status must be pending_review, verified, or rejected',
      },
      default: 'pending_review',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedByName: {
      type: String,
      default: '',
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verificationNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: 'timestamp', updatedAt: 'updatedAt' },
  }
);

module.exports = mongoose.model('HazardReport', hazardReportSchema);
