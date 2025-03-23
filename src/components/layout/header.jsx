// components/layout/header.jsx
'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '../ui/button';
import { ThemeToggle } from '../theme-toggle';
import { User, FileText, LogOut } from 'lucide-react';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center font-semibold">
          <FileText className="mr-2 h-6 w-6" />
          Form Builder
        </Link>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {session ? (
            <div className="flex items-center gap-2">
              <Button className='cursor-pointer' variant="outline" onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Button className='cursor-pointer' onClick={() => signIn()}>
              <User className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}