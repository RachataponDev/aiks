import React from 'react';
import { AlertTriangle, ShoppingCart, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { InventoryItemStatus } from '@/types/dashboard';

interface FocusedInventoryViewProps {
  items?: InventoryItemStatus[];
  onRequestPromo?: () => void;
  generatingPromo?: boolean;
  hasPromosGenerated?: boolean;
}

export const FocusedInventoryView: React.FC<FocusedInventoryViewProps> = ({
  items,
  onRequestPromo,
  generatingPromo = false,
  hasPromosGenerated = false,
}) => {
  if (!items || items.length === 0) return null;

  // Filter only items that have critical problems (Overstock Spoilage Risk OR Reorder Needed)
  const overstocked = items.filter((i) => i.status === 'OVERSTOCK_SPOILAGE_RISK');
  const lowStock = items.filter((i) => i.status === 'REORDER_NEEDED');
  const criticalItems = [...overstocked, ...lowStock];

  const totalWasteRisk = overstocked.reduce((acc, curr) => acc + curr.wasteRiskValueThb, 0);

  return (
    <div className="space-y-6 mb-6">
      {/* Step 2 Header & Action Trigger */}
      <div className="border border-zinc-200 bg-white p-4 rounded-[3px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-blue-800 rounded-[2px]">
              Step 2: Smart Stock Check
            </span>
            <span className="text-xs text-zinc-500 font-medium">Reconciled against Clean Data</span>
          </div>
          <h2 className="text-sm font-bold text-zinc-900 mt-1">
            Real-Time Stock Spoilage Detection & Reorder Signals
          </h2>
        </div>

        {overstocked.length > 0 && onRequestPromo && (
          <button
            onClick={onRequestPromo}
            disabled={generatingPromo}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold text-xs rounded-[3px] transition cursor-pointer disabled:opacity-50 shrink-0 shadow-sm"
          >
            <Sparkles className={`w-4 h-4 ${generatingPromo ? 'animate-spin' : ''}`} />
            {generatingPromo ? 'AI Calculating Deals...' : 'Ask AI to Generate Clearance Promotions'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Highlight Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Red Alert: Overstock & Spoilage */}
        <div className="border border-rose-300 bg-rose-50/40 p-4 rounded-[3px]">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-800 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Overstock & Spoilage Risk
            </span>
            <span className="font-mono text-rose-700 bg-white px-2 py-0.5 border border-rose-200 rounded-[2px]">
              {overstocked.length} Items Alert
            </span>
          </div>
          <div className="text-2xl font-bold text-rose-700 font-mono mt-2">
            ฿{totalWasteRisk.toLocaleString()}
          </div>
          <p className="text-xs text-rose-600 mt-1">
            Total perishable inventory value held over 3 days of supply. Prompt liquidation recommended to avoid waste.
          </p>
        </div>

        {/* Yellow Alert: Low Stock & Reorder */}
        <div className="border border-amber-300 bg-amber-50/40 p-4 rounded-[3px]">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-800 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-amber-600" /> Low Stock / Reorder Needed
            </span>
            <span className="font-mono text-amber-800 bg-white px-2 py-0.5 border border-amber-200 rounded-[2px]">
              {lowStock.length} Items Alert
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-800 font-mono mt-2">
            {lowStock.length > 0 ? `${lowStock.map(i => i.itemName).join(', ')}` : 'Sufficient Stock'}
          </div>
          <p className="text-xs text-amber-700 mt-1">
            Inventory below 2 days of supply. Immediate reorder required to avoid front-of-house stockout.
          </p>
        </div>
      </div>

      {/* Critical Stock Items Table */}
      <div className="border border-zinc-200 bg-white rounded-[3px] overflow-hidden">
        <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between text-xs font-medium text-zinc-700">
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            Prioritized Ingredients & Supplies Requiring Management Action
          </span>
          <span className="font-mono text-zinc-500 text-[11px]">
            {criticalItems.length} Monitored Items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 font-medium text-[11px] bg-zinc-50/50">
                <th className="py-2.5 px-4">Item & ID</th>
                <th className="py-2.5 px-4">Current Stock</th>
                <th className="py-2.5 px-4">Daily Usage</th>
                <th className="py-2.5 px-4">Days Cover</th>
                <th className="py-2.5 px-4">Operating Status</th>
                <th className="py-2.5 px-4">Prescriptive Action Guidance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-800">
              {criticalItems.map((item) => {
                const isOverstock = item.status === 'OVERSTOCK_SPOILAGE_RISK';
                return (
                  <tr
                    key={item.itemId}
                    className={`hover:bg-zinc-50/80 transition ${
                      isOverstock ? 'bg-rose-50/20' : 'bg-amber-50/20'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-900">{item.itemName}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {item.itemId} • Unit Cost: ฿{item.unitCost}/{item.unit}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-zinc-900">
                      {item.currentStock} {item.unit}
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-600">
                      ~{item.avgDailyUsage} {item.unit}/day
                    </td>

                    <td className="py-3 px-4 font-mono font-bold">
                      <span
                        className={`px-2 py-0.5 rounded-[2px] ${
                          isOverstock
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {item.daysOfCover} days
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {isOverstock ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-rose-600 text-white rounded-[2px]">
                          Overstock Risk
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-500 text-white rounded-[2px]">
                          Reorder Needed
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-zinc-800 text-xs font-medium max-w-md">
                      {item.actionNote}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
