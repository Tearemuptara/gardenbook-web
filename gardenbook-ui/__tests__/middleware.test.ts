import { NextRequest, NextResponse } from 'next/server';
import middleware from '../middleware';

// Mock NextRequest and NextResponse
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      next: jest.fn(() => ({ status: 200 })),
      redirect: jest.fn((url) => ({ status: 302, url })),
    },
  };
});

describe('Authentication Middleware', () => {
  let mockRequest: NextRequest;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock request with configurable pathname and cookies
    mockRequest = {
      nextUrl: {
        pathname: '/',
        searchParams: new URLSearchParams(),
      },
      cookies: {
        get: jest.fn(),
      },
      url: 'http://localhost:3000',
    } as unknown as NextRequest;
  });
  
  it('should allow access to public routes without authentication', () => {
    // Configure request to a public route with no auth token
    mockRequest.nextUrl.pathname = '/';
    mockRequest.cookies.get = jest.fn((name) => name === 'auth_token' ? undefined : null);
    
    middleware(mockRequest);
    
    // Should not redirect
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });
  
  it('should redirect unauthenticated users from protected routes to login page', () => {
    // Configure request to a protected route with no auth token
    mockRequest.nextUrl.pathname = '/profile';
    mockRequest.cookies.get = jest.fn((name) => name === 'auth_token' ? undefined : null);
    
    middleware(mockRequest);
    
    // Should redirect to login page with redirect_to parameter
    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectCall = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(redirectCall.toString()).toContain('/auth/login');
    expect(redirectCall.toString()).toContain('redirect_to=/profile');
  });
  
  it('should redirect authenticated users away from auth pages', () => {
    // Configure request to an auth route with auth token
    mockRequest.nextUrl.pathname = '/auth/login';
    mockRequest.cookies.get = jest.fn((name) => 
      name === 'auth_token' ? { value: 'valid-token' } : null
    );
    
    middleware(mockRequest);
    
    // Should redirect to myplants page
    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectCall = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(redirectCall.toString()).toContain('/myplants');
  });
  
  it('should allow authenticated users to access protected routes', () => {
    // Configure request to a protected route with auth token
    mockRequest.nextUrl.pathname = '/profile';
    mockRequest.cookies.get = jest.fn((name) => 
      name === 'auth_token' ? { value: 'valid-token' } : null
    );
    
    middleware(mockRequest);
    
    // Should not redirect
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });
  
  it('should properly handle nested protected routes', () => {
    // Configure request to a nested protected route with no auth token
    mockRequest.nextUrl.pathname = '/myplants/details/123';
    mockRequest.cookies.get = jest.fn((name) => name === 'auth_token' ? undefined : null);
    
    middleware(mockRequest);
    
    // Should redirect to login page
    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectCall = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(redirectCall.toString()).toContain('/auth/login');
    expect(redirectCall.toString()).toContain('redirect_to=/myplants/details/123');
  });
}); 