export interface Kpis {
  totalRevenue: number;
  totalTxnCount: number;
  refundedCount: number;
  completedBookingsCount: number;
  cancelledBookings: number;
  noShowBookings: number;
  totalBookingRevenue: number;
  totalWasteQty: number;
  avgCustomerRating: number;
  totalDataQualityIssues: number;
}

export interface SegmentRevenue {
  name: string;
  value: number;
}

export interface IssueTypeCount {
  type: string;
  count: number;
}

export interface TrendDataPoint {
  month: string;
  sales: number;
  bookings: number;
  waste: number;
}

export interface IssueRecordItem {
  file_name: string;
  record_id: string;
  field_name: string;
  issue_type: string;
  observed_value: string;
  reference_or_expected_value: string;
  student_action_hint: string;
}

export interface DatasetFileInfo {
  fileName: string;
  sizeKb: number;
  rowCount: number;
  category: string;
}

export interface InventoryItemStatus {
  itemId: string;
  itemName: string;
  category: string;
  unit: string;
  unitCost: number;
  currentStock: number;
  avgDailyUsage: number;
  totalWaste: number;
  daysOfCover: number;
  perishable: boolean;
  status: 'OVERSTOCK_SPOILAGE_RISK' | 'REORDER_NEEDED' | 'OPTIMAL';
  wasteRiskValueThb: number;
  recommendedOrderQty: number;
  actionNote: string;
}

export interface PromotionSuggestion {
  id: string;
  title: string;
  targetSegment: 'Cafe' | 'Hotel' | 'Tours' | 'Cross-Bundle';
  ingredientTargeted: string;
  originalPriceThb: number;
  promoPriceThb: number;
  discountPercent: number;
  unitCostThb: number;
  marginThb: number;
  description: string;
  channel: string;
  urgency: 'HIGH' | 'MEDIUM';
}

export interface SalesForecastPoint {
  period: string;
  actual?: number;
  forecast?: number;
  upperBound?: number;
  lowerBound?: number;
}

export interface DataQualityIssueAction {
  fileName: string;
  recordId: string;
  field: string;
  issueType: string;
  currentValue: string;
  correctValue: string;
  instructionToFix: string;
}

export interface AiCalculatedAudit {
  isDataValid: boolean;
  totalIssuesCount: number;
  dataQualityStatus: 'CORRECTIONS_REQUIRED' | 'CLEAN_AND_READY';
  blockingIssues: DataQualityIssueAction[];
  aiAnalysisSummary: string;
  criticalOverstockedItems: {
    name: string;
    stock: number;
    daysCover: number;
    riskThb: number;
    recommendation: string;
  }[];
  criticalLowStockItems: {
    name: string;
    stock: number;
    daysCover: number;
    orderUnits: number;
    recommendation: string;
  }[];
  salesForecast: {
    period: string;
    projectedRevenueThb: number;
    expectedGrowthPercent: number;
    forecastNote: string;
  }[];
  strategicAdvice: string[];
}

export interface MetricsSummary {
  kpis: Kpis;
  segmentRevenue: SegmentRevenue[];
  issuesByType: IssueTypeCount[];
  trendData: TrendDataPoint[];
  recentIssues: IssueRecordItem[];
  datasetFiles?: DatasetFileInfo[];
  inventoryStatus?: InventoryItemStatus[];
  promotionSuggestions?: PromotionSuggestion[];
  salesForecast?: SalesForecastPoint[];
  forecastSummary?: {
    predictedNextMonthRevenue: number;
    projectedGrowthPercent: number;
    dailyRunRateThb: number;
    confidenceLevel: string;
  };
  aiAudit?: AiCalculatedAudit;
}

export interface ModelOption {
  id: string;
  name: string;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Fast & Recommended)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Deep Reasoning)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (High Capability)' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Lightweight)' },
];
