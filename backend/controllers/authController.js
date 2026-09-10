const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { blacklistToken } = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Supports both Community and Authority registration:
 * - Community: name, phone/email, password, assignedZoneId -> role: "community"
 * - Authority: name, email, password, authorityLevel ("MHA" | "StateDMA" | "DistrictAdmin" | "Municipal") -> role: "authority"
 */
const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role = 'community',
      authorityLevel = null,
      assignedZoneId = 'zone_001',
      location = {},
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required.',
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists.',
      });
    }

    // Determine clean role & authorityLevel
    let finalRole = role;
    let finalAuthorityLevel = authorityLevel;

    if (role === 'admin' || role === 'official') {
      finalRole = 'authority';
      if (!finalAuthorityLevel) {
        finalAuthorityLevel = role === 'admin' ? 'MHA' : 'DistrictAdmin';
      }
    } else if (role === 'authority') {
      if (!finalAuthorityLevel) {
        finalAuthorityLevel = 'DistrictAdmin'; // Default authority tier
      }
    } else {
      finalRole = 'community';
      finalAuthorityLevel = null;
    }

    // Create user (password is hashed via pre-save hook)
    const user = await User.create({
      name,
      email,
      phone: phone || '',
      passwordHash: password,
      role: finalRole,
      authorityLevel: finalAuthorityLevel,
      assignedZoneId,
      location: {
        latitude: location.latitude || 19.0760,
        longitude: location.longitude || 72.8777,
        address: location.address || '',
        district: location.district || 'Mumbai Suburban',
        state: location.state || 'Maharashtra',
      },
    });

    const jwtSecret = process.env.JWT_SECRET || 'hazardshield_jwt_secret_fallback_key_2026';

    // Generate JWT including role + authorityLevel
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        authorityLevel: user.authorityLevel,
        assignedZoneId: user.assignedZoneId,
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      success: true,
      data: {
        user,
        admin: user, // backward-compatibility
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Dual-role authentication: accepts "loginType": "community" | "authority" (optional)
 * Validates credentials and returns JWT with role and authorityLevel.
 */
const login = async (req, res, next) => {
  try {
    const { email, password, loginType } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password.',
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    // Normalize user role
    const normalizedRole = (user.role === 'admin' || user.role === 'official') ? 'authority' : user.role;

    // If caller specified loginType, enforce role match
    if (loginType) {
      if (loginType === 'authority' && normalizedRole !== 'authority') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Authority login required for this portal.',
        });
      }
      if (loginType === 'community' && normalizedRole !== 'community') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Community citizen login required for this portal.',
        });
      }
    }

    const authorityLevel = user.authorityLevel || (user.role === 'admin' ? 'MHA' : user.role === 'official' ? 'DistrictAdmin' : null);

    const jwtSecret = process.env.JWT_SECRET || 'hazardshield_jwt_secret_fallback_key_2026';

    // Generate JWT token with full identity payload
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        name: user.name,
        role: normalizedRole,
        authorityLevel,
        assignedZoneId: user.assignedZoneId,
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(200).json({
      success: true,
      data: {
        user,
        admin: user, // backward-compatibility for existing tests
        token,
        role: normalizedRole,
        authorityLevel,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Returns current authenticated profile.
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Invalidate current token by blacklisting.
 */
const logout = async (req, res, next) => {
  try {
    const token = req.token;
    if (token) {
      blacklistToken(token);
    }

    res.status(200).json({
      success: true,
      data: { message: 'Successfully logged out.' },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getMe };
