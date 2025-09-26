// middleware.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Skip middleware for API routes to avoid edge runtime issues
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

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

  // Redirect to signin if not authenticated and trying to access protected route
  if (!isLoggedIn && !isPublicRoute) {
    const signinUrl = new URL('/signin', req.url);
    signinUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signinUrl);
  }

  // If logged in and trying to access signin, redirect to dashboard
  if (isLoggedIn && pathname === '/signin') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Only match HTML pages that might need auth checks.
     * Exclude ALL static assets, images, icons, API routes, and file extensions.
     * This dramatically reduces edge function bundle size.
     */
    '/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|sw.js|manifest.json|robots.txt|.*\\.).*)',
  ],
};