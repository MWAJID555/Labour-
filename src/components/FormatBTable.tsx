import React, { useState } from 'react';
import {
  FiscalMonth,
  RowMonthlyExpenditure,
  ScheduleRowDefinition,
} from '../types/reconciliation';
import { MASTER_SCHEDULE_ROWS } from '../data/budgetConfig';
import { formatPKR } from '../utils/calculations';
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  FileText,
  AlertCircle,
  Check,
} from 'lucide-react';

interface FormatBTableProps {
  currentMonth: FiscalMonth;
  rows: Record<number, RowMonthlyExpenditure>;
  onUpdateRowExpenditure: (
    rowNumber: number,
    field: 'currentMonthDept' | 'currentMonthAg',
    value: number
  ) => void;
  onOpenVariationReason: (rowNumber: number) => void;
}

export const FormatBTable: React.FC<FormatBTableProps> = ({
  currentMonth,
  rows,
  onUpdateRowExpenditure,
  onOpenVariationReason,
}) => {
  const [expandedSubHeads, setExpandedSubHeads] = useState<Record<number, boolean>>({});
  const [editingCell, setEditingCell] = useState<{
    rowNumber: number;
    field: 'dept' | 'ag';
  } | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  const toggleExpand = (rowNumber: number) => {
    setExpandedSubHeads((prev) => ({
      ...prev,
      [rowNumber]: !prev[rowNumber],
    }));
  };

  const startEdit = (rowNumber: number, field: 'dept' | 'ag', currentValue: number) => {
    setEditingCell({ rowNumber, field });
    setTempValue(currentValue.toString());
  };

  const saveEdit = () => {
    if (!editingCell) return;
    const num = parseFloat(tempValue.replace(/,/g, ''));
    const safeNum = isNaN(num) || num < 0 ? 0 : num;
    onUpdateRowExpenditure(
      editingCell.rowNumber,
      editingCell.field === 'dept' ? 'currentMonthDept' : 'currentMonthAg',
      safeNum
    );
    setEditingCell(null);
  };

  const cancelEdit = () => {
    setEditingCell(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
      {/* Table Title and Instructions */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">
            AG Reconciliation Statement (Format B) — Month of {currentMonth}, 2026
          </h3>
          <p className="text-slate-500 mt-0.5">
            Rule 3 & 4: Progressive Exp = Current Month + Previous Month Progressive (B/F). July (Month 1) B/F is 0.
            Click any blue value to edit.
          </p>
        </div>
        <div className="flex items-center gap-2 text-slate-600 text-xs">
          <span className="inline-block w-2.5 h-2.5 rounded-xs bg-amber-100 border border-amber-300"></span>
          <span>Variation Detected</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="inline-block w-2.5 h-2.5 rounded-xs bg-slate-100 border border-slate-300"></span>
          <span>Subtotal Row</span>
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-200 select-none">
              <th className="py-2.5 px-3 w-12 text-center">Row</th>
              <th className="py-2.5 px-3 min-w-[260px]">Detailed Object Head</th>
              <th className="py-2.5 px-3 text-right">Approved Budget</th>
              <th className="py-2.5 px-3 text-right">Exp B/F ({currentMonth === 'July' ? '0' : 'Prev'})</th>
              <th className="py-2.5 px-3 text-right text-emerald-900">Current Month (Dept)</th>
              <th className="py-2.5 px-3 text-right font-bold text-slate-900">Progressive (Dept)</th>
              <th className="py-2.5 px-3 text-right text-slate-700">AG Progressive (SAP)</th>
              <th className="py-2.5 px-3 text-right font-bold">Variation</th>
              <th className="py-2.5 px-3 min-w-[200px]">Remarks / Cause of Variation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
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
              const hasVariation = Math.abs(r.variation) > 0;
              const hasSubHeads = def.subHeads && def.subHeads.length > 0;
              const isExpanded = expandedSubHeads[def.rowNumber];

              // Row styling
              let rowBg = 'hover:bg-slate-50/80';
              if (def.rowNumber === 27) {
                rowBg = 'bg-emerald-50/80 hover:bg-emerald-100/60 font-bold border-t-2 border-emerald-300';
              } else if (isSub) {
                rowBg = 'bg-slate-50 hover:bg-slate-100/70 font-semibold';
              } else if (hasVariation) {
                rowBg = 'bg-amber-50/40 hover:bg-amber-50/70';
              }

              return (
                <React.Fragment key={def.rowNumber}>
                  <tr className={`transition-colors ${rowBg}`}>
                    {/* Row Index */}
                    <td className="py-2 px-3 text-center font-mono text-slate-500">
                      {def.rowNumber}
                    </td>

                    {/* Description and Object Code */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        {hasSubHeads ? (
                          <button
                            onClick={() => toggleExpand(def.rowNumber)}
                            className="p-0.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                            title="Toggle sub-heads"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-700" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
                            )}
                          </button>
                        ) : (
                          <span className="w-4"></span>
                        )}
                        <div>
                          <span className={`font-mono text-[11px] mr-1.5 ${isSub ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                            {def.objectCode}
                          </span>
                          <span className={isSub ? 'font-bold text-slate-900' : 'text-slate-800'}>
                            {def.description}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Approved Budget */}
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700">
                      {formatPKR(def.sanctionedBudget)}
                    </td>

                    {/* Brought Forward (B/F) */}
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-600">
                      {formatPKR(r.previousBfDept)}
                    </td>

                    {/* Current Month (Dept) - Editable if not subtotal */}
                    <td className="py-2 px-3 text-right font-mono tabular-nums">
                      {isSub ? (
                        <span className="font-semibold text-slate-800">
                          {formatPKR(r.currentMonthDept)}
                        </span>
                      ) : editingCell?.rowNumber === def.rowNumber && editingCell.field === 'dept' ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="text"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            autoFocus
                            className="w-24 px-1.5 py-0.5 text-right font-mono bg-white border border-emerald-500 rounded text-slate-900 focus:outline-hidden"
                          />
                          <button
                            onClick={saveEdit}
                            className="p-1 text-emerald-700 hover:bg-emerald-100 rounded cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(def.rowNumber, 'dept', r.currentMonthDept)}
                          className="group inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer"
                          title="Click to edit current month departmental amount"
                        >
                          <span>{formatPKR(r.currentMonthDept)}</span>
                          <Edit2 className="w-2.5 h-2.5 text-slate-300 opacity-0 group-hover:opacity-100" />
                        </button>
                      )}
                    </td>

                    {/* Dept Progressive = B/F + Current */}
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatPKR(r.progressiveDept)}
                    </td>

                    {/* AG Progressive (SAP) - Editable if not subtotal */}
                    <td className="py-2 px-3 text-right font-mono tabular-nums">
                      {isSub ? (
                        <span className="font-semibold text-slate-800">
                          {formatPKR(r.progressiveAg)}
                        </span>
                      ) : editingCell?.rowNumber === def.rowNumber && editingCell.field === 'ag' ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="text"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            autoFocus
                            className="w-24 px-1.5 py-0.5 text-right font-mono bg-white border border-blue-500 rounded text-slate-900 focus:outline-hidden"
                          />
                          <button
                            onClick={saveEdit}
                            className="p-1 text-blue-700 hover:bg-blue-100 rounded cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(def.rowNumber, 'ag', r.currentMonthAg)}
                          className="group inline-flex items-center gap-1 text-slate-700 hover:text-slate-950 hover:underline cursor-pointer"
                          title="Click to adjust AG SAP current month figure"
                        >
                          <span>{formatPKR(r.progressiveAg)}</span>
                          <Edit2 className="w-2.5 h-2.5 text-slate-300 opacity-0 group-hover:opacity-100" />
                        </button>
                      )}
                    </td>

                    {/* Variation = Dept Progressive - AG Progressive */}
                    <td className="py-2 px-3 text-right font-mono tabular-nums">
                      {hasVariation ? (
                        <span className="font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">
                          {formatPKR(r.variation)}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    {/* Remarks / Variation Reasons */}
                    <td className="py-2 px-3">
                      {hasVariation && !isSub ? (
                        <button
                          onClick={() => onOpenVariationReason(def.rowNumber)}
                          className="flex items-center gap-1.5 text-left text-amber-900 hover:text-amber-950 cursor-pointer group"
                        >
                          <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="truncate max-w-[220px] underline decoration-amber-300">
                            {r.variationReason || 'Specify variation reason...'}
                          </span>
                        </button>
                      ) : isSub ? (
                        <span className="text-slate-400 italic text-[11px]">
                          Automated Subtotal Sum
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Sub-Heads rows (e.g. Postage vs Telephone, TA vs POL, etc.) */}
                  {hasSubHeads &&
                    isExpanded &&
                    def.subHeads?.map((sh) => (
                      <tr key={sh.code} className="bg-slate-50/50 text-[11px] text-slate-600 border-l-2 border-emerald-600">
                        <td className="py-1.5 px-3 text-center text-slate-400 font-mono">
                          ↳
                        </td>
                        <td className="py-1.5 px-3 pl-8">
                          <span className="font-mono text-slate-500 mr-2">{sh.code}</span>
                          <span>{sh.name}</span>
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono tabular-nums text-slate-500">
                          {formatPKR(sh.sanctioned)}
                        </td>
                        <td colSpan={6} className="py-1.5 px-3 text-slate-400 italic">
                          Detailed object breakdown under {def.objectCode}
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
