// Mock the model imports first
jest.mock('mongodb');
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Import the actual MongoClient before we set the mock implementation
const { MongoClient, ObjectId } = require('mongodb');

// Create our mocks
const mockFindOne = jest.fn();
const mockInsertOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockFindOneAndUpdate = jest.fn();
const mockCollection = {
  findOne: mockFindOne,
  insertOne: mockInsertOne,
  updateOne: mockUpdateOne,
  findOneAndUpdate: mockFindOneAndUpdate
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
const userModel = require('../src/models/user');

// Helper to create a mock user object
function createMockUser(id, username, encyclopedia = '') {
  return {
    _id: { toString: () => id },
    username,
    encyclopedia,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

describe('User Model', () => {
  beforeEach(() => {
    resetAllMocks();
    
    // Override connect to avoid connection issues
    userModel.connect = jest.fn().mockResolvedValue(undefined);
    userModel.isConnected = true;
  });
  
  describe('getUserById', () => {
    it('should return a user by id', async () => {
      const mockUser = createMockUser('1', 'testuser', 'test encyclopedia');
      
      mocks.findOne.mockResolvedValue(mockUser);
      
      const result = await userModel.getUserById('1');
      
      expect(mocks.findOne).toHaveBeenCalled();
      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('username', 'testuser');
      expect(result).toHaveProperty('encyclopedia', 'test encyclopedia');
      
      // Make sure _id is removed from the result
      expect(result._id).toBeUndefined();
    });
    
    it('should return null if user not found', async () => {
      mocks.findOne.mockResolvedValue(null);
      
      const result = await userModel.getUserById('999');
      
      expect(result).toBeNull();
    });
  });
  
  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = { username: 'newuser' };
      const insertedId = { toString: () => 'new-id' };
      
      mocks.insertOne.mockResolvedValue({ insertedId });
      
      const result = await userModel.createUser(userData);
      
      expect(mocks.insertOne).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'new-id');
      expect(result).toHaveProperty('username', 'newuser');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });
  });
  
  describe('updateUser', () => {
    it('should update an existing user', async () => {
      const userData = { username: 'updateduser' };
      const updatedUser = createMockUser('1', 'updateduser');
      
      mocks.findOneAndUpdate.mockResolvedValue({ value: updatedUser });
      
      const result = await userModel.updateUser('1', userData);
      
      expect(mocks.findOneAndUpdate).toHaveBeenCalled();
      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('username', 'updateduser');
      
      // Make sure _id is removed from the result
      expect(result._id).toBeUndefined();
    });
    
    it('should return null if user not found', async () => {
      mocks.findOneAndUpdate.mockResolvedValue({ value: null });
      
      const result = await userModel.updateUser('999', { username: 'test' });
      
      expect(result).toBeNull();
    });
  });
  
  describe('getEncyclopedia', () => {
    it('should return encyclopedia data for a user', async () => {
      const mockUser = { encyclopedia: 'test encyclopedia data' };
      
      mocks.findOne.mockResolvedValue(mockUser);
      
      const result = await userModel.getEncyclopedia('1');
      
      expect(mocks.findOne).toHaveBeenCalled();
      expect(result).toBe('test encyclopedia data');
    });
    
    it('should return empty string if no encyclopedia data', async () => {
      const mockUser = { username: 'testuser' };
      
      mocks.findOne.mockResolvedValue(mockUser);
      
      const result = await userModel.getEncyclopedia('1');
      
      expect(result).toBe('');
    });
    
    it('should return null if user not found', async () => {
      mocks.findOne.mockResolvedValue(null);
      
      const result = await userModel.getEncyclopedia('999');
      
      expect(result).toBeNull();
    });
  });
  
  describe('updateEncyclopedia', () => {
    it('should update encyclopedia data for a user', async () => {
      // Mock finding the user
      const mockUser = createMockUser('1', 'testuser');
      mocks.findOne.mockResolvedValueOnce(mockUser);
      
      // Mock updating the user
      mocks.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });
      
      // Mock finding the updated user
      const updatedUser = { ...mockUser, encyclopedia: 'updated encyclopedia data' };
      mocks.findOne.mockResolvedValueOnce(updatedUser);
      
      const result = await userModel.updateEncyclopedia('1', 'updated encyclopedia data');
      
      expect(mocks.findOne).toHaveBeenCalledTimes(2);
      expect(mocks.updateOne).toHaveBeenCalled();
      expect(result).toBe('updated encyclopedia data');
    });
    
    it('should return null if user not found', async () => {
      mocks.findOne.mockResolvedValueOnce(null);
      
      const result = await userModel.updateEncyclopedia('999', 'test data');
      
      expect(result).toBeNull();
    });
  });
  
  describe('closeConnection', () => {
    it('should close the database connection', async () => {
      await userModel.closeConnection();
      
      expect(mocks.client.close).toHaveBeenCalled();
    });
  });
}); 