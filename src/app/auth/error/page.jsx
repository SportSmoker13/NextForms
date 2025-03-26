'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '../../../components/ui/button';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

const AuthErrorPageContent = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages = {
    OAuthSignin: {
      title: 'OAuth Sign-In Failed',
      description:
        'There was a problem signing in with the OAuth provider. Please try again.',
    },
    OAuthCallback: {
      title: 'OAuth Callback Error',
      description:
        'Authentication callback from the provider encountered an issue.',
    },
    OAuthCreateAccount: {
      title: 'Account Creation Failed',
      description:
        'Unable to create an account using OAuth. Please contact support.',
    },
    EmailCreateAccount: {
      title: 'Email Account Creation Error',
      description:
        "We couldn't create an account with the provided email. Please check your details.",
    },
    Callback: {
      title: 'Authentication Callback Error',
      description:
        'There was an unexpected error during the authentication process.',
    },
    OAuthAccountNotLinked: {
      title: 'Account Already Exists',
      description:
        'This email is already registered with a different authentication method.',
    },
    default: {
      title: 'Authentication Error',
      description: 'An unexpected error occurred during authentication.',
    },
  };

  const { title, description } = errorMessages[error] || errorMessages.default;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 w-full bg-background text-foreground">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <AlertTriangle
            className="w-16 h-16 text-destructive dark:text-red-400 mb-4"
            strokeWidth={1.5}
          />
          <h1 className="text-3xl font-bold dark:text-white">{title}</h1>
          <p className="text-muted-foreground dark:text-gray-300 text-base">
            {description}
          </p>
        </div>

        <div className="flex flex-col space-y-4">
          <Button
            className="cursor-pointer w-full dark:bg-blue-600 dark:hover:bg-blue-700"
            asChild
          >
            <Link href="/auth/signin">Return to Sign In</Link>
          </Button>
          <Button
            variant="outline"
            className="w-full dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600"
            asChild
          >
            <Link href="/support">Contact Support</Link>
          </Button>
        </div>
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
