import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

const TOKEN_NAME = 'eventhub_token';

// Protect these routes
const protectedRoutes = ['/participant', '/organizer', '/reviewer'];
const publicOnlyRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get(TOKEN_NAME)?.value;
  const { pathname } = request.nextUrl;

  // Check if it's a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isPublicOnlyRoute = publicOnlyRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token) {
    try {
      const decoded = jwtDecode<{ role?: string }>(token);
      
      // If user is already logged in and tries to access login/register, redirect to their dashboard
      if (isPublicOnlyRoute) {
        const role = decoded.role?.toLowerCase();
        let redirectPath = '/';
        if (role === 'participant') redirectPath = '/participant';
        if (role === 'organizer') redirectPath = '/organizer';
        if (role === 'reviewer') redirectPath = '/reviewer';

        return NextResponse.redirect(new URL(redirectPath, request.url));
      }

      // Basic Role guard
      if (pathname.startsWith('/organizer') && decoded.role !== 'ORGANIZER') {
        return NextResponse.redirect(new URL('/participant', request.url));
      }
      if (pathname.startsWith('/reviewer') && decoded.role !== 'REVIEWER') {
        return NextResponse.redirect(new URL('/', request.url));
      }

    } catch {
      // Invalid token
      request.cookies.delete(TOKEN_NAME);
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
