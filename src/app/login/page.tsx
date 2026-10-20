'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { LoginView } from '@/components/LoginView';
import { FullScreenLoader } from '@/components/FullScreenLoader';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useApp();

  useEffect(() => {
    if (isHydrated && isAuthenticated) router.replace('/dashboard');
  }, [isHydrated, isAuthenticated, router]);

  if (!isHydrated || isAuthenticated) return <FullScreenLoader />;
  return <LoginView />;
}
