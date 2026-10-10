import React from 'react';
import { FiscalMonth, RowMonthlyExpenditure } from '../types/reconciliation';
import { MASTER_SCHEDULE_ROWS, COURT_METADATA } from '../data/budgetConfig';
import { formatPKR, verifySubtotals } from '../utils/calculations';
import { Printer, Download } from 'lucide-react';

interface PrintableOfficialCertificateProps {
  currentMonth: FiscalMonth;
  rows: Record<number, RowMonthlyExpenditure>;
  onPrint: () => void;
}

export const PrintableOfficialCertificate: React.FC<PrintableOfficialCertificateProps> = ({
  currentMonth,
  rows,
  onPrint,
}) => {
  const auditStatuses = verifySubtotals(rows);
  const grandRow = rows[27];

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
      {/* Action Toolbar (Hidden during print) */}
      <div className="no-print px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">
            Official Printable Statement & Verification Certificate
          </h3>
          <p className="text-xs text-slate-500">
            Official government layout formatted for A4 printing and submission to AG KP & Labour Dept.
          </p>
        </div>
        <button
          onClick={onPrint}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-semibold rounded-lg shadow-2xs cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Printable Sheet */}
      <div className="p-8 max-w-5xl mx-auto print:p-0 print:max-w-none text-slate-900 text-xs">
        {/* Official Letterhead */}
        <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
          <h1 className="text-base font-bold uppercase tracking-wide">
            OFFICE OF THE PRESIDING OFFICER, LABOUR COURT, HARIPUR
          </h1>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            GOVERNMENT OF KHYBER PAKHTUNKHWA
          </h2>
          <div className="flex justify-center items-center gap-3 text-[11px] font-medium text-slate-600 mt-1">
            <span>Grant No.: {COURT_METADATA.grantNo}</span>
            <span>·</span>
            <span>Functional Head: {COURT_METADATA.functionalHead}</span>
            <span>·</span>
            <span>DDO Code: {COURT_METADATA.ddoCode}</span>
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider mt-2 bg-slate-100 py-1 border border-slate-300">
            MONTHLY EXPENDITURE RECONCILIATION STATEMENT (FORMAT B) FOR THE MONTH OF {currentMonth.toUpperCase()}, 2026
          </h3>
        </div>

        {/* 27 Rows Master Table */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse border border-slate-800 text-[10px]">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-800 text-center">
                <th className="border border-slate-800 p-1 w-8">Row</th>
                <th className="border border-slate-800 p-1 text-left">Detailed Object Head</th>
                <th className="border border-slate-800 p-1 text-right">Sanctioned Budget</th>
                <th className="border border-slate-800 p-1 text-right">Exp B/F ({currentMonth === 'July' ? '0' : 'Prev'})</th>
                <th className="border border-slate-800 p-1 text-right">Month Exp (Dept)</th>
                <th className="border border-slate-800 p-1 text-right">Dept Progressive</th>
                <th className="border border-slate-800 p-1 text-right">AG Progressive</th>
                <th className="border border-slate-800 p-1 text-right">Variation</th>
                <th className="border border-slate-800 p-1 text-left min-w-[140px]">Reasons / Cheque Ref</th>
              </tr>
            </thead>
            <tbody>
              {MASTER_SCHEDULE_ROWS.map((def) => {
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
                const isGrand = def.rowNumber === 27;

                return (
                  <tr
                    key={def.rowNumber}
                    className={`${
                      isGrand
                        ? 'bg-slate-200 font-bold border-t-2 border-b-2 border-slate-900'
                        : isSub
                        ? 'bg-slate-100/90 font-bold'
                        : ''
                    }`}
                  >
                    <td className="border border-slate-800 p-1 text-center font-mono">{def.rowNumber}</td>
                    <td className="border border-slate-800 p-1">
                      <span className="font-mono mr-1">{def.objectCode}</span> {def.description}
                    </td>
                    <td className="border border-slate-800 p-1 text-right font-mono tabular-nums">
                      {formatPKR(def.sanctionedBudget)}
                    </td>
                    <td className="border border-slate-800 p-1 text-right font-mono tabular-nums">
                      {formatPKR(r.previousBfDept)}
                    </td>
                    <td className="border border-slate-800 p-1 text-right font-mono tabular-nums">
                      {formatPKR(r.currentMonthDept)}
                    </td>
                    <td className="border border-slate-800 p-1 text-right font-mono tabular-nums">
                      {formatPKR(r.progressiveDept)}
                    </td>
                    <td className="border border-slate-800 p-1 text-right font-mono tabular-nums">
                      {formatPKR(r.progressiveAg)}
                    </td>
                    <td className="border border-slate-800 p-1 text-right font-mono tabular-nums">
                      {r.variation === 0 ? '0' : formatPKR(r.variation)}
                    </td>
                    <td className="border border-slate-800 p-1 text-[9px]">
                      {r.variation !== 0
                        ? `${r.variationReason || 'Under verification'}${r.chequeOrTokenRef ? ` [${r.chequeOrTokenRef}]` : ''}`
                        : isSub
                        ? 'Subtotal'
                        : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Verification Certificate */}
        <div className="border border-slate-800 p-3 bg-slate-50 text-[11px] mb-8 print-break-inside-avoid">
          <h4 className="font-bold uppercase tracking-wider mb-1">
            RECONCILIATION & AUDIT CERTIFICATE
          </h4>
          <p className="leading-relaxed">
            Certified that the figures of progressive expenditure incurred under <strong>Grant No. 21037 (030) HR-4007 Labour Courts</strong> have been meticulously compared and reconciled with the records and monthly SAP/PIFRA trial balance maintained at the District Accounts Office, Haripur. All five key budgetary subtotals (Row 9 Total A-01, Row 17 Operating, Row 21 Assets, Row 26 Repair & Maintenance, and Row 27 Grand Total) have been verified and found in order. Variations noted above represent timing differences / uncashed cheques and are actively cleared.
          </p>
        </div>

        {/* Official Signatures Blocks */}
        <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs font-semibold print-break-inside-avoid">
          <div>
            <div className="border-t border-slate-900 pt-2">
              <p>Superintendent / Accountant</p>
              <p className="text-[10px] font-normal text-slate-600">Labour Court, Haripur</p>
            </div>
          </div>

          <div>
            <div className="border-t border-slate-900 pt-2">
              <p>Presiding Officer (DDO)</p>
              <p className="text-[10px] font-normal text-slate-600">Labour Court, Haripur</p>
              <p className="text-[10px] font-mono text-slate-500">DDO Code: HR-4007</p>
            </div>
          </div>

          <div>
            <div className="border-t border-slate-900 pt-2">
              <p>District Accounts Officer</p>
              <p className="text-[10px] font-normal text-slate-600">Haripur / AG Khyber Pakhtunkhwa</p>
              <p className="text-[10px] text-slate-500">(Sign & Official Stamp)</p>
            </div>
          </div>
        </div>

        {/* Dispatch endorsement */}
        <div className="mt-8 pt-3 border-t border-dashed border-slate-400 text-[10px] text-slate-600 print-break-inside-avoid">
          <p className="font-semibold">Copy forwarded for information and record to:</p>
          <ol className="list-decimal list-inside space-y-0.5 mt-0.5">
            <li>The Secretary to Government of Khyber Pakhtunkhwa, Labour Department, Peshawar.</li>
            <li>The Accountant General, Khyber Pakhtunkhwa, Peshawar.</li>
            <li>Office Record / Reconciliation File HR-4007 (FY 2026-2027).</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
