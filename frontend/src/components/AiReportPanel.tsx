import React from 'react';
import { Sparkles, Send, RefreshCw } from 'lucide-react';

interface AiReportPanelProps {
  analyzing: boolean;
  aiReport: string;
  customPrompt: string;
  selectedModel: string;
  onPromptChange: (val: string) => void;
  onRunAiAnalysis: (prompt?: string) => void;
}

export const AiReportPanel: React.FC<AiReportPanelProps> = ({
  analyzing,
  aiReport,
  customPrompt,
  selectedModel,
  onPromptChange,
  onRunAiAnalysis,
}) => {
  return (
    <div className="border border-zinc-200 bg-white rounded-[3px] mb-6">
      <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-800">
            Gemini Strategic Quality & Operations Audit
          </h3>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-zinc-200 text-zinc-600">
            {selectedModel}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Ask Gemini specific question (e.g. recommend waste reduction)..."
            value={customPrompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onRunAiAnalysis(customPrompt)}
            className="px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-[3px] w-full sm:w-80 text-zinc-900 focus:outline-none focus:border-zinc-400 placeholder:text-zinc-400"
          />
          <button
            onClick={() => onRunAiAnalysis(customPrompt)}
            disabled={analyzing}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-[3px] transition disabled:opacity-50 inline-flex items-center gap-1 shrink-0"
          >
            <Send className="w-3 h-3" />
            Ask
          </button>
        </div>
      </div>

      <div className="p-6">
        {analyzing ? (
          <div className="py-12 flex flex-col items-center justify-center text-zinc-500">
            <RefreshCw className="w-5 h-5 animate-spin mb-3 text-zinc-400" />
            <p className="text-xs">Analyzing datasets and reconciling data issues with {selectedModel}...</p>
          </div>
        ) : aiReport ? (
          <div className="prose prose-zinc max-w-none text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap font-sans">
            {aiReport}
          </div>
        ) : (
          <div className="text-center py-10 text-zinc-400 text-xs">
            No audit generated yet. Click{' '}
            <button
              onClick={() => onRunAiAnalysis()}
              className="text-zinc-900 underline font-medium hover:text-black"
            >
              Run Gemini Audit
            </button>{' '}
            to analyze cross-segment data, waste points, and recorded quality defects.
          </div>
        )}
      </div>
    </div>
  );
};
