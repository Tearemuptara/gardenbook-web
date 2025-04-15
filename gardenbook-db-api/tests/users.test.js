// Mock the model before requiring app
jest.mock('../src/models/user', () => ({
  getUserById: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  getEncyclopedia: jest.fn(),
  updateEncyclopedia: jest.fn()
}));

// Mock the auth middleware
jest.mock('../src/middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    // If authorization header is present, extract the token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Simulate token verification for our test tokens
    if (token === 'valid_token') {
      // For testing purposes, set userId to match the requested ID in the URL
      // This allows testing paths where user is trying to access their own data
      // but the user doesn't exist in the database
      req.user = { userId: req.params.id || '507f1f77bcf86cd799439011' };
      next();
    } else {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }),
  authenticateJwt: jest.fn((req, res, next) => next()),
  isAdmin: jest.fn((req, res, next) => next()),
  refreshAccessToken: jest.fn((req, res, next) => next()),
  optionalAuthentication: jest.fn((req, res, next) => next())
}));

const request = require('supertest');
const app = require('../src/app');
const userModel = require('../src/models/user');

// Valid MongoDB ObjectId for testing
const TEST_USER_ID = '507f1f77bcf86cd799439011';
const NONEXISTENT_USER_ID = '507f1f77bcf86cd799439012';

describe('Users API', () => {
  // Reset all mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users/:id/encyclopedia', () => {
    it('should return encyclopedia data for a user', async () => {
      userModel.getEncyclopedia.mockResolvedValue('Test encyclopedia data');
      
      const res = await request(app)
        .get(`/api/users/${TEST_USER_ID}/encyclopedia`)
        .set('Authorization', 'Bearer valid_token');
        
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('encyclopedia', 'Test encyclopedia data');
    });

    it('should return 404 if user not found', async () => {
      userModel.getEncyclopedia.mockResolvedValue(null);
      
      const res = await request(app)
        .get(`/api/users/${NONEXISTENT_USER_ID}/encyclopedia`)
        .set('Authorization', 'Bearer valid_token');
        
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error', 'User not found');
    });

    it('should handle database errors', async () => {
      userModel.getEncyclopedia.mockRejectedValue(new Error('Database error'));
      
      const res = await request(app)
        .get(`/api/users/${TEST_USER_ID}/encyclopedia`)
        .set('Authorization', 'Bearer valid_token');
        
      expect(res.statusCode).toEqual(500);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/users/:id/encyclopedia', () => {
    it('should update encyclopedia data for a user', async () => {
      const encyclopediaData = 'Updated encyclopedia data';
      
      userModel.updateEncyclopedia.mockResolvedValue(encyclopediaData);
      
      const res = await request(app)
        .post(`/api/users/${TEST_USER_ID}/encyclopedia`)
        .set('Authorization', 'Bearer valid_token')
        .send({ encyclopedia: encyclopediaData });
        
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('encyclopedia', encyclopediaData);
    });

    it('should return 400 if encyclopedia data is missing', async () => {
      const res = await request(app)
        .post(`/api/users/${TEST_USER_ID}/encyclopedia`)
        .set('Authorization', 'Bearer valid_token')
        .send({});
        
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error', 'Encyclopedia data is required');
    });

    it('should return 404 if user not found', async () => {
      userModel.updateEncyclopedia.mockResolvedValue(null);
      
      const res = await request(app)
        .post(`/api/users/${NONEXISTENT_USER_ID}/encyclopedia`)
        .set('Authorization', 'Bearer valid_token')
        .send({ encyclopedia: 'Test data' });
        
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error', 'User not found');
    });

    it('should handle database errors', async () => {
      userModel.updateEncyclopedia.mockRejectedValue(new Error('Database error'));
      
      const res = await request(app)
        .post(`/api/users/${TEST_USER_ID}/encyclopedia`)
        .set('Authorization', 'Bearer valid_token')
        .send({ encyclopedia: 'Test data' });
        
      expect(res.statusCode).toEqual(500);
      expect(res.body).toHaveProperty('error');
    });
  });
}); 