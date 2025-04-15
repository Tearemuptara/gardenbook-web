const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const authRoutes = require('../src/routes/auth');
const userModel = require('../src/models/user');
const jwtUtils = require('../src/utils/jwt');
const authMiddleware = require('../src/middleware/auth');

// Mock dependencies
jest.mock('../src/models/user');
jest.mock('../src/utils/jwt');
jest.mock('../src/middleware/auth');

// Setup express app for testing
const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use('/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      // Mock user creation
      const mockUser = {
        id: '12345',
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'user',
        password: 'hashedpassword'
      };
      
      userModel.getUserByEmail.mockResolvedValue(null);
      userModel.createUser.mockResolvedValue(mockUser);
      
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'securepassword',
          displayName: 'Test User'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', mockUser.id);
      expect(response.body).toHaveProperty('username', mockUser.username);
      expect(response.body).not.toHaveProperty('password');
      expect(userModel.createUser).toHaveBeenCalledWith(expect.objectContaining({
        username: 'testuser',
        email: 'test@example.com',
        password: 'securepassword'
      }));
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser'
          // Missing email and password
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(userModel.createUser).not.toHaveBeenCalled();
    });

    it('should return 409 for existing email', async () => {
      userModel.getUserByEmail.mockResolvedValue({
        id: 'existing-id',
        email: 'test@example.com'
      });
      
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'securepassword'
        });
      
      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Email already in use');
      expect(userModel.createUser).not.toHaveBeenCalled();
    });
  });

  describe('POST /auth/login', () => {
    it('should login user successfully and set cookies', async () => {
      // Mock user authentication
      const mockUser = {
        id: '12345',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };
      
      userModel.authenticateUser.mockResolvedValue(mockUser);
      jwtUtils.generateAccessToken.mockReturnValue('mock-access-token');
      jwtUtils.generateRefreshToken.mockReturnValue('mock-refresh-token');
      userModel.storeRefreshToken.mockResolvedValue(true);
      
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'correctpassword'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toEqual(mockUser);
      expect(userModel.authenticateUser).toHaveBeenCalledWith('test@example.com', 'correctpassword');
      expect(jwtUtils.generateAccessToken).toHaveBeenCalledWith(mockUser);
      expect(jwtUtils.generateRefreshToken).toHaveBeenCalledWith(mockUser);
      expect(userModel.storeRefreshToken).toHaveBeenCalledWith(mockUser.id, 'mock-refresh-token');
      
      // Check cookies
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'].length).toBe(2);
      expect(response.headers['set-cookie'][0]).toContain('accessToken');
      expect(response.headers['set-cookie'][1]).toContain('refreshToken');
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com'
          // Missing password
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(userModel.authenticateUser).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid credentials', async () => {
      userModel.authenticateUser.mockResolvedValue(null);
      
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid email or password');
      expect(jwtUtils.generateAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh the access token', async () => {
      // Mock the middleware
      authMiddleware.refreshAccessToken.mockImplementation((req, res, next) => {
        next();
      });
      
      const response = await request(app)
        .post('/auth/refresh');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(authMiddleware.refreshAccessToken).toHaveBeenCalled();
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout user and clear cookies', async () => {
      // Set up mocks for logout
      const mockRefreshToken = 'valid-refresh-token';
      const mockDecoded = { userId: '12345' };
      
      jwtUtils.verifyRefreshToken.mockReturnValue(mockDecoded);
      userModel.removeRefreshToken.mockResolvedValue(true);
      
      const response = await request(app)
        .post('/auth/logout')
        .set('Cookie', [`refreshToken=${mockRefreshToken}`]);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(jwtUtils.verifyRefreshToken).toHaveBeenCalledWith(mockRefreshToken);
      expect(userModel.removeRefreshToken).toHaveBeenCalledWith(mockDecoded.userId, mockRefreshToken);
      
      // Check cookies are cleared
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'].length).toBe(2);
      expect(response.headers['set-cookie'][0]).toContain('accessToken=;');
      expect(response.headers['set-cookie'][1]).toContain('refreshToken=;');
    });

    it('should handle logout even with invalid refresh token', async () => {
      jwtUtils.verifyRefreshToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      const response = await request(app)
        .post('/auth/logout')
        .set('Cookie', ['refreshToken=invalid-token']);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(jwtUtils.verifyRefreshToken).toHaveBeenCalled();
      expect(userModel.removeRefreshToken).not.toHaveBeenCalled();
      
      // Cookies should still be cleared
      expect(response.headers['set-cookie']).toBeDefined();
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should generate a password reset token', async () => {
      const mockEmail = 'test@example.com';
      const mockResetResult = {
        id: '12345',
        email: mockEmail,
        resetPasswordToken: 'reset-token',
        resetPasswordExpires: new Date()
      };
      
      userModel.generatePasswordResetToken.mockResolvedValue(mockResetResult);
      
      const response = await request(app)
        .post('/auth/reset-password')
        .send({ email: mockEmail });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(userModel.generatePasswordResetToken).toHaveBeenCalledWith(mockEmail);
    });

    it('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/auth/reset-password')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(userModel.generatePasswordResetToken).not.toHaveBeenCalled();
    });
  });

  describe('POST /auth/set-new-password', () => {
    it('should reset password with valid token', async () => {
      const mockToken = 'valid-reset-token';
      const mockPassword = 'new-password';
      
      userModel.resetPassword.mockResolvedValue(true);
      
      const response = await request(app)
        .post('/auth/set-new-password')
        .send({
          token: mockToken,
          password: mockPassword
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(userModel.resetPassword).toHaveBeenCalledWith(mockToken, mockPassword);
    });

    it('should return 400 if token or password is missing', async () => {
      const response = await request(app)
        .post('/auth/set-new-password')
        .send({
          token: 'valid-token'
          // Missing password
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(userModel.resetPassword).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid or expired', async () => {
      userModel.resetPassword.mockResolvedValue(false);
      
      const response = await request(app)
        .post('/auth/set-new-password')
        .send({
          token: 'invalid-token',
          password: 'new-password'
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid or expired token');
    });
  });

  describe('GET /auth/me', () => {
    it('should return authenticated user info', async () => {
      // Mock the middleware to set req.user
      const mockUser = { id: '12345', username: 'testuser', role: 'user' };
      
      authMiddleware.authenticateJwt.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });
      
      const response = await request(app)
        .get('/auth/me');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user', mockUser);
      expect(authMiddleware.authenticateJwt).toHaveBeenCalled();
    });
  });
}); 