import { NextRequest, NextResponse } from 'next/server';

// Define protected routes
const protectedRoutes = [
  '/profile',
  '/myplants',
  '/chat',
];

// Define public authentication routes
const authRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;
  
  // Check if the route is protected and user is not authenticated
  if (isProtectedRoute(pathname) && !token) {
    // Redirect to login page with redirect_to parameter
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirect_to', pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Check if the user is already authenticated and trying to access auth pages
  if (isAuthRoute(pathname) && token) {
    // Redirect authenticated users to myplants page
    return NextResponse.redirect(new URL('/myplants', request.url));
  }
  
  return NextResponse.next();
}

// Helper function to check if route is protected
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

// Helper function to check if route is an auth route
function isAuthRoute(pathname: string): boolean {
  return authRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

// Configure middleware to run on specific routes
export const config = {
  matcher: [
    // Protected routes
    '/profile/:path*',
    '/myplants/:path*',
    '/chat/:path*',
    // Authentication routes
    '/auth/:path*',
    // Add middleware to index route
    '/',
  ],
}; 