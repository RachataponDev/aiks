import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { calculateSummaryMetrics, generatePromotionSuggestions } from '@/lib/dataLoader';
import { PromotionSuggestion } from '@/types/dashboard';

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
    const inventoryStatus = summary.inventoryStatus || [];
    const overstocked = inventoryStatus.filter(i => i.status === 'OVERSTOCK_SPOILAGE_RISK');

    // Deterministic fallback promos
    const defaultPromos = generatePromotionSuggestions(inventoryStatus);

    if (overstocked.length === 0) {
      return NextResponse.json({
        success: true,
        promotions: defaultPromos,
      });
    }

    const prompt = `You are a Smart Hospitality Revenue Management & Inventory Clearance Expert.
We have perishable inventory overstocked and at risk of spoilage:
${JSON.stringify(overstocked.map(i => ({
  name: i.itemName,
  stockOnHand: i.currentStock,
  unit: i.unit,
  unitCostThb: i.unitCost,
  daysOfCover: i.daysOfCover,
  estimatedWasteLossThb: i.wasteRiskValueThb
})), null, 2)}

Menu items referencing catalog:
- Butter Croissant: List Price 55 THB, Unit Cost 21 THB (uses Croissant dough)
- Latte: List Price 75 THB, Unit Cost 22 THB (uses Milk & Coffee beans)
- Pandan Coconut Cake: List Price 65 THB, Unit Cost 24 THB (uses Coconut cake)
- Mango Sticky Rice: List Price 95 THB, Unit Cost 38 THB (uses Mango & Sticky rice)

Generate 2-3 targeted promotional campaign deals designed to clear this stock before expiration.
CRITICAL CONSTRAINTS (STRICT SYSTEM RULES):
1. PROFIT MARGIN: Each promotion MUST REMAIN PROFITABLE (Promo Price > Unit Cost).
2. PRODUCTION CAPACITY LIMIT: Total coupons allowed ("maxCouponsAvailable") MUST NEVER EXCEED the physical production capacity derived from stockOnHand (e.g. if stockOnHand is 112 croissants, maxCouponsAvailable must be <= 112).
3. REMAINING HOURS: Define "expiresInHours" (e.g. 2, 3, 4, 6 hours) showing exactly how many hours remaining before this deal ends.
ALL TEXT MUST BE IN ENGLISH ONLY.

Format output as valid JSON matching this schema:
[
  {
    "id": "PROMO-001",
    "title": "Afternoon Warm Croissant Flash Sale",
    "targetSegment": "Café Walk-in",
    "ingredientTargeted": "Croissant dough",
    "originalPriceThb": 55,
    "promoPriceThb": 38,
    "discountPercent": 31,
    "expiresInHours": 3,
    "maxCouponsAvailable": 60,
    "couponsRedeemed": 0,
    "unitCostThb": 21,
    "marginThb": 17,
    "description": "Offer Butter Croissant at ฿38 (Cost ฿21) from 14:00 - 17:00 to clear fresh dough pieces before expiration.",
    "channel": "In-Store & Delivery"
  }
]
Return ONLY a valid JSON array. No markdown, no backticks.`;

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
        console.warn(`Model ${model} promo generation failed:`, err);
      }
    }

    let parsedPromos: PromotionSuggestion[] = defaultPromos;

    if (rawText) {
      let cleanedJson = rawText.trim();
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.replace(/^```/, '').replace(/```$/, '').trim();
      }
      try {
        const aiPromos = JSON.parse(cleanedJson);
        if (Array.isArray(aiPromos) && aiPromos.length > 0) {
          parsedPromos = aiPromos;
        }
      } catch (err) {
        console.warn('Failed to parse AI promo JSON, using standard calculations:', err);
      }
    }

    return NextResponse.json({
      success: true,
      promotions: parsedPromos,
    });
  } catch (error: any) {
    console.error('Error generating promo:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
