import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userRole = request.cookies.get('user-role')?.value;
  const normalizedRole = userRole?.toUpperCase();

  // 1. Protect routes that require authentication
  const isProtectedPath = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/chat');
    
  if (!normalizedRole && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Redirect authenticated users away from auth pages
  const isAuthRoute = pathname === '/login' || pathname === '/signup';
  if (normalizedRole && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. Strict Role-Based Access Control (RBAC) for specific dashboard sections
  if (normalizedRole && pathname.startsWith('/dashboard/')) {
    const isTryingAdmin = pathname.startsWith('/dashboard/admin');
    const isTryingOwner = pathname.startsWith('/dashboard/owner');
    const isTryingAgent = pathname.startsWith('/dashboard/agent');
    const isTryingCustomer = pathname.startsWith('/dashboard/customer');
    const isTryingAddProperty = pathname.startsWith('/dashboard/add-property');
    const isTryingAiInsights = pathname.startsWith('/dashboard/ai-insights');

    if (isTryingAdmin && normalizedRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (isTryingOwner && normalizedRole !== 'OWNER') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (isTryingAgent && normalizedRole !== 'AGENT') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (isTryingCustomer && normalizedRole !== 'CUSTOMER') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (isTryingAddProperty && !['OWNER', 'AGENT'].includes(normalizedRole)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (isTryingAiInsights && normalizedRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 4. Restrict management roles from accessing standard customer pages
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
    if (!isAllowedPath) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - files with extensions (e.g. .svg, .png, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
