import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const DATA_DIR = path.resolve(process.cwd(), '../data');

export interface AuditIssueResult {
  id: string;
  category: 'STOCK_RECONCILIATION' | 'PRODUCT_NAMING' | 'MISSING_DATA' | 'NEGATIVE_VALUE';
  severity: 'CRITICAL' | 'WARNING';
  fileName: string;
  recordId: string;
  fieldName: string;
  observedValue: string;
  expectedValue: string;
  impact: string;
  recommendation: string;
}

export interface DirectAuditReport {
  timestamp: string;
  totalRecordsChecked: {
    inventoryRows: number;
    salesRows: number;
    catalogProducts: number;
    itemDictRecords: number;
  };
  totalIssuesCount: number;
  criticalIssuesCount: number;
  warningIssuesCount: number;
  issuesByCategory: {
    stockDiscrepancies: number;
    namingInconsistencies: number;
    missingValues: number;
  };
  issues: AuditIssueResult[];
  datasetStatus: 'FAILED' | 'PASSED';
}

/**
 * Directly scans the actual CSV files (inventory_daily.csv, sales_transactions.csv, products_services.csv, inventory_item_dictionary.csv)
 * to verify equations, cross-table foreign key mappings, and missing fields.
 */
export function runAutomatedDataQualityAudit(): DirectAuditReport {
  const issues: AuditIssueResult[] = [];

  // 1. Read Product Master Catalog
  const productsPath = path.join(DATA_DIR, 'products_services.csv');
  const productsRaw = parse(fs.readFileSync(productsPath, 'utf8'), { columns: true, skip_empty_lines: true });
  const canonicalProductMap = new Map<string, string>(); // ID -> Canonical Name
  productsRaw.forEach((p: any) => {
    if (p.product_service_id) {
      canonicalProductMap.set(p.product_service_id.trim(), p.canonical_name?.trim() || '');
    }
  });

  // 2. Read Inventory Dictionary
  const dictPath = path.join(DATA_DIR, 'inventory_item_dictionary.csv');
  const dictRaw = parse(fs.readFileSync(dictPath, 'utf8'), { columns: true, skip_empty_lines: true });
  const dictMap = new Map<string, any>();
  dictRaw.forEach((d: any) => {
    if (d.inventory_item_id) {
      dictMap.set(d.inventory_item_id.trim(), d);
    }
  });

  // 3. Scan Inventory Daily for Stock Reconciliation Discrepancies & Missing Values
  const inventoryPath = path.join(DATA_DIR, 'inventory_daily.csv');
  const inventoryRaw = parse(fs.readFileSync(inventoryPath, 'utf8'), { columns: true, skip_empty_lines: true });

  inventoryRaw.forEach((row: any, idx: number) => {
    const recordId = row.inventory_record_id || `INV_ROW_${idx + 1}`;
    const date = row.date || 'Unknown Date';
    const itemName = row.inventory_item_name || 'Unknown Item';

    // Check missing values
    if (!row.stock_received || row.stock_received.trim() === '') {
      issues.push({
        id: `ISSUE_INV_RECV_${recordId}`,
        category: 'MISSING_DATA',
        severity: 'WARNING',
        fileName: 'inventory_daily.csv',
        recordId,
        fieldName: 'stock_received',
        observedValue: 'EMPTY',
        expectedValue: '0 or verified inbound qty',
        impact: `Cannot accurately trace inbound delivery for ${itemName} on ${date}.`,
        recommendation: 'Impute 0 if no delivery arrived, or verify supplier delivery invoice.'
      });
    }

    if (!row.waste_quantity || row.waste_quantity.trim() === '') {
      issues.push({
        id: `ISSUE_INV_WASTE_${recordId}`,
        category: 'MISSING_DATA',
        severity: 'WARNING',
        fileName: 'inventory_daily.csv',
        recordId,
        fieldName: 'waste_quantity',
        observedValue: 'EMPTY',
        expectedValue: '0',
        impact: `Waste tracking record missing for ${itemName} on ${date}.`,
        recommendation: 'Default to 0 if no spoilage was recorded for this shift.'
      });
    }

    // Check Stock Reconciliation Equation: Opening + Received - Used - Waste = Closing
    const opening = parseFloat(row.opening_stock) || 0;
    const received = parseFloat(row.stock_received) || 0;
    const used = parseFloat(row.stock_used) || 0;
    const waste = parseFloat(row.waste_quantity) || 0;
    const recordedClosing = parseFloat(row.closing_stock) || 0;

    const calculatedClosing = Math.round((opening + received - used - waste) * 100) / 100;
    const diff = Math.round(Math.abs(recordedClosing - calculatedClosing) * 100) / 100;

    if (diff > 0.05) {
      issues.push({
        id: `ISSUE_INV_BAL_${recordId}`,
        category: 'STOCK_RECONCILIATION',
        severity: 'CRITICAL',
        fileName: 'inventory_daily.csv',
        recordId,
        fieldName: 'closing_stock',
        observedValue: `${recordedClosing}`,
        expectedValue: `${calculatedClosing} (Open ${opening} + Recv ${received} - Used ${used} - Waste ${waste})`,
        impact: `Physical stock balance mismatch of ${recordedClosing > calculatedClosing ? '+' : ''}${Math.round((recordedClosing - calculatedClosing)*10)/10} units for ${itemName}. Creates false stockout or phantom spoilage.`,
        recommendation: 'Reconcile using physical shift count logs. If physical count was verified, record variance as unaccounted loss/shrinkage.'
      });
    }
  });

  // 4. Scan Sales Transactions for Inconsistent Aliases & Missing Customer ID
  const salesPath = path.join(DATA_DIR, 'sales_transactions.csv');
  const salesRaw = parse(fs.readFileSync(salesPath, 'utf8'), { columns: true, skip_empty_lines: true });

  salesRaw.forEach((row: any, idx: number) => {
    const recordId = row.transaction_line_id || `TXN_${idx + 1}`;
    const pId = row.product_service_id?.trim();
    const rawName = row.product_service_name_raw?.trim() || '';

    // Check Inconsistent naming
    if (pId && canonicalProductMap.has(pId)) {
      const canonical = canonicalProductMap.get(pId)!;
      if (rawName && rawName.toLowerCase() !== canonical.toLowerCase()) {
        issues.push({
          id: `ISSUE_SALES_NAME_${recordId}`,
          category: 'PRODUCT_NAMING',
          severity: 'CRITICAL',
          fileName: 'sales_transactions.csv',
          recordId,
          fieldName: 'product_service_name_raw',
          observedValue: rawName,
          expectedValue: canonical,
          impact: `Sales fragmentation: "${rawName}" will be treated as an unknown item instead of "${canonical}", causing distorted demand forecasts.`,
          recommendation: `Normalize "${rawName}" to canonical name "${canonical}" via lookup on product_service_id="${pId}".`
        });
      }
    }

    // Check missing customer_id
    if (!row.customer_id || row.customer_id.trim() === '') {
      issues.push({
        id: `ISSUE_SALES_CUST_${recordId}`,
        category: 'MISSING_DATA',
        severity: 'WARNING',
        fileName: 'sales_transactions.csv',
        recordId,
        fieldName: 'customer_id',
        observedValue: 'EMPTY',
        expectedValue: 'GUEST_ANONYMOUS',
        impact: 'Anonymous guest purchase without registered loyalty ID.',
        recommendation: 'Tag record as GUEST_ANONYMOUS. Do not drop the row as it contains valid financial sales revenue.'
      });
    }
  });

  const criticalIssues = issues.filter(i => i.severity === 'CRITICAL');
  const warningIssues = issues.filter(i => i.severity === 'WARNING');

  return {
    timestamp: new Date().toISOString(),
    totalRecordsChecked: {
      inventoryRows: inventoryRaw.length,
      salesRows: salesRaw.length,
      catalogProducts: productsRaw.length,
      itemDictRecords: dictRaw.length,
    },
    totalIssuesCount: issues.length,
    criticalIssuesCount: criticalIssues.length,
    warningIssuesCount: warningIssues.length,
    issuesByCategory: {
      stockDiscrepancies: issues.filter(i => i.category === 'STOCK_RECONCILIATION').length,
      namingInconsistencies: issues.filter(i => i.category === 'PRODUCT_NAMING').length,
      missingValues: issues.filter(i => i.category === 'MISSING_DATA').length,
    },
    issues,
    datasetStatus: criticalIssues.length > 0 ? 'FAILED' : 'PASSED',
  };
}
