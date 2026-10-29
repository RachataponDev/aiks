'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Database, 
  BarChart3, 
  ChefHat, 
  Settings, 
  TrendingDown, 
  Layers,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileBottomNavProps {
  currentPath?: string;
  isDataReady?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentPath = '/dashboard/overview',
  isDataReady = false,
}) => {
  const [is100Clean, setIs100Clean] = useState(false);

  useEffect(() => {
    const checkClean = () => {
      const clean = localStorage.getItem('aiks_data_is_100_percent_clean') === 'true';
      setIs100Clean(clean);
    };
    checkClean();
    window.addEventListener('storage', checkClean);
    return () => window.removeEventListener('storage', checkClean);
  }, []);

  const isUnlocked = isDataReady || is100Clean;

  const navItems = [
    {
      name: 'Intake',
      href: '/dashboard',
      icon: Database,
      active: currentPath === '/dashboard',
    },
    {
      name: 'Overview',
      href: '/dashboard/overview',
      icon: BarChart3,
      active: currentPath === '/dashboard/overview',
      locked: !isUnlocked,
    },
    {
      name: 'Promotions',
      href: '/dashboard/promotions',
      icon: TrendingDown,
      active: currentPath === '/dashboard/promotions',
      locked: !isUnlocked,
    },
    {
      name: 'Orders',
      href: '/dashboard/reorders',
      icon: Layers,
      active: currentPath === '/dashboard/reorders',
      locked: !isUnlocked,
    },
    {
      name: 'Manage',
      href: '/dashboard/promotions/manage',
      icon: Settings,
      active: currentPath === '/dashboard/promotions/manage',
      locked: !isUnlocked,
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200/80 px-2 py-1.5 shadow-lg flex items-center justify-around safe-area-bottom">
      {navItems.map((item, idx) => {
        const Icon = item.icon;
        if (item.locked) {
          return (
            <div
              key={idx}
              className="flex flex-col items-center justify-center py-1 px-2 text-zinc-300 opacity-50 cursor-not-allowed select-none min-w-[56px]"
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-medium tracking-tight truncate">{item.name}</span>
            </div>
          );
        }

        return (
          <Link
            key={idx}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition min-w-[56px] relative ${
              item.active
                ? 'text-cyan-700 font-bold'
                : 'text-zinc-500 hover:text-zinc-900 active:scale-95'
            }`}
          >
            {item.active && (
              <motion.div
                layoutId="magicNavPill"
                className="absolute inset-0 bg-cyan-50 rounded-xl -z-10"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <Icon className={`w-5 h-5 mb-0.5 ${item.active ? 'text-cyan-600 stroke-[2.5]' : 'text-zinc-500'}`} />
            <span className="text-[10px] tracking-tight truncate">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};

