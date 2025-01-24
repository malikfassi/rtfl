import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const start = Date.now();
  
  console.log(`📥 ${request.method} ${request.url}`);
  
  const response = NextResponse.next();
  
  const duration = Date.now() - start;
  response.headers.set('x-response-time', `${duration}ms`);
  
  console.log(`📤 Response sent in ${duration}ms`);
  
  return response;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 