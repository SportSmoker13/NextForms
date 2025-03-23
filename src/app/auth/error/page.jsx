// app/auth/error/page.jsx
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '../../../components/ui/button';
import Link from 'next/link';

const AuthErrorPageContent = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages = {
    OAuthSignin: 'Error processing OAuth sign in',
    OAuthCallback: 'Error processing OAuth callback',
    OAuthCreateAccount: 'Error creating OAuth account',
    EmailCreateAccount: 'Error creating email account',
    Callback: 'Error processing callback',
    OAuthAccountNotLinked: 'Email already in use with different provider',
    default: 'Authentication error occurred',
  };

  const errorMessage = errorMessages[error] || errorMessages.default;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Authentication Error</h1>
          <p className="text-muted-foreground">{errorMessage}</p>
        </div>
        
        <Button className='cursor-pointer' asChild>
          <Link href="/auth/signin">
            Return to Sign In
          </Link>
        </Button>
      </div>
    </div>
  );
};

// Wrap the content in a Suspense boundary
export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorPageContent />
    </Suspense>
  );
}
