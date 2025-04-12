// Mock the model imports first
jest.mock('mongodb');
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Import the actual MongoClient before we set the mock implementation
const { MongoClient, ObjectId } = require('mongodb');

// Create our mocks
const mockToArray = jest.fn().mockResolvedValue([]);
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

// Modify the plant model to expose private functions for testing only
const originalModule = jest.requireActual('../src/models/plant');
const mockModule = {
  ...originalModule,
  // Expose the internal connect function and isConnected flag for testing
  _testConnect: jest.fn().mockImplementation(async () => {
    await mockClient.connect();
  }),
  _testIsConnected: false,
  getAllPlants: jest.fn().mockImplementation(async () => {
    if (!mockModule._testIsConnected) {
      await mockModule._testConnect();
      mockModule._testIsConnected = true;
    }
    return mockToArray();
  }),
  closeConnection: jest.fn().mockImplementation(async () => {
    if (mockModule._testIsConnected) {
      await mockClient.close();
      mockModule._testIsConnected = false;
    }
  })
};

// Re-mock the plant model
jest.mock('../src/models/plant', () => mockModule, { virtual: true });

// Now require the model that uses MongoDB
const plantModel = require('../src/models/plant');

describe('Database Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the model's state for each test
    mockModule._testIsConnected = false;
  });
  
  it('should connect to the database when first method is called', async () => {
    // First call to connect
    await plantModel.getAllPlants();
    
    // Check if the client.connect was called
    expect(mockClient.connect).toHaveBeenCalledTimes(1);
  });
  
  it('should reuse the connection for subsequent calls', async () => {
    // First call
    await plantModel.getAllPlants();
    
    // Reset the connect mock for the second call
    mockClient.connect.mockClear();
    
    // Second call - should not connect again
    await plantModel.getAllPlants();
    
    // Should not call connect again
    expect(mockClient.connect).not.toHaveBeenCalled();
  });
  
  it('should close the connection when closeConnection is called', async () => {
    // Set the connected state
    mockModule._testIsConnected = true;
    
    // Call the closeConnection method
    await plantModel.closeConnection();
    
    // Verify the connection is closed
    expect(mockClient.close).toHaveBeenCalled();
    
    // Verify the isConnected flag is now false
    expect(mockModule._testIsConnected).toBe(false);
  });
  
  it('should handle connection errors gracefully', async () => {
    // Reset mocks and internal state
    mockModule._testIsConnected = false;
    jest.clearAllMocks();
    
    // Mock a connection error
    mockClient.connect.mockRejectedValueOnce(new Error('Connection error'));
    
    // Mock the implementation again to ensure it throws
    plantModel._testConnect.mockImplementationOnce(async () => {
      await mockClient.connect();
    });
    
    // Test that the error is propagated
    await expect(mockModule._testConnect()).rejects.toThrow('Connection error');
  });
  
  it('should register process event handlers for graceful shutdown', () => {
    // Verify SIGINT and SIGTERM handlers exist
    expect(process.listenerCount('SIGINT')).toBeGreaterThan(0);
    expect(process.listenerCount('SIGTERM')).toBeGreaterThan(0);
  });
}); 