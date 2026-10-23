import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { authRoutes, isRouteOrChild, publicRoutes } from './lib/routes';

function isValidToken(token: string | undefined): boolean {
  if (!token) return false;
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) return false;

  try {
    jwt.verify(token, secret, { algorithms: ['HS256'] });
    return true;
  } catch {
    return false;
  }
}

function clearToken(response: NextResponse) {
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get('token')?.value;
  const authenticated = isValidToken(token);

  // An invalid/expired token is removed before the visitor can continue.
  if (token && !authenticated) {
    const loginUrl = new URL('/login?expired=true', request.url);
    return clearToken(NextResponse.redirect(loginUrl));
  }

  const isPublicRoute = publicRoutes.some((route) => isRouteOrChild(pathname, route));
  const isProtectedRoute = authRoutes.some((route) => isRouteOrChild(pathname, route));

  if (pathname === '/') {
    return NextResponse.redirect(new URL(authenticated ? '/dashboard' : '/login', request.url));
  }

  // Signed-in users do not need to remain on Login/Register.
  if (isPublicRoute && authenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protect dashboard pages, including nested paths.
  if (isProtectedRoute && !authenticated) {
    const loginUrl = new URL('/login', request.url);
    const requestedPath = `${pathname}${search}`;
    if (requestedPath !== '/dashboard') {
      loginUrl.searchParams.set('next', requestedPath);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/register', '/dashboard/:path*'],
};