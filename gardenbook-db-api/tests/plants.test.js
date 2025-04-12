// Mock the model before requiring app
jest.mock('../src/models/plant', () => ({
  getAllPlants: jest.fn(),
  getPlantById: jest.fn(),
  createPlant: jest.fn(),
  updatePlant: jest.fn(),
  deletePlant: jest.fn()
}));

const request = require('supertest');
const app = require('../src/app');
const plantModel = require('../src/models/plant');

describe('Plants API', () => {
  // Reset all mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/plants', () => {
    it('should return all plants', async () => {
      const mockPlants = [
        { id: '1', name: 'Test Plant 1', scientificName: 'Test Scientific 1' },
        { id: '2', name: 'Test Plant 2', scientificName: 'Test Scientific 2' }
      ];
      
      plantModel.getAllPlants.mockResolvedValue(mockPlants);
      
      const res = await request(app).get('/api/plants');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toEqual(2);
    });

    it('should handle database errors', async () => {
      plantModel.getAllPlants.mockRejectedValue(new Error('Database error'));
      
      const res = await request(app).get('/api/plants');
      expect(res.statusCode).toEqual(500);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/plants/:id', () => {
    it('should return a plant by id', async () => {
      const mockPlant = { 
        id: '1', 
        name: 'Test Plant', 
        scientificName: 'Test Scientific'
      };
      
      plantModel.getPlantById.mockResolvedValue(mockPlant);
      
      const res = await request(app).get('/api/plants/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', '1');
      expect(res.body).toHaveProperty('name', 'Test Plant');
      expect(res.body).toHaveProperty('scientificName', 'Test Scientific');
    });

    it('should return 404 if plant not found', async () => {
      plantModel.getPlantById.mockResolvedValue(null);
      
      const res = await request(app).get('/api/plants/999');
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error', 'Plant not found');
    });

    it('should handle invalid ObjectId format', async () => {
      plantModel.getPlantById.mockRejectedValue(new Error('Invalid ObjectId'));
      
      const res = await request(app).get('/api/plants/invalid-id');
      expect(res.statusCode).toEqual(500);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/plants', () => {
    it('should create a new plant', async () => {
      const newPlant = {
        name: 'Monstera',
        scientificName: 'Monstera deliciosa',
        careLevel: 'MODERATE',
        waterFrequency: 7
      };
      
      plantModel.createPlant.mockResolvedValue({
        ...newPlant,
        id: 'new-id'
      });
      
      const res = await request(app)
        .post('/api/plants')
        .send(newPlant);
        
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id', 'new-id');
      expect(res.body.name).toEqual(newPlant.name);
      expect(res.body.scientificName).toEqual(newPlant.scientificName);
    });

    it('should reject empty request body', async () => {
      const res = await request(app)
        .post('/api/plants')
        .send({});
        
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error', 'Request body is empty or invalid');
    });

    it('should handle database errors', async () => {
      const newPlant = {
        name: 'Error Plant',
        scientificName: 'Error Scientific Name'
      };
      
      plantModel.createPlant.mockRejectedValue(new Error('Database error'));
      
      const res = await request(app)
        .post('/api/plants')
        .send(newPlant);
        
      expect(res.statusCode).toEqual(500);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/plants/:id', () => {
    it('should update an existing plant', async () => {
      const updatedPlant = {
        name: 'Updated Plant',
        scientificName: 'Updated Scientific Name',
        careLevel: 'DIFFICULT',
        waterFrequency: 3
      };
      
      plantModel.updatePlant.mockResolvedValue({
        ...updatedPlant,
        id: '1'
      });
      
      const res = await request(app)
        .put('/api/plants/1')
        .send(updatedPlant);
        
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', '1');
      expect(res.body.name).toEqual(updatedPlant.name);
      expect(res.body.scientificName).toEqual(updatedPlant.scientificName);
    });

    it('should return 404 if plant not found', async () => {
      plantModel.updatePlant.mockResolvedValue(null);
      
      const res = await request(app)
        .put('/api/plants/999')
        .send({
          name: 'Test',
          scientificName: 'Test',
          careLevel: 'EASY',
          waterFrequency: 7
        });
        
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error', 'Plant not found');
    });

    it('should reject empty request body', async () => {
      const res = await request(app)
        .put('/api/plants/1')
        .send({});
        
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error', 'Request body is empty or invalid');
    });
  });

  describe('DELETE /api/plants/:id', () => {
    it('should delete a plant', async () => {
      const deletedPlant = {
        id: '1',
        name: 'Deleted Plant',
        scientificName: 'Deleted Scientific Name'
      };
      
      plantModel.deletePlant.mockResolvedValue(deletedPlant);
      
      const res = await request(app).delete('/api/plants/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', '1');
      expect(res.body).toHaveProperty('name', 'Deleted Plant');
    });

    it('should return 404 if plant not found', async () => {
      plantModel.deletePlant.mockResolvedValue(null);
      
      const res = await request(app).delete('/api/plants/999');
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error', 'Plant not found');
    });

    it('should handle database errors', async () => {
      plantModel.deletePlant.mockRejectedValue(new Error('Database error'));
      
      const res = await request(app).delete('/api/plants/1');
      expect(res.statusCode).toEqual(500);
      expect(res.body).toHaveProperty('error');
    });
  });
}); 