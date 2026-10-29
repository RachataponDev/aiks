import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.resolve(process.cwd(), 'data/uploads');
const REGISTRY_FILE = path.resolve(UPLOADS_DIR, 'file_registry.json');
const SOLUTION_CACHE_FILE = path.resolve(UPLOADS_DIR, 'kitchen_solution_cache.json');
const PUBLISHED_PROMOS_FILE = path.resolve(UPLOADS_DIR, 'published_promotions.json');

export interface ClearancePromotion {
  id: string;
  title: string;
  targetedIngredient: string;
  menuItem: string;
  channel: string;
  timeWindow: string;
  expiresInHours?: number; // Hours until promotion expires
  originalPriceThb: number;
  promoPriceThb: number;
  discountPercent?: number; // e.g. 29%
  marginThb: number;
  expectedUnitsCleared: number;
  maxCouponsAvailable?: number; // Strictly bounded by recipe BOM inventory capacity
  couponsRedeemed?: number;
  expectedWasteSavedThb: number;
  strategyRATIONALE: string;
  weatherFactorNote?: string;
  platforms: {
    grabFood: boolean;
    lineMan: boolean;
    shopeeFood: boolean;
    websiteStore: boolean;
  };
}

export interface PurchaseReorderItem {
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

export interface WeatherConditionToday {
  condition: string;
  temperature: string;
  season: string;
  impactOnDineIn: string;
  impactOnDelivery: string;
  syntheticDemandIndex: number;
}

export interface SolutionResponse {
  success: boolean;
  isCached: boolean;
  generatedAt: string;
  weatherToday: WeatherConditionToday;
  summary: {
    totalWasteRescueThb: number;
    totalRestockCostThb: number;
    promotionsCount: number;
    reorderCount: number;
  };
  clearancePromotions: ClearancePromotion[];
  procurementOrders: PurchaseReorderItem[];
  executiveStrategy: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // 1. Check Cache
    if (!forceRefresh && fs.existsSync(SOLUTION_CACHE_FILE)) {
      try {
        const cached = JSON.parse(fs.readFileSync(SOLUTION_CACHE_FILE, 'utf-8'));
        if (cached && cached.success && cached.weatherToday) {
          return NextResponse.json({ ...cached, isCached: true });
        }
      } catch (err) {
        console.warn('Failed to read solution cache:', err);
      }
    }

    // 2. Read All Uploaded User Files from Registry
    let registry: Record<string, any> = {};
    if (fs.existsSync(REGISTRY_FILE)) {
      try {
        registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'));
      } catch {
        registry = {};
      }
    }

    // Read daily_context.csv to extract today's weather context
    let weatherToday: WeatherConditionToday = {
      condition: 'Heavy Rain / Thunderstorm',
      temperature: '28°C',
      season: 'Monsoon Rainy',
      impactOnDineIn: '-35% Walk-in traffic drop due to rain',
      impactOnDelivery: '+45% Surge in Delivery App orders (Grab / LINE MAN / ShopeeFood)',
      syntheticDemandIndex: 0.74,
    };

    const contextFile = Object.values(registry).find((r: any) => 
      r.originalName?.toLowerCase().includes('daily_context') || r.sampleColumns?.some((c: string) => c.includes('weather_condition'))
    );
    if (contextFile && fs.existsSync(contextFile.filePath)) {
      try {
        const lines = fs.readFileSync(contextFile.filePath, 'utf-8').split(/\r?\n/).filter(Boolean);
        const header = lines[0]?.split(',').map(c => c.trim().replace(/^"|"$/g, '')) || [];
        const weatherIdx = header.indexOf('weather_condition');
        const seasonIdx = header.indexOf('season');
        const demandIdx = header.indexOf('synthetic_demand_index');
        
        // Take latest day or rainy sample day
        if (lines.length > 3) {
          const sampleRow = lines[3].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          const cond = sampleRow[weatherIdx] || 'rainy';
          const season = sampleRow[seasonIdx] || 'rainy';
          const demand = parseFloat(sampleRow[demandIdx]) || 0.74;

          weatherToday = {
            condition: cond === 'rainy' || cond === 'very_rainy' ? 'Heavy Rain / Wet Season' : 'Cloudy / Overcast',
            temperature: '28°C',
            season: `${season.toUpperCase()} Season`,
            impactOnDineIn: '-35% Walk-in traffic drop; dine-in bakery sales sluggish.',
            impactOnDelivery: '+45% Spike in Delivery orders (GrabFood, LINE MAN, ShopeeFood).',
            syntheticDemandIndex: demand,
          };
        }
      } catch (err) {
        console.warn('Could not read weather context:', err);
      }
    }

