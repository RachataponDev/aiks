import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Kpis } from '@/types/dashboard';

interface KpiCardsProps {
  kpis: Kpis;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 border border-zinc-200 divide-x divide-y md:divide-y-0 divide-zinc-200 bg-white mb-6 rounded-[3px] overflow-hidden">
      <div className="p-4">
        <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
          Total Net Revenue
        </div>
        <div className="text-xl font-semibold text-zinc-900 mt-1">
          ฿{kpis.totalRevenue.toLocaleString()}
        </div>
        <div className="text-[11px] text-zinc-500 mt-1">
          {kpis.totalTxnCount.toLocaleString()} txns • {kpis.refundedCount} refunds
        </div>
      </div>

      <div className="p-4">
        <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
          Hotel & Tours Bookings
        </div>
        <div className="text-xl font-semibold text-zinc-900 mt-1">
          ฿{kpis.totalBookingRevenue.toLocaleString()}
        </div>
        <div className="text-[11px] text-zinc-500 mt-1">
          {kpis.completedBookingsCount} completed • {kpis.cancelledBookings} cancelled
        </div>
      </div>

      <div className="p-4">
        <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
          Inventory Waste
        </div>
        <div className="text-xl font-semibold text-amber-700 mt-1">
          {kpis.totalWasteQty.toLocaleString()} units
        </div>
        <div className="text-[11px] text-zinc-500 mt-1">
          Guest rating: {kpis.avgCustomerRating} / 5.0
        </div>
      </div>

      <div className="p-4 bg-zinc-50">
        <div className="text-[11px] uppercase tracking-wider text-rose-700 font-medium flex items-center justify-between">
          <span>Data Quality Issues</span>
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
        </div>
        <div className="text-xl font-semibold text-rose-700 mt-1">
          {kpis.totalDataQualityIssues.toLocaleString()}
        </div>
        <div className="text-[11px] text-zinc-500 mt-1">
          Detected in CSV issue register
        </div>
      </div>
    </div>
  );
};
