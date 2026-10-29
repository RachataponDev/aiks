import { NextResponse } from 'next/server';
import { calculateSummaryMetrics } from '@/lib/dataLoader';

export async function GET() {
  try {
    const summary = calculateSummaryMetrics();
    return NextResponse.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('Error computing summary metrics:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
