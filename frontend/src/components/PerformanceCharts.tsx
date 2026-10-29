import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import { SegmentRevenue, TrendDataPoint } from '@/types/dashboard';

interface PerformanceChartsProps {
  segmentRevenue: SegmentRevenue[];
  trendData: TrendDataPoint[];
}

const PIE_COLORS = ['#2563eb', '#059669', '#d97706', '#64748b'];

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({
  segmentRevenue,
  trendData,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Revenue by Segment */}
      <div className="border border-zinc-200 bg-white p-5 rounded-[3px]">
        <div className="border-b border-zinc-100 pb-3 mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
            Revenue by Segment
          </h2>
          <p className="text-[11px] text-zinc-400 mt-0.5">Café (F&B), Hotel, and Tours share</p>
        </div>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segmentRevenue}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
              >
                {segmentRevenue.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e4e4e7',
                  fontSize: '12px',
                  borderRadius: '3px',
                }}
                formatter={(val: any) => `฿${Number(val).toLocaleString()}`}
              />
              <Legend
                verticalAlign="bottom"
                height={30}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', color: '#52525b' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="border border-zinc-200 bg-white p-5 rounded-[3px] lg:col-span-2">
        <div className="border-b border-zinc-100 pb-3 mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
              Monthly Chronological Trend
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">F&B Sales vs Hotel/Tour Bookings</p>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">THB Value</span>
        </div>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid stroke="#f4f4f5" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="#a1a1aa" fontSize={11} tickLine={false} />
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
                formatter={(val: any) => `฿${Number(val).toLocaleString()}`}
              />
              <Legend
                verticalAlign="top"
                height={30}
                iconType="plainline"
                wrapperStyle={{ fontSize: '11px' }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                name="F&B Sales"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="bookings"
                name="Bookings"
                stroke="#059669"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
