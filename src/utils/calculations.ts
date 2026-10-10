import {
  FiscalMonth,
  FISCAL_MONTHS,
  MonthData,
  RowMonthlyExpenditure,
  SubtotalAuditStatus,
} from '../types/reconciliation';
import {
  MASTER_SCHEDULE_ROWS,
  createDefaultRowRecord,
  INITIAL_SAMPLE_MONTHS,
} from '../data/budgetConfig';

// Pakistani Rupee standard formatting
export function formatPKR(num: number | undefined | null, includePrefix = false): string {
  if (num === undefined || num === null || isNaN(num)) return includePrefix ? 'Rs. 0/-' : '0';
  const isNegative = num < 0;
  const absVal = Math.round(Math.abs(num));
  const formatted = absVal.toLocaleString('en-PK');
  const sign = isNegative ? '-' : '';
  return includePrefix ? `Rs. ${sign}${formatted}/-` : `${sign}${formatted}`;
}

// Compute all 12 months progression chain starting from July (B/F = 0)
export function recomputeYearProgressive(
  allMonths: Record<FiscalMonth, Record<number, RowMonthlyExpenditure>>
): Record<FiscalMonth, Record<number, RowMonthlyExpenditure>> {
  const updated: Record<FiscalMonth, Record<number, RowMonthlyExpenditure>> = {} as any;

  for (let m = 0; m < FISCAL_MONTHS.length; m++) {
    const month = FISCAL_MONTHS[m];
    const prevMonth = m > 0 ? FISCAL_MONTHS[m - 1] : null;
    const currentMonthRows = allMonths[month] || {};

    const recomputedMonthRows: Record<number, RowMonthlyExpenditure> = {};

    // First pass: compute non-subtotal base rows
    MASTER_SCHEDULE_ROWS.forEach((def) => {
      if (!def.isSubtotal) {
        const row = currentMonthRows[def.rowNumber] || createDefaultRowRecord(def.rowNumber);

        const prevDeptProg = prevMonth && updated[prevMonth]?.[def.rowNumber]
          ? updated[prevMonth][def.rowNumber].progressiveDept
          : 0;

        const prevAgProg = prevMonth && updated[prevMonth]?.[def.rowNumber]
          ? updated[prevMonth][def.rowNumber].progressiveAg
          : 0;

        const progressiveDept = prevDeptProg + (row.currentMonthDept || 0);
        const progressiveAg = prevAgProg + (row.currentMonthAg || 0);
        const variation = progressiveDept - progressiveAg;

        recomputedMonthRows[def.rowNumber] = {
          ...row,
          previousBfDept: prevDeptProg,
          previousBfAg: prevAgProg,
          progressiveDept,
          progressiveAg,
          variation,
        };
      }
    });

    // Second pass: compute subtotal rows in hierarchical order
    // Order: Row 4 (Pay), Row 8 (Allowances), Row 9 (Total A01), Row 17 (Operating), Row 21 (Assets), Row 26 (M&R), Row 27 (Grand)
    const subtotalOrder = [4, 8, 9, 17, 21, 26, 27];

    subtotalOrder.forEach((rowNum) => {
      const def = MASTER_SCHEDULE_ROWS.find((r) => r.rowNumber === rowNum);
      if (!def || !def.subtotalSourceRows) return;

      let currentDeptSum = 0;
      let currentAgSum = 0;
      let prevBfDeptSum = 0;
      let prevBfAgSum = 0;

      def.subtotalSourceRows.forEach((sourceRowNum) => {
        const sourceRow = recomputedMonthRows[sourceRowNum];
        if (sourceRow) {
          currentDeptSum += sourceRow.currentMonthDept || 0;
          currentAgSum += sourceRow.currentMonthAg || 0;
          prevBfDeptSum += sourceRow.previousBfDept || 0;
          prevBfAgSum += sourceRow.previousBfAg || 0;
        }
      });

      const progressiveDept = prevBfDeptSum + currentDeptSum;
      const progressiveAg = prevBfAgSum + currentAgSum;
      const variation = progressiveDept - progressiveAg;

      const existingRecord = currentMonthRows[rowNum] || createDefaultRowRecord(rowNum);

      recomputedMonthRows[rowNum] = {
        ...existingRecord,
        rowNumber: rowNum,
        currentMonthDept: currentDeptSum,
        currentMonthAg: currentAgSum,
        previousBfDept: prevBfDeptSum,
        previousBfAg: prevBfAgSum,
        progressiveDept,
        progressiveAg,
        variation,
      };
    });

    updated[month] = recomputedMonthRows;
  }

  return updated;
}

