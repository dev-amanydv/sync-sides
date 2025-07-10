import { NextResponse, NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {

  const token = request.cookies.get('next-auth.session-token') || request.cookies.get('__Secure-next-auth.session-token');
  const isLoggedIn = !!token;
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isLandingPage = request.nextUrl.pathname === '/';

  if (isLoggedIn && isAuthPage){
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  if(!isLoggedIn && !isLandingPage && !isAuthPage){
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  return NextResponse.next()
}
 
export const config = {
  matcher: ['/dashboard/:path*', '/meeting/:path*', '/merge/:path*', '/auth/:path*'],
}