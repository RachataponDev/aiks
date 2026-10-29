import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.resolve(process.cwd(), 'data/uploads');
const PROMOTIONS_FILE = path.resolve(UPLOADS_DIR, 'active_promotions_ledger.json');

export interface ManagedPromotion {
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

// GET: Retrieve all managed promotions
export async function GET() {
  try {
    if (!fs.existsSync(PROMOTIONS_FILE)) {
      return NextResponse.json({ success: true, promotions: [] });
    }
    const raw = fs.readFileSync(PROMOTIONS_FILE, 'utf-8');
    const promotions: ManagedPromotion[] = JSON.parse(raw);
    return NextResponse.json({ success: true, promotions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Add, Activate or Update promotions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, promotions, promotion } = body;

    let current: ManagedPromotion[] = [];
    if (fs.existsSync(PROMOTIONS_FILE)) {
      try {
        current = JSON.parse(fs.readFileSync(PROMOTIONS_FILE, 'utf-8'));
      } catch {
        current = [];
      }
    }

    if (action === 'ACTIVATE_BATCH') {
      // Incoming batch of new promotions from generator
      const incomingList: ManagedPromotion[] = (promotions || []).map((p: any) => {
        const orig = Number(p.originalPriceThb) || 55;
        const promo = Number(p.promoPriceThb) || 39;
        const discount = p.discountPercent || Math.max(5, Math.round(((orig - promo) / orig) * 100));
        return {
          id: p.id || `PROMO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: p.title || 'Special Promotion',
          targetedIngredient: p.targetedIngredient || 'Fresh Ingredient',
          menuItem: p.menuItem || 'Menu Item',
          originalPriceThb: orig,
          promoPriceThb: promo,
          discountPercent: discount,
          timeWindow: p.timeWindow || '14:00 - 17:00',
          expiresInHours: Number(p.expiresInHours) || 3,
          maxCouponsAvailable: Number(p.maxCouponsAvailable) || Number(p.expectedUnitsCleared) || 50,
          couponsRedeemed: Number(p.couponsRedeemed) || 0,
          channels: p.channels || {
            grabFood: true,
            lineMan: true,
            shopeeFood: true,
            websiteStore: true,
          },
          isActive: true,
          createdAt: new Date().toISOString(),
          metrics: {
            redemptionCount: Number(p.couponsRedeemed) || 0,
            totalRevenueThb: 0,
            unitsSold: 0,
          },
          description: p.strategyRATIONALE || p.description || 'Special promotional price to prevent food waste.',
        };
      });

      // Merge: replace existing IDs or append new
      const currentMap = new Map(current.map(c => [c.id, c]));
      for (const inc of incomingList) {
        currentMap.set(inc.id, inc);
      }
      current = Array.from(currentMap.values());
    } else if (action === 'UPDATE_SINGLE' && promotion) {
      const idx = current.findIndex(p => p.id === promotion.id);
      if (idx !== -1) {
        current[idx] = { ...current[idx], ...promotion };
      } else {
        current.push(promotion);
      }
    } else if (action === 'REDEEM_COUPON' && promotion?.id) {
      const idx = current.findIndex(p => p.id === promotion.id);
      if (idx !== -1) {
        const item = current[idx];
        const max = item.maxCouponsAvailable ?? 999;
        const redeemed = (item.couponsRedeemed || 0) + 1;
        
        if (redeemed > max) {
          return NextResponse.json({
            success: false,
            error: `Sold out! Coupon limit reached capacity (${max}/${max} issued).`,
          }, { status: 400 });
        }

        current[idx].couponsRedeemed = redeemed;
        current[idx].metrics = {
          ...current[idx].metrics,
          redemptionCount: redeemed,
          unitsSold: (current[idx].metrics?.unitsSold || 0) + 1,
          totalRevenueThb: (current[idx].metrics?.totalRevenueThb || 0) + current[idx].promoPriceThb,
        };
      }
    } else if (action === 'TOGGLE_STATUS' && promotion) {
      const idx = current.findIndex(p => p.id === promotion.id);
      if (idx !== -1) {
        current[idx].isActive = !current[idx].isActive;
      }
    } else if (action === 'DELETE' && promotion) {
      current = current.filter(p => p.id !== promotion.id);
    }

    fs.writeFileSync(PROMOTIONS_FILE, JSON.stringify(current, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Promotions updated successfully.',
      promotions: current,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
