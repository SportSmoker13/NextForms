'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    signOut({
      callbackUrl: '/auth/signin',
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="text-center space-y-6 max-w-md w-full">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary dark:text-primary-foreground" />
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Signing out...</h1>
          <p className="text-muted-foreground mt-2 dark:text-gray-300">
            You're being redirected to the login page
          </p>
        </div>
      </div>
    </div>
  );
}
