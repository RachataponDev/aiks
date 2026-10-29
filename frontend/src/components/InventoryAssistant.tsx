import React from 'react';
import { AlertTriangle, TrendingDown, PackageCheck, AlertCircle, ShoppingCart } from 'lucide-react';
import { InventoryItemStatus } from '@/types/dashboard';

interface InventoryAssistantProps {
  items?: InventoryItemStatus[];
}

export const InventoryAssistant: React.FC<InventoryAssistantProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  const overstocked = items.filter(i => i.status === 'OVERSTOCK_SPOILAGE_RISK');
  const lowStock = items.filter(i => i.status === 'REORDER_NEEDED');
  const totalWasteRisk = overstocked.reduce((acc, curr) => acc + curr.wasteRiskValueThb, 0);

  return (
    <div className="border border-zinc-200 bg-white rounded-[3px] overflow-hidden mb-6">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs uppercase tracking-wider text-zinc-900">
              Smarter Inventory & Spoilage Prevention Assistant
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-rose-100 text-rose-800 font-semibold">
              ฿{totalWasteRisk.toLocaleString()} at Spoilage Risk
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Real-time stock analysis highlighting overstock perishable items, waste values, and urgent reorder points
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-[2px]">
            {overstocked.length} Overstock Alerts
          </span>
          <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-[2px]">
            {lowStock.length} Reorder Needed
          </span>
        </div>
      </div>

      {/* Main Inventory Status Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-600 font-medium text-[11px]">
              <th className="py-2.5 px-4 font-medium">Item & Category</th>
              <th className="py-2.5 px-4 font-medium">Current Stock</th>
              <th className="py-2.5 px-4 font-medium">Avg Daily Usage</th>
              <th className="py-2.5 px-4 font-medium">Days of Cover</th>
              <th className="py-2.5 px-4 font-medium">Operating Status</th>
              <th className="py-2.5 px-4 font-medium">Actionable Merchant Guidance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-zinc-700">
            {items.map((item) => {
              const isOverstock = item.status === 'OVERSTOCK_SPOILAGE_RISK';
              const isReorder = item.status === 'REORDER_NEEDED';

              return (
                <tr key={item.itemId} className="hover:bg-zinc-50/80 transition">
                  <td className="py-2.5 px-4">
                    <div className="font-medium text-zinc-900 flex items-center gap-1.5">
                      {isOverstock && <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                      {isReorder && <ShoppingCart className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                      {!isOverstock && !isReorder && <PackageCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      {item.itemName}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      {item.itemId} • {item.category} • Cost: ฿{item.unitCost}/{item.unit}
                    </div>
                  </td>

                  <td className="py-2.5 px-4 font-mono font-medium text-zinc-900">
                    {item.currentStock.toLocaleString()} {item.unit}
                  </td>

                  <td className="py-2.5 px-4 font-mono text-zinc-600">
                    {item.avgDailyUsage} {item.unit}/day
                  </td>

                  <td className="py-2.5 px-4 font-mono font-medium">
                    <span
                      className={`px-1.5 py-0.5 rounded-[2px] ${
                        isOverstock
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 font-bold'
                          : isReorder
                          ? 'bg-amber-50 text-amber-800 border border-amber-200 font-bold'
                          : 'text-zinc-600'
                      }`}
                    >
                      {item.daysOfCover} days
                    </span>
                  </td>

                  <td className="py-2.5 px-4">
                    {isOverstock && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-[2px] inline-flex items-center gap-1">
                        Overstock Risk
                      </span>
                    )}
                    {isReorder && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-[2px] inline-flex items-center gap-1">
                        Reorder Needed
                      </span>
                    )}
                    {!isOverstock && !isReorder && (
                      <span className="text-[10px] font-medium px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-[2px]">
                        Optimal
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 px-4 text-zinc-600 text-[11px] max-w-md">
                    {item.actionNote}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
