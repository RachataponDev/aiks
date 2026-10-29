import React from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { AVAILABLE_MODELS } from '@/types/dashboard';

interface NavbarProps {
  hasData: boolean;
  hasReport: boolean;
  loading: boolean;
  analyzing: boolean;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  onFetchData: () => void;
  onRunAiAnalysis: () => void;
  onClearData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  hasData,
  hasReport,
  loading,
  analyzing,
  selectedModel,
  onModelChange,
  onFetchData,
  onRunAiAnalysis,
  onClearData,
}) => {
  return (
    <nav className="border-b border-zinc-200 bg-white sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm tracking-tight text-zinc-900">
            Hospitality Operations & Quality Audit
          </span>
          <span className="text-zinc-300">|</span>
          <span className="text-xs text-zinc-500 font-mono">
            data/ (10 datasets)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Model Selector Dropdown */}
          <div className="flex items-center gap-1.5 mr-1">
            <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              disabled={analyzing}
              className="text-xs bg-white text-zinc-800 border border-zinc-200 px-2 py-1.5 rounded-[3px] focus:outline-none focus:border-zinc-400 font-medium cursor-pointer"
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {(hasData || hasReport) && (
            <button
              onClick={onClearData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 active:bg-rose-100 transition rounded-[3px]"
            >
              Clear Data
            </button>
          )}

          <button
            onClick={onFetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-800 bg-white border border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100 transition rounded-[3px] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Processing...' : hasData ? 'Re-run Data Pipeline' : 'Run Data Pipeline'}
          </button>

          <button
            onClick={onRunAiAnalysis}
            disabled={analyzing || !hasData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 border border-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 transition rounded-[3px] disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'Auditing...' : 'Run Gemini Audit'}
          </button>
        </div>
      </div>
    </nav>
  );
};
