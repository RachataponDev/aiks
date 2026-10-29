'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, ShieldCheck, Sparkles, ChefHat, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { WebDeveloperFooter } from '@/components/WebDeveloperFooter';

export default function SignInPage() {
  const [email, setEmail] = useState('manager@restaura.com');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      localStorage.setItem('aiks_member_session', JSON.stringify({ email: email || 'manager@restaura.com', loggedInAt: new Date().toISOString() }));
      toast.success('Welcome back! Signed in successfully.');
      router.push('/dashboard');
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
          Need an account?{' '}
          <Link href="/signup" className="text-amber-400 hover:text-amber-300 font-bold transition">
            Sign Up
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
            {/* Top Amber Border Accent */}
            <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />

            {/* Badge & Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[2px] bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-mono font-semibold mb-3">
                <ChefHat className="w-3.5 h-3.5" />
                Merchant & Staff Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                Sign In to Workspace
              </h1>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Enter your credentials to manage inventory audits, track kitchen spoilage, and dispatch flash promotions.
              </p>
            </div>

            {/* Sign In Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="manager@restaura.com"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Password
                  </label>
                  <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Default password for manager role is active.'); }} className="text-[11px] text-amber-400 hover:text-amber-300 transition">
                    Forgot password?
                  </a>
                </div>
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

              {/* Remember checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-amber-500/20"
                  />
                  Remember on this device
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
                    Authenticating...
                  </span>
                ) : (
                  <>
                    <span>Enter Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Staff Access Help */}
            <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center">
              <p className="text-[11px] text-zinc-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified Hospitality Management Network
              </p>
            </div>

          </div>

          {/* Switch to Sign Up */}
          <p className="text-center text-xs text-zinc-400 mt-6">
            New restaurant or branch?{' '}
            <Link href="/signup" className="text-amber-400 hover:text-amber-300 font-bold transition">
              Create a Merchant Account →
            </Link>
          </p>

        </motion.div>
      </main>

      {/* Unified Full-Width Developer Profile Footer */}
      <WebDeveloperFooter />

    </div>
  );
}
