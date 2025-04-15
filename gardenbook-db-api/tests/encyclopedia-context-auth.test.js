// Mock the dependencies
jest.mock('../src/models/user', () => ({
  getEncyclopedia: jest.fn(),
  updateEncyclopedia: jest.fn(),
  getContextCards: jest.fn(),
  createContextCard: jest.fn(),
  updateContextCard: jest.fn(),
  deleteContextCard: jest.fn()
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
    if (token === 'valid_token_for_user1') {
      req.user = { userId: '507f1f77bcf86cd799439011' };
      next();
    } else if (token === 'valid_token_for_user2') {
      req.user = { userId: '507f1f77bcf86cd799439022' };
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

// Also mock the plant model to avoid issues
jest.mock('../src/models/plant', () => ({
  getAllPlants: jest.fn(),
  getPlantById: jest.fn(),
  createPlant: jest.fn(),
  updatePlant: jest.fn(),
  deletePlant: jest.fn()
}));

const request = require('supertest');
const app = require('../src/app');
const userModel = require('../src/models/user');

// Valid MongoDB ObjectId for testing
const VALID_USER_ID = '507f1f77bcf86cd799439011';
const OTHER_USER_ID = '507f1f77bcf86cd799439022';
const VALID_CARD_ID = '507f1f77bcf86cd799439033';

describe('User Authentication for Encyclopedia and Context Cards', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Encyclopedia endpoints with authentication', () => {
    it('should allow a user to access their own encyclopedia data', async () => {
      userModel.getEncyclopedia.mockResolvedValue('Test encyclopedia data');
      
      const res = await request(app)
        .get(`/api/users/${VALID_USER_ID}/encyclopedia`)
        .set('Authorization', 'Bearer valid_token_for_user1');
        
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('encyclopedia', 'Test encyclopedia data');
    });

    it('should deny access to another user\'s encyclopedia data', async () => {
      const res = await request(app)
        .get(`/api/users/${VALID_USER_ID}/encyclopedia`)
        .set('Authorization', 'Bearer valid_token_for_user2');
        
      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('error', 'You can only access your own encyclopedia data');
    });

    it('should require authentication for encyclopedia access', async () => {
      const res = await request(app)
        .get(`/api/users/${VALID_USER_ID}/encyclopedia`);
        
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error', 'Authentication required');
    });

    it('should allow a user to update their own encyclopedia data', async () => {
      const encyclopediaData = 'Updated encyclopedia data';
      userModel.updateEncyclopedia.mockResolvedValue(encyclopediaData);
      
      const res = await request(app)
        .post(`/api/users/${VALID_USER_ID}/encyclopedia`)
        .set('Authorization', 'Bearer valid_token_for_user1')
        .send({ encyclopedia: encyclopediaData });
        
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('encyclopedia', encyclopediaData);
    });

    it('should deny updates to another user\'s encyclopedia data', async () => {
      const res = await request(app)
        .post(`/api/users/${VALID_USER_ID}/encyclopedia`)
        .set('Authorization', 'Bearer valid_token_for_user2')
        .send({ encyclopedia: 'Test data' });
        
      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('error', 'You can only update your own encyclopedia data');
    });
  });

  describe('Context Cards endpoints with authentication', () => {
    const sampleContextCard = {
      id: VALID_CARD_ID,
      title: 'Test Card',
      content: 'Test content',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should allow a user to get their own context cards', async () => {
      userModel.getContextCards.mockResolvedValue([sampleContextCard]);
      
      const res = await request(app)
        .get(`/api/users/${VALID_USER_ID}/context-cards`)
        .set('Authorization', 'Bearer valid_token_for_user1');
        
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('contextCards');
      expect(res.body.contextCards).toHaveLength(1);
      expect(res.body.contextCards[0]).toHaveProperty('id', VALID_CARD_ID);
    });

    it('should deny access to another user\'s context cards', async () => {
      const res = await request(app)
        .get(`/api/users/${VALID_USER_ID}/context-cards`)
        .set('Authorization', 'Bearer valid_token_for_user2');
        
      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('error', 'You can only access your own context cards');
    });

    it('should allow a user to create a context card for their account', async () => {
      userModel.createContextCard.mockResolvedValue(sampleContextCard);
      
      const res = await request(app)
        .post(`/api/users/${VALID_USER_ID}/context-cards`)
        .set('Authorization', 'Bearer valid_token_for_user1')
        .send({ title: 'Test Card', content: 'Test content' });
        
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('contextCard');
      expect(res.body.contextCard).toHaveProperty('id', VALID_CARD_ID);
    });

    it('should deny creating context cards for another user', async () => {
      const res = await request(app)
        .post(`/api/users/${VALID_USER_ID}/context-cards`)
        .set('Authorization', 'Bearer valid_token_for_user2')
        .send({ title: 'Test Card', content: 'Test content' });
        
      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('error', 'You can only create context cards for your own account');
    });

    it('should allow a user to update their own context card', async () => {
      userModel.updateContextCard.mockResolvedValue({
        ...sampleContextCard,
        title: 'Updated Card',
        content: 'Updated content'
      });
      
      const res = await request(app)
        .put(`/api/users/${VALID_USER_ID}/context-cards/${VALID_CARD_ID}`)
        .set('Authorization', 'Bearer valid_token_for_user1')
        .send({ title: 'Updated Card', content: 'Updated content' });
        
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('contextCard');
      expect(res.body.contextCard).toHaveProperty('title', 'Updated Card');
      expect(res.body.contextCard).toHaveProperty('content', 'Updated content');
    });

    it('should deny updating context cards belonging to another user', async () => {
      const res = await request(app)
        .put(`/api/users/${VALID_USER_ID}/context-cards/${VALID_CARD_ID}`)
        .set('Authorization', 'Bearer valid_token_for_user2')
        .send({ title: 'Updated Card', content: 'Updated content' });
        
      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('error', 'You can only update your own context cards');
    });

    it('should allow a user to delete their own context card', async () => {
      userModel.deleteContextCard.mockResolvedValue(true);
      
      const res = await request(app)
        .delete(`/api/users/${VALID_USER_ID}/context-cards/${VALID_CARD_ID}`)
        .set('Authorization', 'Bearer valid_token_for_user1');
        
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('should deny deleting context cards belonging to another user', async () => {
      const res = await request(app)
        .delete(`/api/users/${VALID_USER_ID}/context-cards/${VALID_CARD_ID}`)
        .set('Authorization', 'Bearer valid_token_for_user2');
        
      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('error', 'You can only delete your own context cards');
    });
  });
}); 