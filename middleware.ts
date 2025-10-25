import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware to handle authentication redirects
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function middleware(_request: NextRequest) {
  // For now, we'll let the client handle auth state
  // since Firebase auth is client-side only
  // This middleware could be extended to check cookies/tokens if using server-side auth
  
  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
