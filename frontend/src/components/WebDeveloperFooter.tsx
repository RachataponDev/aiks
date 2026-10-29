'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export function WebDeveloperFooter() {
  return (
    <div className="bg-[#0b0f19] text-[#e2e8f0] font-sans border-t border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-6 py-10 md:py-12">
        <div className="max-w-md space-y-6">
          
          {/* Section Header */}
          <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-400">
            WEB DEVELOPER
          </div>

          {/* Developer Identity Block */}
          <div className="space-y-1">
            <div className="text-base font-bold text-white tracking-wide">
              Rdev [rachatapon.dev]
            </div>
            <div className="text-sm text-zinc-300 font-normal">
              Rachatapon Chaemsai [นายรชตพล แจ่มใส]
            </div>
            <div className="text-xs text-zinc-400 font-light">
              Lead Web &amp; System Developer • BIM Silpakorn University
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-zinc-800/80 pt-4" />

          {/* Developer Email */}
          <div className="space-y-1">
            <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-zinc-500">
              DEVELOPER EMAIL
            </div>
            <a 
              href="mailto:chaemsai_r@silpakorn.edu" 
              className="block text-sm text-zinc-300 hover:text-white transition font-mono"
            >
              chaemsai_r@silpakorn.edu
            </a>
          </div>

          {/* Divider */}
          <div className="border-t border-zinc-800/80 pt-4" />

          {/* Developer Phone */}
          <div className="space-y-1">
            <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-zinc-500">
              DEVELOPER PHONE
            </div>
            <a 
              href="tel:+66934741115" 
              className="block text-sm text-zinc-300 hover:text-white transition font-mono tracking-wide"
            >
              +66 934741115
            </a>
          </div>

          {/* Divider */}
          <div className="border-t border-zinc-800/80 pt-4" />

          {/* Portfolio Link */}
          <div>
            <a
              href="https://rachatapon.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-zinc-300 hover:text-white transition group"
            >
              <span>rachatapon.dev [Portfolio]</span>
              <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}