// Build initial populated state for all months
export function buildInitialYearData(): Record<FiscalMonth, Record<number, RowMonthlyExpenditure>> {
  const initial: Record<FiscalMonth, Record<number, RowMonthlyExpenditure>> = {} as any;

  FISCAL_MONTHS.forEach((month) => {
    const monthRecord: Record<number, RowMonthlyExpenditure> = {};
    const sample = INITIAL_SAMPLE_MONTHS[month] || {};

    MASTER_SCHEDULE_ROWS.forEach((def) => {
      const record = createDefaultRowRecord(def.rowNumber);
      if (sample[def.rowNumber]) {
        record.currentMonthDept = sample[def.rowNumber].dept;
        record.currentMonthAg = sample[def.rowNumber].ag;
        if (sample[def.rowNumber].reason) {
          record.variationReason = sample[def.rowNumber].reason || '';
        }
        if (sample[def.rowNumber].token) {
          record.chequeOrTokenRef = sample[def.rowNumber].token || '';
        }
      }
      monthRecord[def.rowNumber] = record;
    });

    initial[month] = monthRecord;
  });

  return recomputeYearProgressive(initial);
}

// Audit verification of required subtotals: Row 9, Row 17, Row 21, Row 26, Row 27
export function verifySubtotals(
  monthRows: Record<number, RowMonthlyExpenditure>
): SubtotalAuditStatus[] {
  const checks: { rowNum: number; name: string; budget: number; sourceRows: number[] }[] = [
    {
      rowNum: 9,
      name: 'Row 9: Total A-01 Employees Related Expenses',
      budget: 24551000,
      sourceRows: [4, 8],
    },
    {
      rowNum: 17,
      name: 'Row 17: Total Operating Expenses (A-03, A-04, A-05)',
      budget: 3032000,
      sourceRows: [10, 11, 12, 13, 14, 15, 16],
    },
    {
      rowNum: 21,
      name: 'Row 21: Total Physical Assets (A-09)',
      budget: 900000,
      sourceRows: [18, 19, 20],
    },
    {
      rowNum: 26,
      name: 'Row 26: Total Repair & Maintenance (A-13)',
      budget: 254000,
      sourceRows: [22, 23, 24, 25],
    },
    {
      rowNum: 27,
      name: 'Row 27: Grand Total Budget (HR-4007)',
      budget: 28737000,
      sourceRows: [9, 17, 21, 26],
    },
  ];

  return checks.map((c) => {
    let sumCurrentDept = 0;
    let sumProgDept = 0;
    let sumProgAg = 0;

    c.sourceRows.forEach((rNum) => {
      const r = monthRows[rNum];
      if (r) {
        sumCurrentDept += r.currentMonthDept || 0;
        sumProgDept += r.progressiveDept || 0;
        sumProgAg += r.progressiveAg || 0;
      }
    });

    const recordedRow = monthRows[c.rowNum] || createDefaultRowRecord(c.rowNum);
    const sumVariation = sumProgDept - sumProgAg;

    // Check if recorded row equals calculated source sum
    const isValid =
      Math.abs(recordedRow.progressiveDept - sumProgDept) < 1 &&
      Math.abs(recordedRow.currentMonthDept - sumCurrentDept) < 1;

    return {
      rowNumber: c.rowNum,
      name: c.name,
      targetBudget: c.budget,
      calculatedDeptCurrent: sumCurrentDept,
      calculatedDeptProgressive: sumProgDept,
      calculatedAgProgressive: sumProgAg,
      calculatedVariation: sumVariation,
      isValid,
      expectedSumRows: c.sourceRows,
    };
  });
}
