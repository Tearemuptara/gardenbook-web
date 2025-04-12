// Mock the model imports first
jest.mock('mongodb');
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Import the actual MongoClient before we set the mock implementation
const { MongoClient, ObjectId } = require('mongodb');

// Create our mocks
const mockToArray = jest.fn();
const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
const mockFindOne = jest.fn();
const mockInsertOne = jest.fn();
const mockFindOneAndUpdate = jest.fn();
const mockFindOneAndDelete = jest.fn();
const mockCollection = {
  find: mockFind,
  findOne: mockFindOne,
  insertOne: mockInsertOne,
  findOneAndUpdate: mockFindOneAndUpdate,
  findOneAndDelete: mockFindOneAndDelete
};
const mockDb = { collection: jest.fn().mockReturnValue(mockCollection) };
const mockClient = {
  connect: jest.fn().mockResolvedValue(undefined),
  db: jest.fn().mockReturnValue(mockDb),
  close: jest.fn().mockResolvedValue(undefined)
};

// Mock the MongoDB constructor
MongoClient.mockImplementation(() => mockClient);
ObjectId.mockImplementation((id) => ({ toString: () => id }));

// Require our MongoDB mock
const mongoMock = require('./mocks/mongodb');
const { mocks, resetAllMocks } = mongoMock;

// Now require the model that uses MongoDB
const plantModel = require('../src/models/plant');

// Helper to create a mock plant object
function createMockPlant(id, name, scientificName = 'Scientific Name') {
  return {
    _id: { toString: () => id },
    name,
    scientificName,
    careLevel: 'EASY',
    waterFrequency: 7
  };
}

describe('Plant Model', () => {
  beforeEach(() => {
    resetAllMocks();
    
    // Override connect to avoid connection issues
    plantModel.connect = jest.fn().mockResolvedValue(undefined);
    plantModel.isConnected = true;
  });
  
  describe('getAllPlants', () => {
    it('should return all plants', async () => {
      const mockPlants = [
        createMockPlant('1', 'Plant 1'),
        createMockPlant('2', 'Plant 2')
      ];
      
      mocks.toArray.mockResolvedValue(mockPlants);
      
      const result = await plantModel.getAllPlants();
      
      expect(mocks.find).toHaveBeenCalledWith({});
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', '1');
      expect(result[0]).toHaveProperty('name', 'Plant 1');
      
      // Make sure _id is removed from the result
      expect(result[0]._id).toBeUndefined();
    });
    
    it('should throw an error when the database operation fails', async () => {
      mocks.toArray.mockRejectedValue(new Error('Database error'));
      
      await expect(plantModel.getAllPlants()).rejects.toThrow('Database error');
    });
  });
  
  describe('getPlantById', () => {
    it('should return a plant by id', async () => {
      const mockPlant = createMockPlant('1', 'Plant 1');
      
      mocks.findOne.mockResolvedValue(mockPlant);
      
      const result = await plantModel.getPlantById('1');
      
      expect(mocks.findOne).toHaveBeenCalled();
      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('name', 'Plant 1');
      
      // Make sure _id is removed from the result
      expect(result._id).toBeUndefined();
    });
    
    it('should return null if plant not found', async () => {
      mocks.findOne.mockResolvedValue(null);
      
      const result = await plantModel.getPlantById('999');
      
      expect(result).toBeNull();
    });
  });
  
  describe('createPlant', () => {
    it('should create a new plant', async () => {
      const plantData = { name: 'New Plant', scientificName: 'New Scientific Name' };
      const insertedId = { toString: () => 'new-id' };
      
      mocks.insertOne.mockResolvedValue({ insertedId });
      
      const result = await plantModel.createPlant(plantData);
      
      expect(mocks.insertOne).toHaveBeenCalledWith(plantData);
      expect(result).toHaveProperty('id', 'new-id');
      expect(result).toHaveProperty('name', 'New Plant');
    });
  });
  
  describe('updatePlant', () => {
    it('should update an existing plant', async () => {
      const plantData = { name: 'Updated Plant' };
      const updatedPlant = createMockPlant('1', 'Updated Plant');
      
      mocks.findOneAndUpdate.mockResolvedValue({ value: updatedPlant });
      
      const result = await plantModel.updatePlant('1', plantData);
      
      expect(mocks.findOneAndUpdate).toHaveBeenCalled();
      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('name', 'Updated Plant');
      
      // Make sure _id is removed from the result
      expect(result._id).toBeUndefined();
    });
    
    it('should return null if plant not found', async () => {
      mocks.findOneAndUpdate.mockResolvedValue({ value: null });
      
      const result = await plantModel.updatePlant('999', { name: 'Test' });
      
      expect(result).toBeNull();
    });
  });
  
  describe('deletePlant', () => {
    it('should delete a plant', async () => {
      const deletedPlant = createMockPlant('1', 'Deleted Plant');
      
      mocks.findOneAndDelete.mockResolvedValue({ value: deletedPlant });
      
      const result = await plantModel.deletePlant('1');
      
      expect(mocks.findOneAndDelete).toHaveBeenCalled();
      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('name', 'Deleted Plant');
      
      // Make sure _id is removed from the result
      expect(result._id).toBeUndefined();
    });
    
    it('should return null if plant not found', async () => {
      mocks.findOneAndDelete.mockResolvedValue({ value: null });
      
      const result = await plantModel.deletePlant('999');
      
      expect(result).toBeNull();
    });
  });
  
  describe('closeConnection', () => {
    it('should close the database connection', async () => {
      await plantModel.closeConnection();
      
      expect(mocks.client.close).toHaveBeenCalled();
    });
  });
}); 