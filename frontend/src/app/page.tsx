'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  ShoppingBag, 
  Calendar, 
  Clock, 
  Copy, 
  Check, 
  Settings, 
  ChevronDown, 
  Play, 
  Sparkles,
  Zap,
  ArrowRight,
  User,
  ShieldCheck,
  CheckCircle2,
  Package,
  TrendingDown,
  RefreshCw,
  Layers,
  Phone,
  Mail,
  MapPin,
  Send,
  MessageSquare,
  Lock,
  Navigation
} from 'lucide-react';
import { toast } from 'sonner';
import { PromotionSuggestion } from '@/types/dashboard';
import { motion } from 'framer-motion';
import { WebDeveloperFooter } from '@/components/WebDeveloperFooter';

export default function RestaurantLandingPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [promotions, setPromotions] = useState<PromotionSuggestion[]>([]);
  const [isMemberLoggedIn, setIsMemberLoggedIn] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [claimedPromos, setClaimedPromos] = useState<string[]>([]);

  // Reservation form state
  const [resName, setResName] = useState('');
  const [resEmail, setResEmail] = useState('');
  const [resPhone, setResPhone] = useState('');
  const [resGuests, setResGuests] = useState('2 Persons');
  const [resDate, setResDate] = useState('2026-10-30');
  const [resTime, setResTime] = useState('18:00');

  // Load active promotions from API (or fallback if empty)
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const res = await fetch('/api/active-promotions');
        const json = await res.json();
        if (json.success && Array.isArray(json.promotions)) {
          // Format active promotions to match card format
          const formatted = json.promotions.map((p: any) => ({
            id: p.id,
            title: p.title || p.menuItem,
            targetSegment: 'Flash Sale',
            ingredientTargeted: p.targetedIngredient,
            originalPriceThb: p.originalPriceThb,
            promoPriceThb: p.promoPriceThb,
            discountPercent: Math.round(((p.originalPriceThb - p.promoPriceThb) / (p.originalPriceThb || 1)) * 100),
            unitCostThb: 0,
            marginThb: 0,
            description: p.description,
            channel: 'Online Store & Delivery',
            urgency: 'HIGH',
          }));
          setPromotions(formatted);
          return;
        }
      } catch (err) {
        console.warn('Failed to load active promotions:', err);
      }
      setPromotions([]);
    };

    fetchPromotions();

    // Check if customer member session exists
    try {
      const activeMember = localStorage.getItem('aiks_member_session');
      if (activeMember) {
        const parsed = JSON.parse(activeMember);
        setIsMemberLoggedIn(true);
        setMemberEmail(parsed.email || 'member@lxvii.com');
      }
    } catch {}
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code ${code} copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleReservation = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Table Reserved for ${resGuests} on ${resDate} at ${resTime}! Confirmation sent to ${resEmail || 'email'}.`);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-800 font-sans">
      
      {/* 1. TOP NAVIGATION BAR (Exact match to template header) */}
      <nav className="fixed top-0 inset-x-0 z-40 bg-[#141414]/95 backdrop-blur-md border-b border-white/10 text-white transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Brand Logo matching template */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-serif font-black tracking-wider text-white group-hover:text-amber-400 transition">
              <span className="text-amber-400">R</span>estaura
            </span>
            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mb-1" />
          </Link>

          {/* Central Nav Links */}
          <div className="hidden lg:flex items-center gap-7 text-[11px] font-extrabold tracking-widest uppercase">
            <a href="#home" className="text-amber-400 hover:text-amber-300 transition flex items-center gap-1">
              HOME
            </a>
            <a href="#deals" className="text-amber-300 hover:text-amber-200 transition font-black flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              FLASH DEALS
            </a>
            <a href="#about" className="text-zinc-300 hover:text-amber-400 transition">
              ABOUT US
            </a>
            <a href="#contact" className="text-zinc-300 hover:text-amber-400 transition">
              CONTACT US
            </a>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-4">
            
            {/* RESERVATION Box Button */}
            <a
              href="#reservation"
              className="hidden sm:inline-flex items-center px-5 py-2.5 text-[11px] font-bold tracking-widest uppercase border border-amber-400/80 text-amber-300 hover:bg-amber-400 hover:text-zinc-950 transition rounded-[2px]"
            >
              RESERVATION
            </a>

            {/* Search Icon */}
            <button 
              onClick={() => toast.info('Type to search restaurant courses and specials...')}
              className="text-zinc-300 hover:text-amber-400 p-1.5 transition cursor-pointer"
              title="Search menu"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* AUTH / MEMBER BUTTONS */}
            <div className="flex items-center gap-2 border-l border-zinc-700/80 pl-3">
              {isMemberLoggedIn ? (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-[2px]">
                    Member: {memberEmail.split('@')[0]}
                  </span>
                  <button
                    onClick={() => {
                      localStorage.removeItem('aiks_member_session');
                      setIsMemberLoggedIn(false);
                      toast.info('Signed out of Member Portal.');
                    }}
                    className="text-[10px] text-zinc-400 hover:text-white transition underline cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    href="/signin"
                    className="px-2.5 py-1 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-white/10 rounded-[2px] transition cursor-pointer"
                  >
                    Sign In
                  </Link>

                  <Link
                    href="/signup"
                    className="px-3 py-1 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-[2px] transition cursor-pointer shadow-sm"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Direct Dashboard Link */}
            <Link
              href="/dashboard"
              className="w-8 h-8 rounded-[2px] bg-white hover:bg-amber-400 text-zinc-900 transition flex items-center justify-center shadow-md cursor-pointer ml-1"
              title="Merchant Decision Intelligence Dashboard"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. HERO HEADER SECTION (Dark Wood Background + Big Typography) */}
      <section 
        id="home"
        className="relative min-h-[680px] pt-32 pb-44 flex items-center justify-start bg-cover bg-center"
        style={{ backgroundImage: `url('/dark-hero.jpg')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/40" />

        <div className="relative max-w-7xl mx-auto px-6 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-2xl"
          >
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#d4af37] tracking-tight mb-2"
            >
              Delicious Foods
            </motion.h2>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.8 }}
              className="font-serif text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none mb-8"
            >
              Specialty Of Foods
            </motion.h1>

            <motion.a
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              href="#reservation"
              className="inline-block px-8 py-3.5 border-2 border-amber-400 text-amber-300 hover:bg-amber-400 hover:text-zinc-950 font-bold text-xs tracking-widest uppercase transition rounded-[2px]"
            >
              Reservation
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* 3. PLEASE BOOK A TABLE FLOATING FORM (Exact match to screenshot 1 & 2) */}
      <section id="reservation" className="relative -mt-28 z-30 max-w-5xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="bg-white rounded-[4px] p-8 shadow-2xl border border-zinc-200"
        >
          <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-center text-zinc-900 uppercase tracking-widest mb-6">
            Please Book A Table
          </h3>

          <form onSubmit={handleReservation} className="space-y-4">
            {/* Row 1: Name, Email, Phone */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Enter Your Name"
                value={resName}
                onChange={(e) => setResName(e.target.value)}
                required
                className="w-full px-3.5 py-3 text-xs border border-zinc-300 rounded-[2px] focus:outline-none focus:border-amber-500"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={resEmail}
                onChange={(e) => setResEmail(e.target.value)}
                required
                className="w-full px-3.5 py-3 text-xs border border-zinc-300 rounded-[2px] focus:outline-none focus:border-amber-500"
              />
              <input
                type="tel"
                placeholder="Telephone Number"
                value={resPhone}
                onChange={(e) => setResPhone(e.target.value)}
                required
                className="w-full px-3.5 py-3 text-xs border border-zinc-300 rounded-[2px] focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Row 2: Number of Guests, Date, Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={resGuests}
                onChange={(e) => setResGuests(e.target.value)}
                className="w-full px-3.5 py-3 text-xs border border-zinc-300 rounded-[2px] focus:outline-none focus:border-amber-500 bg-white cursor-pointer"
              >
                <option value="1 Person">1 Person</option>
                <option value="2 Persons">2 Persons</option>
                <option value="3 Persons">3 Persons</option>
                <option value="4 Persons">4 Persons</option>
                <option value="5+ Persons">5+ Persons Group</option>
              </select>

              <div className="relative">
                <input
                  type="date"
                  value={resDate}
                  onChange={(e) => setResDate(e.target.value)}
                  className="w-full px-3.5 py-3 text-xs border border-zinc-300 rounded-[2px] focus:outline-none focus:border-amber-500 bg-white"
                />
              </div>

              <select
                value={resTime}
                onChange={(e) => setResTime(e.target.value)}
                className="w-full px-3.5 py-3 text-xs border border-zinc-300 rounded-[2px] focus:outline-none focus:border-amber-500 bg-white cursor-pointer"
              >
                <option value="12:00">12:00 PM</option>
                <option value="13:00">01:00 PM</option>
                <option value="18:00">06:00 PM</option>
                <option value="19:00">07:00 PM</option>
                <option value="20:00">08:00 PM</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="text-center pt-3">
              <button
                type="submit"
                className="px-12 py-3 border-2 border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white font-bold text-xs tracking-widest uppercase transition rounded-[2px] cursor-pointer"
              >
                Reservation
              </button>
            </div>
          </form>
        </motion.div>
      </section>

      {/* 4. FLASH SALE VOUCHERS SHOWCASE WITH PARALLAX (Clean & Solid) */}
      <section 
        id="deals" 
        className="relative py-24 px-6 bg-fixed bg-center bg-cover border-y border-zinc-800"
        style={{ backgroundImage: `url('/dark-hero.jpg')` }}
      >
        {/* Dark High-Contrast Parallax Overlay (Solid Charcoal #0f0f12) */}
        <div className="absolute inset-0 bg-[#0f0f12]/95" />

        <div className="relative max-w-7xl mx-auto z-10">
          
          {/* Section Header (Clean Solid Badge & Sharp Typography) */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-500 text-zinc-950 font-black text-xs uppercase tracking-widest rounded-[2px] mb-4">
              <Zap className="w-3.5 h-3.5 fill-zinc-950" />
              FLASH SALE • TODAY ONLY
            </div>
            
            <h2 className="font-serif text-3xl sm:text-5xl font-black text-white tracking-tight">
              Special Flash Sale Coupons
            </h2>
            
            <p className="text-xs sm:text-sm text-zinc-400 mt-3 font-sans leading-relaxed">
              Real-time daily clearance offers. Crafted to avoid kitchen waste and delivered with maximum fresh flavor. 
              Present voucher or order with 1-click on delivery platforms.
            </p>
          </motion.div>

          {/* Clean Solid Coupon Cards Grid */}
          {promotions.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-zinc-800 bg-[#161619] max-w-xl mx-auto">
              <Sparkles className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-300">No active flash promotions available at this moment</p>
              <p className="text-xs text-zinc-500 mt-1">
                New promotional vouchers are scheduled automatically whenever excess perishable inventory requires rapid stock turnover.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.map((p, pIdx) => {
                const couponCode = `FLASH${p.discountPercent}-${p.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`;
                const isCopied = copiedCode === couponCode;

                return (
                  <motion.div 
                    key={p.id}
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.5, delay: pIdx * 0.12 }}
                    className="solid-coupon-card flex flex-col justify-between"
                  >
                    {/* Top Solid Amber Header (No Gradient) */}
                    <div className="bg-[#b45309] text-white p-5 border-b border-amber-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-[2px] bg-black/40 text-amber-200 font-bold">
                          {p.targetSegment}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-200 bg-black/30 px-2 py-0.5 rounded-[2px]">
                          Daily Deal
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-4xl font-black font-mono tracking-tight text-white">
                          -{p.discountPercent}% OFF
                        </span>
                        <span className="text-xs font-bold text-amber-200 uppercase tracking-wider font-mono">
                          Valid Today
                        </span>
                      </div>
                    </div>

                    {/* Middle Ticket Perforated Cutouts */}
                    <div className="relative py-2 bg-[#17171a] border-y border-dashed border-zinc-700 flex items-center justify-between px-4">
                      <span className="w-4 h-4 rounded-full bg-[#0f0f12] -ml-5 border border-zinc-700" />
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-semibold">
                        ••• OFFICIAL VOUCHER TICKET •••
                      </span>
                      <span className="w-4 h-4 rounded-full bg-[#0f0f12] -mr-5 border border-zinc-700" />
                    </div>

                    {/* Card Content Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between text-white">
                      <div>
                        {/* Distance & Branch Tag */}
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-[2px] w-fit mb-3">
                          <Navigation className="w-3 h-3 text-amber-400" />
                          <span>{pIdx === 0 ? '0.8 km' : pIdx === 1 ? '1.4 km' : '2.1 km'} from your current location</span>
                        </div>

                        <h3 className="font-serif font-bold text-lg text-white mb-2 leading-snug">
                          {p.title}
                        </h3>
                        
                        <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                          {p.description}
                        </p>

                        {/* Clean High-Contrast Price Strip (Solid Backgrounds) */}
                        <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-[2px] font-mono text-xs mb-5">
                          <div>
                            <span className="text-[9px] text-zinc-500 block uppercase">Original</span>
                            <span className="line-through text-zinc-500 font-bold">฿{p.originalPriceThb}</span>
                          </div>
                          <div className="text-center">
                            <span className="text-[9px] text-amber-400 font-bold block uppercase">Flash Price</span>
                            <span className="text-xl font-black text-amber-400">฿{p.promoPriceThb}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-emerald-400 font-bold block uppercase">Net Save</span>
                            <span className="text-sm font-bold text-emerald-400">฿{p.originalPriceThb - p.promoPriceThb}</span>
                          </div>
                        </div>
                      </div>

                      {/* Member-Gated Redemption Action */}
                      <div className="pt-3 border-t border-zinc-800">
                        {isMemberLoggedIn ? (
                          claimedPromos.includes(p.id) ? (
                            <div className="space-y-2">
                              <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/50 rounded-[2px] text-center">
                                <span className="text-[11px] font-bold text-emerald-300 flex items-center justify-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  Voucher Unlocked & Active!
                                </span>
                                <span className="text-[10px] text-zinc-400 block mt-0.5">
                                  Present to cashier or use in 1-click delivery
                                </span>
                              </div>
                              <button
                                onClick={() => toast.success(`Order placed with voucher discount on delivery partner!`)}
                                className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-[2px] transition cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <span>Order on Delivery App</span>
                                <span>⚡</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setClaimedPromos((prev) => [...prev, p.id]);
                                toast.success(`Coupon claimed! Discount applied to member account (${memberEmail}).`);
                              }}
                              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-widest rounded-[2px] transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
                            >
                              <Zap className="w-3.5 h-3.5 fill-zinc-950" />
                              <span>Claim This Member Discount</span>
                            </button>
                          )
                        ) : (
                          <div className="space-y-2">
                            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-[2px] text-center">
                              <div className="flex items-center justify-center gap-1.5 text-zinc-400 text-xs font-semibold mb-1">
                                <Lock className="w-3.5 h-3.5 text-amber-500" />
                                <span>Member-Only Flash Voucher</span>
                              </div>
                              <p className="text-[11px] text-zinc-500">
                                Please sign in or register to claim and redeem this deal.
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <Link
                                href="/signin"
                                className="py-2.5 px-3 text-center text-xs font-bold text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-white rounded-[2px] border border-zinc-700 transition"
                              >
                                Sign In
                              </Link>

                              <Link
                                href="/signup"
                                className="py-2.5 px-3 text-center text-xs font-black text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-[2px] transition"
                              >
                                Join Free
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

        </div>
      </section>

      {/* 5. ABOUT US: INVENTORY RECONCILIATION & STOCK CLEARANCE INTELLIGENCE */}
      <section id="about" className="py-24 bg-[#141417] text-white border-y border-zinc-800">
        <div className="max-w-6xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest block mb-2">
              ABOUT OUR INTELLIGENCE SYSTEM
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Smart Stock Calculation & Food Waste Clearance
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-3 leading-relaxed">
              We empower food and hospitality SMEs by connecting POS transactions directly with physical inventory counts. 
              Our system detects discrepancies, calculates spoilage risks, and automatically transforms near-expiry stock into profitable flash promotions.
            </p>
          </div>

          {/* 3 Pillars of the Business */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            
            {/* Pillar 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-[4px] hover:border-amber-500/60 transition"
            >
              <div className="w-12 h-12 rounded-[2px] bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-6">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-white mb-2.5">
                Automated Inventory Audits
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Daily reconciliation across POS sales receipts and kitchen warehouse ledgers. Highlights stock count imbalances and unit naming mismatches automatically.
              </p>
            </motion.div>

            {/* Pillar 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-[4px] hover:border-amber-500/60 transition"
            >
              <div className="w-12 h-12 rounded-[2px] bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-6">
                <TrendingDown className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-white mb-2.5">
                Early Spoilage Detection
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Tracks shelf-life expiration dates for high-risk ingredients such as dairy, fresh dough, and premium meats. Alerts management days before ingredients deteriorate.
              </p>
            </motion.div>

            {/* Pillar 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.24 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-[4px] hover:border-amber-500/60 transition"
            >
              <div className="w-12 h-12 rounded-[2px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-white mb-2.5">
                Smart Flash Clearance
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Converts excess raw materials into enticing promotional bundles. Instantly distributes digital vouchers across LINE MAN, GrabFood, and LINE OA.
              </p>
            </motion.div>

          </div>

          {/* Impact Stats Banner */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-[4px] p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <span className="block font-mono text-3xl font-black text-amber-400">92%</span>
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider mt-1 block">Waste Reduction</span>
            </div>
            <div>
              <span className="block font-mono text-3xl font-black text-white">100%</span>
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider mt-1 block">POS Audit Match</span>
            </div>
            <div>
              <span className="block font-mono text-3xl font-black text-amber-400">1-Click</span>
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider mt-1 block">Multi-Channel Push</span>
            </div>
            <div>
              <span className="block font-mono text-3xl font-black text-white">฿0</span>
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider mt-1 block">Unsold Expired Stock</span>
            </div>
          </div>

        </div>
      </section>

      {/* 6. CONTACT US SECTION */}
      <section id="contact" className="py-24 bg-[#0d0d0f] text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left: Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest block mb-2">
                GET IN TOUCH
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                Partner with Our Inventory & Promotion Network
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-8">
                Are you a food brand, restaurant chain, or culinary SME looking to recover profit margins and eliminate kitchen spoilage? Speak with our hospitality intelligence advisors today.
              </p>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-[2px] bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-0.5">Headquarters</h4>
                    <p className="text-xs text-zinc-400">88 Wireless Road, Lumphini, Pathum Wan, Bangkok 10330</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-[2px] bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-0.5">Telephone Support</h4>
                    <p className="text-xs text-zinc-400">+66 2 123 4567 (Mon - Fri: 09:00 - 18:00)</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-[2px] bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-0.5">Enterprise Inquiries</h4>
                    <p className="text-xs text-zinc-400">contact@lxvii.com • chaemsai_r@silpakorn.edu</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Interactive Message Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-[4px]"
            >
              <h3 className="font-serif text-xl font-bold text-white mb-2">
                Send a Message
              </h3>
              <p className="text-xs text-zinc-400 mb-6">
                Fill out the form below and our stock solutions engineer will reach out within 2 hours.
              </p>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success('Thank you! Your message has been sent to our restaurant intelligence team.');
                }} 
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Somchai Prasert"
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-700 rounded-[2px] text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Restaurant Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. LXVII Bistro"
                      className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-700 rounded-[2px] text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Business Email</label>
                  <input
                    type="email"
                    required
                    placeholder="manager@restaurant.com"
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-700 rounded-[2px] text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">Message or Stock Requirements</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us about your daily stock count discrepancies or clearance objectives..."
                    className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-700 rounded-[2px] text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-widest rounded-[2px] transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Inquiry</span>
                </button>
              </form>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Unified Full-Width Footer with Permissions & Developer Credentials */}
      <WebDeveloperFooter />

    </div>
  );
}
