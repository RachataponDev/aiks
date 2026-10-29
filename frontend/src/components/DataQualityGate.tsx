'use client';

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Check, 
  Search, 
  AlertOctagon, 
  Info, 
  Database,
  ArrowRight
} from 'lucide-react';
import { DirectAuditReport } from '@/lib/dataAuditor';

interface DataQualityGateProps {
  auditReport: DirectAuditReport | null;
  loading: boolean;
  onRunAudit: () => void;
  onSaveAndProceed: () => void;
  isCleanSaved: boolean;
}

export const DataQualityGate: React.FC<DataQualityGateProps> = ({
  auditReport,
  loading,
  onRunAudit,
  onSaveAndProceed,
  isCleanSaved,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  if (!auditReport && !loading) {
    return (
      <div className="border border-zinc-200 bg-white p-4 rounded-[3px] flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-900">Data Quality Audit</h3>
          <p className="text-[11px] text-zinc-500">Scan closing stock equations, naming aliases, and missing records.</p>
        </div>
        <button
          onClick={onRunAudit}
          className="px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-[2px] transition cursor-pointer"
        >
          Run Audit
        </button>
      </div>
    );
  }

  const issues = auditReport?.issues || [];
  const filteredIssues = issues.filter((issue) => {
    const matchesCategory = filterCategory === 'ALL' || issue.category === filterCategory;
    const matchesSearch = 
      issue.recordId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.fieldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.observedValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.expectedValue.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="border border-zinc-200 bg-white rounded-[3px] overflow-hidden mb-6">
      {/* 1. COMPACT KPI NUMERICAL STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-zinc-200 border-b border-zinc-200 bg-zinc-50 font-mono text-center">
        <div className="p-3">
          <span className="text-[10px] text-zinc-400 font-sans uppercase font-bold tracking-wider block">Checked Rows</span>
          <span className="text-lg font-bold text-zinc-900">
            {(
              (auditReport?.totalRecordsChecked.inventoryRows || 0) +
              (auditReport?.totalRecordsChecked.salesRows || 0)
            ).toLocaleString()}
          </span>
        </div>
        <div className="p-3">
          <span className="text-[10px] text-rose-500 font-sans uppercase font-bold tracking-wider block">Critical Issues</span>
          <span className="text-lg font-bold text-rose-600">
            {auditReport?.criticalIssuesCount || 0}
          </span>
        </div>
        <div className="p-3">
          <span className="text-[10px] text-zinc-500 font-sans uppercase font-bold tracking-wider block">Stock Discrepancy</span>
          <span className="text-lg font-bold text-rose-600">
            {auditReport?.issuesByCategory.stockDiscrepancies || 0}
          </span>
        </div>
        <div className="p-3">
          <span className="text-[10px] text-zinc-500 font-sans uppercase font-bold tracking-wider block">Naming Aliases</span>
          <span className="text-lg font-bold text-amber-600">
            {auditReport?.issuesByCategory.namingInconsistencies || 0}
          </span>
        </div>
        <div className="p-3 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-zinc-500 font-sans uppercase font-bold tracking-wider block">Missing Values</span>
          <span className="text-lg font-bold text-zinc-700">
            {auditReport?.issuesByCategory.missingValues || 0}
          </span>
        </div>
      </div>

      {/* 2. MINIMAL ACTION BAR */}
      <div className="p-2.5 px-4 bg-white border-b border-zinc-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All', count: issues.length },
            { id: 'STOCK_RECONCILIATION', label: 'Stock', count: auditReport?.issuesByCategory.stockDiscrepancies },
            { id: 'PRODUCT_NAMING', label: 'Aliases', count: auditReport?.issuesByCategory.namingInconsistencies },
            { id: 'MISSING_DATA', label: 'Missing', count: auditReport?.issuesByCategory.missingValues },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-2 py-0.5 rounded-[2px] font-mono text-[11px] transition cursor-pointer flex items-center gap-1 ${
                filterCategory === cat.id
                  ? 'bg-zinc-900 text-white font-bold'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              <span>{cat.label}</span>
              <span className="text-[10px] opacity-70">({cat.count})</span>
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <div className="relative w-44">
            <Search className="w-3 h-3 text-zinc-400 absolute left-2 top-2" />
            <input
              type="text"
              placeholder="Search ID/field..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-6 pr-2 py-1 text-xs border border-zinc-200 rounded-[2px] font-mono focus:outline-none focus:border-zinc-400"
            />
          </div>

          <button
            onClick={onRunAudit}
            disabled={loading}
            className="px-2.5 py-1 text-zinc-700 hover:text-black border border-zinc-200 hover:bg-zinc-50 rounded-[2px] font-medium text-xs transition cursor-pointer"
          >
            {loading ? 'Auditing...' : 'Re-run'}
          </button>

          {!isCleanSaved ? (
            <button
              onClick={onSaveAndProceed}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-[2px] transition cursor-pointer inline-flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              Save Clean Data
            </button>
          ) : (
            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 font-mono text-xs rounded-[2px] border border-emerald-200 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              CLEAN DATA SAVED
            </span>
          )}
        </div>
      </div>

      {/* 3. COMPACT DATA COMPARISON TABLE (NUMBER-FOCUSED) */}
      <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-zinc-100 border-b border-zinc-200 font-mono text-[10px] uppercase text-zinc-500 z-10">
            <tr>
              <th className="py-2 px-3">File / Record ID</th>
              <th className="py-2 px-3">Field</th>
              <th className="py-2 px-3">Observed</th>
              <th className="py-2 px-3">Expected</th>
              <th className="py-2 px-3">Resolution Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 font-mono text-[11px]">
            {filteredIssues.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-zinc-400 font-sans">
                  No issues found matching criteria.
                </td>
              </tr>
            ) : (
              filteredIssues.slice(0, 40).map((issue) => (
                <tr key={issue.id} className="hover:bg-zinc-50/80 transition">
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className="font-bold text-zinc-900 mr-1.5">{issue.recordId}</span>
                    <span className="text-[10px] text-zinc-400">{issue.fileName}</span>
                  </td>

                  <td className="py-2 px-3 text-zinc-600 font-mono">
                    {issue.fieldName}
                  </td>

                  <td className="py-2 px-3 text-rose-700 font-bold bg-rose-50/50">
                    {issue.observedValue}
                  </td>

                  <td className="py-2 px-3 text-emerald-700 font-bold bg-emerald-50/50">
                    {issue.expectedValue}
                  </td>

                  <td className="py-2 px-3 font-sans text-xs text-zinc-600 truncate max-w-xs" title={issue.recommendation}>
                    {issue.recommendation}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredIssues.length > 40 && (
        <div className="p-1.5 bg-zinc-50 text-center font-mono text-[10px] text-zinc-400 border-t border-zinc-200">
          Showing 40 of {filteredIssues.length} records.
        </div>
      )}
    </div>
  );
};
