import React from 'react';
import { FiscalMonth, RowMonthlyExpenditure } from '../types/reconciliation';
import { MASTER_SCHEDULE_ROWS } from '../data/budgetConfig';
import { formatPKR } from '../utils/calculations';

interface FormatATableProps {
  currentMonth: FiscalMonth;
  rows: Record<number, RowMonthlyExpenditure>;
}

export const FormatATable: React.FC<FormatATableProps> = ({ currentMonth, rows }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">
            Monthly Expenditure & Budget Utilization Statement (Format A)
          </h3>
          <p className="text-slate-500 mt-0.5">
            DDO Code HR-4007 · Labour Court Haripur · Month: {currentMonth}, 2026
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-200 select-none">
              <th className="py-2.5 px-3 w-12 text-center">Row</th>
              <th className="py-2.5 px-3 min-w-[260px]">Detailed Object Head</th>
              <th className="py-2.5 px-3 text-right">Sanctioned Grant (Rs.)</th>
              <th className="py-2.5 px-3 text-right text-emerald-900">Exp. During Month (Rs.)</th>
              <th className="py-2.5 px-3 text-right font-bold text-slate-900">Progressive Exp. (Rs.)</th>
              <th className="py-2.5 px-3 text-right font-bold text-slate-700">Unspent Balance (Rs.)</th>
              <th className="py-2.5 px-3 text-right w-24">% Utilized</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MASTER_SCHEDULE_ROWS.map((def) => {
              const r = rows[def.rowNumber] || {
                currentMonthDept: 0,
                progressiveDept: 0,
              };

              const balance = def.sanctionedBudget - r.progressiveDept;
              const percent = def.sanctionedBudget > 0
                ? Math.min(100, Math.max(0, (r.progressiveDept / def.sanctionedBudget) * 100))
                : 0;

              const isSub = def.isSubtotal;
              let rowBg = 'hover:bg-slate-50/80';
              if (def.rowNumber === 27) {
                rowBg = 'bg-emerald-50/80 font-bold border-t-2 border-emerald-300';
              } else if (isSub) {
                rowBg = 'bg-slate-50 font-semibold';
              }

              return (
                <tr key={def.rowNumber} className={`transition-colors ${rowBg}`}>
                  <td className="py-2 px-3 text-center font-mono text-slate-500">
                    {def.rowNumber}
                  </td>
                  <td className="py-2 px-3">
                    <span className={`font-mono text-[11px] mr-1.5 ${isSub ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                      {def.objectCode}
                    </span>
                    <span className={isSub ? 'font-bold text-slate-900' : 'text-slate-800'}>
                      {def.description}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700">
                    {formatPKR(def.sanctionedBudget)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-emerald-900">
                    {formatPKR(r.currentMonthDept)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                    {formatPKR(r.progressiveDept)}
                  </td>
                  <td className={`py-2 px-3 text-right font-mono tabular-nums ${balance < 0 ? 'text-rose-700 font-bold' : 'text-slate-700'}`}>
                    {formatPKR(balance)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="font-semibold text-slate-800">
                        {percent.toFixed(1)}%
                      </span>
                      <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden shrink-0 hidden sm:block">
                        <div
                          className={`h-full ${percent > 90 ? 'bg-rose-500' : percent > 50 ? 'bg-amber-500' : 'bg-emerald-600'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
