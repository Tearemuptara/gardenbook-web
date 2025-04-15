const express = require('express');
const router = express.Router();
const userModel = require('../models/user');
const jwtUtils = require('../utils/jwt');
const authMiddleware = require('../middleware/auth');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               displayName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Email already in use
 *       500:
 *         description: Server error
 */
router.post('/register', async (req, res) => {
  console.log('[POST /auth/register] Request received');
  
  try {
    const { username, email, password, displayName } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Username, email, and password are required'
      });
    }
    
    // Check if email is already in use
    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'Email already in use'
      });
    }
    
    // Create user
    const user = await userModel.createUser({
      username,
      email,
      password,
      displayName: displayName || username,
      isVerified: false,
    });
    
    // Remove sensitive data before returning
    const { password: _, ...userWithoutPassword } = user;
    
    console.log(`[POST /auth/register] User registered successfully: ${user.id}`);
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('[POST /auth/register] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate a user and return JWT tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns user data
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', async (req, res) => {
  console.log('[POST /auth/login] Request received');
  
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }
    
    // Authenticate user
    const user = await userModel.authenticateUser(email, password);
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }
    
    // Generate tokens
    const accessToken = jwtUtils.generateAccessToken(user);
    const refreshToken = jwtUtils.generateRefreshToken(user);
    
    // Store refresh token in database
    await userModel.storeRefreshToken(user.id, refreshToken);
    
    // Set tokens as HTTP-only cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    console.log(`[POST /auth/login] User logged in successfully: ${user.id}`);
    res.json({ user });
  } catch (error) {
    console.error('[POST /auth/login] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Generate a new access token using refresh token
 *     responses:
 *       200:
 *         description: New access token generated successfully
 *       401:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Server error
 */
router.post('/refresh', authMiddleware.refreshAccessToken, (req, res) => {
  console.log('[POST /auth/refresh] Access token refreshed successfully');
  res.json({ success: true });
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     description: Invalidate user tokens and clear cookies
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post('/logout', async (req, res) => {
  console.log('[POST /auth/logout] Request received');
  
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies?.refreshToken;
    
    if (refreshToken) {
      // Extract user ID from token
      try {
        const decoded = jwtUtils.verifyRefreshToken(refreshToken);
        
        // Remove refresh token from database
        if (decoded && decoded.userId) {
          await userModel.removeRefreshToken(decoded.userId, refreshToken);
        }
      } catch (error) {
        console.log('[POST /auth/logout] Invalid refresh token, continuing with logout');
      }
    }
    
    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    console.log('[POST /auth/logout] User logged out successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('[POST /auth/logout] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Request password reset
 *     description: Generate a password reset token and send email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset instructions sent
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/reset-password', async (req, res) => {
  console.log('[POST /auth/reset-password] Request received');
  
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }
    
    // Generate reset token
    await userModel.generatePasswordResetToken(email);
    
    // Note: In a real application, send an email with the reset link
    // For now, we'll just return success
    
    console.log(`[POST /auth/reset-password] Password reset token generated for email: ${email}`);
    res.json({
      message: 'Password reset instructions sent to your email'
    });
  } catch (error) {
    console.error('[POST /auth/reset-password] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /auth/set-new-password:
 *   post:
 *     summary: Set new password
 *     description: Reset password using a valid reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.post('/set-new-password', async (req, res) => {
  console.log('[POST /auth/set-new-password] Request received');
  
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({
        error: 'Token and password are required'
      });
    }
    
    // Reset password
    const success = await userModel.resetPassword(token, password);
    
    if (!success) {
      return res.status(401).json({
        error: 'Invalid or expired token'
      });
    }
    
    console.log('[POST /auth/set-new-password] Password reset successful');
    res.json({
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('[POST /auth/set-new-password] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user
 *     description: Get information about the authenticated user
 *     responses:
 *       200:
 *         description: User information
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/me', authMiddleware.authenticateJwt, (req, res) => {
  console.log('[GET /auth/me] Request received');
  
  // User is attached to request by authenticateJwt middleware
  res.json({ user: req.user });
});

module.exports = router; 