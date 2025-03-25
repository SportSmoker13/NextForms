// app/auth/signin/page.jsx
'use client';

import { Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

const SignInForm = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      callbackUrl: '/forms',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 w-full">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Sign In</h1>
          <p className="text-muted-foreground mt-2">
            Access your form builder account
          </p>
        </div>

        {error && (
          <div className="text-red-500 text-center">
            {error === 'CredentialsSignin'
              ? 'Invalid email or password'
              : 'Authentication error'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="user@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full cursor-pointer">
            Sign In
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              OR CONTINUE WITH
            </span>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            className="w-full cursor-pointer"
            onClick={() => signIn('google', { callbackUrl: '/forms' })}
          >
            Google
          </Button>
        </div>
      </div>
    </div>
  );
};

// Wrap the form with Suspense
export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
