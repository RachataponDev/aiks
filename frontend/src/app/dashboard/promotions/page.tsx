'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Tag, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  RefreshCw, 
  CloudRain, 
  Send, 
  Square, 
  CheckSquare,
  Sparkles,
  ShoppingBag,
  Store,
  Layers,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardNavbar } from '@/components/DashboardNavbar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';

interface ClearancePromotion {
  id: string;
  title: string;
  targetedIngredient: string;
  menuItem: string;
  channel: string;
  timeWindow: string;
  originalPriceThb: number;
  promoPriceThb: number;
  marginThb: number;
  expectedUnitsCleared: number;
  expectedWasteSavedThb: number;
  strategyRATIONALE: string;
  weatherFactorNote?: string;
  channels: {
    grabFood: boolean;
    lineMan: boolean;
    shopeeFood: boolean;
    websiteStore: boolean;
  };
}

interface WeatherConditionToday {
  condition: string;
  temperature: string;
  season: string;
  impactOnDineIn: string;
  impactOnDelivery: string;
  syntheticDemandIndex: number;
}

interface SolutionResponse {
  success: boolean;
  isCached: boolean;
  generatedAt: string;
  weatherToday: WeatherConditionToday;
  summary: {
    totalWasteRescueThb: number;
    totalRestockCostThb: number;
    promotionsCount: number;
    reorderCount: number;
  };
  clearancePromotions: ClearancePromotion[];
  executiveStrategy: string;
}

