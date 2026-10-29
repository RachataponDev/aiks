import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Area,
  ComposedChart,
} from 'recharts';
import { TrendingUp, ArrowUpRight, Calendar } from 'lucide-react';
import { SalesForecastPoint } from '@/types/dashboard';

interface SalesForecastCardProps {
  forecastData?: SalesForecastPoint[];
  summary?: {
    predictedNextMonthRevenue: number;
    projectedGrowthPercent: number;
    dailyRunRateThb: number;
    confidenceLevel: string;
  };
}

export const SalesForecastCard: React.FC<SalesForecastCardProps> = ({
  forecastData,
  summary,
}) => {
  if (!forecastData || forecastData.length === 0) return null;

  return (
    <div className="border border-zinc-200 bg-white rounded-[3px] overflow-hidden mb-6">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-zinc-800" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">
              Sales Revenue Forecast (Historical vs Projected 3 Months)
            </h3>
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Time-series projection based on completed transaction run rates to help merchants plan inventory purchases
          </p>
        </div>

        {summary && (
          <div className="flex items-center gap-3 text-xs">
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 block uppercase">Next Month Projection</span>
              <span className="font-semibold text-zinc-900 font-mono">
                ฿{summary.predictedNextMonthRevenue.toLocaleString()}
              </span>
            </div>
            <div className="text-right border-l border-zinc-200 pl-3">
              <span className="text-[10px] text-zinc-400 block uppercase">Projected Trend</span>
              <span className="font-semibold text-emerald-700 font-mono flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +{summary.projectedGrowthPercent}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Forecast Chart */}
      <div className="p-5">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecastData}>
              <CartesianGrid stroke="#f4f4f5" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="period" stroke="#a1a1aa" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#a1a1aa"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e4e4e7',
                  fontSize: '12px',
                  borderRadius: '3px',
                }}
                formatter={(val: any, name: any) => [
                  `฿${Number(val).toLocaleString()}`,
                  name === 'actual' ? 'Actual Sales' : 'Forecasted Sales',
                ]}
              />
              <Legend
                verticalAlign="top"
                height={30}
                iconType="plainline"
                wrapperStyle={{ fontSize: '11px' }}
              />
              <Line
                type="monotone"
                dataKey="actual"
                name="Historical Actual Sales"
                stroke="#18181b"
                strokeWidth={2}
                dot={{ r: 3, fill: '#18181b' }}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                name="Forecasted Sales Projection"
                stroke="#2563eb"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#2563eb' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
