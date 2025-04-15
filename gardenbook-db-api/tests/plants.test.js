const request = require('supertest');
const app = require('../src/app');
const plantModel = require('../src/models/plant');
const jwt = require('jsonwebtoken');
require('dotenv').config();

jest.mock('../src/models/plant');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TEST_USER_ID = '60d21b4667d0d8992e610c85';

// Helper function to generate JWT token for testing
const generateTestToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
};

describe('Plants API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/plants', () => {
    test('should return all plants when not authenticated (backward compatibility)', async () => {
      const mockPlants = [
        { id: '1', name: 'Test Plant', scientificName: 'Test Scientific' },
        { id: '2', name: 'Another Plant', scientificName: 'Another Scientific' }
      ];
      
      plantModel.getAllPlants.mockResolvedValue(mockPlants);
      
      const res = await request(app).get('/api/plants');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(2);
      expect(plantModel.getAllPlants).toHaveBeenCalled();
    });

    test('should return user plants when authenticated', async () => {
      const mockPlants = [
        { id: '1', name: 'User Plant', scientificName: 'User Scientific', userId: TEST_USER_ID }
      ];
      
      plantModel.getPlantsByUserId.mockResolvedValue(mockPlants);
      
      const token = generateTestToken(TEST_USER_ID);
      
      const res = await request(app)
        .get('/api/plants')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(1);
      expect(plantModel.getPlantsByUserId).toHaveBeenCalledWith(TEST_USER_ID);
    });
    
    test('should handle database errors', async () => {
      plantModel.getAllPlants.mockRejectedValue(new Error('Database error'));
      
      const res = await request(app).get('/api/plants');
      
      expect(res.statusCode).toEqual(500);
      expect(res.body).toHaveProperty('error');
    });
  });
  
  describe('GET /api/plants/:id', () => {
    test('should return a specific plant', async () => {
      const mockPlant = { id: '1', name: 'Test Plant', scientificName: 'Test Scientific' };
      plantModel.getPlantById.mockResolvedValue(mockPlant);
      
      const res = await request(app).get('/api/plants/1');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', '1');
      expect(res.body.name).toEqual('Test Plant');
    });
    
    test('should filter by userId when authenticated', async () => {
      const mockPlant = { 
        id: '1', 
        name: 'User Plant', 
        scientificName: 'User Scientific',
        userId: TEST_USER_ID 
      };
      
      plantModel.getPlantById.mockResolvedValue(mockPlant);
      
      const token = generateTestToken(TEST_USER_ID);
      
      const res = await request(app)
        .get('/api/plants/1')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', '1');
      expect(plantModel.getPlantById).toHaveBeenCalledWith('1', TEST_USER_ID);
    });
    
    test('should return 404 if plant not found', async () => {
      plantModel.getPlantById.mockResolvedValue(null);
      
      const res = await request(app).get('/api/plants/999');
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error', 'Plant not found');
    });
    
    test('should handle invalid ID errors', async () => {
      plantModel.getPlantById.mockRejectedValue(new Error('Invalid ObjectId'));
      
      const res = await request(app).get('/api/plants/invalid-id');
      
      expect(res.statusCode).toEqual(500);
      expect(res.body).toHaveProperty('error');
    });
  });
  
  describe('POST /api/plants', () => {
    test('should create a new plant when authenticated', async () => {
      const newPlant = {
        name: 'New Plant',
        scientificName: 'New Scientific',
        careLevel: 'EASY',
        waterFrequency: 7
      };
      
      const createdPlant = {
        ...newPlant,
        id: 'new-id',
        userId: TEST_USER_ID
      };
      
      plantModel.createPlant.mockResolvedValue(createdPlant);
      
      const token = generateTestToken(TEST_USER_ID);
      
      const res = await request(app)
        .post('/api/plants')
        .set('Authorization', `Bearer ${token}`)
        .send(newPlant);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id', 'new-id');
      expect(res.body.name).toEqual(newPlant.name);
      expect(res.body.scientificName).toEqual(newPlant.scientificName);
      expect(plantModel.createPlant).toHaveBeenCalledWith(expect.objectContaining({
        ...newPlant,
        userId: TEST_USER_ID
      }));
    });
    
    test('should require authentication', async () => {
      const newPlant = {
        name: 'New Plant',
        scientificName: 'New Scientific',
        careLevel: 'EASY',
        waterFrequency: 7
      };
      
      const res = await request(app)
        .post('/api/plants')
        .send(newPlant);
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error', 'Authentication required');
    });
    
    test('should reject empty request body', async () => {
      const token = generateTestToken(TEST_USER_ID);
      
      const res = await request(app)
        .post('/api/plants')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error', 'Request body is empty or invalid');
    });
    
    test('should handle database errors', async () => {
      const newPlant = {
        name: 'New Plant',
        scientificName: 'New Scientific',
        careLevel: 'EASY',
        waterFrequency: 7
      };
      
      plantModel.createPlant.mockRejectedValue(new Error('Database error'));
      
      const token = generateTestToken(TEST_USER_ID);
      
      const res = await request(app)
        .post('/api/plants')
        .set('Authorization', `Bearer ${token}`)
        .send(newPlant);
      
      expect(res.statusCode).toEqual(500);
      expect(res.body).toHaveProperty('error');
    });
  });
  
  describe('PUT /api/plants/:id', () => {
    test('should update an existing plant when authenticated', async () => {
      const updatedPlant = {
        name: 'Updated Plant',
        scientificName: 'Updated Scientific',
        careLevel: 'MODERATE',
        waterFrequency: 5
      };
      
      const returnedPlant = {
        ...updatedPlant,
        id: '1',
        userId: TEST_USER_ID
      };
      
      plantModel.updatePlant.mockResolvedValue(returnedPlant);
      
      const token = generateTestToken(TEST_USER_ID);
      
      const res = await request(app)
        .put('/api/plants/1')
        .set('Authorization', `Bearer ${token}`)
        .send(updatedPlant);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', '1');
      expect(res.body.name).toEqual(updatedPlant.name);
      expect(res.body.scientificName).toEqual(updatedPlant.scientificName);
      expect(plantModel.updatePlant).toHaveBeenCalledWith('1', updatedPlant, TEST_USER_ID);
    });
    
    test('should require authentication', async () => {
      const updatedPlant = {
        name: 'Updated Plant',
        scientificName: 'Updated Scientific'
      };
      
      const res = await request(app)
        .put('/api/plants/1')
        .send(updatedPlant);
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error', 'Authentication required');
    });
    
    test('should return 404 if plant not found or not owned by user', async () => {
      plantModel.updatePlant.mockResolvedValue(null);
      
      const token = generateTestToken(TEST_USER_ID);
      
      const res = await request(app)
        .put('/api/plants/999')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name'
        });
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error', 'Plant not found or not owned by you');
    });
    
    test('should reject empty request body', async () => {
      const token = generateTestToken(TEST_USER_ID);
      
      const res = await request(app)
        .put('/api/plants/1')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error', 'Request body is empty or invalid');
    });
  });
  
  describe('DELETE /api/plants/:id', () => {
    test('should delete a plant when authenticated', async () => {
      const deletedPlant = {
        id: '1',
        name: 'Deleted Plant',
        userId: TEST_USER_ID
      };
      
      plantModel.deletePlant.mockResolvedValue(deletedPlant);
      
      const token = generateTestToken(TEST_USER_ID);
      
      const res = await request(app)
        .delete('/api/plants/1')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', '1');
      expect(res.body).toHaveProperty('name', 'Deleted Plant');
      expect(plantModel.deletePlant).toHaveBeenCalledWith('1', TEST_USER_ID);
    });
    
    test('should require authentication', async () => {
      const res = await request(app).delete('/api/plants/1');
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error', 'Authentication required');
    });
    
    test('should return 404 if plant not found or not owned by user', async () => {
      plantModel.deletePlant.mockResolvedValue(null);
      
      const token = generateTestToken(TEST_USER_ID);
      
      const res = await request(app)
        .delete('/api/plants/999')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error', 'Plant not found or not owned by you');
    });
    
    test('should handle database errors', async () => {
      plantModel.deletePlant.mockRejectedValue(new Error('Database error'));
      
      const token = generateTestToken(TEST_USER_ID);
      
      const res = await request(app)
        .delete('/api/plants/1')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(500);
      expect(res.body).toHaveProperty('error');
    });
  });
});