export default function PromotionsGeneratorPage() {
  const router = useRouter();
  const [data, setData] = useState<SolutionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [promotions, setPromotions] = useState<ClearancePromotion[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activating, setActivating] = useState(false);

  const fetchPromotions = async (refresh: boolean = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`/api/operational-solution${refresh ? '?refresh=true' : ''}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
        const mapped = (json.clearancePromotions || []).map((p: any) => ({
          ...p,
          channels: p.channels || {
            grabFood: true,
            lineMan: true,
            shopeeFood: true,
            websiteStore: true,
          },
        }));
        setPromotions(mapped);
        setSelectedIds(new Set(mapped.map((p: any) => p.id)));
        if (refresh) {
          toast.success('Promotions re-calculated based on inventory velocity and weather.');
        }
      } else {
        toast.error(`Failed to calculate promotions: ${json.error}`);
      }
    } catch (err: any) {
      toast.error(`Error loading promotions: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPromotions(false);
  }, []);

  const toggleSelectPromo = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === promotions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(promotions.map(p => p.id)));
    }
  };

  // Toggle individual platform channel button
  const toggleChannel = (promoId: string, channelKey: keyof ClearancePromotion['channels']) => {
    setPromotions(prev => prev.map(p => {
      if (p.id !== promoId) return p;
      return {
        ...p,
        channels: {
          ...p.channels,
          [channelKey]: !p.channels[channelKey],
        },
      };
    }));
  };

  // Activate promotions and redirect to Promotion Management page
  const handleActivatePromotions = async () => {
    const toActivate = promotions.filter(p => selectedIds.has(p.id));
    if (toActivate.length === 0) {
      toast.error('Please select at least 1 promotion to activate.');
      return;
    }

    const toastId = toast.loading('Activating selected promotions and saving to ledger...');
    try {
      setActivating(true);
      const res = await fetch('/api/promotions-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ACTIVATE_BATCH',
          promotions: toActivate,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Successfully activated ${toActivate.length} promotion(s). Redirecting to Promotion Manager...`, { id: toastId });
        setTimeout(() => {
          router.push('/dashboard/promotions/manage');
        }, 800);
      } else {
        toast.error(`Activation failed: ${json.error}`, { id: toastId });
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`, { id: toastId });
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50/70 font-sans antialiased text-zinc-900">
      <DashboardSidebar currentPath="/dashboard/promotions" isDataReady={true} />

      <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-10">
        <DashboardNavbar />

        <main className="flex-1 p-3.5 sm:p-6 md:p-10 max-w-6xl w-full mx-auto space-y-6 sm:space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 tracking-wide uppercase flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  Clearance Strategy
                </span>
                {data?.isCached && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Cached JSON (0 Tokens Used)
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-zinc-950 tracking-tight">
                Recommended Clearance Deals
              </h1>
              <p className="text-xs text-zinc-500 mt-1">
                Formulated from recipe costs and weather conditions. Choose your broadcast channels and click Activate.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/overview"
                className="px-4 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-xs font-bold text-zinc-700 transition"
              >
                ← Overview
              </Link>
              <Link
                href="/dashboard/promotions/manage"
                className="px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-bold text-blue-700 transition flex items-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Promotion Manager</span>
              </Link>
              <button
                onClick={() => fetchPromotions(true)}
                disabled={loading || refreshing}
                className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-98 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Analyzing...' : 'Recalculate'}</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-20 text-center space-y-4">
              <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-zinc-600">
                Evaluating recipe unit economics and weather factors...
              </p>
            </div>
          ) : data ? (
            <>
              {/* Weather Forecast Context Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-sky-900 to-blue-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 border border-sky-800 shadow-xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 text-sky-300 flex items-center justify-center shrink-0 border border-white/15">
                    <CloudRain className="w-6 h-6 text-sky-300" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-sky-300">
                        Weather Integration
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-800/80 text-sky-200">
                        {data.weatherToday.temperature} • {data.weatherToday.season}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white">
                      {data.weatherToday.condition}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-sky-200/90 pt-0.5">
                      <span>• Dine-in Impact: <strong className="text-amber-300">{data.weatherToday.impactOnDineIn}</strong></span>
                      <span>• Delivery Surge: <strong className="text-emerald-300">{data.weatherToday.impactOnDelivery}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="bg-sky-950/80 px-5 py-3 rounded-2xl border border-sky-700/60 shrink-0 text-right self-end md:self-auto">
                  <span className="text-[10px] uppercase font-bold text-sky-300 block">Total Waste Rescued</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    ฿{data.summary.totalWasteRescueThb.toLocaleString()} THB
                  </span>
                </div>
              </div>

              {/* Selection Bar & Primary Action Button */}
              <div className="p-5 rounded-3xl bg-white border border-zinc-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 text-xs font-bold text-zinc-700 hover:text-zinc-950 cursor-pointer"
                  >
                    {selectedIds.size === promotions.length ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-400" />
                    )}
                    <span>Select All ({selectedIds.size}/{promotions.length})</span>
                  </button>
                  <span className="text-xs text-zinc-400">|</span>
                  <span className="text-xs text-zinc-500">
                    Selected deals will be moved to Promotion Manager.
                  </span>
                </div>

                <button
                  onClick={handleActivatePromotions}
                  disabled={activating || selectedIds.size === 0}
                  className="px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-sm flex items-center gap-2 transition shadow-lg shadow-blue-600/30 cursor-pointer active:scale-98"
                >
                  <Send className={`w-4 h-4 ${activating ? 'animate-spin' : ''}`} />
                  <span>{activating ? 'Activating Deals...' : `Activate Selected Deals (${selectedIds.size}) →`}</span>
                </button>
              </div>

              {/* Promotions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promotions.map((promo) => {
                  const isChecked = selectedIds.has(promo.id);
                  return (
                    <div 
                      key={promo.id}
                      className={`rounded-3xl p-6 border-2 transition flex flex-col justify-between space-y-5 relative ${
                        isChecked 
                          ? 'bg-white border-blue-500 shadow-md ring-4 ring-blue-50/50' 
                          : 'bg-white/80 border-zinc-200 opacity-70'
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Top select checkbox & Time window */}
                        <div className="flex items-start justify-between">
                          <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectPromo(promo.id)}
                              className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                            />
                            <span className="text-xs font-black uppercase text-zinc-700 tracking-wide">
                              Include Deal
                            </span>
                          </label>

                          <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {promo.timeWindow}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-black text-lg text-zinc-950 tracking-tight">
                            {promo.title}
                          </h3>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Target Ingredient: <strong className="text-zinc-800">{promo.targetedIngredient}</strong> ({promo.menuItem})
                          </p>
                        </div>

                        {/* Pricing and margin box */}
                        <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-zinc-400 block font-medium">Regular</span>
                            <span className="text-xs line-through text-zinc-400 font-mono">฿{promo.originalPriceThb}</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                          <div>
                            <span className="text-[10px] text-blue-600 font-bold block">Promo Price</span>
                            <span className="text-lg font-black text-blue-700 font-mono">฿{promo.promoPriceThb}</span>
                          </div>
                          <div className="text-right pl-3 border-l border-zinc-200">
                            <span className="text-[10px] text-emerald-700 font-bold block">Profit Margin</span>
                            <span className="text-xs font-bold text-emerald-700 font-mono">+฿{promo.marginThb}/unit</span>
                          </div>
                        </div>

                        {/* Weather impact note */}
                        {promo.weatherFactorNote && (
                          <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100 text-[11px] text-sky-900 leading-tight">
                            <span className="font-bold block text-sky-950 mb-0.5">Weather Rationale:</span>
                            {promo.weatherFactorNote}
                          </div>
                        )}

                        <p className="text-xs text-zinc-600 leading-relaxed bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                          {promo.strategyRATIONALE}
                        </p>
                      </div>

                      {/* BIG VISUAL CHANNEL SELECTION BUTTONS */}
                      <div className="pt-4 border-t border-zinc-100 space-y-2">
                        <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">
                          Broadcast Channels (Click to Toggle)
                        </span>

                        <div className="grid grid-cols-2 gap-2">
                          {/* GrabFood Toggle */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleChannel(promo.id, 'grabFood');
                            }}
                            className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
                              promo.channels?.grabFood
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                            }`}
                          >
                            <span>GrabFood</span>
                            <span className={`w-2 h-2 rounded-full ${promo.channels?.grabFood ? 'bg-emerald-200' : 'bg-zinc-300'}`} />
                          </button>

                          {/* LINE MAN Toggle */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleChannel(promo.id, 'lineMan');
                            }}
                            className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
                              promo.channels?.lineMan
                                ? 'bg-green-600 text-white border-green-700 shadow-xs'
                                : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                            }`}
                          >
                            <span>LINE MAN</span>
                            <span className={`w-2 h-2 rounded-full ${promo.channels?.lineMan ? 'bg-green-200' : 'bg-zinc-300'}`} />
                          </button>

                          {/* ShopeeFood Toggle */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleChannel(promo.id, 'shopeeFood');
                            }}
                            className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
                              promo.channels?.shopeeFood
                                ? 'bg-orange-600 text-white border-orange-700 shadow-xs'
                                : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                            }`}
                          >
                            <span>ShopeeFood</span>
                            <span className={`w-2 h-2 rounded-full ${promo.channels?.shopeeFood ? 'bg-orange-200' : 'bg-zinc-300'}`} />
                          </button>

                          {/* Storefront Website Toggle */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleChannel(promo.id, 'websiteStore');
                            }}
                            className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
                              promo.channels?.websiteStore
                                ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                                : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                            }`}
                          >
                            <span>Store Website</span>
                            <span className={`w-2 h-2 rounded-full ${promo.channels?.websiteStore ? 'bg-blue-200' : 'bg-zinc-300'}`} />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-zinc-500">
              No promotions available. Please verify uploaded datasets.
            </div>
          )}

        </main>
      </div>

      {/* Mobile Magic Bottom Menu for screens <= 768px (down to 360px) */}
      <MobileBottomNav currentPath="/dashboard/promotions" isDataReady={true} />
    </div>
  );
}
