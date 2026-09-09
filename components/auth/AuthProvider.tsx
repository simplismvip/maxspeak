'use client';

import { useEffect } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { useAuthStore } from '@/lib/store/useAuthStore';

function AuthSessionSync() {
  const { data, status } = useSession();
  const setFromSession = useAuthStore((s) => s.setFromSession);

  useEffect(() => {
    if (status === 'loading') return;
    const email = data?.user?.email?.trim();
    if (!email) {
      setFromSession(null);
      return;
    }
    setFromSession({
      email,
      name: data.user?.name?.trim() || email.split('@')[0] || '用户',
      image: data.user?.image || undefined,
      provider: data.user?.provider,
    });
  }, [data, status, setFromSession]);

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthSessionSync />
      {children}
    </SessionProvider>
  );
}
