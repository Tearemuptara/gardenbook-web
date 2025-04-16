import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../app/context/AuthContext';
import { getCurrentUser, logoutUser } from '../../app/api/auth';

// Mock the Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the auth API functions
jest.mock('../../app/api/auth', () => ({
  getCurrentUser: jest.fn(),
  logoutUser: jest.fn(),
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="loading-state">{isLoading ? 'Loading' : 'Not loading'}</div>
      <div data-testid="auth-state">{isAuthenticated ? 'Authenticated' : 'Not authenticated'}</div>
      <div data-testid="user-info">{user ? user.username : 'No user'}</div>
      <button data-testid="logout-button" onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should initialize with loading state', async () => {
    // Mock getCurrentUser to return null after delay
    (getCurrentUser as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(null), 100))
    );
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initial state should be loading
    expect(screen.getByTestId('loading-state').textContent).toBe('Loading');
    
    // After API resolves, loading should be false
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('Not loading');
    });
    
    // Should not be authenticated when no user returned
    expect(screen.getByTestId('auth-state').textContent).toBe('Not authenticated');
    expect(screen.getByTestId('user-info').textContent).toBe('No user');
  });
  
  it('should set authenticated state when user exists', async () => {
    // Mock getCurrentUser to return a user
    const mockUser = { id: '123', username: 'testuser', email: 'test@example.com', createdAt: '2023-01-01' };
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('Not loading');
    });
    
    // Should be authenticated when user is returned
    expect(screen.getByTestId('auth-state').textContent).toBe('Authenticated');
    expect(screen.getByTestId('user-info').textContent).toBe('testuser');
  });
  
  it('should logout the user when logout is called', async () => {
    // Mock getCurrentUser to return a user
    const mockUser = { id: '123', username: 'testuser', email: 'test@example.com', createdAt: '2023-01-01' };
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    (logoutUser as jest.Mock).mockResolvedValue({ success: true });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-state').textContent).toBe('Authenticated');
    });
    
    // Click logout button
    const user = userEvent.setup();
    await act(async () => {
      await user.click(screen.getByTestId('logout-button'));
    });
    
    // Should call logout API
    expect(logoutUser).toHaveBeenCalled();
    
    // Should update auth state
    await waitFor(() => {
      expect(screen.getByTestId('auth-state').textContent).toBe('Not authenticated');
      expect(screen.getByTestId('user-info').textContent).toBe('No user');
    });
  });
  
  it('should handle API errors gracefully', async () => {
    // Mock getCurrentUser to throw an error
    (getCurrentUser as jest.Mock).mockRejectedValue(new Error('API error'));
    
    // Mock console.error to prevent error from being displayed in test output
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('Not loading');
    });
    
    // Should not be authenticated when API throws error
    expect(screen.getByTestId('auth-state').textContent).toBe('Not authenticated');
    expect(screen.getByTestId('user-info').textContent).toBe('No user');
    
    // Should have logged the error
    expect(console.error).toHaveBeenCalled();
    
    // Restore console.error
    console.error = originalConsoleError;
  });
}); 