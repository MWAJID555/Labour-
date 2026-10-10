import { FiscalMonth, RowMonthlyExpenditure } from '../types/reconciliation';
import { MASTER_SCHEDULE_ROWS, COURT_METADATA } from '../data/budgetConfig';
import { formatPKR, verifySubtotals } from './calculations';

export function generateReconciliationMarkdown(
  month: FiscalMonth,
  rows: Record<number, RowMonthlyExpenditure>
): string {
  const auditStatuses = verifySubtotals(rows);
  const grandRow = rows[27];

  const variationsList = Object.values(rows).filter(
    (r) => !MASTER_SCHEDULE_ROWS.find((m) => m.rowNumber === r.rowNumber)?.isSubtotal && r.variation !== 0
  );

  let md = '';

  md += `# OFFICIAL FINANCIAL RECONCILIATION STATEMENT (FORMAT B)\n`;
  md += `### ${COURT_METADATA.department.toUpperCase()} (${COURT_METADATA.province.toUpperCase()})\n`;
  md += `**Grant No.:** ${COURT_METADATA.grantNo}  |  **Functional Head:** ${COURT_METADATA.functionalHead}  |  **DDO Code:** ${COURT_METADATA.ddoCode}\n`;
  md += `**Fiscal Year:** ${COURT_METADATA.fiscalYear}  |  **Reconciliation Month:** ${month} ${month === 'July' ? '(Month 1, B/F = 0)' : ''}\n\n`;

  md += `---\n\n`;

  md += `## 1. Reconciliation Table (Master Schedule Rows 1 to 27)\n\n`;
  md += `| Row | Object Head | Approved Budget (Rs.) | Exp. B/F (Rs.) | Current Month (Rs.) | Dept Progressive (Rs.) | AG Progressive (Rs.) | Variation (Rs.) | Remarks / Cause |\n`;
  md += `|:---|:---|---:|---:|---:|---:|---:|---:|:---|\n`;

  MASTER_SCHEDULE_ROWS.forEach((def) => {
    const r = rows[def.rowNumber] || {
      currentMonthDept: 0,
      currentMonthAg: 0,
      previousBfDept: 0,
      previousBfAg: 0,
      progressiveDept: 0,
      progressiveAg: 0,
      variation: 0,
      variationReason: '',
      chequeOrTokenRef: '',
    };

    const isSub = def.isSubtotal;
    const prefix = isSub ? `**` : '';
    const suffix = isSub ? `**` : '';

    const rowNumStr = `${prefix}${def.rowNumber}${suffix}`;
    const headStr = `${prefix}${def.objectCode} ${def.description}${suffix}`;
    const budgetStr = `${prefix}${formatPKR(def.sanctionedBudget)}${suffix}`;
    const bfStr = `${prefix}${formatPKR(r.previousBfDept)}${suffix}`;
    const currStr = `${prefix}${formatPKR(r.currentMonthDept)}${suffix}`;
    const deptProgStr = `${prefix}${formatPKR(r.progressiveDept)}${suffix}`;
    const agProgStr = `${prefix}${formatPKR(r.progressiveAg)}${suffix}`;
    const variationStr = `${prefix}${r.variation === 0 ? '0' : formatPKR(r.variation)}${suffix}`;

    let reasonStr = '-';
    if (r.variation !== 0) {
      reasonStr = r.variationReason
        ? `${r.variationReason}${r.chequeOrTokenRef ? ` (${r.chequeOrTokenRef})` : ''}`
        : 'Variation pending reconciliation';
    } else if (isSub) {
      reasonStr = 'Verified subtotal';
    }

    md += `| ${rowNumStr} | ${headStr} | ${budgetStr} | ${bfStr} | ${currStr} | ${deptProgStr} | ${agProgStr} | ${variationStr} | ${reasonStr} |\n`;
  });

  md += `\n---\n\n`;

  md += `## 2. Subtotals & Reconciliation Verification Check\n\n`;
  md += `| Verified Subtotal | Target Budget (Rs.) | Current Month (Rs.) | Dept Progressive (Rs.) | AG Progressive (Rs.) | Net Variation | Mathematical Status |\n`;
  md += `|:---|---:|---:|---:|---:|---:|:---|\n`;

  auditStatuses.forEach((stat) => {
    md += `| **${stat.name}** | ${formatPKR(stat.targetBudget)} | ${formatPKR(stat.calculatedDeptCurrent)} | ${formatPKR(stat.calculatedDeptProgressive)} | ${formatPKR(stat.calculatedAgProgressive)} | ${formatPKR(stat.calculatedVariation)} | ${stat.isValid ? 'MATCHED (VERIFIED)' : 'DISCREPANCY'} |\n`;
  });

  md += `\n---\n\n`;

  md += `## 3. Variation Analysis & Causes Summary\n\n`;
  const grandDept = grandRow?.progressiveDept || 0;
  const grandAg = grandRow?.progressiveAg || 0;
  const grandVar = grandRow?.variation || 0;

  md += `- **Departmental Progressive Total:** Rs. ${formatPKR(grandDept)}/-\n`;
  md += `- **AG KP / PIFRA Progressive Total:** Rs. ${formatPKR(grandAg)}/-\n`;
  md += `- **Net Variation (Dept - AG):** Rs. ${formatPKR(grandVar)}/-\n\n`;

  if (variationsList.length === 0) {
    md += `> **Reconciliation Status: 100% RECONCILED WITH ZERO VARIATION.** All figures in Departmental Cash Book strictly agree with PIFRA SAP schedules at District Accounts Office, Haripur.\n\n`;
  } else {
    md += `### Itemized Variation Details:\n\n`;
    variationsList.forEach((v, idx) => {
      const def = MASTER_SCHEDULE_ROWS.find((m) => m.rowNumber === v.rowNumber);
      const isPositive = v.variation > 0;
      md += `${idx + 1}. **Row ${v.rowNumber} (${def?.objectCode} - ${def?.description})**\n`;
      md += `   - Variation Amount: **Rs. ${formatPKR(v.variation)}/-** (${isPositive ? 'Department is higher' : 'AG is higher'})\n`;
      md += `   - Departmental Progressive: Rs. ${formatPKR(v.progressiveDept)}/- | AG Progressive: Rs. ${formatPKR(v.progressiveAg)}/-\n`;
      md += `   - **Cause / Justification:** ${v.variationReason || 'Under verification with DAO Haripur'}\n`;
      if (v.chequeOrTokenRef) {
        md += `   - **Reference / Token / Cheque:** ${v.chequeOrTokenRef}\n`;
      }
      md += `\n`;
    });
  }

  md += `\n---\n\n`;
  md += `**Presiding Officer**  \nLabour Court, Haripur  \n\n`;
  md += `**District Accounts Officer**  \nHaripur (Accountant General KP)\n`;

  return md;
}
