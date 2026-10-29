'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Check fake auth from localStorage
    const session = localStorage.getItem('aiks_member_session');
    if (!session) {
      setIsAuthenticated(false);
      router.replace('/signin');
      return;
    }
    setIsAuthenticated(true);

    // 2. Lock check: If user tries to access child pages without 100% clean data verified
    const isCleaned = localStorage.getItem('aiks_data_is_100_percent_clean') === 'true';
    if (!isCleaned && pathname !== '/dashboard') {
      router.replace('/dashboard');
    }
  }, [router, pathname]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono text-zinc-400">Verifying session & data state...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

