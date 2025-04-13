// Set up MongoDB mocks
jest.mock('mongodb');
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Import and mock MongoDB
const mongodb = require('mongodb');

// Create mock functions
const mockToArray = jest.fn().mockResolvedValue([]);
const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
const mockFindOne = jest.fn();
const mockInsertOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockFindOneAndUpdate = jest.fn();
const mockFindOneAndDelete = jest.fn();
const mockCollection = {
  find: mockFind,
  findOne: mockFindOne,
  insertOne: mockInsertOne,
  updateOne: mockUpdateOne,
  findOneAndUpdate: mockFindOneAndUpdate,
  findOneAndDelete: mockFindOneAndDelete
};
const mockDb = { collection: jest.fn().mockReturnValue(mockCollection) };
const mockClient = {
  connect: jest.fn().mockResolvedValue(undefined),
  db: jest.fn().mockReturnValue(mockDb),
  close: jest.fn().mockResolvedValue(undefined)
};

// Set up the mocks
mongodb.MongoClient.mockImplementation(() => mockClient);
mongodb.ObjectId.mockImplementation((id) => ({ 
  toString: () => id,
  valueOf: () => id
}));

module.exports = {
  mongodb,
  mocks: {
    client: mockClient,
    db: mockDb,
    collection: mockCollection,
    find: mockFind,
    findOne: mockFindOne,
    insertOne: mockInsertOne,
    updateOne: mockUpdateOne,
    findOneAndUpdate: mockFindOneAndUpdate,
    findOneAndDelete: mockFindOneAndDelete,
    toArray: mockToArray
  },
  // Helper to reset all mocks
  resetAllMocks: () => {
    jest.clearAllMocks();
  }
}; 