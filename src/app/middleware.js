// middleware.js
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const session = await getToken({ req, secret: process.env.NEXT_PUBLIC_SECRET });
  const { pathname } = req.nextUrl;

  // Protected routes
  const protectedRoutes = ['/dashboard', '/forms', '/responses'];

  // Redirect unauthenticated users
  if (!session && protectedRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  return NextResponse.next();
}
