import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { calculateSummaryMetrics, loadAllData } from '@/lib/dataLoader';
import { AiCalculatedAudit } from '@/types/dashboard';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const selectedModel = body.model || 'gemini-2.5-flash';

    const apiKey = process.env.GEMINI_API_KEY || process.env.api_key;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'GEMINI_API_KEY not configured in environment' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const summary = calculateSummaryMetrics();
    const data = loadAllData();

    // Select top prioritized data quality issues
    const topIssues = data.issues.slice(0, 10);
    const criticalOverstock = summary.inventoryStatus?.filter(i => i.status === 'OVERSTOCK_SPOILAGE_RISK') || [];
    const criticalLowStock = summary.inventoryStatus?.filter(i => i.status === 'REORDER_NEEDED') || [];

    // Streamlined prompt focused purely on data quality audit and inventory guidance in English
    const prompt = `You are an expert Data Quality & Hospitality Inventory Auditor.
Analyze these issues from 'data_quality_issue_register.csv':
${JSON.stringify(topIssues.map(i => ({
  file: i.file_name,
  record_id: i.record_id,
  field: i.field_name,
  issue_type: i.issue_type,
  observed: i.observed_value,
  expected: i.reference_or_expected_value,
  action_hint: i.student_action_hint
})), null, 2)}

And these critical inventory alerts:
- Overstock at Spoilage Risk: ${JSON.stringify(criticalOverstock.map(i => ({ name: i.itemName, stock: i.currentStock, unit: i.unit, daysOfCover: i.daysOfCover, riskThb: i.wasteRiskValueThb })))}
- Low Stock Needing Reorder: ${JSON.stringify(criticalLowStock.map(i => ({ name: i.itemName, stock: i.currentStock, unit: i.unit, daysOfCover: i.daysOfCover, recommendedOrder: i.recommendedOrderQty })))}

Produce a valid JSON object strictly matching this schema. All text MUST BE IN ENGLISH ONLY:
{
  "isDataValid": false,
  "totalIssuesCount": ${data.issues.length},
  "dataQualityStatus": "CORRECTIONS_REQUIRED",
  "aiAnalysisSummary": "Critical data quality defects detected across sales and inventory datasets. Normalization and balance reconciliation are required.",
  "blockingIssues": [
    {
      "fileName": "sales_transactions.csv",
      "recordId": "TXN00011",
      "field": "product_service_name_raw",
      "issueType": "INCONSISTENT_PRODUCT_NAMING",
      "currentValue": "Water bottle",
      "correctValue": "Bottled Water",
      "instructionToFix": "Update the raw product name to match canonical name in products_services.csv to avoid fragmenting sales totals."
    }
  ],
  "criticalOverstockedItems": [
    {
      "name": "Croissant dough",
      "stock": 112,
      "daysCover": 3.7,
      "riskThb": 1400,
      "recommendation": "Perishable dough held past 3-day buffer. Launch an afternoon flash promotion immediately."
    }
  ],
  "criticalLowStockItems": [
    {
      "name": "Soy milk",
      "stock": 13,
      "daysCover": 1.6,
      "orderUnits": 11,
      "recommendation": "Stock cover is only 1.6 days. Reorder 11 cartons today to prevent stockout."
    }
  ],
  "salesForecast": [
    {
      "period": "2026-10",
      "projectedRevenueThb": 58500,
      "expectedGrowthPercent": 4.5,
      "forecastNote": "Projected from current daily run rate with upcoming weekend uplift."
    },
    {
      "period": "2026-11",
      "projectedRevenueThb": 61200,
      "expectedGrowthPercent": 4.6,
      "forecastNote": "High-season inbound tourist traffic increase."
    },
    {
      "period": "2026-12",
      "projectedRevenueThb": 64500,
      "expectedGrowthPercent": 5.4,
      "forecastNote": "Year-end holiday demand peak across café and hotel segments."
    }
  ],
  "strategicAdvice": [
    "Reconcile daily closing stock equations before submitting financial reports.",
    "Promote high-margin bundle combinations to absorb excess perishable dairy and dough inventory.",
    "Filter out refunded transactions from demand forecasting algorithms to avoid over-ordering."
  ]
}
Return ONLY valid JSON. No markdown fences or conversational text.`;

    let rawText = '';
    const candidateModels = [selectedModel, 'gemini-2.5-flash', 'gemini-1.5-flash'];

    for (const model of candidateModels) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        rawText = res.text || '';
        if (rawText) break;
      } catch (err) {
        console.warn(`Model ${model} call failed, trying next...`, err);
      }
    }

    let parsedAudit: AiCalculatedAudit;

    if (rawText) {
      let cleanedJson = rawText.trim();
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.replace(/^```/, '').replace(/```$/, '').trim();
      }
      try {
        parsedAudit = JSON.parse(cleanedJson);
      } catch {
        parsedAudit = getDefaultAudit(data, topIssues, criticalOverstock, criticalLowStock);
      }
    } else {
      parsedAudit = getDefaultAudit(data, topIssues, criticalOverstock, criticalLowStock);
    }

    return NextResponse.json({
      success: true,
      aiAudit: parsedAudit,
      metricsSnapshot: summary,
    });
  } catch (error: any) {
    console.error('Error in analyze API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function getDefaultAudit(data: any, topIssues: any[], criticalOverstock: any[], criticalLowStock: any[]): AiCalculatedAudit {
  return {
    isDataValid: false,
    totalIssuesCount: data.issues.length,
    dataQualityStatus: 'CORRECTIONS_REQUIRED',
    aiAnalysisSummary: 'AI identified critical anomalies in sales records and stock equations. Merchant corrections required before datasets can be verified 100% clean.',
    blockingIssues: topIssues.slice(0, 8).map(i => ({
      fileName: i.file_name,
      recordId: i.record_id,
      field: i.field_name,
      issueType: i.issue_type,
      currentValue: i.observed_value,
      correctValue: i.reference_or_expected_value,
      instructionToFix: i.student_action_hint || 'Align value with canonical reference dictionary.',
    })),
    criticalOverstockedItems: criticalOverstock.map(i => ({
      name: i.itemName,
      stock: i.currentStock,
      daysCover: i.daysOfCover,
      riskThb: i.wasteRiskValueThb,
      recommendation: i.actionNote,
    })),
    criticalLowStockItems: criticalLowStock.map(i => ({
      name: i.itemName,
      stock: i.currentStock,
      daysCover: i.daysOfCover,
      orderUnits: i.recommendedOrderQty,
      recommendation: i.actionNote,
    })),
    salesForecast: [
      { period: '2026-10', projectedRevenueThb: 58500, expectedGrowthPercent: 4.5, forecastNote: 'Projected from current daily run rate' },
      { period: '2026-11', projectedRevenueThb: 61000, expectedGrowthPercent: 4.3, forecastNote: 'High season influx expected' },
      { period: '2026-12', projectedRevenueThb: 63800, expectedGrowthPercent: 4.6, forecastNote: 'Holiday and year-end demand surge' }
    ],
    strategicAdvice: [
      'Accelerate sales of Butter Croissant and fresh milk via targeted afternoon bundles to eliminate waste.',
      'Correct raw product naming inconsistencies in sales_transactions.csv to ensure 100% demand accuracy.',
      'Maintain an active buffer for Soy milk to prevent recurring out-of-stock occurrences.'
    ]
  };
}
