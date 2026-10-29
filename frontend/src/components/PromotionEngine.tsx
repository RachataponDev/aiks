'use client';

import React, { useState } from 'react';
import { 
  Tag, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  ArrowLeft,
  Clock, 
  Check, 
  Calendar, 
  Loader2,
  TrendingUp,
  Store,
  ExternalLink,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { PromotionSuggestion } from '@/types/dashboard';
import { CouponLandingModal } from './CouponLandingModal';

interface PromotionEngineProps {
  promotions?: PromotionSuggestion[];
  onApplyPromo?: (promoId: string) => void;
  onBackToAudit?: () => void;
  selectedDate?: string;
  onDateChange?: (date: string) => void;
  availableDates?: string[];
}

export type DeliveryChannel = 'LINEMAN' | 'GRAB' | 'LINE_OA' | 'STORE';

interface ChannelOption {
  id: DeliveryChannel;
  name: string;
  color: string;
  activeColor: string;
}

const CHANNELS: ChannelOption[] = [
  { id: 'LINEMAN', name: 'LINE MAN', color: 'border-emerald-200 text-emerald-800', activeColor: 'bg-emerald-600 text-white border-emerald-600' },
  { id: 'GRAB', name: 'GrabFood', color: 'border-green-200 text-green-800', activeColor: 'bg-green-600 text-white border-green-600' },
  { id: 'LINE_OA', name: 'LINE OA Broadcast', color: 'border-emerald-200 text-emerald-800', activeColor: 'bg-emerald-700 text-white border-emerald-700' },
  { id: 'STORE', name: 'In-Store POS', color: 'border-zinc-300 text-zinc-800', activeColor: 'bg-zinc-900 text-white border-zinc-900' },
];

export const PromotionEngine: React.FC<PromotionEngineProps> = ({
  promotions = [],
  onApplyPromo,
  onBackToAudit,
  selectedDate = '2026-09-30',
  onDateChange,
  availableDates = ['2026-09-30', '2026-09-29', '2026-09-28', '2026-09-27', '2026-09-26'],
}) => {
  // Promotion selected for Landing Page view
  const [previewPromo, setPreviewPromo] = useState<PromotionSuggestion | null>(null);

  // Multi-channel selection state: Record<promoId, Set of selected channels>
  const [selectedChannels, setSelectedChannels] = useState<Record<string, DeliveryChannel[]>>(() => {
    // Default both LINE MAN & Grab selected for maximum reach
    const initial: Record<string, DeliveryChannel[]> = {};
    promotions.forEach((p) => {
      initial[p.id] = ['LINEMAN', 'GRAB'];
    });
    return initial;
  });

  // Track simulated loading animation per promo
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  // Track launched status with channels
  const [launchedMap, setLaunchedMap] = useState<Record<string, DeliveryChannel[]>>({});

  const toggleChannel = (promoId: string, channel: DeliveryChannel) => {
    setSelectedChannels((prev) => {
      const current = prev[promoId] || ['LINEMAN', 'GRAB'];
      const exists = current.includes(channel);
      let updated: DeliveryChannel[];
      if (exists) {
        // Keep at least 1 channel
        if (current.length === 1) {
          toast.warning('Select at least 1 dispatch channel');
          return prev;
        }
        updated = current.filter((c) => c !== channel);
      } else {
        updated = [...current, channel];
      }
      return { ...prev, [promoId]: updated };
    });
  };

  const handleLaunchCoupon = (promo: PromotionSuggestion) => {
    const channels = selectedChannels[promo.id] || ['LINEMAN', 'GRAB'];
    const channelNames = channels
      .map((c) => CHANNELS.find((ch) => ch.id === c)?.name)
      .filter(Boolean)
      .join(', ');

    setDispatchingId(promo.id);

    // Simulated short 1-second dispatch
    setTimeout(() => {
      setDispatchingId(null);
      setLaunchedMap((prev) => ({
        ...prev,
        [promo.id]: channels,
      }));
      toast.success(`Coupon Dispatched to [${channelNames}]!`, {
        description: `Promo: "${promo.title}" is now active for ${selectedDate}.`,
      });
      if (onApplyPromo) onApplyPromo(promo.id);
    }, 1000);
  };

  // Launch All Campaigns with 1 Click
  const handleLaunchAll = () => {
    setDispatchingId('ALL');
    setTimeout(() => {
      setDispatchingId(null);
      const allLaunched: Record<string, DeliveryChannel[]> = {};
      promotions.forEach((p) => {
        allLaunched[p.id] = selectedChannels[p.id] || ['LINEMAN', 'GRAB'];
      });
      setLaunchedMap(allLaunched);
      toast.success(`All ${promotions.length} Promotions Dispatched Live!`, {
        description: 'Coupons synchronized to selected delivery apps & POS.',
      });
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* MINIMAL HEADER - FOCUS ON 1 ACTION */}
      <div className="bg-white border border-zinc-200 p-4 rounded-[4px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBackToAudit && (
            <button
              onClick={onBackToAudit}
              className="p-2 border border-zinc-200 hover:bg-zinc-50 rounded-[3px] text-zinc-600 transition cursor-pointer"
              title="Back to Data Audit"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-600 text-white rounded-[2px]">
                Promotions Ready
              </span>
              <span className="text-xs font-mono text-zinc-500">
                {promotions.length} Deals Created
              </span>
            </div>
            <h2 className="text-base font-bold text-zinc-900 mt-0.5">
              Select Channels & Launch Coupons
            </h2>
          </div>
        </div>

        {/* Date Selector & 1-Click Launch All */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-[3px] text-xs font-mono">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={selectedDate}
              onChange={(e) => onDateChange && onDateChange(e.target.value)}
              className="bg-transparent font-bold text-zinc-900 focus:outline-none cursor-pointer"
            >
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleLaunchAll}
            disabled={Boolean(dispatchingId)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-[3px] transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          >
            {dispatchingId === 'ALL' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Launching All...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Launch All ({promotions.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* CLEAN CARDS - MINIMAL TEXT, FOCUS ON BUTTONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {promotions.map((p) => {
          const promoChannels = selectedChannels[p.id] || ['LINEMAN', 'GRAB'];
          const isDispatching = dispatchingId === p.id || dispatchingId === 'ALL';
          const launchedChannels = launchedMap[p.id];
          const isLaunched = Boolean(launchedChannels && launchedChannels.length > 0);

          return (
            <div
              key={p.id}
              className={`border rounded-[4px] bg-white transition flex flex-col justify-between overflow-hidden shadow-xs ${
                isLaunched ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-zinc-200'
              }`}
            >
              {/* Card Top */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded-[2px]">
                    {p.targetSegment}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-[2px] border border-rose-200">
                    Clear: {p.ingredientTargeted}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-zinc-900 mb-1 leading-snug">
                  {p.title}
                </h3>
                <p className="text-xs text-zinc-500 mb-3 line-clamp-2">
                  {p.description}
                </p>

                {/* Numbers Pill */}
                <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-[3px] font-mono text-xs mb-4">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Original</span>
                    <span className="line-through text-zinc-400">฿{p.originalPriceThb}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-600 font-bold block">Promo</span>
                    <span className="font-bold text-zinc-900 text-sm">฿{p.promoPriceThb}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 font-bold block">Profit Margin</span>
                    <span className="font-bold text-emerald-700">+฿{p.marginThb}</span>
                  </div>
                </div>

                {/* MULTI-SELECT CHANNELS (Click to toggle) */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5 font-mono">
                    Select Channels (Multi-Choice):
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CHANNELS.map((ch) => {
                      const isSelected = promoChannels.includes(ch.id);
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          disabled={isDispatching}
                          onClick={() => toggleChannel(p.id, ch.id)}
                          className={`px-2.5 py-1.5 text-xs font-semibold rounded-[3px] border transition flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? ch.activeColor
                              : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                          }`}
                        >
                          <span className="truncate">{ch.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card Action Button */}
              <div className="p-3 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500">
                  {isLaunched ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Live on {launchedChannels.length} channels
                    </span>
                  ) : (
                    `${promoChannels.length} channels selected`
                  )}
                </span>

                <div className="flex items-center gap-2">
                  <a
                    href={`/coupon/${p.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-[3px] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Open Customer Public Landing Page (New Tab)"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                    <span>Customer Page ↗</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setPreviewPromo(p)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-[3px] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Quick Preview Voucher Modal"
                  >
                    <Eye className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Preview</span>
                  </button>

                  <button
                    type="button"
                    disabled={isDispatching}
                    onClick={() => handleLaunchCoupon(p)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-[3px] transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                      isDispatching
                        ? 'bg-zinc-400 text-white cursor-wait'
                        : isLaunched
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-zinc-900 hover:bg-black text-white'
                    }`}
                  >
                    {isDispatching ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Dispatching...</span>
                      </>
                    ) : isLaunched ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Dispatched</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Coupon</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Customer-Facing Coupon Landing Page Modal */}
      {previewPromo && (
        <CouponLandingModal
          promo={previewPromo}
          channels={
            (selectedChannels[previewPromo.id] || ['LINEMAN', 'GRAB'])
              .map((c) => CHANNELS.find((ch) => ch.id === c)?.name)
              .filter(Boolean) as string[]
          }
          selectedDate={selectedDate}
          onClose={() => setPreviewPromo(null)}
        />
      )}
    </div>
  );
};
