import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cookie Supabase auth (format: sb-<project-ref>-auth-token)
  const hasCookie = request.cookies.getAll().some(
    (c) => c.name.includes('-auth-token') || c.name.includes('sb-access-token')
  );

  // Protéger /dashboard/*
  if (pathname.startsWith('/dashboard') && !hasCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Rediriger vers /dashboard si déjà connecté sur /login ou /
  if ((pathname === '/login' || pathname === '/') && hasCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Page d'accueil sans cookie → login
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/login'],
};
