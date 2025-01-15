import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// All routes under /admin require admin access
const ADMIN_ROUTES = [
  '/api/admin/games', // Admin only - game management
  '/api/spotify/playlists', // Admin only - playlist management
];

/**
 * Middleware to protect admin routes
 * For now, it uses a simple API key check
 * TODO: Implement proper authentication
 */
export function middleware(request: NextRequest) {
  // Check if this is an admin route
  const isAdminRoute = ADMIN_ROUTES.some((route) => {
    const pattern = new RegExp(route);
    return pattern.test(request.nextUrl.pathname);
  });

  if (!isAdminRoute) {
    return NextResponse.next();
  }

  // Check for API key
  const apiKey = request.headers.get('x-api-key');
  const validApiKey = process.env.ADMIN_API_KEY;

  if (!apiKey || apiKey !== validApiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
