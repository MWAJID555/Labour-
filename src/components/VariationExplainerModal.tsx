import React, { useState, useEffect } from 'react';
import { RowMonthlyExpenditure } from '../types/reconciliation';
import { MASTER_SCHEDULE_ROWS, COMMON_VARIATION_REASONS } from '../data/budgetConfig';
import { formatPKR } from '../utils/calculations';
import { X, AlertCircle, Check, FileCheck } from 'lucide-react';

interface VariationExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  rowNumber: number | null;
  rowRecord: RowMonthlyExpenditure | null;
  onSaveReason: (rowNumber: number, reason: string, ref: string) => void;
}

export const VariationExplainerModal: React.FC<VariationExplainerModalProps> = ({
  isOpen,
  onClose,
  rowNumber,
  rowRecord,
  onSaveReason,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [reference, setReference] = useState<string>('');

  useEffect(() => {
    if (rowRecord) {
      setSelectedReason(rowRecord.variationReason || COMMON_VARIATION_REASONS[0]);
      setCustomReason(rowRecord.variationReason || '');
      setReference(rowRecord.chequeOrTokenRef || '');
    }
  }, [rowRecord]);

  if (!isOpen || rowNumber === null || !rowRecord) return null;

  const def = MASTER_SCHEDULE_ROWS.find((r) => r.rowNumber === rowNumber);
  const variation = rowRecord.variation;
  const isPositive = variation > 0;

  const handleSave = () => {
    const finalReason = customReason.trim() || selectedReason;
    onSaveReason(rowNumber, finalReason, reference.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            <h3 className="font-bold text-slate-900 text-sm">
              Reconcile Variation: Row {rowNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Summary Box */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="font-semibold text-amber-950 mb-1">
              {def?.objectCode} — {def?.description}
            </div>
            <div className="grid grid-cols-3 gap-2 text-slate-700 pt-1 border-t border-amber-200/70">
              <div>
                <span className="text-slate-500 block">Dept Prog:</span>
                <span className="font-mono font-medium">{formatPKR(rowRecord.progressiveDept)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">AG Prog:</span>
                <span className="font-mono font-medium">{formatPKR(rowRecord.progressiveAg)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Net Variation:</span>
                <span className="font-mono font-bold text-amber-900">
                  {formatPKR(variation)}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-amber-800 mt-2">
              {isPositive
                ? 'Department Progressive is HIGHER than AG Progressive. Commonly due to uncashed cheques issued to suppliers/staff or pending DAO tokens.'
                : 'AG Progressive is HIGHER than Department Progressive. Commonly due to AG Book Adjustments (TE), treasury deductions, or misclassifications.'}
            </p>
          </div>

          {/* Quick preset reasons */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Select Standard Official KP Reason:
            </label>
            <select
              value={selectedReason}
              onChange={(e) => {
                setSelectedReason(e.target.value);
                setCustomReason(e.target.value);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 font-medium"
            >
              {COMMON_VARIATION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Detailed Justification Note */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Custom Justification / Explanation:
            </label>
            <textarea
              rows={3}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-hidden"
              placeholder="Provide specific justification for audit scrutiny..."
            />
          </div>

          {/* Cheque / Token Number */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Cheque No. / DAO Token No. / TE Ref:
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. Cheque # 408891, Token # 312 dated 28-10-2026"
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 font-mono"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Save & Update Statement</span>
          </button>
        </div>
      </div>
    </div>
  );
};
