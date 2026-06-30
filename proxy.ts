import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sha256 } from './app/lib/hash';

const PASSWORD = process.env.SITE_PASSWORD;
const COOKIE_NAME = 'site-auth';

export async function proxy(request: NextRequest) {
  // If no password is configured, allow all access (useful for local dev)
  if (!PASSWORD) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Always allow the login page and static assets
  if (
    pathname === '/login' ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const expected = await sha256(PASSWORD);

  if (token === expected) {
    return NextResponse.next();
  }

  // Redirect to login, remembering where the user wanted to go
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('redirect', pathname);
  url.searchParams.set('error', '1');
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