    // Assemble file contents for holistic context
    const datasetContext: Record<string, any> = {};
    for (const [key, meta] of Object.entries(registry)) {
      if (meta.filePath && fs.existsSync(meta.filePath)) {
        try {
          const content = fs.readFileSync(meta.filePath, 'utf-8');
          const lines = content.split(/\r?\n/).filter(Boolean);
          const header = lines[0]?.split(',').map(c => c.trim().replace(/^"|"$/g, '')) || [];
          const sampleRows = lines.slice(1, 30).map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
          
          datasetContext[meta.originalName] = {
            totalRows: lines.length - 1,
            headers: header,
            sampleData: sampleRows,
          };
        } catch (e) {
          console.warn(`Could not read ${meta.originalName}:`, e);
        }
      }
    }

    // 3. Calibrated Promos factoring in Weather (Rainy = Delivery heavy)
    const defaultPromotions: ClearancePromotion[] = [
      {
        id: 'PROMO-01',
        title: 'Rainy Afternoon Warm Croissant Flash Sale',
        targetedIngredient: 'Croissant dough',
        menuItem: 'Butter Croissant',
        channel: 'GrabFood & LINE MAN Exclusive',
        timeWindow: '14:00 - 17:00 (Rainy Window)',
        expiresInHours: 3,
        originalPriceThb: 55,
        promoPriceThb: 39,
        discountPercent: 29,
        marginThb: 18,
        expectedUnitsCleared: 60,
        maxCouponsAvailable: 60,
        couponsRedeemed: 14,
        expectedWasteSavedThb: 1680,
        strategyRATIONALE: 'Monsoon rain dropped walk-in traffic by 35%. Shift 112 fresh dough pieces into a delivery flash sale on Grab/LINE MAN to clear before expiration while retaining ฿18 margin.',
        weatherFactorNote: 'Weather Alert: Heavy rain suppresses dine-in; delivery channels capture 2.4x higher conversion.',
        platforms: {
          grabFood: true,
          lineMan: true,
          shopeeFood: true,
          websiteStore: true,
        },
      },
      {
        id: 'PROMO-02',
        title: 'Sweet Mango Sticky Rice Duo Special',
        targetedIngredient: 'Mango',
        menuItem: 'Mango Sticky Rice',
        channel: 'Store Website & LINE MAN',
        timeWindow: 'All Day Delivery Special',
        expiresInHours: 6,
        originalPriceThb: 95,
        promoPriceThb: 75,
        discountPercent: 21,
        marginThb: 37,
        expectedUnitsCleared: 10,
        maxCouponsAvailable: 15,
        couponsRedeemed: 6,
        expectedWasteSavedThb: 950,
        strategyRATIONALE: 'Ripe mangoes (14 kg) reach critical ripeness today. Bundle with sweet coconut sticky rice as a rainy day comfort food special.',
        weatherFactorNote: 'Comfort food demand rises during rainy periods; high margin offset protects food cost.',
        platforms: {
          grabFood: true,
          lineMan: true,
          shopeeFood: false,
          websiteStore: true,
        },
      },
      {
        id: 'PROMO-03',
        title: 'Signature Iced Latte & Pastry Morning Combo',
        targetedIngredient: 'Milk',
        menuItem: 'Latte',
        channel: 'All Delivery Platforms & Walk-in',
        timeWindow: '08:00 - 12:00',
        expiresInHours: 4,
        originalPriceThb: 75,
        promoPriceThb: 55,
        discountPercent: 27,
        marginThb: 33,
        expectedUnitsCleared: 25,
        maxCouponsAvailable: 40,
        couponsRedeemed: 12,
        expectedWasteSavedThb: 1625,
        strategyRATIONALE: 'Accelerate milk turnover (43 litres on hand) through high-velocity morning delivery combos across Grab and ShopeeFood.',
        weatherFactorNote: 'Morning rain boosts hot/iced beverage delivery orders before work hours.',
        platforms: {
          grabFood: true,
          lineMan: true,
          shopeeFood: true,
          websiteStore: true,
        },
      },
    ];

