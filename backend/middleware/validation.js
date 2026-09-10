const Joi = require('joi');

/**
 * Factory: creates an Express middleware that validates req[property]
 * against the given Joi schema.
 *
 * @param {Joi.ObjectSchema} schema — Joi validation schema
 * @param {'body'|'query'|'params'} property — request property to validate
 * @returns {Function} Express middleware
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,   // Return all errors, not just the first
      stripUnknown: true,  // Remove unknown fields
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: messages,
      });
    }

    // Replace request property with validated (and sanitized) values
    req[property] = value;
    next();
  };
};

// ─── Auth Schemas ────────────────────────────────────────────────

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 100 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'string.max': 'Password cannot exceed 128 characters',
    'any.required': 'Password is required',
  }),
  phone: Joi.string().trim().allow('', null).optional(),
  role: Joi.string().valid('community', 'authority', 'admin', 'official').default('community'),
  authorityLevel: Joi.string().valid('MHA', 'StateDMA', 'DistrictAdmin', 'Municipal').allow(null).optional(),
  assignedZoneId: Joi.string().trim().default('zone_001').optional(),
  location: Joi.object({
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    address: Joi.string().allow('').optional(),
    district: Joi.string().allow('').optional(),
    state: Joi.string().allow('').optional(),
  }).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
  loginType: Joi.string().valid('community', 'authority').optional(),
});

// ─── Zone Query Schemas ──────────────────────────────────────────

const zoneQuerySchema = Joi.object({
  hazardType: Joi.string()
    .valid('earthquake', 'flood', 'landslide', 'cyclone', 'drought')
    .optional(),
  riskLevel: Joi.string()
    .valid('red', 'yellow', 'green')
    .optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

// ─── Relocation Schemas ──────────────────────────────────────────

const approveRelocationSchema = Joi.object({
  status: Joi.string()
    .valid('approved', 'completed')
    .default('approved')
    .messages({
      'any.only': 'Status must be either approved or completed',
    }),
});

// ─── Report Query Schema ─────────────────────────────────────────

const reportQuerySchema = Joi.object({
  format: Joi.string()
    .valid('csv', 'pdf')
    .default('csv')
    .messages({
      'any.only': 'Format must be either csv or pdf',
    }),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  zoneQuerySchema,
  approveRelocationSchema,
  reportQuerySchema,
};
