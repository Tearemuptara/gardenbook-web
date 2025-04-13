// Mock the model before requiring app
jest.mock('../src/models/user', () => ({
  getUserById: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  getEncyclopedia: jest.fn(),
  updateEncyclopedia: jest.fn()
}));

const request = require('supertest');
const app = require('../src/app');
const userModel = require('../src/models/user');

describe('Users API', () => {
  // Reset all mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users/:id/encyclopedia', () => {
    it('should return encyclopedia data for a user', async () => {
      userModel.getEncyclopedia.mockResolvedValue('Test encyclopedia data');
      
      const res = await request(app).get('/api/users/1/encyclopedia');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('encyclopedia', 'Test encyclopedia data');
    });

    it('should return 404 if user not found', async () => {
      userModel.getEncyclopedia.mockResolvedValue(null);
      
      const res = await request(app).get('/api/users/999/encyclopedia');
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error', 'User not found');
    });

    it('should handle database errors', async () => {
      userModel.getEncyclopedia.mockRejectedValue(new Error('Database error'));
      
      const res = await request(app).get('/api/users/1/encyclopedia');
      expect(res.statusCode).toEqual(500);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/users/:id/encyclopedia', () => {
    it('should update encyclopedia data for a user', async () => {
      const encyclopediaData = 'Updated encyclopedia data';
      
      userModel.updateEncyclopedia.mockResolvedValue(encyclopediaData);
      
      const res = await request(app)
        .post('/api/users/1/encyclopedia')
        .send({ encyclopedia: encyclopediaData });
        
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('encyclopedia', encyclopediaData);
    });

    it('should return 400 if encyclopedia data is missing', async () => {
      const res = await request(app)
        .post('/api/users/1/encyclopedia')
        .send({});
        
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error', 'Encyclopedia data is required');
    });

    it('should return 404 if user not found', async () => {
      userModel.updateEncyclopedia.mockResolvedValue(null);
      
      const res = await request(app)
        .post('/api/users/999/encyclopedia')
        .send({ encyclopedia: 'Test data' });
        
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error', 'User not found');
    });

    it('should handle database errors', async () => {
      userModel.updateEncyclopedia.mockRejectedValue(new Error('Database error'));
      
      const res = await request(app)
        .post('/api/users/1/encyclopedia')
        .send({ encyclopedia: 'Test data' });
        
      expect(res.statusCode).toEqual(500);
      expect(res.body).toHaveProperty('error');
    });
  });
}); 