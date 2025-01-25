import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ValidationError } from '@/app/api/lib/errors/base';
import { handleError } from '@/app/api/lib/utils/error-handler';

export async function middleware(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      throw new ValidationError('x-user-id header is required');
    }

    // Continue with the request, passing the userId header along
    return NextResponse.next();
  } catch (error) {
    return handleError(error);
  }
}

export const config = {
  matcher: '/api/games/:path*'
} 