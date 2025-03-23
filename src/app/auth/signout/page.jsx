// app/auth/signout/page.jsx
'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    signOut({
      callbackUrl: '/auth/signin'
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Signing out...</h1>
        <p className="text-muted-foreground">
          You're being redirected to the login page
        </p>
      </div>
    </div>
  );
}