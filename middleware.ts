// middleware.ts - Fix the import issue
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/signin',
    '/forgot-password',
    '/reset-password',
    '/verify-request',
    '/how-it-works',
    '/privacy',
    '/terms',
  ];

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));

  // Allow access to public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Simple session check using cookies instead of heavy auth import
  const sessionToken = request.cookies.get('authjs.session-token') || 
                      request.cookies.get('__Secure-authjs.session-token');
  
  // Redirect to signin if not authenticated and trying to access protected route
  if (!sessionToken && !isPublicRoute) {
    const signinUrl = new URL('/signin', request.url);
    signinUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signinUrl);
  }

  // If logged in and trying to access signin, redirect to dashboard
  if (sessionToken && pathname === '/signin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Only match essential protected pages to keep bundle size small
    '/dashboard/:path*',
    '/settings/:path*',
    '/billing/:path*',
    '/calendar/:path*',
    '/analytics/:path*',
    '/signin',
  ],
};