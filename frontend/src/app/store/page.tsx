'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { 
  Clock, Copy, Check, MapPin, Star, Zap, ArrowLeft, Phone, 
  Ticket, QrCode, CheckCircle2, Store, Smartphone, X, AlertCircle, Sparkles, Hourglass
} from 'lucide-react';
import { WebDeveloperFooter } from '@/components/WebDeveloperFooter';

const FALLBACK_PROMOS = [
  { 
    id: 'PROMO-01', 
    title: 'Rainy Day Butter Croissant Flash Deal', 
    menuItem: 'Butter Croissant',
    originalPriceThb: 55, 
    promoPriceThb: 39, 
    discountPercent: 29, 
    expiresInHours: 3,
    maxCouponsAvailable: 60,
    couponsRedeemed: 14,
    timeWindow: '14:00 - 17:00'
  },
  { 
    id: 'PROMO-02', 
    title: 'Afternoon Iced Latte & Tea Boost', 
    menuItem: 'Iced Latte',
    originalPriceThb: 75, 
    promoPriceThb: 55, 
    discountPercent: 27, 
    expiresInHours: 4,
    maxCouponsAvailable: 40,
    couponsRedeemed: 18,
    timeWindow: '13:00 - 18:00'
  },
  { 
    id: 'PROMO-03', 
    title: 'Signature Mango Sticky Rice Clearance', 
    menuItem: 'Mango Sticky Rice',
    originalPriceThb: 95, 
    promoPriceThb: 75, 
    discountPercent: 21, 
    expiresInHours: 6,
    maxCouponsAvailable: 15,
    couponsRedeemed: 9,
    timeWindow: '12:00 - 19:00'
  },
];

const MENU = [
  { name: 'Butter Croissant', price: 55, emoji: '🥐' },
  { name: 'Iced Latte', price: 75, emoji: '🧋' },
  { name: 'Mango Sticky Rice', price: 95, emoji: '🥭' },
  { name: 'Pandan Coconut Cake', price: 65, emoji: '🍰' },
  { name: 'Chicken Basil Rice', price: 89, emoji: '🍛' },
  { name: 'Thai Iced Tea', price: 45, emoji: '🍹' },
];