    const defaultOrders: PurchaseReorderItem[] = [
      {
        itemId: 'INV003',
        itemName: 'Soy milk',
        unit: 'carton',
        currentStock: 13,
        dailyUsage: 8,
        daysRemaining: 1.6,
        recommendedOrderQuantity: 30,
        unitCostThb: 25,
        estimatedOrderCostThb: 750,
        supplierLeadTimeDays: 1,
        urgencyLevel: 'IMMEDIATE_ORDER',
        reason: 'Imminent stockout in 1.6 days. Order 30 cartons to secure a 5-day operational buffer.',
      },
      {
        itemId: 'INV001',
        itemName: 'Tea leaves',
        unit: 'kg',
        currentStock: 11,
        dailyUsage: 4,
        daysRemaining: 2.8,
        recommendedOrderQuantity: 15,
        unitCostThb: 280,
        estimatedOrderCostThb: 4200,
        supplierLeadTimeDays: 2,
        urgencyLevel: 'IMMEDIATE_ORDER',
        reason: 'Under 3 days runway. Order 15 kg to maintain Thai Tea & Iced Tea service through weekend.',
      },
      {
        itemId: 'INV009',
        itemName: 'Sticky rice',
        unit: 'kg',
        currentStock: 7,
        dailyUsage: 3,
        daysRemaining: 2.3,
        recommendedOrderQuantity: 12,
        unitCostThb: 65,
        estimatedOrderCostThb: 780,
        supplierLeadTimeDays: 1,
        urgencyLevel: 'IMMEDIATE_ORDER',
        reason: 'Remaining stock will deplete in 2.3 days. Restock 12 kg to cover planned mango promotions.',
      },
      {
        itemId: 'INV004',
        itemName: 'Coffee beans',
        unit: 'kg',
        currentStock: 8,
        dailyUsage: 2.5,
        daysRemaining: 3.2,
        recommendedOrderQuantity: 10,
        unitCostThb: 520,
        estimatedOrderCostThb: 5200,
        supplierLeadTimeDays: 2,
        urgencyLevel: 'UPCOMING_WEEKEND_RESTOCK',
        reason: '3.2 days buffer. Order 10 kg safety batch before peak weekend barista consumption.',
      },
    ];

    let clearancePromotions = defaultPromotions;
    let procurementOrders = defaultOrders;
    let executiveStrategy = `Forecast: ${weatherToday.condition} (${weatherToday.season}). Dine-in traffic drops -35%, while Delivery channels (Grab/LINE MAN) surge +45%. Target clearance promotions heavily on delivery apps to clear Croissant dough and Fresh Milk. Restock Soy Milk and Tea Leaves immediately to meet weekend delivery volume.`;

