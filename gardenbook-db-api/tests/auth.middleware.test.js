const authMiddleware = require('../src/middleware/auth');
const jwtUtils = require('../src/utils/jwt');
const userModel = require('../src/models/user');

// Mock dependencies
jest.mock('../src/utils/jwt');
jest.mock('../src/models/user');

describe('Auth Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      cookies: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn()
    };
    next = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('authenticateJwt', () => {
    it('should authenticate valid JWT tokens', async () => {
      // Mock data
      const token = 'valid-access-token';
      const decoded = { userId: '12345', role: 'user' };
      const user = { id: '12345', username: 'testuser', role: 'user' };
      
      // Set up mocks
      req.cookies.accessToken = token;
      jwtUtils.verifyAccessToken.mockReturnValue(decoded);
      userModel.getUserById.mockResolvedValue(user);
      
      // Call middleware
      await authMiddleware.authenticateJwt(req, res, next);
      
      // Assertions
      expect(jwtUtils.verifyAccessToken).toHaveBeenCalledWith(token);
      expect(userModel.getUserById).toHaveBeenCalledWith(decoded.userId);
      expect(req.user).toEqual(user);
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 when token is missing', async () => {
      await authMiddleware.authenticateJwt(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', async () => {
      req.cookies.accessToken = 'invalid-token';
      jwtUtils.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      await authMiddleware.authenticateJwt(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not found', async () => {
      req.cookies.accessToken = 'valid-token';
      jwtUtils.verifyAccessToken.mockReturnValue({ userId: '12345' });
      userModel.getUserById.mockResolvedValue(null);
      
      await authMiddleware.authenticateJwt(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('isAdmin', () => {
    it('should allow access to admin users', () => {
      req.user = { role: 'admin' };
      
      authMiddleware.isAdmin(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      authMiddleware.isAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not an admin', () => {
      req.user = { role: 'user' };
      
      authMiddleware.isAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Admin privileges required' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token with valid refresh token', async () => {
      // Mock data
      const refreshToken = 'valid-refresh-token';
      const decoded = { userId: '12345' };
      const user = { id: '12345', username: 'testuser', role: 'user' };
      const newAccessToken = 'new-access-token';
      
      // Set up mocks
      req.cookies.refreshToken = refreshToken;
      jwtUtils.verifyRefreshToken.mockReturnValue(decoded);
      userModel.getUserById.mockResolvedValue(user);
      jwtUtils.generateAccessToken.mockReturnValue(newAccessToken);
      
      // Call middleware
      await authMiddleware.refreshAccessToken(req, res, next);
      
      // Assertions
      expect(jwtUtils.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(userModel.getUserById).toHaveBeenCalledWith(decoded.userId);
      expect(jwtUtils.generateAccessToken).toHaveBeenCalledWith(user);
      expect(res.cookie).toHaveBeenCalledWith('accessToken', newAccessToken, expect.any(Object));
      expect(req.user).toEqual(user);
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 when refresh token is missing', async () => {
      await authMiddleware.refreshAccessToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Refresh token required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when refresh token is invalid', async () => {
      req.cookies.refreshToken = 'invalid-token';
      jwtUtils.verifyRefreshToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      await authMiddleware.refreshAccessToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired refresh token' });
      expect(res.clearCookie).toHaveBeenCalledWith('accessToken');
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not found', async () => {
      req.cookies.refreshToken = 'valid-token';
      jwtUtils.verifyRefreshToken.mockReturnValue({ userId: '12345' });
      userModel.getUserById.mockResolvedValue(null);
      
      await authMiddleware.refreshAccessToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });
  });
}); 