import React from 'react';
import { IssueRecordItem } from '@/types/dashboard';

interface IssueRegisterTableProps {
  issues: IssueRecordItem[];
  totalIssuesCount: number;
}

export const IssueRegisterTable: React.FC<IssueRegisterTableProps> = ({
  issues,
  totalIssuesCount,
}) => {
  return (
    <div className="border border-zinc-200 bg-white rounded-[3px] overflow-hidden mb-6">
      <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-800">
            Data Quality Issue Register
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Records with schema violations, alias inconsistencies, and balance mismatches
          </p>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 bg-zinc-200 text-zinc-700 rounded-[2px]">
          Showing first {issues.length} of {totalIssuesCount}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-600 font-medium text-[11px]">
              <th className="py-2.5 px-4 font-medium">Source File</th>
              <th className="py-2.5 px-4 font-medium">Record ID</th>
              <th className="py-2.5 px-4 font-medium">Issue Type</th>
              <th className="py-2.5 px-4 font-medium">Observed Value</th>
              <th className="py-2.5 px-4 font-medium">Expected Reference</th>
              <th className="py-2.5 px-4 font-medium">Action Hint</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-zinc-700">
            {issues.map((issue, idx) => (
              <tr key={idx} className="hover:bg-zinc-50/80 transition">
                <td className="py-2.5 px-4 font-mono text-[11px] text-zinc-500">{issue.file_name}</td>
                <td className="py-2.5 px-4 font-mono text-[11px] font-medium text-zinc-900">{issue.record_id}</td>
                <td className="py-2.5 px-4">
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-[2px] bg-rose-50 text-rose-700 border border-rose-200">
                    {issue.issue_type}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-zinc-600 font-mono text-[11px]">{issue.observed_value || '-'}</td>
                <td className="py-2.5 px-4 text-emerald-700 font-mono text-[11px] font-medium">{issue.reference_or_expected_value || '-'}</td>
                <td className="py-2.5 px-4 text-zinc-600 max-w-sm text-[11px]">{issue.student_action_hint}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
