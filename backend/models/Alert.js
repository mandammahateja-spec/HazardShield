const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    zoneId: {
      type: String,
      required: true,
      trim: true,
    },
    zoneName: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'critical',
    },
    dispatchedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dispatchedByName: {
      type: String,
      default: 'Authority Command Center',
    },
    channels: {
      type: [String],
      enum: ['sms', 'email', 'cell_broadcast'],
      default: ['sms', 'email'],
    },
    recipientsCount: {
      type: Number,
      default: 0,
    },
    recipients: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        phone: String,
        email: String,
        status: { type: String, default: 'sent' }, // 'sent' | 'simulated_sandbox' | 'failed'
      },
    ],
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
);

module.exports = mongoose.model('Alert', alertSchema);
