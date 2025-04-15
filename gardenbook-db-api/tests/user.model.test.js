// Mock the model imports first
jest.mock('mongodb');
jest.mock('dotenv', () => ({
  config: jest.fn()
}));
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockImplementation((password) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn().mockImplementation((password, hash) => {
    // Simple mock implementation that checks if hash is 'hashed_' + password
    return Promise.resolve(hash === `hashed_${password}`);
  })
}));

// Import the actual MongoClient before we set the mock implementation
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

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

// Helper to create a mock user object with all the new fields
function createMockUser(id, username, email = 'user@example.com', options = {}) {
  return {
    _id: { toString: () => id },
    username,
    email,
    password: options.password || 'hashed_password123',
    displayName: options.displayName || username,
    isVerified: options.isVerified !== undefined ? options.isVerified : false,
    verificationToken: options.verificationToken || null,
    resetPasswordToken: options.resetPasswordToken || null,
    resetPasswordExpires: options.resetPasswordExpires || null,
    role: options.role || 'user',
    preferences: options.preferences || {
      theme: 'light',
      notifications: true
    },
    encyclopedia: options.encyclopedia || '',
    contextCards: options.contextCards || [],
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
  
  // Close MongoDB connection after all tests are done
  afterAll(async () => {
    if (userModel.closeConnection) {
      await userModel.closeConnection();
    }
  });
  
  describe('getUserById', () => {
    it('should return a user by id', async () => {
      const mockUser = createMockUser('1', 'testuser', 'user@example.com', {
        encyclopedia: 'test encyclopedia'
      });
      
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
    it('should create a new user with required fields', async () => {
      const userData = { 
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123'
      };
      const insertedId = { toString: () => 'new-id' };
      
      mocks.insertOne.mockResolvedValue({ insertedId });
      
      const result = await userModel.createUser(userData);
      
      expect(mocks.insertOne).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'new-id');
      expect(result).toHaveProperty('username', 'newuser');
      expect(result).toHaveProperty('email', 'newuser@example.com');
      expect(result).toHaveProperty('password', 'hashed_password123');
      expect(result).toHaveProperty('role', 'user');
      expect(result).toHaveProperty('preferences');
      expect(result.preferences).toHaveProperty('theme', 'light');
      expect(result.preferences).toHaveProperty('notifications', true);
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
      
      // Verify bcrypt was called
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });
    
    it('should throw an error if username is missing', async () => {
      const userData = { 
        email: 'newuser@example.com',
        password: 'password123'
      };
      
      await expect(userModel.createUser(userData)).rejects.toThrow('Username is required');
    });
    
    it('should throw an error if email is invalid', async () => {
      const userData = { 
        username: 'newuser',
        email: 'invalid-email',
        password: 'password123'
      };
      
      await expect(userModel.createUser(userData)).rejects.toThrow('Invalid email format');
    });
    
    it('should throw an error if role is invalid', async () => {
      const userData = { 
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'superadmin'
      };
      
      await expect(userModel.createUser(userData)).rejects.toThrow('Role must be one of: user, admin');
    });
  });
  
  describe('updateUser', () => {
    it('should update an existing user', async () => {
      const userData = { 
        username: 'updateduser',
        email: 'updated@example.com',
        displayName: 'Updated User'
      };
      const updatedUser = createMockUser('1', 'updateduser', 'updated@example.com', {
        displayName: 'Updated User'
      });
      
      mocks.findOneAndUpdate.mockResolvedValue({ value: updatedUser });
      
      const result = await userModel.updateUser('1', userData);
      
      expect(mocks.findOneAndUpdate).toHaveBeenCalled();
      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('username', 'updateduser');
      expect(result).toHaveProperty('email', 'updated@example.com');
      expect(result).toHaveProperty('displayName', 'Updated User');
      
      // Make sure _id is removed from the result
      expect(result._id).toBeUndefined();
    });
    
    it('should hash the password when updating', async () => {
      const userData = { 
        password: 'newpassword123'
      };
      
      const updatedUser = createMockUser('1', 'testuser', 'user@example.com', {
        password: 'hashed_newpassword123'
      });
      
      mocks.findOneAndUpdate.mockResolvedValue({ value: updatedUser });
      
      const result = await userModel.updateUser('1', userData);
      
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(result).toHaveProperty('password', 'hashed_newpassword123');
    });
    
    it('should return null if user not found', async () => {
      mocks.findOneAndUpdate.mockResolvedValue({ value: null });
      
      const result = await userModel.updateUser('999', { username: 'test' });
      
      expect(result).toBeNull();
    });
  });
  
  describe('authenticateUser', () => {
    it('should authenticate a user with correct credentials', async () => {
      const mockUser = createMockUser('1', 'testuser', 'user@example.com', {
        password: 'hashed_correctpassword'
      });
      
      mocks.findOne.mockResolvedValue(mockUser);
      
      const result = await userModel.authenticateUser('user@example.com', 'correctpassword');
      
      expect(mocks.findOne).toHaveBeenCalledWith({ email: 'user@example.com' });
      expect(bcrypt.compare).toHaveBeenCalledWith('correctpassword', 'hashed_correctpassword');
      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('username', 'testuser');
      expect(result).toHaveProperty('email', 'user@example.com');
      
      // Password should be removed from the result
      expect(result.password).toBeUndefined();
    });
    
    it('should return null with incorrect password', async () => {
      const mockUser = createMockUser('1', 'testuser', 'user@example.com', {
        password: 'hashed_correctpassword'
      });
      
      mocks.findOne.mockResolvedValue(mockUser);
      
      const result = await userModel.authenticateUser('user@example.com', 'wrongpassword');
      
      expect(result).toBeNull();
    });
    
    it('should return null if user not found', async () => {
      mocks.findOne.mockResolvedValue(null);
      
      const result = await userModel.authenticateUser('nonexistent@example.com', 'password');
      
      expect(result).toBeNull();
    });
  });
  
  describe('generatePasswordResetToken', () => {
    it('should generate a password reset token', async () => {
      const mockUser = createMockUser('1', 'testuser', 'user@example.com');
      
      mocks.findOne.mockResolvedValue(mockUser);
      mocks.updateOne.mockResolvedValue({ modifiedCount: 1 });
      
      const result = await userModel.generatePasswordResetToken('user@example.com');
      
      expect(mocks.findOne).toHaveBeenCalledWith({ email: 'user@example.com' });
      expect(mocks.updateOne).toHaveBeenCalled();
      expect(result).toHaveProperty('resetPasswordToken');
      expect(result).toHaveProperty('resetPasswordExpires');
    });
    
    it('should return null if user not found', async () => {
      mocks.findOne.mockResolvedValue(null);
      
      const result = await userModel.generatePasswordResetToken('nonexistent@example.com');
      
      expect(result).toBeNull();
    });
  });
  
  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const resetPasswordToken = 'valid-token';
      const newPassword = 'newpassword123';
      
      // Mock a user with valid reset token
      const mockUser = createMockUser('1', 'testuser', 'user@example.com', {
        resetPasswordToken,
        resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour in the future
      });
      
      mocks.findOne.mockResolvedValue(mockUser);
      mocks.updateOne.mockResolvedValue({ modifiedCount: 1 });
      
      const result = await userModel.resetPassword(resetPasswordToken, newPassword);
      
      expect(mocks.findOne).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(mocks.updateOne).toHaveBeenCalled();
      expect(result).toBe(true);
    });
    
    it('should return false if token is invalid or expired', async () => {
      mocks.findOne.mockResolvedValue(null);
      
      const result = await userModel.resetPassword('invalid-token', 'newpassword');
      
      expect(result).toBe(false);
    });
  });
  
  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const verificationToken = 'valid-verification-token';
      
      // Mock a user with valid verification token
      const mockUser = createMockUser('1', 'testuser', 'user@example.com', {
        verificationToken,
        isVerified: false
      });
      
      mocks.findOne.mockResolvedValue(mockUser);
      mocks.updateOne.mockResolvedValue({ modifiedCount: 1 });
      
      const result = await userModel.verifyEmail(verificationToken);
      
      expect(mocks.findOne).toHaveBeenCalledWith({ verificationToken });
      expect(mocks.updateOne).toHaveBeenCalled();
      expect(result).toBe(true);
    });
    
    it('should return false if token is invalid', async () => {
      mocks.findOne.mockResolvedValue(null);
      
      const result = await userModel.verifyEmail('invalid-token');
      
      expect(result).toBe(false);
    });
  });
  
  describe('validation functions', () => {
    describe('validateEmail', () => {
      it('should validate correct email format', () => {
        expect(() => userModel.validateEmail('user@example.com')).not.toThrow();
        expect(userModel.validateEmail('user@example.com')).toBe(true);
      });
      
      it('should throw error for invalid email format', () => {
        expect(() => userModel.validateEmail('invalid-email')).toThrow('Invalid email format');
        expect(() => userModel.validateEmail('')).toThrow('Email is required');
        expect(() => userModel.validateEmail(null)).toThrow('Email is required');
      });
    });
    
    describe('validateUser', () => {
      it('should validate user with required fields', () => {
        const userData = {
          username: 'testuser',
          email: 'user@example.com'
        };
        
        expect(() => userModel.validateUser(userData)).not.toThrow();
        expect(userModel.validateUser(userData)).toBe(true);
      });
      
      it('should throw error if username missing', () => {
        const userData = {
          email: 'user@example.com'
        };
        
        expect(() => userModel.validateUser(userData)).toThrow('Username is required');
      });
      
      it('should throw error if email format invalid', () => {
        const userData = {
          username: 'testuser',
          email: 'invalid-email'
        };
        
        expect(() => userModel.validateUser(userData)).toThrow('Invalid email format');
      });
      
      it('should throw error if role invalid', () => {
        const userData = {
          username: 'testuser',
          email: 'user@example.com',
          role: 'superadmin'
        };
        
        expect(() => userModel.validateUser(userData)).toThrow('Role must be one of: user, admin');
      });
    });
    
    describe('verifyPassword', () => {
      it('should verify correct password', async () => {
        const result = await userModel.verifyPassword('password123', 'hashed_password123');
        expect(result).toBe(true);
      });
      
      it('should return false for incorrect password', async () => {
        const result = await userModel.verifyPassword('wrongpassword', 'hashed_password123');
        expect(result).toBe(false);
      });
      
      it('should return false if password or hash is missing', async () => {
        expect(await userModel.verifyPassword(null, 'hashed_password')).toBe(false);
        expect(await userModel.verifyPassword('password', null)).toBe(false);
        expect(await userModel.verifyPassword(null, null)).toBe(false);
      });
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
      const mockUser = createMockUser('1', 'testuser', 'user@example.com');
      
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
      const mockUser = createMockUser('1', 'testuser', 'user@example.com');
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