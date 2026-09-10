const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: {
        values: ['community', 'authority', 'admin', 'official'], // 'admin'/'official' kept for backward-compatibility
        message: 'Role must be either community or authority',
      },
      default: 'community',
    },
    authorityLevel: {
      type: String,
      enum: {
        values: ['MHA', 'StateDMA', 'DistrictAdmin', 'Municipal', null],
        message: 'Invalid authority level',
      },
      default: null,
    },
    assignedZoneId: {
      type: String,
      trim: true,
      default: 'zone_001',
    },
    location: {
      latitude: { type: Number, default: 19.0760 },
      longitude: { type: Number, default: 72.8777 },
      address: { type: String, default: '' },
      district: { type: String, default: 'Mumbai Suburban' },
      state: { type: String, default: 'Maharashtra' },
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

/**
 * Pre-save hook: hash password before saving.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare password helper method.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Remove sensitive credentials from JSON representations.
 */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
