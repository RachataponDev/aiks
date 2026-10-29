'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Power, Sparkles, Database, ShieldCheck, LogOut, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardNavbarProps {
  systemTitle?: string;
  fileCount?: number;
  onClearFiles?: () => void;
  isDataReady?: boolean;
}

export const DashboardNavbar: React.FC<DashboardNavbarProps> = ({
  systemTitle = 'LXVII',
  fileCount = 0,
  onClearFiles,
  isDataReady = false,
}) => {
  const router = useRouter();

  const [isResetting, setIsResetting] = useState(false);

  const handleResetAllData = async () => {
    if (!window.confirm('Are you sure you want to completely reset the system?\n\n- All uploaded CSVs will be removed\n- Cache and analysis results will be cleared\n- All promotions and coupons will be wiped\n\nThis action cannot be undone.')) {
      return;
    }

    try {
      setIsResetting(true);
      const res = await fetch('/api/system-reset', { method: 'POST' });
      const json = await res.json();

      if (json.success) {
        // Clear client local storage caches
        localStorage.removeItem('aiks_metrics_data');
        localStorage.removeItem('aiks_solution_data');
        localStorage.removeItem('aiks_data_is_100_percent_clean');
        toast.success('System reset completed successfully.');

        // Optional clear callback
        if (onClearFiles) {
          onClearFiles();
        }

        // Refresh page or redirect to onboarding
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 800);
      } else {
        toast.error(`Reset failed: ${json.error}`);
      }
    } catch (err: any) {
      toast.error(`Error occurred: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aiks_member_session');
    toast.info('Signed out of Dashboard.');
    router.push('/signin');
  };
  return (
    <header className="h-16 bg-white border-b border-zinc-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <span className="text-sm sm:text-base font-black tracking-tight text-zinc-900 font-mono">
          {systemTitle}
        </span>
        <span className="text-zinc-300 hidden sm:inline">/</span>
        <span className="text-[11px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider truncate hidden sm:inline">
          Data Intake & Validation
        </span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Dataset Status Pill */}
        <div className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold flex items-center gap-1.5 ${
          isDataReady 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : fileCount > 0 
              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
              : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            isDataReady ? 'bg-emerald-500' : fileCount > 0 ? 'bg-blue-500' : 'bg-zinc-400'
          }`} />
          <span>{isDataReady ? 'Verified' : fileCount > 0 ? `${fileCount} Files` : 'No Data'}</span>
        </div>

        {/* Reset System Data Button */}
        <button
          onClick={handleResetAllData}
          disabled={isResetting}
          className="flex items-center gap-1 text-[11px] sm:text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-800 transition px-2 py-1 sm:px-2.5 rounded border border-amber-200 cursor-pointer disabled:opacity-50"
          title="Delete all uploaded files and start over"
        >
          <RotateCcw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isResetting ? 'Resetting...' : 'Reset System'}</span>
        </button>

        {/* Back to Restaurant */}
        <Link
          href="/"
          className="text-[11px] sm:text-xs text-zinc-500 hover:text-zinc-800 transition font-medium px-1.5 sm:px-2 py-1"
        >
          Store
        </Link>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-[11px] sm:text-xs text-zinc-500 hover:text-red-600 transition px-2 py-1 rounded border border-zinc-200 hover:border-red-200 hover:bg-red-50"
          title="Sign out"
        >
          <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
