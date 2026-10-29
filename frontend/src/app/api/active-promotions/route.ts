import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.resolve(process.cwd(), 'data/uploads');
const PROMOTIONS_FILE = path.resolve(UPLOADS_DIR, 'active_promotions_ledger.json');

export async function GET() {
  try {
    if (fs.existsSync(PROMOTIONS_FILE)) {
      try {
        const raw = fs.readFileSync(PROMOTIONS_FILE, 'utf-8');
        const all = JSON.parse(raw);
        // Only return active promotions where websiteStore channel is true
        const activeForStore = all.filter((p: any) => p.isActive && p.channels?.websiteStore !== false);
        return NextResponse.json({
          success: true,
          promotions: activeForStore,
          isLive: activeForStore.length > 0,
        });
      } catch (e) {
        console.warn('Failed reading active promotions ledger:', e);
      }
    }

    return NextResponse.json({
      success: true,
      promotions: [],
      isLive: false,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
