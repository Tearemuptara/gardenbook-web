const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // For development only

/**
 * Authentication middleware to verify JWT tokens
 */
const authenticateToken = (req, res, next) => {
  // Get the authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format

  if (!token) {
    console.log('[authenticateToken] No token provided');
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('[authenticateToken] Invalid token:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Set user information on the request object
    req.user = user; // Contains userId and possibly other user info
    next();
  });
};

/**
 * Optional authentication middleware that doesn't reject the request if no token is provided
 * Instead, it just attaches the user info if a valid token is present
 */
const optionalAuthentication = (req, res, next) => {
  // Get the authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format

  if (!token) {
    // No token, but that's ok - proceed without user info
    next();
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) {
      // Valid token, set user info
      req.user = user;
    }
    // Proceed regardless of token validity
    next();
  });
};

module.exports = {
  authenticateToken,
  optionalAuthentication
}; 