function useCountdown() {
  const [left, setLeft] = useState('');
  useEffect(() => {
    const tick = () => {
      const end = new Date(); end.setHours(20, 0, 0, 0);
      let ms = end.getTime() - Date.now();
      if (ms < 0) ms += 86400000;
      const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
      setLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return left;
}

export default function StorePage() {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const countdown = useCountdown();

  // In-store Redeem Modal Simulation
  const [activeRedeemPromo, setActiveRedeemPromo] = useState<any | null>(null);
  const [redeemStep, setRedeemStep] = useState<'READY' | 'SCANNING' | 'SUCCESS'>('READY');
  const [redeemTimestamp, setRedeemTimestamp] = useState<string>('');
  const [redeemTimer, setRedeemTimer] = useState<number>(300); // 5 min mock expiry timer for cashier

  useEffect(() => {
    let interval: any;
    if (redeemStep === 'SUCCESS' && redeemTimer > 0) {
      interval = setInterval(() => {
        setRedeemTimer((t) => (t > 0 ? t - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [redeemStep, redeemTimer]);

  const loadPromotions = async () => {
    try {
      const res = await fetch('/api/active-promotions');
      const json = await res.json();
      if (json.success && json.promotions && json.promotions.length > 0) {
        const normalized = json.promotions.map((p: any) => {
          const orig = Number(p.originalPriceThb) || 55;
          const promo = Number(p.promoPriceThb) || 39;
          const discount = p.discountPercent || Math.max(5, Math.round(((orig - promo) / orig) * 100));
          return {
            id: p.id,
            title: p.title,
            menuItem: p.menuItem || p.title,
            originalPriceThb: orig,
            promoPriceThb: promo,
            discountPercent: discount,
            expiresInHours: Number(p.expiresInHours) || 3,
            maxCouponsAvailable: Number(p.maxCouponsAvailable) || 50,
            couponsRedeemed: Number(p.couponsRedeemed) || Number(p.metrics?.redemptionCount) || 0,
            timeWindow: p.timeWindow || '14:00 - 17:00'
          };
        });
        setPromos(normalized);
      } else {
        setPromos(FALLBACK_PROMOS);
      }
    } catch (e) {
      setPromos(FALLBACK_PROMOS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, []);

  const codeOf = (p: any) => `FLASH${p.discountPercent || 30}-${p.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`;

  const copy = (p: any) => {
    navigator.clipboard.writeText(codeOf(p));
    setCopied(p.id);
    toast.success(`Coupon code ${codeOf(p)} copied to clipboard!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleOpenRedeemModal = (p: any) => {
    const remaining = (p.maxCouponsAvailable || 50) - (p.couponsRedeemed || 0);
    if (remaining <= 0) {
      toast.error('This coupon has reached maximum inventory capacity and is sold out!');
      return;
    }
    setActiveRedeemPromo(p);
    setRedeemStep('READY');
    setRedeemTimer(300);
  };

  const handleConfirmRedeem = async () => {
    if (!activeRedeemPromo) return;
    setRedeemStep('SCANNING');

    try {
      // Sync redemption with backend ledger to decrement remaining coupon capacity
      await fetch('/api/promotions-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REDEEM_COUPON', promotion: activeRedeemPromo }),
      });
      // Update local state capacity
      setPromos(prev => prev.map(p => {
        if (p.id !== activeRedeemPromo.id) return p;
        return {
          ...p,
          couponsRedeemed: (p.couponsRedeemed || 0) + 1
        };
      }));
    } catch (e) {
      // Proceed with mock anyway
    }

    setTimeout(() => {
      setRedeemStep('SUCCESS');
      const now = new Date();
      setRedeemTimestamp(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      toast.success('In-Store Coupon Verified & Redeemed!');
    }, 1200);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] text-zinc-900 pb-20">
      {/* Top Navbar */}
      <nav className="absolute top-0 inset-x-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-400" />
            <span className="font-black tracking-tight text-xl font-serif">LXVII</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a href="#deals" className="hidden sm:inline hover:text-amber-300 transition">Flash Deals</a>
            <a href="#menu" className="hidden sm:inline hover:text-amber-300 transition">Menu</a>
            <Link 
              href="/dashboard/promotions/manage" 
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur border border-white/20 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back-Office Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <header className="relative h-[480px] sm:h-[520px] flex items-center">
        <img 
          src="/store-hero.jpg" 
          alt="LXVII dining interior" 
          className="absolute inset-0 w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
        
        <div className="relative max-w-6xl mx-auto px-6 text-white pt-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-400 text-zinc-950 rounded-full text-xs font-black mb-4 animate-pulse">
            <Zap className="w-4 h-4 fill-zinc-950" /> Live In-Store Flash Pass — Ends in {countdown}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight max-w-xl leading-tight">
            LXVII Riverside Dining &amp; Artisan Specials.
          </h1>
          <p className="mt-4 text-zinc-200 max-w-md text-sm sm:text-base leading-relaxed">
            Handcrafted Thai &amp; French café classics by the Chao Phraya. Tap below to present digital flash coupons directly at our counter.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
            <a 
              href="#deals" 
              className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-full transition shadow-lg shadow-amber-400/20"
            >
              Claim In-Store Coupons ({promos.length})
            </a>
            <span className="flex items-center gap-1 text-zinc-200 text-xs sm:text-sm font-medium">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> 4.8 · 1,280 Verified Customer Reviews
            </span>
          </div>
        </div>
      </header>

      {/* Flash Deals Section (Streamlined to Essential Elements Only) */}
      <section id="deals" className="max-w-6xl mx-auto px-6 py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                TODAY ONLY
              </span>
              <span className="text-xs font-medium text-zinc-500">
                Menu • Discount % • Remaining Hours • Inventory Limit
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">
              Active Flash Coupons
            </h2>
          </div>
          <span className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-bold bg-zinc-900 text-amber-400 px-3.5 py-2 rounded-full shadow-sm w-fit">
            <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} /> Window: {countdown} left
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {promos.map((p) => {
            const code = codeOf(p);
            const remainingCoupons = Math.max(0, (p.maxCouponsAvailable || 50) - (p.couponsRedeemed || 0));
            const isSoldOut = remainingCoupons === 0;

            return (
              <div 
                key={p.id} 
                className={`group bg-white rounded-3xl overflow-hidden border-2 transition duration-300 flex flex-col relative ${
                  isSoldOut 
                    ? 'border-zinc-300 opacity-60' 
                    : 'border-zinc-200 hover:border-amber-400 hover:shadow-2xl'
                }`}
              >
                {/* Header: Menu Name & Discount Percentage */}
                <div className="relative bg-gradient-to-br from-rose-500 via-rose-600 to-amber-500 text-white p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-4xl font-black font-mono tracking-tight">
                      -{p.discountPercent}%
                    </span>
                    <span className="text-[11px] font-black uppercase bg-black/25 backdrop-blur px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1">
                      <Hourglass className="w-3 h-3 text-amber-300" />
                      Expires in {p.expiresInHours || 3} hrs
                    </span>
                  </div>
                  {/* Clean Menu Item Name */}
                  <h3 className="font-black text-xl leading-snug">{p.menuItem || p.title}</h3>
                </div>

                {/* Perforation punch effect */}
                <div className="relative h-0 border-t-2 border-dashed border-zinc-200">
                  <span className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-[#faf7f2] border-r-2 border-zinc-200" />
                  <span className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-[#faf7f2] border-l-2 border-zinc-200" />
                </div>

                {/* Body Content: Prices & Real-Time Remaining Capacity */}
                <div className="p-5 flex-1 flex flex-col bg-white">
                  
                  {/* Pricing Row: Before & After Discount */}
                  <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-zinc-100">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Flash Price</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-zinc-950 font-mono">฿{p.promoPriceThb}</span>
                        <span className="text-sm text-zinc-400 line-through font-mono">฿{p.originalPriceThb}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">You Save</div>
                      <span className="text-base font-black text-emerald-600 font-mono">
                        ฿{p.originalPriceThb - p.promoPriceThb}
                      </span>
                    </div>
                  </div>

                  {/* Coupon Stock Capacity Bounded by Inventory BOM */}
                  <div className="bg-zinc-50 rounded-2xl p-3 border border-zinc-200/80 mb-5">
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="text-zinc-600 flex items-center gap-1">
                        <Ticket className="w-3.5 h-3.5 text-amber-600" /> Stock Capacity Limit:
                      </span>
                      <span className={`font-mono ${isSoldOut ? 'text-rose-600 font-black' : 'text-zinc-900'}`}>
                        {isSoldOut ? 'SOLD OUT' : `${remainingCoupons} / ${p.maxCouponsAvailable || 50} left`}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          isSoldOut ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-rose-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (((p.couponsRedeemed || 0) / (p.maxCouponsAvailable || 50)) * 100))}%`
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1.5 flex items-center justify-between">
                      <span>Bounded by raw batch capacity</span>
                      <span>Expires in {p.expiresInHours || 3} hrs</span>
                    </div>
                  </div>

                  {/* In-Store Redeem Action */}
                  <div className="mt-auto space-y-2.5">
                    <button
                      onClick={() => handleOpenRedeemModal(p)}
                      disabled={isSoldOut}
                      className={`w-full py-3 px-4 font-black text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                        isSoldOut 
                          ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed shadow-none' 
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-zinc-950 shadow-amber-500/20'
                      }`}
                    >
                      <Ticket className="w-4 h-4" /> 
                      {isSoldOut ? 'Coupons Depleted (Sold Out)' : 'Use In-Store Coupon'}
                    </button>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 font-mono font-bold text-xs text-center border-2 border-dashed border-zinc-200 bg-zinc-50/70 rounded-lg py-2 select-all text-zinc-700">
                        {code}
                      </div>
                      <button 
                        onClick={() => copy(p)} 
                        className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-800 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer border border-zinc-200"
                        title="Copy Code"
                      >
                        {copied === p.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied === p.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Menu Showcase */}
      <section id="menu" className="bg-white border-y border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Kitchen Craft</span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">Featured Store Menu</h2>
            </div>
            <span className="text-xs text-zinc-400 font-medium hidden sm:inline">Fresh batches baked every 4 hours</span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MENU.map((m) => (
              <div 
                key={m.name} 
                className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-100 hover:border-amber-400 hover:bg-amber-50/30 transition group"
              >
                <span className="text-3xl group-hover:scale-110 transition duration-200">{m.emoji}</span>
                <span className="flex-1 font-bold text-sm text-zinc-800">{m.name}</span>
                <span className="font-mono font-black text-sm text-zinc-950">฿{m.price}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full-Width Footer with Permissions & Developer Credentials */}
      <WebDeveloperFooter />

      {/* ========================================================================= */}
      {/* REALISTIC IN-STORE REDEMPTION MODAL (Mock Coupon Execution)              */}
      {/* ========================================================================= */}
      {activeRedeemPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 relative animate-in zoom-in-95 duration-200">
            {/* Top Close Button */}
            <button
              onClick={() => setActiveRedeemPromo(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-zinc-700 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {redeemStep === 'READY' && (
              <div className="p-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 mb-4 mx-auto">
                  <Smartphone className="w-6 h-6 animate-bounce" />
                </div>
                <h3 className="text-xl font-black text-center text-zinc-900">Present to Cashier</h3>
                <p className="text-xs text-center text-zinc-500 mt-1 mb-6">
                  Please confirm you are standing in front of the counter before activating this voucher.
                </p>

                {/* Voucher Ticket Summary */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-amber-300 rounded-2xl p-4 mb-6">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-amber-700">
                    <span>Digital Voucher</span>
                    <span>Expires in {activeRedeemPromo.expiresInHours || 3} hrs</span>
                  </div>
                  <div className="font-black text-lg text-zinc-900 mt-1">{activeRedeemPromo.menuItem || activeRedeemPromo.title}</div>
                  <div className="flex items-baseline gap-2 mt-3 pt-3 border-t border-amber-200/60">
                    <span className="text-xs text-zinc-500">Counter Price:</span>
                    <span className="text-2xl font-black text-zinc-950 font-mono">฿{activeRedeemPromo.promoPriceThb}</span>
                    <span className="text-xs line-through text-zinc-400 font-mono">฿{activeRedeemPromo.originalPriceThb}</span>
                    <span className="ml-auto text-xs font-black text-rose-600 bg-rose-100 px-2 py-0.5 rounded">
                      -{activeRedeemPromo.discountPercent}%
                    </span>
                  </div>
                  <div className="mt-3 text-[11px] font-mono font-bold bg-white px-3 py-1.5 rounded-lg border border-amber-200 text-center text-amber-900">
                    CODE: {codeOf(activeRedeemPromo)}
                  </div>
                </div>

                <div className="bg-amber-500/10 rounded-xl p-3 mb-6 border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>Once activated, a 5-minute countdown starts for the cashier to scan or verify.</span>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleConfirmRedeem}
                    className="w-full py-3.5 bg-zinc-950 hover:bg-black active:scale-[0.98] text-white font-black text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Tap to Redeem Voucher
                  </button>
                  <button
                    onClick={() => setActiveRedeemPromo(null)}
                    className="w-full py-2.5 text-zinc-500 hover:text-zinc-800 text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {redeemStep === 'SCANNING' && (
              <div className="p-8 text-center py-16">
                <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-ping" />
                  <div className="w-16 h-16 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center shadow-xl animate-pulse">
                    <QrCode className="w-8 h-8" />
                  </div>
                </div>
                <h3 className="text-lg font-black text-zinc-900 mb-1">Verifying Counter Code...</h3>
                <p className="text-xs text-zinc-500">Syncing voucher token with POS terminal</p>
              </div>
            )}

            {redeemStep === 'SUCCESS' && (
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30 animate-in zoom-in duration-300">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black mb-2">
                  <Sparkles className="w-3.5 h-3.5" /> COUPON APPLIED
                </div>

                <h3 className="text-xl font-black text-zinc-900">Redemption Successful!</h3>
                <p className="text-xs text-zinc-500 mt-1">Show this verified pass to the cashier</p>

                {/* Mock Live Barcode / QR Section */}
                <div className="my-5 p-4 bg-zinc-50 border-2 border-emerald-400 rounded-2xl relative overflow-hidden">
                  <div className="font-mono text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Pass Number</div>
                  <div className="font-mono text-lg font-black text-zinc-900 tracking-wider">
                    {codeOf(activeRedeemPromo)}-USED
                  </div>

                  {/* Mock CSS Barcode */}
                  <div className="h-12 w-full my-3 flex items-center justify-center gap-[3px] bg-white p-2 rounded border border-zinc-200">
                    {[12, 28, 16, 36, 12, 40, 24, 16, 32, 20, 28, 12, 36, 16, 24, 40, 20, 28, 12, 32, 16, 24].map((h, i) => (
                      <div 
                        key={i} 
                        className="bg-zinc-900 w-[3px] rounded-full" 
                        style={{ height: `${h}px` }} 
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-200">
                    <span>Verified At: <strong className="text-zinc-800">{redeemTimestamp}</strong></span>
                    <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Expires: {formatTimer(redeemTimer)}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-100 rounded-xl mb-4 text-[11px] text-zinc-600 font-medium">
                  Amount to Pay: <strong className="text-zinc-950 text-sm font-mono">฿{activeRedeemPromo.promoPriceThb}</strong> (Discount of ฿{activeRedeemPromo.originalPriceThb - activeRedeemPromo.promoPriceThb} applied)
                </div>

                <button
                  onClick={() => setActiveRedeemPromo(null)}
                  className="w-full py-3 bg-zinc-900 hover:bg-black text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Close & Back to Store
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
