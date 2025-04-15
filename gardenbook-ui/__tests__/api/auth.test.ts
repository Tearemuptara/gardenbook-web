import {
  registerUser,
  loginUser,
  logoutUser,
  requestPasswordReset,
  resetPassword,
  getCurrentUser
} from '../../app/api/auth';

// Mock global fetch
global.fetch = jest.fn();

describe('Auth API Client', () => {
  const mockFetch = global.fetch as jest.Mock;
  
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    );
  });
  
  describe('registerUser', () => {
    test('calls correct endpoint with right data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      
      await registerUser(userData);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(userData),
        })
      );
    });
    
    test('throws error on API failure', async () => {
      mockFetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Registration failed' }),
        })
      );
      
      await expect(registerUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      })).rejects.toThrow('Registration failed');
    });
  });
  
  describe('loginUser', () => {
    test('calls correct endpoint with right data', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      };
      
      await loginUser(loginData);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(loginData),
          credentials: 'include',
        })
      );
    });
    
    test('throws error on API failure', async () => {
      mockFetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Invalid credentials' }),
        })
      );
      
      await expect(loginUser({
        email: 'test@example.com',
        password: 'wrong-password',
      })).rejects.toThrow('Invalid credentials');
    });
  });
  
  describe('logoutUser', () => {
    test('calls correct endpoint with credentials included', async () => {
      await logoutUser();
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/logout'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });
  });
  
  describe('requestPasswordReset', () => {
    test('calls correct endpoint with right data', async () => {
      const resetData = {
        email: 'test@example.com',
      };
      
      await requestPasswordReset(resetData);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/forgot-password'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(resetData),
        })
      );
    });
  });
  
  describe('resetPassword', () => {
    test('calls correct endpoint with right data', async () => {
      const resetData = {
        token: 'reset-token-123',
        password: 'new-password',
      };
      
      await resetPassword(resetData);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/reset-password'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(resetData),
        })
      );
    });
  });
  
  describe('getCurrentUser', () => {
    test('calls correct endpoint with credentials included', async () => {
      await getCurrentUser();
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/me'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );
    });
    
    test('returns null on 401 unauthorized', async () => {
      mockFetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          status: 401,
        })
      );
      
      const result = await getCurrentUser();
      expect(result).toBeNull();
    });
  });
}); 