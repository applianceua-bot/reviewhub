import { NextResponse, type NextRequest } from 'next/server'

/**
 * Optimistic gate: no session cookie means straight to /login. The real
 * check (valid session, role, brand access) happens server-side in every
 * page and action via lib/auth/session.ts.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has('rr_session')) {
    const url = new URL('/login', request.url)
    url.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/cabinet/:path*', '/admin/:path*'],
}
