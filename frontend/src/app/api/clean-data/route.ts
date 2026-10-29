import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.resolve(process.cwd(), 'data/uploads');
const REGISTRY_FILE = path.resolve(UPLOADS_DIR, 'file_registry.json');

export interface ProposedFix {
  id: string;
  category: string;
  fileName: string;
  recordId: string;
  field: string;
  issueType: string;
  currentValue: string;
  suggestedValue: string;
  explanation: string;
}

// AI-powered flexible quality anomaly detector for any store format
export async function detectQualityIssuesWithAi(registry: Record<string, any>): Promise<ProposedFix[]> {
  const fixes: ProposedFix[] = [];
  const apiKey = process.env.GEMINI_API_KEY || process.env.api_key;

  const registryItems = Object.values(registry);
  const invFile = registryItems.find((r: any) => 
    r.originalName?.toLowerCase().includes('inventory') && r.sampleColumns?.some((c: string) => c.includes('stock'))
  ) || registry.inventory;

  const salesFile = registryItems.find((r: any) => 
    r.originalName?.toLowerCase().includes('sales') || r.sampleColumns?.some((c: string) => c.includes('transaction'))
  ) || registry.sales;

  const menuFile = registryItems.find((r: any) => 
    r.originalName?.toLowerCase().includes('product') || r.originalName?.toLowerCase().includes('menu') || r.sampleColumns?.some((c: string) => c.includes('canonical_name'))
  ) || registry.menu;

  // 1. Math Reconciliation for inventory (Deterministic ground truth calculation)
  if (invFile && fs.existsSync(invFile.filePath)) {
    try {
      const content = fs.readFileSync(invFile.filePath, 'utf-8');
      const lines = content.split(/\r?\n/);
      const header = lines[0]?.split(',').map(c => c.trim().replace(/^"|"$/g, '')) || [];
      const idIdx = header.indexOf('inventory_record_id');
      const openIdx = header.indexOf('opening_stock');
      const recvIdx = header.indexOf('stock_received');
      const usedIdx = header.indexOf('stock_used');
      const wasteIdx = header.indexOf('waste_quantity');
      const closeIdx = header.indexOf('closing_stock');

      if (idIdx !== -1 && openIdx !== -1 && recvIdx !== -1 && usedIdx !== -1 && wasteIdx !== -1 && closeIdx !== -1) {
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const row = lines[i].split(',');
          const rowId = row[idIdx]?.trim();
          const open = parseFloat(row[openIdx]) || 0;
          const recv = parseFloat(row[recvIdx]) || 0;
          const used = parseFloat(row[usedIdx]) || 0;
          const waste = parseFloat(row[wasteIdx]) || 0;
          const currentClose = parseFloat(row[closeIdx]) || 0;

          const expectedClose = open + recv - used - waste;
          if (Math.abs(currentClose - expectedClose) > 0.01) {
            fixes.push({
              id: `fix_inv_${rowId}`,
              category: 'inventory',
              fileName: invFile.originalName,
              recordId: rowId,
              field: 'closing_stock',
              issueType: 'STOCK_RECONCILIATION_ERROR',
              currentValue: String(currentClose),
              suggestedValue: String(expectedClose),
              explanation: `Reconciled balance formula: ${open} (open) + ${recv} (recv) - ${used} (used) - ${waste} (waste) = ${expectedClose}`,
            });
          }
        }
      }
    } catch (e) {
      console.warn('Inventory reconciliation check error:', e);
    }
  }

    // 2. Missing Customer ID Imputation (Deterministic Data Governance Check)
    if (salesFile && fs.existsSync(salesFile.filePath)) {
      try {
        const content = fs.readFileSync(salesFile.filePath, 'utf-8');
        const lines = content.split(/\r?\n/);
        const header = lines[0]?.split(',').map(c => c.trim().replace(/^"|"$/g, '')) || [];
        const custIdx = header.indexOf('customer_id');
        const idIdx = header.indexOf('transaction_line_id');

        if (custIdx !== -1 && idIdx !== -1) {
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const row = lines[i].split(',');
            const rowId = row[idIdx]?.trim();
            const custVal = row[custIdx]?.trim();

            if (!custVal) {
              fixes.push({
                id: `fix_cust_${rowId}`,
                category: 'sales',
                fileName: salesFile.originalName,
                recordId: rowId,
                field: 'customer_id',
                issueType: 'MISSING_CUSTOMER_ID',
                currentValue: '<EMPTY>',
                suggestedValue: 'GUEST-ANONYMOUS',
                explanation: 'Assign standardized anonymous guest identifier to maintain audit and segmentation integrity.',
              });
            }
          }
        }
      } catch (e) {
        console.warn('Customer ID validation error:', e);
      }
    }

  // 3. AI Semantic Inspection for Sales / Menu matching (Supports ANY dynamic store catalog)
  if (apiKey && salesFile && menuFile && fs.existsSync(salesFile.filePath) && fs.existsSync(menuFile.filePath)) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      // Extract canonical menu item names from menu file
      const menuContent = fs.readFileSync(menuFile.filePath, 'utf-8');
      const menuLines = menuContent.split(/\r?\n/).slice(1, 50).filter(Boolean);
      const menuHeader = menuContent.split(/\r?\n/)[0]?.split(',').map(c => c.trim().replace(/^"|"$/g, '')) || [];
      const menuNameIdx = menuHeader.indexOf('canonical_name') !== -1 ? menuHeader.indexOf('canonical_name') : menuHeader.indexOf('product_service_name_raw');

      const canonicalList = menuLines.map(line => {
        const parts = line.split(',');
        return parts[menuNameIdx !== -1 ? menuNameIdx : 1]?.trim().replace(/^"|"$/g, '');
      }).filter(Boolean);

      // Extract sales sample items
      const salesContent = fs.readFileSync(salesFile.filePath, 'utf-8');
      const salesLines = salesContent.split(/\r?\n/);
      const salesHeader = salesLines[0]?.split(',').map(c => c.trim().replace(/^"|"$/g, '')) || [];
      const salesNameIdx = salesHeader.indexOf('product_service_name_raw');
      const salesIdIdx = salesHeader.indexOf('transaction_line_id');

      if (salesNameIdx !== -1 && salesIdIdx !== -1 && canonicalList.length > 0) {
        // Collect unique raw names in sales
        const rawNameToIds: Record<string, string[]> = {};
        for (let i = 1; i < salesLines.length; i++) {
          if (!salesLines[i].trim()) continue;
          const row = salesLines[i].split(',');
          const id = row[salesIdIdx]?.trim();
          const name = row[salesNameIdx]?.trim().replace(/^"|"$/g, '');
          if (name && id) {
            if (!rawNameToIds[name]) rawNameToIds[name] = [];
            rawNameToIds[name].push(id);
          }
        }

        const uniqueRawNames = Object.keys(rawNameToIds);

        // Prompt Gemini to dynamically resolve anomalies, aliases, typos for ANY restaurant
        const aiPrompt = `You are an AI Data Quality & Entity Resolution Specialist for restaurants.
Compare the Observed Raw Sales Names against the Official Store Menu Catalog below:

OFFICIAL STORE MENU CATALOG:
${JSON.stringify(canonicalList, null, 2)}

OBSERVED RAW PRODUCT NAMES FROM SALES:
${JSON.stringify(uniqueRawNames, null, 2)}

TASK:
Identify any raw sales names that are spelling mistakes, aliases, casing differences, or slight variations of an official menu item.
Do NOT flag names that are already an exact match.
Output ONLY valid JSON array with objects matching:
[
  {
    "rawName": "exact raw name",
    "canonicalName": "exact official menu item from catalog",
    "explanation": "concise explanation of the alias/typo resolution"
  }
]
Output pure JSON array only.`;

        const models = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];
        let aiResultText = '';
        for (const m of models) {
          try {
            const resp = await ai.models.generateContent({
              model: m,
              contents: aiPrompt,
            });
            aiResultText = resp.text || '';
            if (aiResultText) break;
          } catch (err: any) {
            console.warn(`Model ${m} failed in clean-data:`, err.message);
          }
        }

        if (aiResultText) {
          let cleaned = aiResultText.trim();
          if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
          if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();

          const resolutions: Array<{ rawName: string; canonicalName: string; explanation: string }> = JSON.parse(cleaned);

          for (const res of resolutions) {
            const rowIds = rawNameToIds[res.rawName] || [];
            // Create a fix suggestion for affected rows
            for (const rowId of rowIds) {
              fixes.push({
                id: `fix_sales_${rowId}`,
                category: 'sales',
                fileName: salesFile.originalName,
                recordId: rowId,
                field: 'product_service_name_raw',
                issueType: 'AI_DETECTED_ALIAS',
                currentValue: res.rawName,
                suggestedValue: res.canonicalName,
                explanation: res.explanation || `AI resolved product alias '${res.rawName}' to canonical '${res.canonicalName}'`,
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('AI dynamic alias detection error:', e);
    }
  }

  return fixes;
}

// GET: Preview detected issues dynamically using AI + math validation
export async function GET() {
  try {
    let registry: Record<string, any> = {};
    if (fs.existsSync(REGISTRY_FILE)) {
      try {
        const raw = fs.readFileSync(REGISTRY_FILE, 'utf-8');
        if (raw.trim()) registry = JSON.parse(raw);
      } catch {
        registry = {};
      }
    }

    const fixes = await detectQualityIssuesWithAi(registry);
    return NextResponse.json({
      success: true,
      totalIssues: fixes.length,
      fixes,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Execute and persist confirmed fixes into the CSV files on disk
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { acceptedFixIds } = body as { acceptedFixIds?: string[] };

    let registry: Record<string, any> = {};
    if (fs.existsSync(REGISTRY_FILE)) {
      try {
        const raw = fs.readFileSync(REGISTRY_FILE, 'utf-8');
        if (raw.trim()) registry = JSON.parse(raw);
      } catch {
        registry = {};
      }
    }

    const availableFixes = await detectQualityIssuesWithAi(registry);
    const fixesToApply = acceptedFixIds && acceptedFixIds.length > 0 
      ? availableFixes.filter(f => acceptedFixIds.includes(f.id))
      : availableFixes;

    if (fixesToApply.length === 0) {
      return NextResponse.json({ success: true, message: 'No fixes to apply.', appliedCount: 0 });
    }

    let appliedCount = 0;

    const registryItems = Object.values(registry);
    const invFile = registryItems.find((r: any) => 
      r.originalName?.toLowerCase().includes('inventory') && r.sampleColumns?.some((c: string) => c.includes('stock'))
    ) || registry.inventory;

    const salesFile = registryItems.find((r: any) => 
      r.originalName?.toLowerCase().includes('sales') || r.sampleColumns?.some((c: string) => c.includes('transaction'))
    ) || registry.sales;

    // Apply Sales Fixes
    const salesFixes = fixesToApply.filter(f => f.category === 'sales');
    if (salesFixes.length > 0 && salesFile && fs.existsSync(salesFile.filePath)) {
      const fixMap = new Map(salesFixes.map(f => [f.recordId, f]));
      const content = fs.readFileSync(salesFile.filePath, 'utf-8');
      const lines = content.split(/\r?\n/);
      const header = lines[0]?.split(',').map(c => c.trim().replace(/^"|"$/g, '')) || [];
      const nameIdx = header.indexOf('product_service_name_raw');
      const custIdx = header.indexOf('customer_id');
      const idIdx = header.indexOf('transaction_line_id');

      if (idIdx !== -1) {
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const row = lines[i].split(',');
          const rowId = row[idIdx]?.trim();
          if (fixMap.has(rowId)) {
            const fix = fixMap.get(rowId)!;
            if (fix.field === 'product_service_name_raw' && nameIdx !== -1) {
              row[nameIdx] = fix.suggestedValue;
              lines[i] = row.join(',');
              appliedCount++;
            } else if (fix.field === 'customer_id' && custIdx !== -1) {
              row[custIdx] = fix.suggestedValue;
              lines[i] = row.join(',');
              appliedCount++;
            }
          }
        }
        fs.writeFileSync(salesFile.filePath, lines.join('\n'), 'utf-8');
      }
    }

    // Apply Inventory Fixes
    const invFixes = fixesToApply.filter(f => f.category === 'inventory');
    if (invFixes.length > 0 && invFile && fs.existsSync(invFile.filePath)) {
      const fixMap = new Map(invFixes.map(f => [f.recordId, f.suggestedValue]));
      const content = fs.readFileSync(invFile.filePath, 'utf-8');
      const lines = content.split(/\r?\n/);
      const header = lines[0]?.split(',').map(c => c.trim().replace(/^"|"$/g, '')) || [];
      const closeIdx = header.indexOf('closing_stock');
      const idIdx = header.indexOf('inventory_record_id');

      if (closeIdx !== -1 && idIdx !== -1) {
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const row = lines[i].split(',');
          const rowId = row[idIdx]?.trim();
          if (fixMap.has(rowId)) {
            row[closeIdx] = fixMap.get(rowId)!;
            lines[i] = row.join(',');
            appliedCount++;
          }
        }
        fs.writeFileSync(invFile.filePath, lines.join('\n'), 'utf-8');
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned and reconciled ${appliedCount} data record(s).`,
      appliedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
