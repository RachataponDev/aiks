'use client';

import React, { useEffect, useState } from 'react';
import { 
  ArrowUpRight, 
  MapPin, 
  Cookie, 
  ShieldCheck, 
  Check, 
  X, 
  Globe, 
  Mail, 
  Phone, 
  Building2,
  Navigation,
  Compass
} from 'lucide-react';
import { toast } from 'sonner';

export function WebDeveloperFooter() {
  const [cookieConsent, setCookieConsent] = useState<boolean | null>(null);
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [detectedCoords, setDetectedCoords] = useState<string | null>(null);

  useEffect(() => {
    // Check saved cookie preferences
    const savedCookie = localStorage.getItem('lxvii_cookie_consent');
    if (savedCookie) {
      setCookieConsent(savedCookie === 'accepted');
    }

    const savedLoc = localStorage.getItem('lxvii_location_consent');
    if (savedLoc === 'granted') {
      setLocationStatus('granted');
      const coords = localStorage.getItem('lxvii_location_coords');
      if (coords) setDetectedCoords(coords);
    } else if (savedLoc === 'denied') {
      setLocationStatus('denied');
    }
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem('lxvii_cookie_consent', 'accepted');
    setCookieConsent(true);
    toast.success('Cookies enabled for session preferences & security.');
  };

  const handleDeclineCookies = () => {
    localStorage.setItem('lxvii_cookie_consent', 'declined');
    setCookieConsent(false);
    toast.info('Only strictly essential cookies will be utilized.');
  };

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordsText = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
        setDetectedCoords(coordsText);
        setLocationStatus('granted');
        localStorage.setItem('lxvii_location_consent', 'granted');
        localStorage.setItem('lxvii_location_coords', coordsText);
        toast.success(`Location verified (${coordsText})! Personalized delivery ETA activated.`);
      },
      (error) => {
        setLocationStatus('denied');
        localStorage.setItem('lxvii_location_consent', 'denied');
        toast.info('Location access declined. Defaulting to Central Bangkok Riverside.');
      },
      { timeout: 8000 }
    );
  };

  return (
    <footer className="w-full bg-[#07090e] text-[#cbd5e1] font-sans border-t border-zinc-800/80">
      
      {/* 1. TOP PERMISSION BAR: COOKIE & LOCATION CONSENT (FULL-WIDTH BANNER) */}
      <div className="w-full bg-[#0d121f] border-b border-zinc-800/90 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          
          {/* Privacy & Location Disclosures */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-zinc-300">
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              Privacy &amp; Permissions:
            </span>
            <span className="text-zinc-400 text-[11px] sm:text-xs">
              We request cookies to secure operations and device location to estimate delivery radius and nearby store routes.
            </span>
          </div>

          {/* Action Pills */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Location Permission Button */}
            {locationStatus !== 'granted' ? (
              <button
                onClick={handleRequestLocation}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold transition cursor-pointer border border-zinc-700"
              >
                <Navigation className="w-3 h-3 text-cyan-400" />
                <span>Allow Location</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 text-[11px] font-semibold">
                <Check className="w-3 h-3 text-emerald-400" />
                Location Active {detectedCoords ? `(${detectedCoords})` : ''}
              </span>
            )}

            {/* Cookie Consent Toggle */}
            {cookieConsent === null ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleAcceptCookies}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 text-[11px] font-extrabold transition cursor-pointer shadow-xs"
                >
                  <Cookie className="w-3 h-3" />
                  <span>Accept All Cookies</span>
                </button>
                <button
                  onClick={handleDeclineCookies}
                  className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white text-[11px] transition cursor-pointer"
                >
                  Essential Only
                </button>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800/80 text-zinc-300 text-[11px] font-medium border border-zinc-700/60">
                <Cookie className="w-3 h-3 text-amber-400" />
                {cookieConsent ? 'Cookies Enabled' : 'Essential Cookies'}
              </span>
            )}
          </div>

        </div>
      </div>

      {/* 2. MAIN FULL-WIDTH FOOTER GRID */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Column 1: Lead Web & System Developer */}
          <div className="space-y-4">
            <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-amber-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Web Developer</span>
            </div>

            <div className="space-y-1">
              <div className="text-lg font-black text-white tracking-tight">
                Rdev [rachatapon.dev]
              </div>
              <div className="text-sm font-semibold text-zinc-200">
                Rachatapon Chaemsai
              </div>
              <div className="text-xs text-zinc-400 leading-relaxed">
                Lead Web &amp; System Developer • Department of Built Environment Information Management (BIM), Faculty of Architecture, Silpakorn University
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://rachatapon.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 transition group border-b border-amber-400/40 pb-0.5"
              >
                <span>rachatapon.dev [Portfolio]</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
              </a>
            </div>
          </div>

          {/* Column 2: Direct Contact Credentials */}
          <div className="space-y-4">
            <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-400">
              Developer Inquiries
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">
                  Institutional Email
                </div>
                <a
                  href="mailto:chaemsai_r@silpakorn.edu"
                  className="text-xs font-mono text-zinc-300 hover:text-white transition flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span>chaemsai_r@silpakorn.edu</span>
                </a>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">
                  Direct Line
                </div>
                <a
                  href="tel:+66934741115"
                  className="text-xs font-mono text-zinc-300 hover:text-white transition flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  <span>+66 934741115</span>
                </a>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">
                  Headquarters &amp; Lab
                </div>
                <span className="text-xs text-zinc-400 flex items-start gap-1.5 leading-relaxed">
                  <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                  <span>Silpakorn University Innovation Lab, Bangkok, Thailand</span>
                </span>
              </div>
            </div>
          </div>

          {/* Column 3: Restaurant Brand Identity (LXVII) */}
          <div className="space-y-4">
            <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-400">
              Culinary Destination
            </div>

            <div className="space-y-2 text-xs">
              <div className="text-base font-black text-white font-serif tracking-wide">
                LXVII Riverside Dining
              </div>
              <p className="text-zinc-400 leading-relaxed text-xs">
                Handcrafted Thai and French café classics by the Chao Phraya riverside. Sustainable hospitality powered by real-time inventory waste prevention.
              </p>
              <div className="pt-1 flex items-center gap-2 text-zinc-400">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>88 Charoen Krung Rd, Bangkok Riverside, Thailand</span>
              </div>
              <div className="text-zinc-500 text-[11px]">
                Daily Service: 07:00 – 22:00
              </div>
            </div>
          </div>

          {/* Column 4: Compliance, Cookies & Location Governance */}
          <div className="space-y-4">
            <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-400">
              Privacy &amp; Data Rights
            </div>

            <div className="space-y-2.5 text-xs text-zinc-400">
              <p className="leading-relaxed text-[11px]">
                This web platform operates in strict accordance with digital privacy standards. Geolocation coordinates are processed client-side solely for routing optimization.
              </p>
              
              <div className="pt-2 flex flex-col gap-1.5 text-[11px] font-medium text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Zero unauthorized data sharing</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Granular permission revocation at any time</span>
                </span>
              </div>

              <div className="pt-2 flex items-center gap-3 text-[11px] text-zinc-400">
                <button 
                  onClick={handleAcceptCookies}
                  className="hover:text-amber-400 transition cursor-pointer underline underline-offset-2"
                >
                  Cookie Settings
                </button>
                <span>•</span>
                <button 
                  onClick={handleRequestLocation}
                  className="hover:text-amber-400 transition cursor-pointer underline underline-offset-2"
                >
                  Update GPS
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. BOTTOM COPYRIGHT & LEGAL NOTICE */}
      <div className="border-t border-zinc-900 bg-[#04060a] py-6 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500 font-mono">
          <div>
            © 2026 LXVII • Lead System Developer Rachatapon Chaemsai (rachatapon.dev). All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>English (US)</span>
            <span>•</span>
            <span>W3C Compliant</span>
            <span>•</span>
            <span className="text-emerald-500 font-semibold">SSL 256-Bit Encrypted</span>
          </div>
        </div>
      </div>

    </footer>
  );
}
