import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PLAYER_ID_KEY = 'rtfl_player_id';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Check if player ID cookie exists
  const playerId = request.cookies.get(PLAYER_ID_KEY);
  
  if (!playerId) {
    // Generate new ID if none exists
    const newPlayerId = crypto.randomUUID().replace(/-/g, '').slice(0, 25);
    response.cookies.set(PLAYER_ID_KEY, newPlayerId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 