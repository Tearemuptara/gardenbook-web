const jwtUtils = require('../utils/jwt');
const userModel = require('../models/user');

/**
 * Middleware to authenticate and verify JWT access token from cookies
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateJwt = async (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies?.accessToken;
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Verify token
    const decoded = jwtUtils.verifyAccessToken(token);
    
    // Get user from database
    const user = await userModel.getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('[authenticateJwt] Error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware to check if the user has admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  
  next();
};

/**
 * Middleware to refresh access token using refresh token from cookies
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const refreshAccessToken = async (req, res, next) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    // Verify refresh token
    const decoded = jwtUtils.verifyRefreshToken(refreshToken);
    
    // Get user from database
    const user = await userModel.getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Generate new access token
    const newAccessToken = jwtUtils.generateAccessToken(user);
    
    // Set new access token in cookie
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
    });
    
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('[refreshAccessToken] Error:', error.message);
    // Clear cookies on error
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

module.exports = {
  authenticateJwt,
  isAdmin,
  refreshAccessToken,
}; 