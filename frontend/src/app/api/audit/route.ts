import { NextResponse } from 'next/server';
import { runAutomatedDataQualityAudit } from '@/lib/dataAuditor';

export async function GET() {
  try {
    const auditReport = runAutomatedDataQualityAudit();
    return NextResponse.json({
      success: true,
      report: auditReport,
    });
  } catch (error: any) {
    console.error('Audit API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to execute data quality audit' },
      { status: 500 }
    );
  }
}
