const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Default secret key - should be replaced with environment variable in production
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_key_dev';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_key_dev';

// Token expiration times (in seconds)
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d'; // 7 days

/**
 * Generate a JWT access token for a user
 * @param {Object} user - User object with id and role properties
 * @returns {String} JWT access token
 */
const generateAccessToken = (user) => {
  if (!user || !user.id) {
    throw new Error('User ID is required to generate access token');
  }

  return jwt.sign(
    {
      userId: user.id,
      role: user.role || 'user',
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

/**
 * Generate a JWT refresh token for a user
 * @param {Object} user - User object with id property
 * @returns {String} JWT refresh token
 */
const generateRefreshToken = (user) => {
  if (!user || !user.id) {
    throw new Error('User ID is required to generate refresh token');
  }

  return jwt.sign(
    {
      userId: user.id,
      tokenType: 'refresh',
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};

/**
 * Verify a JWT access token
 * @param {String} token - JWT access token to verify
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  if (!token) {
    throw new Error('Access token is required');
  }

  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (error) {
    throw new Error(`Invalid access token: ${error.message}`);
  }
};

/**
 * Verify a JWT refresh token
 * @param {String} token - JWT refresh token to verify
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  if (!token) {
    throw new Error('Refresh token is required');
  }

  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new Error(`Invalid refresh token: ${error.message}`);
  }
};

/**
 * Generate a random token
 * @param {Number} bytes - Number of bytes to generate
 * @returns {String} Random token as hexadecimal string
 */
const generateRandomToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateRandomToken,
}; 