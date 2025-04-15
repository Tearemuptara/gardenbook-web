// Authentication API client functions

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface PasswordResetRequestData {
  email: string;
}

interface PasswordResetData {
  token: string;
  password: string;
}

const API_URL = process.env.NEXT_PUBLIC_NODE_API_URL || 'http://localhost:3001';

/**
 * Register a new user
 */
export async function registerUser(data: RegisterData) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Registration failed');
  }

  return response.json();
}

/**
 * Login a user
 */
export async function loginUser(data: LoginData) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include', // Important for cookies
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Login failed');
  }

  return response.json();
}

/**
 * Logout the current user
 */
export async function logoutUser() {
  const response = await fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include', // Important for cookies
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Logout failed');
  }

  return response.json();
}

/**
 * Request a password reset
 */
export async function requestPasswordReset(data: PasswordResetRequestData) {
  const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Password reset request failed');
  }

  return response.json();
}

/**
 * Reset password with token
 */
export async function resetPassword(data: PasswordResetData) {
  const response = await fetch(`${API_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Password reset failed');
  }

  return response.json();
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: 'GET',
    credentials: 'include', // Important for cookies
  });

  if (!response.ok) {
    // If 401, user is not logged in
    if (response.status === 401) {
      return null;
    }
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to get current user');
  }

  return response.json();
} 