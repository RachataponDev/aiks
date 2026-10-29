import React from 'react';
import { FileText, Database, Layers } from 'lucide-react';
import { DatasetFileInfo } from '@/types/dashboard';

interface DatasetFilesGridProps {
  files?: DatasetFileInfo[];
}

export const DatasetFilesGrid: React.FC<DatasetFilesGridProps> = ({ files }) => {
  if (!files || files.length === 0) return null;

  return (
    <div className="border border-zinc-200 bg-white rounded-[3px] overflow-hidden mb-6">
      <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-zinc-700" />
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-800">
              Active Dataset Catalog ({files.length} Files in <code>data/</code>)
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Verified files parsed by the pipeline and fed into the Gemini Audit context
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 bg-zinc-200 text-zinc-700 rounded-[2px]">
          100% Local CSV
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 border-b border-zinc-200">
        {files.slice(0, 5).map((f) => (
          <div key={f.fileName} className="p-3 bg-white hover:bg-zinc-50/60 transition">
            <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
              <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-[10px] uppercase font-semibold text-zinc-400 truncate">
                {f.category}
              </span>
            </div>
            <div className="font-mono text-xs font-semibold text-zinc-900 truncate" title={f.fileName}>
              {f.fileName}
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2 font-mono">
              <span>{f.rowCount > 0 ? `${f.rowCount.toLocaleString()} rows` : 'Docs'}</span>
              <span>{f.sizeKb} KB</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
        {files.slice(5).map((f) => (
          <div key={f.fileName} className="p-3 bg-white hover:bg-zinc-50/60 transition">
            <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
              <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-[10px] uppercase font-semibold text-zinc-400 truncate">
                {f.category}
              </span>
            </div>
            <div className="font-mono text-xs font-semibold text-zinc-900 truncate" title={f.fileName}>
              {f.fileName}
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2 font-mono">
              <span>{f.rowCount > 0 ? `${f.rowCount.toLocaleString()} rows` : 'Docs'}</span>
              <span>{f.sizeKb} KB</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
