import { getToken } from 'next-auth/jwt';
import { NextResponse, NextRequest } from 'next/server'
 
export async function middleware(request: NextRequest) {

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isLoggedIn = !!token;
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isLandingPage = request.nextUrl.pathname === '/';
  console.log("MIDDLEWARE TOKEN:", token);
  console.log("PATH:", request.nextUrl.pathname);
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