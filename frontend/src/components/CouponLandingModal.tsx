'use client';

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Clock, 
  Copy, 
  Check, 
  QrCode, 
  ExternalLink, 
  ShieldCheck, 
  Smartphone,
  Share2,
  Percent,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { PromotionSuggestion } from '@/types/dashboard';

interface CouponLandingModalProps {
  promo: PromotionSuggestion | null;
  channels?: string[];
  selectedDate?: string;
  onClose: () => void;
}

export const CouponLandingModal: React.FC<CouponLandingModalProps> = ({
  promo,
  channels = ['LINE MAN', 'GrabFood'],
  selectedDate = '2026-09-30',
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [redeemed, setRedeemed] = useState(false);

  if (!promo) return null;

  const couponCode = `SAVE${promo.discountPercent}-${promo.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    toast.success(`Coupon code ${couponCode} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateRedeem = () => {
    setRedeemed(true);
    toast.success(`Coupon Redeemed Successfully! ฿${promo.promoPriceThb} charged.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Landing Page Container (Mobile-first voucher style) */}
      <div className="bg-white w-full max-w-md rounded-[8px] overflow-hidden shadow-2xl border border-zinc-200 relative animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-zinc-600 hover:text-black flex items-center justify-center shadow-md transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero Visual Banner */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-blue-900 text-white p-6 pt-7 text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-semibold text-blue-200 mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Limited Daily Flash Offer • {selectedDate}
          </div>

          <h2 className="text-xl font-extrabold tracking-tight text-white mb-1.5 leading-snug">
            {promo.title}
          </h2>

          <p className="text-xs text-zinc-300 max-w-xs mx-auto leading-relaxed">
            {promo.description}
          </p>

          {/* Discount Badge */}
          <div className="mt-4 inline-flex items-baseline gap-2 bg-white/15 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/20">
            <span className="text-2xl font-black text-amber-300 font-mono">
              -{promo.discountPercent}% OFF
            </span>
            <span className="text-xs text-zinc-200 font-medium">Valid Today Only</span>
          </div>
        </div>

        {/* Voucher Ticket Body */}
        <div className="p-6 relative">
          
          {/* Ticket Perforation cutouts */}
          <div className="absolute -top-3 -left-3 w-6 h-6 bg-black/60 rounded-full" />
          <div className="absolute -top-3 -right-3 w-6 h-6 bg-black/60 rounded-full" />

          {/* Pricing Details */}
          <div className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-200 rounded-[6px] mb-5">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-mono block">Regular Price</span>
              <span className="text-sm line-through text-zinc-400 font-mono">฿{promo.originalPriceThb}</span>
            </div>

            <div className="text-center">
              <span className="text-[10px] text-blue-600 font-bold uppercase font-mono block">Special Deal</span>
              <span className="text-2xl font-extrabold text-zinc-900 font-mono">฿{promo.promoPriceThb}</span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-emerald-600 font-bold uppercase font-mono block">You Save</span>
              <span className="text-sm font-bold text-emerald-700 font-mono">
                ฿{promo.originalPriceThb - promo.promoPriceThb}
              </span>
            </div>
          </div>

          {/* Coupon Code Box */}
          <div className="border-2 border-dashed border-zinc-300 bg-zinc-50/80 p-4 rounded-[6px] text-center mb-5">
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block mb-1">
              Your Exclusive Voucher Code:
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono text-xl font-bold tracking-widest text-zinc-900 bg-white px-4 py-1 border border-zinc-200 rounded-[3px] select-all">
                {couponCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-[3px] transition flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Active Channels Supported */}
          <div className="mb-5">
            <span className="text-[10px] uppercase font-bold text-zinc-400 font-mono block mb-2 text-center">
              Available to Redeem via:
            </span>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {channels.map((ch) => (
                <span
                  key={ch}
                  className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {ch}
                </span>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="space-y-2">
            {!redeemed ? (
              <button
                onClick={handleSimulateRedeem}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-[4px] transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <Smartphone className="w-4 h-4" />
                Redeem Voucher in Delivery App
              </button>
            ) : (
              <div className="w-full py-3 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-[4px] text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Voucher Redeemed • Order Placed
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="p-3 bg-zinc-50 border-t border-zinc-200 text-center text-[10px] text-zinc-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          Verified Merchant Discount • AI SME Smart Hospitality
        </div>
      </div>
    </div>
  );
};
