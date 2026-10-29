'use client';

import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Cookie, 
  MapPin, 
  Check, 
  X, 
  Navigation, 
  Lock,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export function PrivacyConsentModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [cookieChoice, setCookieChoice] = useState<'all' | 'essential'>('all');
  const [locationRequested, setLocationRequested] = useState(false);

  useEffect(() => {
    // Check if user has already responded to the consent modal
    const hasConsented = localStorage.getItem('lxvii_privacy_consent_decided');
    if (!hasConsented) {
      // Show modal on fresh entrance
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleGrantLocationAndProceed = () => {
    localStorage.setItem('lxvii_privacy_consent_decided', 'true');
    localStorage.setItem('lxvii_cookie_consent', cookieChoice);

    if (navigator.geolocation) {
      setLocationRequested(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
          localStorage.setItem('lxvii_location_consent', 'granted');
          localStorage.setItem('lxvii_location_coords', coords);
          toast.success(`Location enabled (${coords}) & preferences saved.`);
          setIsOpen(false);
        },
        (err) => {
          localStorage.setItem('lxvii_location_consent', 'denied');
          toast.info('Location declined. Defaulting to Bangkok Riverside.');
          setIsOpen(false);
        },
        { timeout: 7000 }
      );
    } else {
      localStorage.setItem('lxvii_location_consent', 'unsupported');
      toast.success('Preferences saved.');
      setIsOpen(false);
    }
  };

  const handleDeclineLocationAndProceed = () => {
    localStorage.setItem('lxvii_privacy_consent_decided', 'true');
    localStorage.setItem('lxvii_cookie_consent', cookieChoice);
    localStorage.setItem('lxvii_location_consent', 'denied');
    toast.info('Preferences saved without location tracking.');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#0b0f19] border border-zinc-800 text-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
        
        {/* Top Gradient Banner */}
        <div className="bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-transparent p-6 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
                LXVII Privacy &amp; Permissions
              </span>
              <h2 className="text-xl font-black text-white tracking-tight mt-0.5">
                Cookie &amp; Location Access
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-zinc-300">
          <p className="leading-relaxed text-zinc-400 text-xs">
            To provide real-time dining operations, accurate delivery radiuses, and seamless culinary services, LXVII requests permission for device location and cookie storage.
          </p>

          {/* Section 1: Cookie Selection */}
          <div className="bg-[#121826] border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Cookie className="w-4 h-4 text-amber-400" />
              <span>Cookie Preferences</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCookieChoice('all')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  cookieChoice === 'all'
                    ? 'bg-amber-400/10 border-amber-400/60 text-white shadow-xs'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white">Accept All</span>
                  {cookieChoice === 'all' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <span className="text-[11px] text-zinc-400 leading-tight">Analytics, preferences &amp; session security</span>
              </button>

              <button
                type="button"
                onClick={() => setCookieChoice('essential')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  cookieChoice === 'essential'
                    ? 'bg-amber-400/10 border-amber-400/60 text-white shadow-xs'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white">Essential Only</span>
                  {cookieChoice === 'essential' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <span className="text-[11px] text-zinc-400 leading-tight">Strictly necessary for security &amp; login</span>
              </button>
            </div>
          </div>

          {/* Section 2: Device Location Disclosure */}
          <div className="bg-[#121826] border border-zinc-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>Device Location (GPS)</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Enabling location allows automatic delivery ETA calculation from our Bangkok Riverside kitchen. You may choose to enable location now or browse without location tracking.
            </p>
          </div>

          <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>SSL 256-Bit Encrypted • Zero third-party marketing tracking</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-6 pt-0 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleGrantLocationAndProceed}
            disabled={locationRequested}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
          >
            <Navigation className="w-4 h-4 fill-zinc-950" />
            <span>{locationRequested ? 'Requesting GPS...' : 'Allow Location & Accept'}</span>
          </button>

          <button
            type="button"
            onClick={handleDeclineLocationAndProceed}
            className="py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs sm:text-sm transition border border-zinc-800 cursor-pointer text-center"
          >
            Don&apos;t Allow Location
          </button>
        </div>

      </div>
    </div>
  );
}

