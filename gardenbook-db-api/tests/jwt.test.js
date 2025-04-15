const jwt = require('jsonwebtoken');
const jwtUtils = require('../src/utils/jwt');

// Mock jwt module
jest.mock('jsonwebtoken');

describe('JWT Utilities', () => {
  const mockUser = {
    id: '12345',
    username: 'testuser',
    role: 'user'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      // Mock jwt.sign to return a token
      jwt.sign.mockReturnValue('mock-access-token');

      const token = jwtUtils.generateAccessToken(mockUser);

      expect(token).toBe('mock-access-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          role: mockUser.role,
        },
        expect.any(String),
        { expiresIn: expect.any(String) }
      );
    });

    it('should throw an error if user is not provided', () => {
      expect(() => jwtUtils.generateAccessToken()).toThrow('User ID is required');
      expect(() => jwtUtils.generateAccessToken({})).toThrow('User ID is required');
    });

    it('should use default role if not provided', () => {
      jwt.sign.mockReturnValue('mock-access-token');

      const userWithoutRole = { id: '12345' };
      jwtUtils.generateAccessToken(userWithoutRole);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: userWithoutRole.id,
          role: 'user',
        },
        expect.any(String),
        { expiresIn: expect.any(String) }
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      jwt.sign.mockReturnValue('mock-refresh-token');

      const token = jwtUtils.generateRefreshToken(mockUser);

      expect(token).toBe('mock-refresh-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          tokenType: 'refresh',
        },
        expect.any(String),
        { expiresIn: expect.any(String) }
      );
    });

    it('should throw an error if user is not provided', () => {
      expect(() => jwtUtils.generateRefreshToken()).toThrow('User ID is required');
      expect(() => jwtUtils.generateRefreshToken({})).toThrow('User ID is required');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const mockDecoded = { userId: '12345', role: 'user' };
      jwt.verify.mockReturnValue(mockDecoded);

      const result = jwtUtils.verifyAccessToken('valid-token');

      expect(result).toEqual(mockDecoded);
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
    });

    it('should throw an error if token is not provided', () => {
      expect(() => jwtUtils.verifyAccessToken()).toThrow('Access token is required');
      expect(() => jwtUtils.verifyAccessToken('')).toThrow('Access token is required');
    });

    it('should throw an error if token verification fails', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      expect(() => jwtUtils.verifyAccessToken('invalid-token')).toThrow('Invalid access token: Token expired');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const mockDecoded = { userId: '12345', tokenType: 'refresh' };
      jwt.verify.mockReturnValue(mockDecoded);

      const result = jwtUtils.verifyRefreshToken('valid-token');

      expect(result).toEqual(mockDecoded);
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
    });

    it('should throw an error if token is not provided', () => {
      expect(() => jwtUtils.verifyRefreshToken()).toThrow('Refresh token is required');
      expect(() => jwtUtils.verifyRefreshToken('')).toThrow('Refresh token is required');
    });

    it('should throw an error if token verification fails', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      expect(() => jwtUtils.verifyRefreshToken('invalid-token')).toThrow('Invalid refresh token: Token expired');
    });
  });

  describe('generateRandomToken', () => {
    it('should generate a random token with the default length', () => {
      const token = jwtUtils.generateRandomToken();
      // Default is 32 bytes which is 64 hex characters
      expect(token).toHaveLength(64);
    });

    it('should generate a random token with custom length', () => {
      const token = jwtUtils.generateRandomToken(16);
      // 16 bytes is 32 hex characters
      expect(token).toHaveLength(32);
    });
  });
}); 