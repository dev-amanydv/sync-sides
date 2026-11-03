import { getToken } from 'next-auth/jwt';
import { NextResponse, NextRequest } from 'next/server'

// Only allow same-origin relative paths as redirect targets
const safeCallbackUrl = (url: string | null) =>
  url && url.startsWith('/') && !url.startsWith('//') ? url : null;

export async function middleware(request: NextRequest) {

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isLoggedIn = !!token;
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isLandingPage = request.nextUrl.pathname === '/';

  if (isLoggedIn && isAuthPage){
    const callbackUrl = safeCallbackUrl(request.nextUrl.searchParams.get('callbackUrl'));
    return NextResponse.redirect(new URL(callbackUrl ?? '/dashboard', request.url))
  }
  if(!isLoggedIn && !isLandingPage && !isAuthPage){
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/meeting/:path*', '/auth/:path*'],
}
