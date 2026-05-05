import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userRole = request.cookies.get('user-role')?.value;
  const normalizedRole = userRole?.toUpperCase();

  // Management roles: ADMIN, OWNER, AGENT
  const isManagementRole = normalizedRole && ['ADMIN', 'OWNER', 'AGENT'].includes(normalizedRole);

  if (isManagementRole) {
    // Define management-allowed paths
    const isAllowedPath = 
      pathname.startsWith('/dashboard') || 
      pathname.startsWith('/profile') || 
      pathname.startsWith('/property/') || 
      pathname.startsWith('/chat') ||
      pathname.startsWith('/verify-email');

    // If on a non-allowed path (like Home '/'), redirect to dashboard immediately
    if (!isAllowedPath && pathname !== '/login' && pathname !== '/signup') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/login',
    '/signup',
  ],
};
