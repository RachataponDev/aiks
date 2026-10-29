'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, use } from 'react';
import { 
  Sparkles, 
  Clock, 
  Copy, 
  Check, 
  MapPin, 
  Phone, 
  Share2, 
  ShieldCheck, 
  ArrowLeft,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { PromotionSuggestion } from '@/types/dashboard';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CouponPublicLandingPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const promoId = resolvedParams.id;

  const [promo, setPromo] = useState<PromotionSuggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [orderClaimed, setOrderClaimed] = useState(false);

  useEffect(() => {
    // 1. Try to read from localStorage first
    try {
      const savedData = localStorage.getItem('aiks_metrics_data');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        const match = parsed.promotionSuggestions?.find((p: PromotionSuggestion) => p.id === promoId);
        if (match) {
          setPromo(match);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    // 2. Fallback to API data-summary
    fetch('/api/data-summary')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.promotionSuggestions) {
          const match = json.data.promotionSuggestions.find((p: PromotionSuggestion) => p.id === promoId);
          if (match) {
            setPromo(match);
          } else {
            // Default first promo if id not found
            setPromo(json.data.promotionSuggestions[0] || null);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [promoId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="text-center font-mono text-xs text-zinc-500">
          <Sparkles className="w-5 h-5 text-blue-600 animate-spin mx-auto mb-2" />
          Loading Flash Deal Voucher...
        </div>
      </div>
    );
  }

  // Fallback demo coupon if not loaded
  const activePromo: PromotionSuggestion = promo || {
    id: promoId || 'PROMO-CRS-01',
    title: 'Warm Butter Croissant & Coffee Flash Deal',
    targetSegment: 'Cafe',
    ingredientTargeted: 'Croissant dough',
    originalPriceThb: 55,
    promoPriceThb: 35,
    discountPercent: 36,
    unitCostThb: 21,
    marginThb: 14,
    description: 'Freshly baked artisanal butter croissant. Baked today using French cultured butter. Grab yours before shift clearance!',
    channel: 'LINE MAN & GrabFood',
    urgency: 'HIGH',
  };

  const couponCode = `FLASH${activePromo.discountPercent}-${activePromo.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    toast.success(`Coupon code ${couponCode} copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 font-sans flex flex-col justify-between">
      
      {/* Front-Store Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-30">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 transition font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Merchant Hub</span>
          </Link>

          <span className="font-bold text-xs tracking-tight text-zinc-900 uppercase font-mono">
            Smart Café & Deli
          </span>

          <span className="w-6" />
        </div>
      </header>

      {/* Main Public Voucher Card (Mobile Container) */}
      <main className="max-w-md mx-auto w-full p-4 py-6 flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-[12px] overflow-hidden shadow-lg border border-zinc-200">
          
          {/* Top Hero Banner */}
          <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-blue-950 text-white p-6 text-center relative overflow-hidden">
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-400 text-zinc-950 rounded-full text-[11px] font-extrabold uppercase tracking-wide mb-3 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Limited Afternoon Flash Sale
            </div>

            <h1 className="text-xl font-black tracking-tight text-white mb-2 leading-snug">
              {activePromo.title}
            </h1>

            <p className="text-xs text-zinc-300 leading-relaxed max-w-xs mx-auto">
              {activePromo.description}
            </p>

            {/* Discount Badge */}
            <div className="mt-4 inline-flex items-baseline gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-xs">
              <span className="text-2xl font-black text-amber-300 font-mono">
                -{activePromo.discountPercent}% OFF
              </span>
              <span className="text-xs text-zinc-200 font-medium">Valid Today Only</span>
            </div>
          </div>

          {/* Ticket Perforation Notch */}
          <div className="relative py-2 bg-zinc-50 border-y border-dashed border-zinc-200 flex items-center justify-between px-4">
            <div className="w-4 h-4 rounded-full bg-zinc-100 -ml-6 border border-zinc-200" />
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
              • Exclusive Online Voucher •
            </span>
            <div className="w-4 h-4 rounded-full bg-zinc-100 -mr-6 border border-zinc-200" />
          </div>

          {/* Pricing & Voucher Code Area */}
          <div className="p-6">
            
            {/* Price Box */}
            <div className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-200 rounded-[8px] mb-5">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-mono block">Regular Price</span>
                <span className="text-sm line-through text-zinc-400 font-mono">฿{activePromo.originalPriceThb}</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-blue-600 font-bold uppercase font-mono block">Deal Price</span>
                <span className="text-2xl font-black text-zinc-900 font-mono">฿{activePromo.promoPriceThb}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-600 font-bold uppercase font-mono block">You Save</span>
                <span className="text-sm font-bold text-emerald-700 font-mono">
                  ฿{activePromo.originalPriceThb - activePromo.promoPriceThb}
                </span>
              </div>
            </div>

            {/* Voucher Code Copy Box */}
            <div className="border border-zinc-200 bg-zinc-50 p-4 rounded-[8px] text-center mb-6">
              <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold tracking-wider block mb-1.5">
                Redemption Code:
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-xl font-black tracking-wider text-zinc-900 bg-white px-4 py-1.5 border border-zinc-300 rounded-[4px] select-all">
                  {couponCode}
                </span>
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-[4px] transition flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Delivery Apps 1-Click Order Buttons */}
            <div className="space-y-2.5 mb-6">
              <span className="text-[10px] uppercase font-bold text-zinc-400 font-mono block text-center">
                Order Directly With Coupon:
              </span>

              {/* LINE MAN */}
              <button
                onClick={() => {
                  setOrderClaimed(true);
                  toast.success(`Redirecting to LINE MAN with promo code ${couponCode}...`);
                }}
                className="w-full py-3 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-sm rounded-[6px] transition flex items-center justify-between px-4 cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white text-[#06C755] font-black text-[10px] flex items-center justify-center">
                    LM
                  </span>
                  <span>Order on LINE MAN</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-70" />
              </button>

              {/* GrabFood */}
              <button
                onClick={() => {
                  setOrderClaimed(true);
                  toast.success(`Redirecting to GrabFood with promo code ${couponCode}...`);
                }}
                className="w-full py-3 bg-[#00B14F] hover:bg-[#009e46] text-white font-bold text-sm rounded-[6px] transition flex items-center justify-between px-4 cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white text-[#00B14F] font-black text-[10px] flex items-center justify-center">
                    GF
                  </span>
                  <span>Order on GrabFood</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-70" />
              </button>
            </div>

            {/* In-Store Notice */}
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-[6px] flex items-start gap-2.5 text-xs text-zinc-600">
              <MapPin className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-zinc-900 block font-semibold">In-Store Walk-in:</strong>
                <span>Present this screen at our front counter before 17:00 to redeem.</span>
              </div>
            </div>

          </div>

          {/* Footer Guarantee */}
          <div className="p-3 bg-zinc-50 border-t border-zinc-200 text-center text-[10px] text-zinc-400 font-mono flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified Authentic Merchant Deal • Single-Use Per Customer
          </div>

        </div>
      </main>

      {/* Front-Store Footer */}
      <footer className="text-center py-4 text-[11px] text-zinc-400 font-mono">
        © 2026 Smart Hospitality F&B Ecosystem • Bangkok Riverside
      </footer>
    </div>
  );
}
