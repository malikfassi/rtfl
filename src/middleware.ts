import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'rtfl_admin';
const SESSION_MAX_AGE = 60 * 60 * 12; // 12h

/**
 * The cookie carries a digest rather than the password itself, so the shared
 * secret isn't sitting in the browser's cookie jar in plain text. Possession of
 * either still grants access - this is hygiene, not a second factor.
 */
async function digest(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function basicAuthPassword(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Basic ')) return null;

  try {
    const decoded = atob(auth.slice(6));
    // Split once: a password is allowed to contain colons, the username is not.
    const separator = decoded.indexOf(':');
    return separator === -1 ? null : decoded.slice(separator + 1);
  } catch {
    return null;
  }
}

function challenge(): NextResponse {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="rtfl admin"' },
  });
}

export async function middleware(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return challenge();

  const expected = await digest(adminPassword);

  // The cookie is what actually keeps the session working. Browsers scope
  // basic-auth credentials by path, so the header that unlocked /admin is not
  // sent to /api/admin/* - the screen would load and then every one of its
  // data requests would come back 401.
  if (request.cookies.get(SESSION_COOKIE)?.value === expected) {
    return NextResponse.next();
  }

  if (basicAuthPassword(request) === adminPassword) {
    const response = NextResponse.next();
    response.cookies.set(SESSION_COOKIE, expected, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
      secure: process.env.NODE_ENV === 'production',
    });
    return response;
  }

  return challenge();
}

// `/admin` is a rewrite onto `/front/admin`, and Next still serves the page at
// its real path too - so the underlying route has to be matched as well, or the
// admin screen is reachable unauthenticated at /front/admin.
export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/front/admin',
    '/front/admin/:path*',
    '/api/admin/:path*',
  ],
};
