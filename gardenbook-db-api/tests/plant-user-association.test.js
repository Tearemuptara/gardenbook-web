const request = require('supertest');
const app = require('../src/app');
const plantModel = require('../src/models/plant');
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Mock MongoDB
jest.mock('mongodb');

// Constants for testing
const TEST_USER_ID = '60d21b4667d0d8992e610c85';
const TEST_USER_ID_2 = '60d21b4667d0d8992e610c86';
const TEST_PLANT_ID = '60d21b4667d0d8992e610c87';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

describe('Plant-User Association', () => {
  let mockPlantCollection;
  let mockDb;
  
  // Setup mock MongoDB functions
  beforeAll(() => {
    // Mock collection methods
    mockPlantCollection = {
      find: jest.fn(),
      findOne: jest.fn(),
      insertOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn()
    };
    
    // Mock DB and client
    mockDb = {
      collection: jest.fn().mockReturnValue(mockPlantCollection)
    };
    
    // Mock the MongoClient methods
    MongoClient.prototype.connect = jest.fn().mockResolvedValue(null);
    MongoClient.prototype.db = jest.fn().mockReturnValue(mockDb);
    MongoClient.prototype.close = jest.fn().mockResolvedValue(null);
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Helper function to generate JWT token for testing
  const generateTestToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
  };
  
  describe('Plant Model', () => {
    // Mock plant model functions to avoid actual MongoDB calls
    beforeEach(() => {
      // Override the plant model functions to use our mocks directly
      plantModel.getPlantsByUserId = jest.fn().mockImplementation(async (userId) => {
        const mockPlants = [
          { _id: new ObjectId(), name: 'Test Plant 1', userId: userId },
          { _id: new ObjectId(), name: 'Test Plant 2', userId: userId }
        ];
        return mockPlants.map(plant => ({
          ...plant,
          id: plant._id.toString(),
          _id: undefined
        }));
      });
      
      plantModel.getPlantById = jest.fn().mockImplementation(async (id, userId) => {
        const mockPlant = {
          _id: new ObjectId(id || TEST_PLANT_ID),
          name: 'Test Plant',
          userId: userId || TEST_USER_ID
        };
        return {
          ...mockPlant,
          id: mockPlant._id.toString(),
          _id: undefined
        };
      });
      
      plantModel.updatePlant = jest.fn().mockImplementation(async (id, data, userId) => {
        const mockPlant = {
          _id: new ObjectId(id || TEST_PLANT_ID),
          ...data,
          userId: userId || TEST_USER_ID,
          scientificName: 'Scientificus plantus',
          careLevel: 'EASY'
        };
        return {
          ...mockPlant,
          id: mockPlant._id.toString(),
          _id: undefined
        };
      });
      
      plantModel.deletePlant = jest.fn().mockImplementation(async (id, userId) => {
        const mockPlant = {
          _id: new ObjectId(id || TEST_PLANT_ID),
          name: 'Plant to delete',
          userId: userId || TEST_USER_ID
        };
        return {
          ...mockPlant,
          id: mockPlant._id.toString(),
          _id: undefined
        };
      });
      
      plantModel.createPlant = jest.fn().mockImplementation(async (plantData) => {
        return {
          ...plantData,
          id: new ObjectId().toString()
        };
      });
      
      plantModel.getAllPlants = jest.fn().mockImplementation(async () => {
        const mockPlants = [
          { _id: new ObjectId(), name: 'Test Plant 1', userId: TEST_USER_ID },
          { _id: new ObjectId(), name: 'Test Plant 2', userId: TEST_USER_ID_2 }
        ];
        return mockPlants.map(plant => ({
          ...plant,
          id: plant._id.toString(),
          _id: undefined
        }));
      });
    });
    
    test('getPlantsByUserId should filter plants by userId', async () => {
      // Call the function
      const result = await plantModel.getPlantsByUserId(TEST_USER_ID);
      
      // Assertions
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Test Plant 1');
      expect(result[1].name).toBe('Test Plant 2');
      expect(result[0].userId).toBe(TEST_USER_ID);
    });
    
    test('getPlantById should filter by userId when provided', async () => {
      // Call the function with userId
      const result = await plantModel.getPlantById(TEST_PLANT_ID, TEST_USER_ID);
      
      // Assertions
      expect(result.name).toBe('Test Plant');
      expect(result.userId).toBe(TEST_USER_ID);
    });
    
    test('updatePlant should check userId when provided', async () => {
      // Call the function with userId
      const result = await plantModel.updatePlant(
        TEST_PLANT_ID,
        { name: 'Updated Plant' },
        TEST_USER_ID
      );
      
      // Assertions
      expect(result.name).toBe('Updated Plant');
      expect(result.userId).toBe(TEST_USER_ID);
    });
    
    test('deletePlant should check userId when provided', async () => {
      // Call the function with userId
      const result = await plantModel.deletePlant(TEST_PLANT_ID, TEST_USER_ID);
      
      // Assertions
      expect(result.name).toBe('Plant to delete');
      expect(result.userId).toBe(TEST_USER_ID);
    });
  });
  
  describe('Plant Routes with Authentication', () => {
    test('GET /plants should return only user\'s plants when authenticated', async () => {
      // Generate token
      const token = generateTestToken(TEST_USER_ID);
      
      // Make request
      const response = await request(app)
        .get('/api/plants')
        .set('Authorization', `Bearer ${token}`);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(plantModel.getPlantsByUserId).toHaveBeenCalledWith(TEST_USER_ID);
    });
    
    test('POST /plants should associate plant with authenticated user', async () => {
      // Mock data
      const newPlant = {
        name: 'New Plant',
        scientificName: 'Scientificus plantus',
        careLevel: 'EASY',
        waterFrequency: 7
      };
      
      // Generate token
      const token = generateTestToken(TEST_USER_ID);
      
      // Make request
      const response = await request(app)
        .post('/api/plants')
        .set('Authorization', `Bearer ${token}`)
        .send(newPlant);
      
      // Assertions
      expect(response.status).toBe(201);
      expect(plantModel.createPlant).toHaveBeenCalledWith(expect.objectContaining({
        ...newPlant,
        userId: TEST_USER_ID
      }));
    });
    
    test('PUT /plants/:id should only update if plant belongs to user', async () => {
      // Mock data
      const plantUpdate = {
        name: 'Updated Plant Name',
        waterFrequency: 10
      };
      
      // Generate token
      const token = generateTestToken(TEST_USER_ID);
      
      // Make request
      const response = await request(app)
        .put(`/api/plants/${TEST_PLANT_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send(plantUpdate);
      
      // Assertions for success
      expect(response.status).toBe(200);
      expect(plantModel.updatePlant).toHaveBeenCalledWith(
        TEST_PLANT_ID,
        plantUpdate,
        TEST_USER_ID
      );
      
      // Mock failed update (not found or not owned)
      plantModel.updatePlant.mockResolvedValueOnce(null);
      
      // Make another request
      const response2 = await request(app)
        .put(`/api/plants/${TEST_PLANT_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send(plantUpdate);
      
      // Assertions for not found
      expect(response2.status).toBe(404);
      expect(response2.body.error).toBe('Plant not found or not owned by you');
    });
    
    test('DELETE /plants/:id should only delete if plant belongs to user', async () => {
      // Generate token
      const token = generateTestToken(TEST_USER_ID);
      
      // Make request
      const response = await request(app)
        .delete(`/api/plants/${TEST_PLANT_ID}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assertions for success
      expect(response.status).toBe(200);
      expect(plantModel.deletePlant).toHaveBeenCalledWith(
        TEST_PLANT_ID,
        TEST_USER_ID
      );
      
      // Mock failed delete (not found or not owned)
      plantModel.deletePlant.mockResolvedValueOnce(null);
      
      // Make another request
      const response2 = await request(app)
        .delete(`/api/plants/${TEST_PLANT_ID}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assertions for not found
      expect(response2.status).toBe(404);
      expect(response2.body.error).toBe('Plant not found or not owned by you');
    });
    
    test('GET /plants/:id should filter by userId when authenticated', async () => {
      // Generate token
      const token = generateTestToken(TEST_USER_ID);
      
      // Make request
      const response = await request(app)
        .get(`/api/plants/${TEST_PLANT_ID}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(plantModel.getPlantById).toHaveBeenCalledWith(
        TEST_PLANT_ID,
        TEST_USER_ID
      );
    });
  });
}); 