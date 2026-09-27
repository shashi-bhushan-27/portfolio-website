import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

/**
 * First line of defence for the admin area: bounce unauthenticated requests
 * before any page renders. Every admin page, server action, and route
 * handler re-checks the session itself (see lib/auth.ts).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith('/api/admin')) {
    return authed
      ? NextResponse.next()
      : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (pathname === '/admin/login') {
    return authed ? NextResponse.redirect(new URL('/admin', request.url)) : NextResponse.next();
  }

  if (!authed) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const res = NextResponse.next();
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
};
