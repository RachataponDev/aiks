'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  RefreshCw, 
  ArrowLeft,
  ArrowRight,
  X,
  Check,
  Tag,
  Clock,
  Layers,
  Store,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardNavbar } from '@/components/DashboardNavbar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';

interface ManagedPromotion {
  id: string;
  title: string;
  targetedIngredient: string;
  menuItem: string;
  originalPriceThb: number;
  promoPriceThb: number;
  discountPercent?: number;
  timeWindow: string;
  expiresInHours?: number;
  maxCouponsAvailable?: number;
  couponsRedeemed?: number;
  channels: {
    grabFood: boolean;
    lineMan: boolean;
    shopeeFood: boolean;
    websiteStore: boolean;
  };
  isActive: boolean;
  createdAt: string;
  metrics: {
    redemptionCount: number;
    totalRevenueThb: number;
    unitsSold: number;
  };
  description: string;
}

export default function PromotionManagerPage() {
  const [promotions, setPromotions] = useState<ManagedPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Modal State
  const [editingPromo, setEditingPromo] = useState<ManagedPromotion | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchManagedPromotions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/promotions-manager');
      const json = await res.json();
      if (json.success && json.promotions) {
        setPromotions(json.promotions);
      }
    } catch (err: any) {
      toast.error(`Error loading promotions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagedPromotions();
  }, []);

  // Toggle Active/Inactive
  const handleToggleStatus = async (promo: ManagedPromotion) => {
    try {
      const res = await fetch('/api/promotions-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_STATUS', promotion: promo }),
      });
      const json = await res.json();
      if (json.success) {
        setPromotions(json.promotions);
        toast.success(`Promotion '${promo.title}' is now ${!promo.isActive ? 'Active' : 'Inactive'}.`);
      }
    } catch (err: any) {
      toast.error(`Failed to update status: ${err.message}`);
    }
  };

  // Delete Promotion
  const handleDeletePromo = async (promo: ManagedPromotion) => {
    if (!confirm(`Are you sure you want to delete '${promo.title}'?`)) return;

    try {
      const res = await fetch('/api/promotions-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE', promotion: promo }),
      });
      const json = await res.json();
      if (json.success) {
        setPromotions(json.promotions);
        toast.success(`Promotion deleted.`);
      }
    } catch (err: any) {
      toast.error(`Failed to delete: ${err.message}`);
    }
  };

  // Save Edit Details
  const handleSaveEdit = async () => {
    if (!editingPromo) return;

    try {
      setSavingEdit(true);
      const res = await fetch('/api/promotions-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_SINGLE', promotion: editingPromo }),
      });
      const json = await res.json();
      if (json.success) {
        setPromotions(json.promotions);
        toast.success(`Promotion details updated.`);
        setEditingPromo(null);
      }
    } catch (err: any) {
      toast.error(`Failed to update: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50/70 font-sans antialiased text-zinc-900">
      <DashboardSidebar currentPath="/dashboard/promotions" isDataReady={true} />

      <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-10">
        <DashboardNavbar />

        <main className="flex-1 p-3.5 sm:p-6 md:p-10 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 tracking-wide uppercase flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-blue-600" />
                  Promotion Management
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  {promotions.filter(p => p.isActive).length} Active Live
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-zinc-950 tracking-tight">
                All Active Promotions
              </h1>
              <p className="text-xs text-zinc-500 mt-1">
                Manage, edit parameters, toggle status, or remove promotional campaigns across platforms.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Link
                href="/dashboard/promotions"
                className="px-3.5 sm:px-4 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-xs font-bold text-zinc-700 transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Calculate</span>
              </Link>

              <Link
                href="/store"
                target="_blank"
                className="px-3.5 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Store</span>
                <ExternalLink className="w-3 h-3" />
              </Link>

              <button
                onClick={fetchManagedPromotions}
                disabled={loading}
                className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition cursor-pointer"
                title="Refresh list"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-20 text-center space-y-4">
              <div className="w-12 h-12 border-3 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-zinc-600">
                Loading active promotional ledger...
              </p>
            </div>
          ) : promotions.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-3xl border border-zinc-200 shadow-xs space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                <Tag className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-zinc-900">No Promotions Activated Yet</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Run the clearance calculation engine to generate deals and click Activate to view them here.
                </p>
              </div>
              <Link
                href="/dashboard/promotions"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition"
              >
                <span>Generate Clearance Deals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-xs overflow-hidden">
              
              {/* Table Header */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      <th className="py-4 px-6">Campaign & Menu Item</th>
                      <th className="py-4 px-4">Price / Promo</th>
                      <th className="py-4 px-4">Channels</th>
                      <th className="py-4 px-4">Usage Analytics</th>
                      <th className="py-4 px-4 text-center">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs">
                    {promotions.map((promo) => (
                      <tr key={promo.id} className="hover:bg-zinc-50/50 transition">
                        
                        {/* Title and Item */}
                        <td className="py-4 px-6">
                          <div className="space-y-0.5">
                            <span className="font-mono text-[10px] text-zinc-400 uppercase font-bold block">
                              {promo.id} • {promo.timeWindow}
                            </span>
                            <span className="font-black text-sm text-zinc-950 block">
                              {promo.title}
                            </span>
                            <span className="text-zinc-500 text-[11px]">
                              Target: <strong>{promo.targetedIngredient}</strong> ({promo.menuItem})
                            </span>
                          </div>
                        </td>

                        {/* Price and Remaining */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="line-through text-zinc-400 font-mono text-xs">
                              ฿{promo.originalPriceThb}
                            </span>
                            <span className="font-black text-blue-700 font-mono text-sm">
                              ฿{promo.promoPriceThb}
                            </span>
                            <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              -{promo.discountPercent || Math.max(5, Math.round(((promo.originalPriceThb - promo.promoPriceThb) / promo.originalPriceThb) * 100))}%
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-amber-700 font-mono block mt-1">
                            Expires in ~{promo.expiresInHours || 3} hrs
                          </span>
                        </td>

                        {/* Channels */}
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap items-center gap-1">
                            {promo.channels?.grabFood && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Grab
                              </span>
                            )}
                            {promo.channels?.lineMan && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-50 text-green-800 border border-green-200">
                                LINE MAN
                              </span>
                            )}
                            {promo.channels?.shopeeFood && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-50 text-orange-800 border border-orange-200">
                                Shopee
                              </span>
                            )}
                            {promo.channels?.websiteStore && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                Storefront
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Usage Analytics & Coupon Caps */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-zinc-500">Coupons Claimed:</span>
                              <strong className="font-mono text-zinc-900">
                                {promo.couponsRedeemed || promo.metrics?.redemptionCount || 0} / {promo.maxCouponsAvailable || 50}
                              </strong>
                            </div>
                            <div className="w-24 bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-blue-600 h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.min(100, (((promo.couponsRedeemed || promo.metrics?.redemptionCount || 0) / (promo.maxCouponsAvailable || 50)) * 100))}%`
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status Toggle */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(promo)}
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition cursor-pointer border ${
                              promo.isActive 
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200' 
                                : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200'
                            }`}
                          >
                            {promo.isActive ? 'Active Live' : 'Paused'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingPromo(promo)}
                              className="px-3 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => handleDeletePromo(promo)}
                              className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Delete promotion"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* Mobile Magic Bottom Navigation */}
      <MobileBottomNav currentPath="/dashboard/promotions" isDataReady={true} />

      {/* Edit Details Modal */}
      {editingPromo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-base text-zinc-950">
                  Edit Promotion Details
                </h3>
              </div>
              <button
                onClick={() => setEditingPromo(null)}
                className="w-8 h-8 rounded-lg hover:bg-zinc-200 text-zinc-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-6 space-y-4 text-xs">
              
              {/* Campaign Title */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700">Campaign Title</label>
                <input
                  type="text"
                  value={editingPromo.title}
                  onChange={(e) => setEditingPromo({ ...editingPromo, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:border-blue-600 font-medium text-xs"
                />
              </div>

              {/* Price adjustments */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-700">Original Price (THB)</label>
                  <input
                    type="number"
                    value={editingPromo.originalPriceThb}
                    onChange={(e) => setEditingPromo({ ...editingPromo, originalPriceThb: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-700">Promo Price (THB)</label>
                  <input
                    type="number"
                    value={editingPromo.promoPriceThb}
                    onChange={(e) => setEditingPromo({ ...editingPromo, promoPriceThb: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 font-mono text-xs font-bold text-blue-600"
                  />
                </div>
              </div>

              {/* Expiry Hours & Max Coupons Capacity Limit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-700">Expires In (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={editingPromo.expiresInHours || 3}
                    onChange={(e) => setEditingPromo({ ...editingPromo, expiresInHours: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-700">Max Coupons (Inventory Limit)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingPromo.maxCouponsAvailable || 50}
                    onChange={(e) => setEditingPromo({ ...editingPromo, maxCouponsAvailable: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 font-mono text-xs font-bold text-amber-700"
                  />
                  <span className="text-[10px] text-zinc-400 block">Cannot exceed physical stock capacity</span>
                </div>
              </div>

              {/* Time Window */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700">Time Window (Schedule)</label>
                <input
                  type="text"
                  value={editingPromo.timeWindow}
                  onChange={(e) => setEditingPromo({ ...editingPromo, timeWindow: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-700">Campaign Description</label>
                <textarea
                  rows={3}
                  value={editingPromo.description}
                  onChange={(e) => setEditingPromo({ ...editingPromo, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs"
                />
              </div>

              {/* Channel Toggles in Modal */}
              <div className="space-y-2 pt-2">
                <label className="font-bold text-zinc-700 block">Active Broadcast Channels</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPromo({
                      ...editingPromo,
                      channels: { ...editingPromo.channels, grabFood: !editingPromo.channels?.grabFood },
                    })}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      editingPromo.channels?.grabFood ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                    }`}
                  >
                    GrabFood
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingPromo({
                      ...editingPromo,
                      channels: { ...editingPromo.channels, lineMan: !editingPromo.channels?.lineMan },
                    })}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      editingPromo.channels?.lineMan ? 'bg-green-600 text-white border-green-700' : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                    }`}
                  >
                    LINE MAN
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingPromo({
                      ...editingPromo,
                      channels: { ...editingPromo.channels, shopeeFood: !editingPromo.channels?.shopeeFood },
                    })}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      editingPromo.channels?.shopeeFood ? 'bg-orange-600 text-white border-orange-700' : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                    }`}
                  >
                    ShopeeFood
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingPromo({
                      ...editingPromo,
                      channels: { ...editingPromo.channels, websiteStore: !editingPromo.channels?.websiteStore },
                    })}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      editingPromo.channels?.websiteStore ? 'bg-blue-600 text-white border-blue-700' : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                    }`}
                  >
                    Store Website
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setEditingPromo(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-6 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
