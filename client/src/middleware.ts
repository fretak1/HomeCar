import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userRole = request.cookies.get('user-role')?.value;

  // Management roles: ADMIN, OWNER, AGENT
  const isManagementRole = userRole && ['ADMIN', 'OWNER', 'AGENT'].includes(userRole);

  if (isManagementRole) {
    // Define management-allowed paths
    const isAllowedPath = 
      pathname.startsWith('/dashboard') || 
      pathname.startsWith('/profile') || 
      pathname.startsWith('/property/') || 
      pathname.startsWith('/chat') ||
      pathname.startsWith('/verify-email') ||
      pathname.startsWith('/api') ||
      pathname.includes('.'); // assets, etc.

    // If on a non-allowed path (like Home '/'), redirect to dashboard immediately
    if (!isAllowedPath && pathname !== '/login' && pathname !== '/signup') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
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