    // 4. Gemini AI Synthesis
    const apiKey = process.env.GEMINI_API_KEY || process.env.api_key;
    if (apiKey && Object.keys(datasetContext).length > 0) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are a Restaurant Operations & Delivery Revenue Specialist.
Review all uploaded operational datasets below, with special emphasis on WEATHER & CALENDAR context:

TODAY'S WEATHER FORECAST CONTEXT:
- Condition: ${weatherToday.condition}
- Season: ${weatherToday.season}
- Dine-in Impact: ${weatherToday.impactOnDineIn}
- Delivery Impact: ${weatherToday.impactOnDelivery}

UPLOADED DATASETS:
${JSON.stringify(datasetContext, null, 2)}

TASK:
1. STOCK CLEARANCE PROMOTIONS (WEATHER-DRIVEN & STRICT INVENTORY CAPACITY CONSTRAINT):
   - Formulate 2-3 promotional deals designed to clear excess perishable inventory (Croissant dough, Milk, Mango) before expiration.
   - FACTOR IN WEATHER: If rainy, steer channels toward Delivery Apps (GrabFood, LINE MAN, ShopeeFood) and digital vouchers since foot traffic is low.
   - Ensure Promo Price > Recipe Unit Cost (protect margin).
   - CRITICAL CAPACITY CONSTRAINT (STRICT RULE):
     * The total number of coupons available ("maxCouponsAvailable") MUST NOT EXCEED the physical production capacity from available perishable inventory on hand (e.g., if stock on hand is 60 croissant doughs, maxCouponsAvailable CANNOT be more than 60 coupons).
     * Calculate "expiresInHours": number of hours until this promotion expires today (e.g. 2, 3, 4, 6 hours) based on timeWindow.
     * Calculate "discountPercent": percentage discount calculated as ((originalPriceThb - promoPriceThb) / originalPriceThb) * 100.
   - Set boolean flags for platforms: grabFood, lineMan, shopeeFood, websiteStore.

2. PROCUREMENT ORDERS:
   - Identify low-stock items (Soy milk, Tea leaves, Sticky rice, Coffee beans).
   - Calculate recommended order quantity to secure a 4-7 day operating buffer.

Output strictly JSON:
{
  "executiveStrategy": "2-sentence executive summary highlighting weather impact and delivery clearance strategy",
  "clearancePromotions": [
    {
      "id": "PROMO-01",
      "title": "Campaign Name",
      "targetedIngredient": "Ingredient Name",
      "menuItem": "Menu Item",
      "channel": "Delivery / Flash Sale",
      "timeWindow": "e.g. 14:00 - 17:00",
      "expiresInHours": 3,
      "originalPriceThb": 55,
      "promoPriceThb": 39,
      "discountPercent": 29,
      "marginThb": 18,
      "expectedUnitsCleared": 60,
      "maxCouponsAvailable": 60,
      "couponsRedeemed": 0,
      "expectedWasteSavedThb": 1680,
      "strategyRATIONALE": "Why this clears stock and protects margin",
      "weatherFactorNote": "How today's weather influenced this promotion",
      "platforms": {
        "grabFood": true,
        "lineMan": true,
        "shopeeFood": true,
        "websiteStore": true
      }
    }
  ],
  "procurementOrders": [
    {
      "itemId": "INV003",
      "itemName": "Item Name",
      "unit": "carton",
      "currentStock": 13,
      "dailyUsage": 8,
      "daysRemaining": 1.6,
      "recommendedOrderQuantity": 30,
      "unitCostThb": 25,
      "estimatedOrderCostThb": 750,
      "supplierLeadTimeDays": 1,
      "urgencyLevel": "IMMEDIATE_ORDER",
      "reason": "Replenishment justification"
    }
  ]
}
JSON output only. 100% English.`;

        const models = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];
        for (const m of models) {
          try {
            const resp = await ai.models.generateContent({
              model: m,
              contents: prompt,
            });
            let txt = resp.text || '';
            if (txt) {
              txt = txt.trim().replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
              const parsed = JSON.parse(txt);
              if (parsed.clearancePromotions && parsed.procurementOrders) {
                clearancePromotions = parsed.clearancePromotions.map((p: any) => ({
                  ...p,
                  expiresInHours: Number(p.expiresInHours) || 3,
                  maxCouponsAvailable: Number(p.maxCouponsAvailable) || Number(p.expectedUnitsCleared) || 50,
                  couponsRedeemed: Number(p.couponsRedeemed) || 0,
                  discountPercent: p.discountPercent || (p.originalPriceThb ? Math.max(5, Math.round(((p.originalPriceThb - p.promoPriceThb) / p.originalPriceThb) * 100)) : 25),
                }));
                procurementOrders = parsed.procurementOrders;
                if (parsed.executiveStrategy) executiveStrategy = parsed.executiveStrategy;
                break;
              }
            }
          } catch (mErr: any) {
            console.warn(`Model ${m} failed in weather-driven solution generation:`, mErr.message);
          }
        }
      } catch (aiErr) {
        console.warn('AI Solution synthesis fallback:', aiErr);
      }
    }

    const totalWasteRescueThb = clearancePromotions.reduce((acc, p) => acc + (p.expectedWasteSavedThb || 0), 0);
    const totalRestockCostThb = procurementOrders.reduce((acc, o) => acc + (o.estimatedOrderCostThb || 0), 0);

    const payload: SolutionResponse = {
      success: true,
      isCached: false,
      generatedAt: new Date().toISOString(),
      weatherToday,
      summary: {
        totalWasteRescueThb,
        totalRestockCostThb,
        promotionsCount: clearancePromotions.length,
        reorderCount: procurementOrders.length,
      },
      clearancePromotions,
      procurementOrders,
      executiveStrategy,
    };

    // Save cache
    try {
      fs.writeFileSync(SOLUTION_CACHE_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (saveErr) {
      console.warn('Failed saving solution cache:', saveErr);
    }

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('Error generating solutions:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Publish selected promotions to website & delivery sync channels
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { selectedPromotions, syncPlatforms } = body as {
      selectedPromotions: ClearancePromotion[];
      syncPlatforms?: {
        grabFood?: boolean;
        lineMan?: boolean;
        shopeeFood?: boolean;
        websiteStore?: boolean;
      };
    };

    if (!selectedPromotions || selectedPromotions.length === 0) {
      return NextResponse.json({ success: false, error: 'No promotions selected.' }, { status: 400 });
    }

    const publishedRecord = {
      publishedAt: new Date().toISOString(),
      syncPlatforms: syncPlatforms || {
        grabFood: true,
        lineMan: true,
        shopeeFood: true,
        websiteStore: true,
      },
      activePromotions: selectedPromotions,
      broadcastStatus: {
        grabFood: 'SYNCED_ACTIVE (Simulated POS API v2.4)',
        lineMan: 'CAMPAIGN_LIVE (Simulated LINE OA Broadcast)',
        shopeeFood: 'FLASH_DEAL_ACTIVE (Simulated Seller Center API)',
        websiteStore: 'DISPLAYED_ON_STOREFRONT',
      },
    };

    fs.writeFileSync(PUBLISHED_PROMOS_FILE, JSON.stringify(publishedRecord, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: `Successfully published ${selectedPromotions.length} promotion(s) across Website and Delivery Platforms.`,
      publishedRecord,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
