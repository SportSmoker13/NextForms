import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    console.log('Middleware running');
    console.log('Request URL:', req.nextUrl.pathname);
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        console.log('Authorization check - Token exists:', !!token);
        return token !== null;
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

export const config = {
  matcher: ['/dashboard', '/forms', '/responses'],
};
