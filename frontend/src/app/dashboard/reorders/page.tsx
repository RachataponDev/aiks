'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Truck, 
  ArrowRight, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Package, 
  Copy, 
  Check,
  FileSpreadsheet,
  FileText,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DashboardNavbar } from '@/components/DashboardNavbar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';

interface PurchaseReorderItem {
  itemId: string;
  itemName: string;
  unit: string;
  currentStock: number;
  dailyUsage: number;
  daysRemaining: number;
  recommendedOrderQuantity: number;
  unitCostThb: number;
  estimatedOrderCostThb: number;
  supplierLeadTimeDays: number;
  urgencyLevel: 'IMMEDIATE_ORDER' | 'UPCOMING_WEEKEND_RESTOCK';
  reason: string;
}

interface SolutionResponse {
  success: boolean;
  isCached: boolean;
  generatedAt: string;
  summary: {
    totalWasteRescueThb: number;
    totalRestockCostThb: number;
    promotionsCount: number;
    reorderCount: number;
  };
  procurementOrders: PurchaseReorderItem[];
  executiveStrategy: string;
}

export default function ProcurementOrdersPage() {
  const [data, setData] = useState<SolutionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const fetchOrders = async (refresh: boolean = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`/api/operational-solution${refresh ? '?refresh=true' : ''}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
        if (refresh) {
          toast.success('Procurement orders recalculated based on inventory velocity.');
        }
      } else {
        toast.error(`Failed to load reorders: ${json.error}`);
      }
    } catch (err: any) {
      toast.error(`Error loading orders: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders(false);
  }, []);

  // 1. Export as CSV (Plain Text Comma-Separated Values)
  const handleExportCSV = () => {
    if (!data?.procurementOrders || data.procurementOrders.length === 0) {
      toast.error('No procurement data available to export.');
      return;
    }

    const headers = [
      'Item ID',
      'Item Name',
      'Current Stock',
      'Daily Usage',
      'Unit',
      'Days Runway',
      'Recommended Order Qty',
      'Unit Cost (THB)',
      'Estimated Cost (THB)',
      'Lead Time (Days)',
      'Urgency',
      'Reason'
    ];

    const rows = data.procurementOrders.map(o => [
      `"${o.itemId}"`,
      `"${o.itemName}"`,
      o.currentStock,
      o.dailyUsage,
      `"${o.unit}"`,
      o.daysRemaining,
      o.recommendedOrderQuantity,
      o.unitCostThb,
      o.estimatedOrderCostThb,
      o.supplierLeadTimeDays,
      `"${o.urgencyLevel}"`,
      `"${o.reason.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `procurement_purchase_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Purchase Order exported successfully.');
  };

  // 2. Export as Excel (.xlsx)
  const handleExportExcel = () => {
    if (!data?.procurementOrders || data.procurementOrders.length === 0) {
      toast.error('No procurement data available to export.');
      return;
    }

    const tableRows = data.procurementOrders.map((o, idx) => ({
      No: idx + 1,
      'Item ID': o.itemId,
      'Item Name': o.itemName,
      'Current Stock': o.currentStock,
      'Daily Usage': o.dailyUsage,
      Unit: o.unit,
      'Days Left': o.daysRemaining,
      'Order Qty': o.recommendedOrderQuantity,
      'Unit Cost (THB)': o.unitCostThb,
      'Total Cost (THB)': o.estimatedOrderCostThb,
      'Supplier Lead Time (Days)': o.supplierLeadTimeDays,
      Urgency: o.urgencyLevel === 'IMMEDIATE_ORDER' ? 'Immediate Order (Critical)' : 'Weekend Restock',
      Notes: o.reason,
    }));

    const worksheet = XLSX.utils.json_to_sheet(tableRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Orders');

    // Auto-fit column widths
    const maxCols = [
      { wch: 6 },  // No
      { wch: 12 }, // Item ID
      { wch: 22 }, // Item Name
      { wch: 14 }, // Current Stock
      { wch: 12 }, // Daily Usage
      { wch: 8 },  // Unit
      { wch: 10 }, // Days Left
      { wch: 12 }, // Order Qty
      { wch: 15 }, // Unit Cost
      { wch: 16 }, // Total Cost
      { wch: 22 }, // Supplier Lead Time
      { wch: 24 }, // Urgency
      { wch: 50 }, // Notes
    ];
    worksheet['!cols'] = maxCols;

    XLSX.writeFile(workbook, `procurement_purchase_orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Excel (.xlsx) Purchase Order exported successfully.');
  };

  // 3. Export as PDF (Clean Minimalist Standard Font)
  const handleExportPDF = () => {
    if (!data?.procurementOrders || data.procurementOrders.length === 0) {
      toast.error('No procurement data available to export.');
      return;
    }

    const doc = new jsPDF('landscape', 'pt', 'a4');

    // PDF Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(24, 24, 27);
    doc.text('KITCHEN PROCUREMENT PURCHASE ORDER', 40, 45);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(113, 113, 122);
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Generated on: ${dateStr}  |  System: AIKS Operations Hub`, 40, 62);
    doc.text(`Total Budget: THB ${data.summary.totalRestockCostThb.toLocaleString()}  |  Items to Order: ${data.procurementOrders.length} lines`, 40, 76);

    // Table Columns & Data
    const columns = [
      { header: '#', dataKey: 'no' },
      { header: 'Item Name', dataKey: 'itemName' },
      { header: 'Current', dataKey: 'currentStock' },
      { header: 'Runway', dataKey: 'runway' },
      { header: 'Daily Use', dataKey: 'dailyUsage' },
      { header: 'Order Qty', dataKey: 'orderQty' },
      { header: 'Unit Cost', dataKey: 'unitCost' },
      { header: 'Total (THB)', dataKey: 'totalCost' },
      { header: 'Urgency', dataKey: 'urgency' },
      { header: 'Reason & Context', dataKey: 'reason' },
    ];

    const rows = data.procurementOrders.map((o, idx) => ({
      no: idx + 1,
      itemName: o.itemName,
      currentStock: `${o.currentStock} ${o.unit}`,
      runway: `${o.daysRemaining} days`,
      dailyUsage: `${o.dailyUsage} ${o.unit}/d`,
      orderQty: `+${o.recommendedOrderQuantity} ${o.unit}`,
      unitCost: `THB ${o.unitCostThb}`,
      totalCost: `THB ${o.estimatedOrderCostThb.toLocaleString()}`,
      urgency: o.urgencyLevel === 'IMMEDIATE_ORDER' ? 'CRITICAL' : 'BUFFER',
      reason: o.reason,
    }));

    autoTable(doc, {
      startY: 92,
      columns: columns,
      body: rows,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 5,
        textColor: [39, 39, 42],
      },
      headStyles: {
        fillColor: [24, 24, 27],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        no: { cellWidth: 25, halign: 'center' },
        itemName: { cellWidth: 100, fontStyle: 'bold' },
        currentStock: { cellWidth: 55 },
        runway: { cellWidth: 50 },
        dailyUsage: { cellWidth: 55 },
        orderQty: { cellWidth: 65, fontStyle: 'bold', textColor: [37, 99, 235] },
        unitCost: { cellWidth: 55 },
        totalCost: { cellWidth: 65, fontStyle: 'bold' },
        urgency: { cellWidth: 60, halign: 'center' },
        reason: { cellWidth: 230 },
      },
      margin: { left: 40, right: 40 },
    });

    doc.save(`procurement_purchase_orders_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success('PDF Purchase Order exported successfully.');
  };

  // Quick Copy
  const handleCopyPurchaseOrder = () => {
    if (!data?.procurementOrders) return;
    const lines = [
      `PURCHASE ORDER SHEET`,
      `Date: ${new Date().toLocaleDateString('en-GB')}`,
      `---------------------------------------`,
      ...data.procurementOrders.map(
        (o, idx) => `${idx + 1}. ${o.itemName}: +${o.recommendedOrderQuantity} ${o.unit} (Est. THB ${o.estimatedOrderCostThb.toLocaleString()})`
      ),
      `---------------------------------------`,
      `TOTAL ESTIMATED BUDGET: THB ${data.summary.totalRestockCostThb.toLocaleString()}`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedSummary(true);
    toast.success('Copied Purchase Order list to clipboard!');
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans antialiased text-zinc-900 pb-20 lg:pb-0">
      
      {/* Desktop Sidebar (Auto-hidden on mobile <1024px) */}
      <DashboardSidebar currentPath="/dashboard/reorders" isDataReady={true} />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardNavbar />

        <main className="flex-1 p-3.5 sm:p-6 md:p-10 max-w-6xl w-full mx-auto space-y-5 sm:space-y-8">
          
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-2 border-b border-zinc-200/60">
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-blue-100 text-blue-800 tracking-wide uppercase flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  Procurement Operations
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Inventory Reconciled
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-zinc-950 tracking-tight">
                Recommended Purchase Orders
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Automatically calculated replenishment quantities to avoid stockouts and protect service capacity.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
              <Link
                href="/dashboard/overview"
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-700 transition shadow-xs"
              >
                ← Overview
              </Link>
              <button
                onClick={() => fetchOrders(true)}
                disabled={loading || refreshing}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-sm active:scale-97 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Calculating...' : 'Recalculate Units'}</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-16 sm:p-24 text-center space-y-4">
              <div className="w-12 h-12 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-zinc-600">
                Calculating required safety buffers and supplier order quantities...
              </p>
            </div>
          ) : data ? (
            <>
              {/* TOP SUMMARY BAR WITH 3 EXPORT BUTTONS (CSV, PDF, EXCEL) */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white border border-zinc-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                    Total Procurement Budget
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-zinc-950 font-mono tracking-tight">
                    THB {data.summary.totalRestockCostThb.toLocaleString()}
                  </div>
                  <p className="text-xs text-zinc-500">
                    Replenishes <strong>{data.procurementOrders.length} critical ingredient lines</strong> to guarantee a 4 to 7-day safe runway.
                  </p>
                </div>

                {/* Export Buttons Group */}
                <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                  {/* CSV Export */}
                  <button
                    onClick={handleExportCSV}
                    className="px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                    title="Export as CSV table"
                  >
                    <Download className="w-3.5 h-3.5 text-zinc-600" />
                    <span>CSV</span>
                  </button>

                  {/* Excel Export */}
                  <button
                    onClick={handleExportExcel}
                    className="px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                    title="Export as Excel spreadsheet (.xlsx)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Excel</span>
                  </button>

                  {/* PDF Export */}
                  <button
                    onClick={handleExportPDF}
                    className="px-3.5 py-2.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100/80 text-rose-900 font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                    title="Export as printable PDF document"
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-700" />
                    <span>PDF</span>
                  </button>

                  {/* Copy Text Summary */}
                  <button
                    onClick={handleCopyPurchaseOrder}
                    className="px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95 ml-1"
                  >
                    {copiedSummary ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy List</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Orders List */}
              <div className="space-y-4">
                {data.procurementOrders.map((order, idx) => (
                  <div 
                    key={order.itemId}
                    className="p-6 rounded-3xl bg-white border border-zinc-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition"
                  >
                    <div className="space-y-2.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-zinc-100 text-zinc-600 text-xs font-mono font-bold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <h3 className="font-black text-lg text-zinc-950">
                          {order.itemName}
                        </h3>
                        <span className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full uppercase ${
                          order.urgencyLevel === 'IMMEDIATE_ORDER' 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {order.urgencyLevel === 'IMMEDIATE_ORDER' ? 'Order Today (Critical)' : 'Weekend Buffer'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-zinc-600 font-medium">
                        <span>Current Stock: <strong className="text-zinc-900 font-bold">{order.currentStock} {order.unit}</strong></span>
                        <span>•</span>
                        <span>Depletes In: <strong className="text-rose-600 font-bold">{order.daysRemaining} days</strong></span>
                        <span>•</span>
                        <span>Daily Velocity: <strong>{order.dailyUsage} {order.unit}/day</strong></span>
                        <span>•</span>
                        <span>Lead Time: <strong>{order.supplierLeadTimeDays} day(s)</strong></span>
                      </div>

                      <p className="text-xs text-zinc-600 leading-relaxed bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                        {order.reason}
                      </p>
                    </div>

                    {/* Order Qty Box */}
                    <div className="bg-zinc-50/80 p-3 sm:p-4 rounded-2xl border border-zinc-200 text-left sm:text-right shrink-0 w-full sm:w-auto sm:min-w-48 flex sm:flex-col justify-between items-center sm:items-end">
                      <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block">
                        Recommended Order
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-cyan-700 font-mono my-0.5">
                        +{order.recommendedOrderQuantity} <span className="text-xs sm:text-sm font-semibold">{order.unit}</span>
                      </div>
                      <span className="text-[11px] sm:text-xs text-zinc-500 font-medium font-mono block">
                        THB {order.estimatedOrderCostThb.toLocaleString()} (@ THB {order.unitCostThb}/{order.unit})
                      </span>
                    </div>

                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-16 text-center text-zinc-500 bg-white rounded-3xl border border-zinc-200">
              No procurement recommendations available. Please verify uploaded datasets.
            </div>
          )}

        </main>
      </div>

      {/* Mobile Magic Bottom Navigation */}
      <MobileBottomNav currentPath="/dashboard/reorders" isDataReady={true} />

    </div>
  );
}
