import React from 'react';
import { Database, FileText, CheckCircle2, Clock } from 'lucide-react';
import { DatasetFileInfo } from '@/types/dashboard';

interface DatasetSidebarProps {
  files?: DatasetFileInfo[];
  loading?: boolean;
}

const DEFAULT_DATASETS = [
  { fileName: 'sales_transactions.csv', category: 'F&B Sales', sizeKb: 314.9, rowCount: 1470 },
  { fileName: 'bookings_operations.csv', category: 'Hotel & Tours', sizeKb: 87.3, rowCount: 379 },
  { fileName: 'inventory_daily.csv', category: 'Stock & Waste', sizeKb: 377.5, rowCount: 6390 },
  { fileName: 'products_services.csv', category: 'Price Catalog', sizeKb: 2.1, rowCount: 28 },
  { fileName: 'inventory_item_dictionary.csv', category: 'Item Dictionary', sizeKb: 0.6, rowCount: 18 },
  { fileName: 'customer_feedback.csv', category: 'Guest Ratings', sizeKb: 29.7, rowCount: 300 },
  { fileName: 'data_quality_issue_register.csv', category: 'Defect Register', sizeKb: 29.8, rowCount: 162 },
  { fileName: 'daily_context.csv', category: 'Weather & Calendar', sizeKb: 15.5, rowCount: 365 },
  { fileName: 'DATA_DICTIONARY.csv', category: 'Data Schema', sizeKb: 6.4, rowCount: 76 },
  { fileName: 'README_STUDENT.md', category: 'Track Guidelines', sizeKb: 3.4, rowCount: 42 },
];

export const DatasetSidebar: React.FC<DatasetSidebarProps> = ({ files, loading }) => {
  const displayFiles = files && files.length > 0 ? files : DEFAULT_DATASETS;

  return (
    <aside className="w-full lg:w-80 shrink-0 border border-zinc-200 bg-white rounded-[3px] overflow-hidden self-start">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-zinc-700" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
            Datasets in <code>data/</code>
          </h3>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-200 text-zinc-700 rounded-[2px] font-medium">
          {displayFiles.length} Files
        </span>
      </div>

      {/* File List */}
      <div className="divide-y divide-zinc-100 max-h-[calc(100vh-140px)] overflow-y-auto">
        {displayFiles.map((file, idx) => {
          return (
            <div
              key={file.fileName}
              className={`p-3 transition ${
                loading
                  ? 'animate-pulse bg-zinc-50/60'
                  : 'hover:bg-zinc-50/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide truncate">
                  {file.category}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {file.sizeKb} KB
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="font-mono text-xs font-semibold text-zinc-900 truncate" title={file.fileName}>
                  {file.fileName}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1.5 font-mono">
                <span>{file.rowCount > 0 ? `${file.rowCount.toLocaleString()} rows` : 'Documentation'}</span>
                <span className="flex items-center gap-1 text-emerald-600 font-sans text-[10px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Loaded
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Info Box */}
      <div className="p-3 bg-zinc-50 border-t border-zinc-200 text-[11px] text-zinc-500 leading-normal">
        All CSV tables are parsed in-memory and audited for schema integrity by the active AI model.
      </div>
    </aside>
  );
};
