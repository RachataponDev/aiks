'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Database, 
  Layers, 
  BarChart3, 
  ChefHat, 
  Settings, 
  Sparkles, 
  ShieldCheck,
  TrendingDown
} from 'lucide-react';

interface DashboardSidebarProps {
  currentPath?: string;
  isDataReady?: boolean;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  locked?: boolean;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  currentPath = '/dashboard',
  isDataReady = false,
}) => {
  const [is100Clean, setIs100Clean] = React.useState(false);

  React.useEffect(() => {
    const checkClean = () => {
      const clean = localStorage.getItem('aiks_data_is_100_percent_clean') === 'true';
      setIs100Clean(clean);
    };
    checkClean();
    window.addEventListener('storage', checkClean);
    return () => window.removeEventListener('storage', checkClean);
  }, []);

  const isUnlocked = isDataReady || is100Clean;

  const navItems: NavSection[] = [
    {
      title: 'DATA ONBOARDING',
      items: [
        {
          name: 'Upload Dataset',
          href: '/dashboard',
          icon: Database,
          active: currentPath === '/dashboard',
          badge: isUnlocked ? '100% Clean' : 'Step 1',
        },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        {
          name: 'Urgent State Overview',
          href: '/dashboard/overview',
          icon: BarChart3,
          active: currentPath === '/dashboard/overview',
          locked: !isUnlocked,
        },
        {
          name: 'Clearance Promotions',
          href: '/dashboard/promotions',
          icon: TrendingDown,
          active: currentPath === '/dashboard/promotions',
          locked: !isUnlocked,
          badge: 'Generate',
        },
        {
          name: 'Promotion Manager',
          href: '/dashboard/promotions/manage',
          icon: Settings,
          active: currentPath === '/dashboard/promotions/manage',
          locked: !isUnlocked,
          badge: 'Live',
        },
        {
          name: 'Procurement Orders',
          href: '/dashboard/reorders',
          icon: Layers,
          active: currentPath === '/dashboard/reorders',
          locked: !isUnlocked,
          badge: 'Restock',
        },
      ],
    },
  ];

  return (
    <aside className="hidden lg:flex w-64 bg-white border-r border-zinc-200/80 flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-zinc-200/80 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-black tracking-widest text-xs shadow-sm">
            LX
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black tracking-wider text-zinc-950 font-mono">
              LXVII
            </span>
            <span className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
              Operations Hub
            </span>
          </div>
        </Link>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 py-6 px-3 space-y-6 overflow-y-auto">
        {navItems.map((section, idx) => (
          <div key={idx} className="space-y-1.5">
            <span className="px-3 text-[10px] font-bold text-zinc-400 tracking-wider uppercase">
              {section.title}
            </span>
            <div className="space-y-0.5">
              {section.items.map((item, i) => {
                const Icon = item.icon;
                if (item.locked) {
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 opacity-60 cursor-not-allowed select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-zinc-400" />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-[9px] font-mono uppercase bg-zinc-100 text-zinc-400 px-1.5 py-0.5 rounded">
                        Locked
                      </span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={i}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      item.active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${item.active ? 'text-blue-600' : 'text-zinc-400'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-zinc-200/80 bg-zinc-50/50">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-zinc-700">LXVII Engine v1.0</span>
        </div>
        <p className="text-[10px] text-zinc-400 mt-1">
          Hospitality Intelligence Operations
        </p>
      </div>
    </aside>
  );
};
