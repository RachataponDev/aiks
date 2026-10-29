import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.resolve(process.cwd(), 'data/uploads');
const REGISTRY_FILE = path.resolve(UPLOADS_DIR, 'file_registry.json');
const CACHE_FILE = path.resolve(UPLOADS_DIR, 'operational_summary_cache.json');

export interface KitchenItemAlert {
  itemId: string;
  itemName: string;
  unit: string;
  closingStock: number;
  dailyUsage: number;
  daysRemaining: number;
  estimatedWasteLossThb: number;
  status: 'EXPIRE_SOON' | 'RUNNING_OUT' | 'NOT_ENOUGH';
  aiReason: string;
  recommendedAction: string;
}

export interface KitchenAlertsResponse {
  success: boolean;
  isCached: boolean;
  generatedAt: string;
  summaryStats: {
    totalWasteRiskThb: number;
    expiringSoonCount: number;
    runningOutCount: number;
    notEnoughCount: number;
  };
  cards: {
    expiringSoon: KitchenItemAlert[]; // อะไรจะเน่า (Perishable risk within 24-48h)
    runningOut: KitchenItemAlert[];   // อะไรจะหมด (Stockout risk < 2.5 days)
    notEnough: KitchenItemAlert[];    // อะไรที่ไม่พอ (High demand items with insufficient buffer)
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // 1. Cache Check to prevent wasting AI tokens
    if (!forceRefresh && fs.existsSync(CACHE_FILE)) {
      try {
        const cachedRaw = fs.readFileSync(CACHE_FILE, 'utf-8');
        const parsed = JSON.parse(cachedRaw);
        if (parsed && parsed.success && parsed.cards) {
          return NextResponse.json({ ...parsed, isCached: true });
        }
      } catch (err) {
        console.warn('Failed reading cache, will re-compute:', err);
      }
    }

    // 2. Load file registry
    let registry: Record<string, any> = {};
    if (fs.existsSync(REGISTRY_FILE)) {
      try {
        registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'));
      } catch {
        registry = {};
      }
    }

    const registryItems = Object.values(registry);
    const invDailyFile = registryItems.find((r: any) => 
      r.originalName?.toLowerCase().includes('inventory_daily') || r.sampleColumns?.some((c: string) => c.includes('opening_stock'))
    );
    const invDictFile = registryItems.find((r: any) => 
      r.originalName?.toLowerCase().includes('inventory_item') || r.sampleColumns?.some((c: string) => c.includes('typical_daily_usage'))
    );
    const salesFile = registryItems.find((r: any) => 
      r.originalName?.toLowerCase().includes('sales') || r.sampleColumns?.some((c: string) => c.includes('net_sales_thb'))
    );

    // 3. Load Kitchen Ingredient Master Dictionary (Filter only kitchen ingredients, skip hotel supplies)
    const ingredientDict: Record<string, { name: string; uom: string; cost: number; usage: number; perishable: boolean }> = {};
    if (invDictFile && fs.existsSync(invDictFile.filePath)) {
      const dictLines = fs.readFileSync(invDictFile.filePath, 'utf-8').split(/\r?\n/);
      const dictHeader = dictLines[0]?.split(',').map(c => c.trim().replace(/^"|"$/g, '')) || [];
      const idIdx = dictHeader.indexOf('inventory_item_id');
      const nameIdx = dictHeader.indexOf('inventory_item_name');
      const catIdx = dictHeader.indexOf('inventory_category');
      const uomIdx = dictHeader.indexOf('unit_of_measure');
      const costIdx = dictHeader.indexOf('unit_cost_thb');
      const usageIdx = dictHeader.indexOf('typical_daily_usage');
      const perishIdx = dictHeader.indexOf('perishable_flag');

      for (let i = 1; i < dictLines.length; i++) {
        if (!dictLines[i].trim()) continue;
        const row = dictLines[i].split(',');
        const id = row[idIdx]?.trim();
        const cat = row[catIdx]?.trim().toLowerCase();
        
        // Skip non-food/drink supplies (e.g. hotel toiletry set)
        if (cat === 'hotel_supply') continue;

        if (id) {
          ingredientDict[id] = {
            name: row[nameIdx]?.trim().replace(/^"|"$/g, '') || id,
            uom: row[uomIdx]?.trim() || 'unit',
            cost: parseFloat(row[costIdx]) || 0,
            usage: parseFloat(row[usageIdx]) || 1,
            perishable: parseInt(row[perishIdx]) === 1,
          };
        }
      }
    }

    // 4. Calculate latest stock & accumulated waste per ingredient
    const latestStock: Record<string, { date: string; itemId: string; itemName: string; closing: number; uom: string }> = {};
    const itemWasteSum: Record<string, number> = {};

    if (invDailyFile && fs.existsSync(invDailyFile.filePath)) {
      const invLines = fs.readFileSync(invDailyFile.filePath, 'utf-8').split(/\r?\n/);
      const invHeader = invLines[0]?.split(',').map(c => c.trim().replace(/^"|"$/g, '')) || [];
      const dateIdx = invHeader.indexOf('date');
      const itemIdIdx = invHeader.indexOf('inventory_item_id');
      const itemNameIdx = invHeader.indexOf('inventory_item_name');
      const wasteIdx = invHeader.indexOf('waste_quantity');
      const closeIdx = invHeader.indexOf('closing_stock');
      const uomIdx = invHeader.indexOf('unit_of_measure');

      for (let i = 1; i < invLines.length; i++) {
        if (!invLines[i].trim()) continue;
        const row = invLines[i].split(',');
        const id = row[itemIdIdx]?.trim();
        if (!id || !ingredientDict[id]) continue; // Only process kitchen ingredients

        const date = row[dateIdx]?.trim();
        const close = parseFloat(row[closeIdx]) || 0;
        const waste = parseFloat(row[wasteIdx]) || 0;
        const itemName = row[itemNameIdx]?.trim().replace(/^"|"$/g, '') || id;
        const uom = row[uomIdx]?.trim() || '';

        if (!latestStock[id] || date > latestStock[id].date) {
          latestStock[id] = { date, itemId: id, itemName, closing: close, uom };
        }

        itemWasteSum[id] = (itemWasteSum[id] || 0) + waste;
      }
    }

    // 5. Structure preliminary items for AI analysis
    const ingredientList = Object.entries(latestStock).map(([id, info]) => {
      const meta = ingredientDict[id] || { name: info.itemName, uom: info.uom, cost: 0, usage: 1, perishable: false };
      const daysRemaining = meta.usage > 0 ? parseFloat((info.closing / meta.usage).toFixed(1)) : 99;
      const wasteLoss = (itemWasteSum[id] || 0) * meta.cost;
      return {
        itemId: id,
        itemName: meta.name,
        unit: meta.uom,
        closingStock: info.closing,
        dailyUsage: meta.usage,
        unitCostThb: meta.cost,
        daysRemaining,
        perishable: meta.perishable,
        totalWasteHistorical: itemWasteSum[id] || 0,
        estimatedWasteLossThb: Math.round(wasteLoss),
      };
    });

    // 6. Gemini AI: Prompt to evaluate exactly: What will spoil? What will run out? What is not enough?
    const apiKey = process.env.GEMINI_API_KEY || process.env.api_key;
    let aiEvaluatedCards = {
      expiringSoon: [] as KitchenItemAlert[],
      runningOut: [] as KitchenItemAlert[],
      notEnough: [] as KitchenItemAlert[],
    };

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const aiPrompt = `You are an AI Restaurant Operations & Food Waste Specialist.
A restaurant owner needs a simple, concise status card for kitchen ingredients.
Analyze the kitchen inventory data below:

${JSON.stringify(ingredientList, null, 2)}

CLASSIFICATION RULES:
1. "expiringSoon" (Critical Spoilage Risk):
   - Perishable items with high stock or high historical waste (e.g. Croissant dough, Milk, Coconut cake, Chicken, Mango) that risk spoilage if not used within 24-48 hours.
2. "runningOut" (Imminent Stockout Risk):
   - Critical items with less than 2.5 days of runway left based on daily usage (e.g. Soy milk, Tea leaves).
3. "notEnough" (Buffer Depletion Alert):
   - Items with tight coverage (2.5 - 3.2 days) where any sudden rush or catering order will cause a stockout.

TASK:
Classify each item into ONE of the three categories. Provide a 1-sentence plain-English reason and a 1-sentence recommended action that a restaurant owner can execute immediately.
Output strictly JSON matching this structure:
{
  "expiringSoon": [
    {
      "itemId": "INVxxx",
      "itemName": "Item Name",
      "unit": "kg/piece/litre",
      "closingStock": 0,
      "dailyUsage": 0,
      "daysRemaining": 0,
      "estimatedWasteLossThb": 0,
      "status": "EXPIRE_SOON",
      "aiReason": "Concise reason why it will spoil soon",
      "recommendedAction": "Actionable fix (e.g. Run 30% discount promotion today)"
    }
  ],
  "runningOut": [
    {
      "itemId": "INVxxx",
      "itemName": "Item Name",
      "unit": "kg/piece/litre",
      "closingStock": 0,
      "dailyUsage": 0,
      "daysRemaining": 0,
      "estimatedWasteLossThb": 0,
      "status": "RUNNING_OUT",
      "aiReason": "Concise reason why it is running out",
      "recommendedAction": "Actionable fix (e.g. Reorder 20 units now)"
    }
  ],
  "notEnough": [
    {
      "itemId": "INVxxx",
      "itemName": "Item Name",
      "unit": "kg/piece/litre",
      "closingStock": 0,
      "dailyUsage": 0,
      "daysRemaining": 0,
      "estimatedWasteLossThb": 0,
      "status": "NOT_ENOUGH",
      "aiReason": "Concise reason why current buffer is insufficient",
      "recommendedAction": "Actionable fix (e.g. Restock buffer before weekend)"
    }
  ]
}
JSON only.`;

        const models = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];
        for (const m of models) {
          try {
            const resp = await ai.models.generateContent({
              model: m,
              contents: aiPrompt,
            });
            let txt = resp.text || '';
            if (txt) {
              txt = txt.trim().replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
              const parsed = JSON.parse(txt);
              if (parsed.expiringSoon || parsed.runningOut || parsed.notEnough) {
                aiEvaluatedCards = {
                  expiringSoon: parsed.expiringSoon || [],
                  runningOut: parsed.runningOut || [],
                  notEnough: parsed.notEnough || [],
                };
                break;
              }
            }
          } catch (err: any) {
            console.warn(`Model ${m} failed in kitchen analysis:`, err.message);
          }
        }
      } catch (aiErr) {
        console.warn('AI Kitchen analysis error:', aiErr);
      }
    }

    // Fallback classification if AI failed
    if (aiEvaluatedCards.expiringSoon.length === 0 && aiEvaluatedCards.runningOut.length === 0) {
      for (const item of ingredientList) {
        if (item.daysRemaining <= 2.2) {
          aiEvaluatedCards.runningOut.push({
            itemId: item.itemId,
            itemName: item.itemName,
            unit: item.unit,
            closingStock: item.closingStock,
            dailyUsage: item.dailyUsage,
            daysRemaining: item.daysRemaining,
            estimatedWasteLossThb: item.estimatedWasteLossThb,
            status: 'RUNNING_OUT',
            aiReason: `Only ${item.daysRemaining} days left at current usage rate.`,
            recommendedAction: `Place reorder immediately to avoid café stockout.`,
          });
        } else if (item.perishable && (item.daysRemaining >= 3.5 || item.totalWasteHistorical > 30)) {
          aiEvaluatedCards.expiringSoon.push({
            itemId: item.itemId,
            itemName: item.itemName,
            unit: item.unit,
            closingStock: item.closingStock,
            dailyUsage: item.dailyUsage,
            daysRemaining: item.daysRemaining,
            estimatedWasteLossThb: item.estimatedWasteLossThb,
            status: 'EXPIRE_SOON',
            aiReason: `High stock (${item.closingStock} ${item.unit}) with short shelf-life and history of spoilage.`,
            recommendedAction: `Launch Afternoon Happy Hour promotion or bundle in combo.`,
          });
        } else {
          aiEvaluatedCards.notEnough.push({
            itemId: item.itemId,
            itemName: item.itemName,
            unit: item.unit,
            closingStock: item.closingStock,
            dailyUsage: item.dailyUsage,
            daysRemaining: item.daysRemaining,
            estimatedWasteLossThb: item.estimatedWasteLossThb,
            status: 'NOT_ENOUGH',
            aiReason: `Buffer of ${item.daysRemaining} days is below safe weekend threshold.`,
            recommendedAction: `Adjust prep quantity or order safety buffer stock.`,
          });
        }
      }
    }

    // Calculate total waste cost
    const totalWasteRiskThb = ingredientList.reduce((acc, i) => acc + (i.estimatedWasteLossThb || 0), 0);

    const payload: KitchenAlertsResponse = {
      success: true,
      isCached: false,
      generatedAt: new Date().toISOString(),
      summaryStats: {
        totalWasteRiskThb,
        expiringSoonCount: aiEvaluatedCards.expiringSoon.length,
        runningOutCount: aiEvaluatedCards.runningOut.length,
        notEnoughCount: aiEvaluatedCards.notEnough.length,
      },
      cards: aiEvaluatedCards,
    };

    // Save to disk JSON cache so subsequent calls never waste AI tokens
    try {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (saveErr) {
      console.warn('Failed saving operational summary cache:', saveErr);
    }

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('Error in kitchen summary API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
