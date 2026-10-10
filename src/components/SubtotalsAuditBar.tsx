import React from 'react';
import { SubtotalAuditStatus, FiscalMonth } from '../types/reconciliation';
import { formatPKR } from '../utils/calculations';
import { CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SubtotalsAuditBarProps {
  auditStatuses: SubtotalAuditStatus[];
  currentMonth: FiscalMonth;
}

export const SubtotalsAuditBar: React.FC<SubtotalsAuditBarProps> = ({
  auditStatuses,
  currentMonth,
}) => {
  const allValid = auditStatuses.every((s) => s.isValid);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3.5 mb-5 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-800" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Subtotals Mathematical Verification & Audit (Rule 6)
          </h2>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-600">
            For {currentMonth} {currentMonth === 'July' ? '(Month 1: Previous B/F is Strictly 0)' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {allValid ? (
            <span className="flex items-center gap-1.5 font-semibold text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              All 5 Subtotal Rows Verified & Consistent
            </span>
          ) : (
            <span className="flex items-center gap-1.5 font-semibold text-rose-700">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              Subtotal Discrepancy Detected
            </span>
          )}
        </div>
      </div>

      {/* Grid of the 5 Verified Subtotals */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
        {auditStatuses.map((stat) => {
          const hasVariation = Math.abs(stat.calculatedVariation) > 0;
          return (
            <div
              key={stat.rowNumber}
              className={`p-2.5 rounded border text-xs transition-colors ${
                stat.rowNumber === 27
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-bold text-slate-900 truncate">
                  Row {stat.rowNumber}: {stat.name.split(':')[1]?.trim() || stat.name}
                </span>
                {stat.isValid ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                )}
              </div>

              <div className="space-y-0.5 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Budget:</span>
                  <span className="font-mono text-slate-800">{formatPKR(stat.targetBudget)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dept Prog:</span>
                  <span className="font-mono font-medium text-slate-900">
                    {formatPKR(stat.calculatedDeptProgressive)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">AG Prog:</span>
                  <span className="font-mono text-slate-700">
                    {formatPKR(stat.calculatedAgProgressive)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">Variation:</span>
                  <span
                    className={`font-mono font-medium ${
                      hasVariation ? 'text-amber-800' : 'text-slate-600'
                    }`}
                  >
                    {stat.calculatedVariation === 0 ? '0' : formatPKR(stat.calculatedVariation)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
