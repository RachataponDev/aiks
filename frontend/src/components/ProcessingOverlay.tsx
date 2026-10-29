import React from 'react';
import { Sparkles, RefreshCw, Cpu, Database, CheckCircle2 } from 'lucide-react';

interface ProcessingOverlayProps {
  model: string;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ model }) => {
  return (
    <div className="border border-zinc-300 bg-white p-8 rounded-[3px] text-center my-6 relative overflow-hidden">
      {/* Animated Top Scanning Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-zinc-900 animate-pulse"></div>

      <div className="max-w-md mx-auto">
        <div className="relative inline-flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full border-2 border-zinc-200 border-t-zinc-900 animate-spin"></div>
          <Sparkles className="w-5 h-5 text-zinc-900 absolute" />
        </div>

        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-1">
          AI Audit & Calculation Engine Running
        </h3>
        <p className="text-xs text-zinc-500 mb-6">
          Querying <span className="font-semibold text-zinc-800">{model}</span> via Interactions API. Scanning CSV files for discrepancies...
        </p>

        {/* Step Progress Effect */}
        <div className="space-y-2.5 text-left text-xs bg-zinc-50 border border-zinc-200 p-4 rounded-[3px] font-mono">
          <div className="flex items-center gap-2 text-zinc-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>1. Parsing 10 datasets in data/</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>2. Checking schema & data quality register</span>
          </div>
          <div className="flex items-center gap-2 text-blue-700 animate-pulse font-semibold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0 text-blue-600" />
            <span>3. Reconciling perishable inventory burn rates...</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            <ClockIcon />
            <span>4. Generating 3-month sales forecast</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClockIcon = () => (
  <span className="w-3.5 h-3.5 rounded-full border border-zinc-300 inline-block shrink-0"></span>
);
