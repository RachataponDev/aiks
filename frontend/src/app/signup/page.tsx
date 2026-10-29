'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Store, ArrowRight, ShieldCheck, Sparkles, ChefHat, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { WebDeveloperFooter } from '@/components/WebDeveloperFooter';

export default function SignUpPage() {
  const [fullName, setFullName] = useState('Store Manager');
  const [restaurantName, setRestaurantName] = useState('Restaura Cafe & Bistro');
  const [email, setEmail] = useState('manager@restaura.com');
  const [password, setPassword] = useState('••••••••••••');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      toast.error('Please agree to terms and conditions.');
      return;
    }
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      localStorage.setItem('aiks_member_session', JSON.stringify({ email: email || 'member@restaura.com', name: fullName, loggedInAt: new Date().toISOString() }));
      toast.success('Account created successfully! Member discounts are now unlocked.');
      router.push('/#deals');
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#0e0e11] text-zinc-100 flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Background Ambience & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f23_1px,transparent_1px),linear-gradient(to_bottom,#1f1f23_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Top Bar Navigation */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-amber-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Restaurant
        </Link>

        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-serif font-black tracking-wider text-white">
            <span className="text-amber-400">LXVII</span>
          </span>
        </Link>

        <div className="text-xs text-zinc-400">
          Already registered?{' '}
          <Link href="/signin" className="text-amber-400 hover:text-amber-300 font-bold transition">
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content Form Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          
          <div className="bg-[#18181c] border border-zinc-800 rounded-xl p-8 relative overflow-hidden">
            {/* Top Solid Amber Border Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />

            {/* Badge & Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[2px] bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-mono font-semibold mb-3">
                <ChefHat className="w-3.5 h-3.5" />
                Merchant Registration
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                Create Merchant Account
              </h1>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Connect your Point-of-Sale & inventory logs to start automated reconciliation and smart flash sales.
              </p>
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="e.g. John Doe"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Restaurant / Branch Name
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    required
                    placeholder="e.g. Restaura Bangkok Branch"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Business Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="owner@restaurant.com"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  />
                </div>
              </div>

              {/* Agree checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agree"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
                />
                <label htmlFor="agree" className="text-xs text-zinc-400 select-none cursor-pointer">
                  I agree to the Merchant Terms of Service and Data Policy
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-widest rounded-lg transition duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    Registering Merchant...
                  </span>
                ) : (
                  <>
                    <span>Create Account & Enter Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Features check */}
            <div className="mt-6 pt-5 border-t border-zinc-800/80 grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                POS Data Sync
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                AI Spoilage Guard
              </span>
            </div>

          </div>

          {/* Switch to Sign In */}
          <p className="text-center text-xs text-zinc-400 mt-6">
            Already have an active account?{' '}
            <Link href="/signin" className="text-amber-400 hover:text-amber-300 font-bold transition">
              Sign In here →
            </Link>
          </p>

        </motion.div>
      </main>

      {/* Unified Full-Width Developer Profile Footer */}
      <WebDeveloperFooter />

    </div>
  );
}
