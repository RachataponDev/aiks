'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight,
  Flame,
  Package,
  TrendingDown,
  Layers,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardNavbar } from '@/components/DashboardNavbar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';

interface KitchenItemAlert {
  itemId: string;
  itemName: string;
  unit: string;
  closingStock: number;
  dailyUsage: number;
  daysRemaining: number;
  estimatedWasteLossThb: number;
  status: 'EXPIRE_SOON' | 'RUNNING_OUT' | 'NOT_ENOUGH';
  aiReason: string;
  recommendedAction: string;
}

interface KitchenAlertsResponse {
  success: boolean;
  isCached: boolean;
  generatedAt: string;
  summaryStats: {
    totalWasteRiskThb: number;
    expiringSoonCount: number;
    runningOutCount: number;
    notEnoughCount: number;
  };
  cards: {
    expiringSoon: KitchenItemAlert[];
    runningOut: KitchenItemAlert[];
    notEnough: KitchenItemAlert[];
  };
}

export default function OverviewPage() {
  const [data, setData] = useState<KitchenAlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Safety confirmation modal state to prevent human error
  const [confirmAction, setConfirmAction] = useState<{
    type: 'PROMOTIONS' | 'ORDERS' | 'UPDATE';
    title: string;
    description: string;
    confirmText: string;
    targetHref?: string;
  } | null>(null);

  const fetchOverview = async (refresh: boolean = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`/api/operational-summary${refresh ? '?refresh=true' : ''}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
        if (refresh) {
          toast.success('Inventory calculations updated successfully.');
        }
      } else {
        toast.error(`Failed to load kitchen status: ${json.error}`);
      }
    } catch (err: any) {
      toast.error(`Error loading kitchen status: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview(false);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans antialiased text-zinc-900 pb-20 lg:pb-0">
      
      {/* Desktop Sidebar (Auto-hidden below 1024px) */}
      <DashboardSidebar currentPath="/dashboard/overview" isDataReady={true} />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardNavbar />

        <main className="flex-1 p-4 sm:p-6 md:p-10 max-w-6xl w-full mx-auto space-y-6 sm:space-y-8">
          
          {/* HEADER WITH BIG HUMAN-ERROR-FREE BUTTONS */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200/60">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-rose-100 text-rose-800 tracking-wide uppercase flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-600" />
                  Kitchen Action Center
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Live Calculated
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-zinc-950 tracking-tight">
                Kitchen Waste & Stock Urgent State
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Clear summary of items to cook, promote, or restock today to eliminate food waste.
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Link
                href="/dashboard"
                className="px-4 py-2.5 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-700 transition shadow-xs"
              >
                ← Datasets
              </Link>
              <button
                onClick={() => {
                  setConfirmAction({
                    type: 'UPDATE',
                    title: 'Recalculate Kitchen Status?',
                    description: 'This will re-evaluate inventory levels, daily usage runs, and shelf-life expiration dates from the latest CSV data.',
                    confirmText: 'Yes, Recalculate',
                  });
                }}
                disabled={loading || refreshing}
                className="px-5 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-97 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Updating...' : 'Update Status'}</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-16 sm:p-24 text-center space-y-4">
              <div className="w-12 h-12 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-zinc-600">
                Evaluating kitchen stock runway and waste risks...
              </p>
            </div>
          ) : data ? (
            <>
              {/* 1. TOP 3 BIG STATE TILES (CLEAR VISUAL TOUCH TARGETS) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">

                {/* Card 1: Spoilage Risk (Red) */}
                <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-rose-200 shadow-sm space-y-4 flex flex-col justify-between relative overflow-hidden">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs uppercase tracking-wider">
                          <Clock className="w-4 h-4 text-rose-600" />
                          <span>Spoilage Risk</span>
                        </div>
                        <h2 className="text-2xl font-black text-zinc-950">
                          {data.summaryStats.expiringSoonCount} Items
                        </h2>
                      </div>
                      <span className="w-10 h-10 rounded-2xl bg-rose-600 text-white font-mono font-black text-base flex items-center justify-center shadow-xs">
                        {data.summaryStats.expiringSoonCount}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Short shelf-life items. Feature as daily specials or flash discounts before expiry.
                    </p>

                    {/* Items List */}
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {data.cards.expiringSoon.map(item => (
                        <div key={item.itemId} className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-zinc-950 text-xs sm:text-sm">
                              {item.itemName}
                            </span>
                            <span className="font-mono font-bold text-rose-700 text-xs px-2 py-0.5 rounded-lg bg-white border border-rose-200">
                              {item.closingStock} {item.unit}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-zinc-600">
                            <span>Runway: <strong className="text-rose-700">{item.daysRemaining} days</strong></span>
                            <span className="font-semibold text-rose-800">฿{item.estimatedWasteLossThb.toLocaleString()} Risk</span>
                          </div>

                          <div className="bg-white/90 p-2 rounded-xl text-[11px] text-rose-900 font-medium">
                            👉 {item.recommendedAction}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Primary Big Direct Action Button */}
                  <button
                    onClick={() => {
                      setConfirmAction({
                        type: 'PROMOTIONS',
                        title: 'Proceed to Clearance Promotions?',
                        description: `You have ${data.summaryStats.expiringSoonCount} item(s) facing ฿${data.summaryStats.totalWasteRiskThb.toLocaleString()} THB in potential waste. Launch flash promotions to sell them out fast?`,
                        confirmText: 'Launch Clearance Deals',
                        targetHref: '/dashboard/promotions',
                      });
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md active:scale-97 cursor-pointer mt-2"
                  >
                    <span>Launch Spoilage Deals</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Card 2: Stockout Risk (Amber) */}
                <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-amber-200 shadow-sm space-y-4 flex flex-col justify-between relative overflow-hidden">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs uppercase tracking-wider">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Stockout Risk</span>
                        </div>
                        <h2 className="text-2xl font-black text-zinc-950">
                          {data.summaryStats.runningOutCount} Items
                        </h2>
                      </div>
                      <span className="w-10 h-10 rounded-2xl bg-amber-600 text-white font-mono font-black text-base flex items-center justify-center shadow-xs">
                        {data.summaryStats.runningOutCount}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Fast-moving supplies below 2.5-day safety buffer. Create purchase orders to prevent stockouts.
                    </p>

                    {/* Items List */}
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {data.cards.runningOut.map(item => (
                        <div key={item.itemId} className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-zinc-950 text-xs sm:text-sm">
                              {item.itemName}
                            </span>
                            <span className="font-mono font-bold text-amber-900 text-xs px-2 py-0.5 rounded-lg bg-white border border-amber-200">
                              {item.closingStock} {item.unit}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-zinc-600">
                            <span>Runway: <strong className="text-amber-800">{item.daysRemaining} days</strong></span>
                            <span>{item.dailyUsage} {item.unit}/day</span>
                          </div>

                          <div className="bg-white/90 p-2 rounded-xl text-[11px] text-amber-950 font-medium">
                            👉 {item.recommendedAction}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Primary Big Direct Action Button */}
                  <button
                    onClick={() => {
                      setConfirmAction({
                        type: 'ORDERS',
                        title: 'Generate Restock Purchase Orders?',
                        description: `${data.summaryStats.runningOutCount} key ingredient(s) are depleting rapidly. Navigate to Procurement Orders to review recommended restock quantities?`,
                        confirmText: 'Generate Purchase Orders',
                        targetHref: '/dashboard/reorders',
                      });
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md active:scale-97 cursor-pointer mt-2"
                  >
                    <span>Restock Depleting Supplies</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Card 3: Buffer Margin (Blue) */}
                <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-blue-200 shadow-sm space-y-4 flex flex-col justify-between relative overflow-hidden">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs uppercase tracking-wider">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span>Tight Buffer</span>
                        </div>
                        <h2 className="text-2xl font-black text-zinc-950">
                          {data.summaryStats.notEnoughCount} Items
                        </h2>
                      </div>
                      <span className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-mono font-black text-base flex items-center justify-center shadow-xs">
                        {data.summaryStats.notEnoughCount}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Tight inventory buffers (2.5–3.2 days). High catering demand or weekend volume could cause sudden runout.
                    </p>

                    {/* Items List */}
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {data.cards.notEnough.map(item => (
                        <div key={item.itemId} className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-zinc-950 text-xs sm:text-sm">
                              {item.itemName}
                            </span>
                            <span className="font-mono font-bold text-blue-900 text-xs px-2 py-0.5 rounded-lg bg-white border border-blue-200">
                              {item.closingStock} {item.unit}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-zinc-600">
                            <span>Runway: <strong className="text-blue-800">{item.daysRemaining} days</strong></span>
                            <span>{item.dailyUsage} {item.unit}/day</span>
                          </div>

                          <div className="bg-white/90 p-2 rounded-xl text-[11px] text-blue-950 font-medium">
                            👉 {item.recommendedAction}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    href="/dashboard/reorders"
                    className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md active:scale-97 text-center mt-2"
                  >
                    <span>View Weekend Replenishment</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

              </div>

              {/* 2. BIG PREVENT-HUMAN-ERROR ACTION BANNER */}
              <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 border border-zinc-800 shadow-xl">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-bold block">
                    Prevent Food Waste & Under-Stocking
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    Identified ฿{data.summaryStats.totalWasteRiskThb.toLocaleString()} THB in Kitchen Spoilage Risk
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Choose one of the two verified operational actions below to resolve immediately:
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
                  <button
                    onClick={() => {
                      setConfirmAction({
                        type: 'PROMOTIONS',
                        title: 'Launch Clearance Promotions?',
                        description: 'This will convert short shelf-life stock into flash sale bundles and publish vouchers to your online store and delivery apps.',
                        confirmText: 'Go to Promotions',
                        targetHref: '/dashboard/promotions',
                      });
                    }}
                    className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition shadow-lg shadow-cyan-600/30 cursor-pointer active:scale-97"
                  >
                    <TrendingDown className="w-4 h-4" />
                    <span>1. Launch Clearance Deals</span>
                  </button>

                  <button
                    onClick={() => {
                      setConfirmAction({
                        type: 'ORDERS',
                        title: 'Open Procurement Orders?',
                        description: 'Review low stock kitchen ingredients and generate purchase order sheets for suppliers before supplier order cut-offs.',
                        confirmText: 'Go to Orders',
                        targetHref: '/dashboard/reorders',
                      });
                    }}
                    className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition border border-zinc-700 cursor-pointer active:scale-97"
                  >
                    <Layers className="w-4 h-4" />
                    <span>2. Procurement Orders</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-16 text-center text-zinc-500 bg-white rounded-3xl border border-zinc-200">
              No inventory data available. Please upload datasets first.
            </div>
          )}

        </main>
      </div>

      {/* 3. SAFETY CONFIRMATION MODAL (PREVENTS HUMAN ERROR BEFORE TAKING ACTION) */}
      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-zinc-200 overflow-hidden p-6 text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-bold text-zinc-900">{confirmAction.title}</h3>
                <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                  {confirmAction.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const target = confirmAction.targetHref;
                    const actionType = confirmAction.type;
                    setConfirmAction(null);

                    if (actionType === 'UPDATE') {
                      fetchOverview(true);
                    } else if (target) {
                      window.location.href = target;
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"
                >
                  {confirmAction.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. MOBILE BOTTOM MAGIC NAV (SHOWN ONLY ON SCREENS < 1024px DOWN TO 360px) */}
      <MobileBottomNav currentPath="/dashboard/overview" isDataReady={true} />

    </div>
  );
}
