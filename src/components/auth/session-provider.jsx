// components/auth/session-provider.jsx
'use client';

import { SessionProvider } from 'next-auth/react';

export default function NextAuthProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
