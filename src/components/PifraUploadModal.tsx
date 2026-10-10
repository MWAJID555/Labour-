import React, { useState } from 'react';
import { FiscalMonth, ParseResult } from '../types/reconciliation';
import { parsePifraScheduleText, SAMPLE_PIFRA_DUMPS } from '../utils/pifraParser';
import { formatPKR } from '../utils/calculations';
import {
  Upload,
  X,
  FileText,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Copy,
} from 'lucide-react';

interface PifraUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: FiscalMonth;
  onApplyParsedData: (
    matches: { rowNumber: number; detectedAmount: number }[],
    targetField: 'dept' | 'ag' | 'both',
    monthToApply: FiscalMonth
  ) => void;
}

export const PifraUploadModal: React.FC<PifraUploadModalProps> = ({
  isOpen,
  onClose,
  currentMonth,
  onApplyParsedData,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [targetColumn, setTargetColumn] = useState<'dept' | 'ag' | 'both'>('dept');
  const [targetMonth, setTargetMonth] = useState<FiscalMonth>(currentMonth);

  if (!isOpen) return null;

  const handleParse = (textToParse: string) => {
    const result = parsePifraScheduleText(textToParse);
    setParseResult(result);
    if (result.suggestedMonth) {
      setTargetMonth(result.suggestedMonth);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      setInputText(content);
      handleParse(content);
    };
    reader.readAsText(file);
  };

  const loadSample = (key: keyof typeof SAMPLE_PIFRA_DUMPS) => {
    const sample = SAMPLE_PIFRA_DUMPS[key];
    setInputText(sample);
    handleParse(sample);
  };

  const handleApply = () => {
    if (!parseResult || parseResult.matches.length === 0) return;
    onApplyParsedData(
      parseResult.matches.map((m) => ({
        rowNumber: m.rowNumber,
        detectedAmount: m.detectedAmount,
      })),
      targetColumn,
      targetMonth
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Parse PIFRA / SAP Schedule or Monthly Bills
              </h3>
              <p className="text-xs text-slate-500">
                Rule 1 & 2: Automatically maps Object Codes (A01101, A038, A039...) & extracts exact figures
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Quick Load Sample Buttons */}
          <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-100 rounded-lg">
            <span className="font-semibold text-slate-700">Test Samples:</span>
            <button
              type="button"
              onClick={() => loadSample('octoberSAP')}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-slate-800 font-medium cursor-pointer"
            >
              October SAP Schedule
            </button>
            <button
              type="button"
              onClick={() => loadSample('monthlyBillsText')}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-slate-800 font-medium cursor-pointer"
            >
              Raw Court Bill Vouchers
            </button>
            <button
              type="button"
              onClick={() => loadSample('julyTrialBalance')}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-slate-800 font-medium cursor-pointer"
            >
              July Trial Balance (Month 1)
            </button>
          </div>

          {/* Paste or Upload Area */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-semibold text-slate-700">
                Paste SAP / PIFRA Trial Balance or Bill Schedule:
              </label>
              <label className="text-emerald-800 hover:text-emerald-950 underline font-medium cursor-pointer flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Upload .txt or .csv</span>
                <input
                  type="file"
                  accept=".txt,.csv,.tsv,.log"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            <textarea
              rows={6}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                handleParse(e.target.value);
              }}
              placeholder={`Paste your PIFRA schedule, SAP trial balance, or bill lines here... Example:\nA01101 Pay of Officers 449,900\nA03807 POL Charges 175,000\nTelephone bill Rs. 10,500`}
              className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Parse Results Preview */}
          {parseResult && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                  <span className="font-semibold text-emerald-900">
                    Extracted {parseResult.matchedCount} Heads Successfully
                  </span>
                  <span className="text-emerald-700">·</span>
                  <span className="text-emerald-800">
                    Total Extracted: <strong>{formatPKR(parseResult.totalParsedAmount, true)}</strong>
                  </span>
                </div>
                {parseResult.suggestedMonth && (
                  <span className="text-xs bg-white text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-medium">
                    Month Detected: {parseResult.suggestedMonth}
                  </span>
                )}
              </div>

              {/* Matched Heads Preview Table */}
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                    <tr>
                      <th className="py-1.5 px-3">Row</th>
                      <th className="py-1.5 px-3">Object Head</th>
                      <th className="py-1.5 px-3">Matched Code</th>
                      <th className="py-1.5 px-3 text-right">Extracted Amount</th>
                      <th className="py-1.5 px-3 text-center">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parseResult.matches.map((m) => (
                      <tr key={m.rowNumber} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 font-mono text-slate-500">{m.rowNumber}</td>
                        <td className="py-1.5 px-3 text-slate-800">{m.description}</td>
                        <td className="py-1.5 px-3 font-mono text-slate-600">{m.objectCode}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-900">
                          {formatPKR(m.detectedAmount)}
                        </td>
                        <td className="py-1.5 px-3 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              m.confidence === 'HIGH'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {m.confidence}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Unmatched Lines Warning */}
              {parseResult.unmatchedLines.length > 0 && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900">
                  <span className="font-semibold">Unmapped lines containing figures:</span>
                  <ul className="mt-1 list-disc list-inside text-[11px] text-amber-800 space-y-0.5">
                    {parseResult.unmatchedLines.map((line, idx) => (
                      <li key={idx} className="truncate">{line}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Destination Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Apply Extracted Amounts To:
              </label>
              <select
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 font-medium"
              >
                <option value="dept">Departmental Cash Book (Current Month Dept)</option>
                <option value="ag">District Accounts Office / AG KP (SAP Current)</option>
                <option value="both">Both Department & AG (Zero Initial Variation)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Target Fiscal Month:
              </label>
              <select
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 font-medium"
              >
                {['July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June'].map((m) => (
                  <option key={m} value={m}>
                    {m} {m === 'July' ? '(Month 1: B/F = 0)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
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
            disabled={!parseResult || parseResult.matchedCount === 0}
            onClick={handleApply}
            className="flex items-center gap-1.5 px-5 py-2 bg-emerald-900 hover:bg-emerald-950 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>Apply to {targetMonth} Reconciliation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
