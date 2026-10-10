export type FiscalMonth =
  | 'July'
  | 'August'
  | 'September'
  | 'October'
  | 'November'
  | 'December'
  | 'January'
  | 'February'
  | 'March'
  | 'April'
  | 'May'
  | 'June';

export const FISCAL_MONTHS: FiscalMonth[] = [
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
];

export interface SubHeadItem {
  code: string;
  name: string;
  sanctioned: number;
  currentDept?: number;
  currentAg?: number;
}

export type RowCategory =
  | 'PAY'
  | 'ALLOWANCE'
  | 'TOTAL_A01'
  | 'OPERATING'
  | 'TOTAL_OPERATING'
  | 'PHYSICAL_ASSETS'
  | 'TOTAL_PHYSICAL_ASSETS'
  | 'REPAIR_MAINTENANCE'
  | 'TOTAL_REPAIR_MAINTENANCE'
  | 'GRAND_TOTAL';

export interface ScheduleRowDefinition {
  rowNumber: number; // 1 to 27
  objectCode: string; // e.g. A01101, A01150, A038, etc.
  description: string;
  category: RowCategory;
  sanctionedBudget: number;
  isSubtotal: boolean;
  subtotalSourceRows?: number[]; // rows summed to produce this
  subHeads?: SubHeadItem[];
  notes?: string;
}

export interface RowMonthlyExpenditure {
  rowNumber: number;
  currentMonthDept: number; // Expenditure during current month (Departmental)
  currentMonthAg: number;   // Expenditure during current month (AG KP / PIFRA)
  previousBfDept: number;   // Brought forward departmental progressive
  previousBfAg: number;     // Brought forward AG progressive
  progressiveDept: number;  // previousBfDept + currentMonthDept
  progressiveAg: number;    // previousBfAg + currentMonthAg (or direct AG Progressive)
  variation: number;        // progressiveDept - progressiveAg
  variationReason?: string; // e.g. "Cheque issued but uncashed", "Book adjustment"
  chequeOrTokenRef?: string;
}

export interface MonthData {
  month: FiscalMonth;
  rows: Record<number, RowMonthlyExpenditure>;
  isFinalized?: boolean;
  notes?: string;
}

export interface SubtotalAuditStatus {
  rowNumber: number;
  name: string;
  targetBudget: number;
  calculatedDeptCurrent: number;
  calculatedDeptProgressive: number;
  calculatedAgProgressive: number;
  calculatedVariation: number;
  isValid: boolean;
  expectedSumRows: number[];
}

export interface ParsedHeadMatch {
  rowNumber: number;
  objectCode: string;
  description: string;
  detectedAmount: number;
  rawTextSnippet: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ParseResult {
  success: boolean;
  matchedCount: number;
  totalParsedAmount: number;
  matches: ParsedHeadMatch[];
  unmatchedLines: string[];
  suggestedMonth?: FiscalMonth;
}
