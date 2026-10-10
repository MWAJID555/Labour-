import React, { useState } from 'react';
import { FiscalMonth, RowMonthlyExpenditure } from '../types/reconciliation';
import { generateReconciliationMarkdown } from '../utils/markdownGenerator';
import { Copy, Check, Download, FileText, Code2, Eye } from 'lucide-react';

interface MarkdownReportViewProps {
  currentMonth: FiscalMonth;
  rows: Record<number, RowMonthlyExpenditure>;
}

export const MarkdownReportView: React.FC<MarkdownReportViewProps> = ({
  currentMonth,
  rows,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');

  const markdownContent = generateReconciliationMarkdown(currentMonth, rows);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Labour_Court_Haripur_Reconciliation_${currentMonth}_2026.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
      {/* Header bar */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">
            Finalized Markdown Reconciliation Statement (Rule 7)
          </h3>
          <p className="text-slate-500 mt-0.5">
            Clear, formatted Markdown table with exact figures, verified subtotals, and variation summary.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center p-0.5 bg-slate-200 rounded-lg">
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Table View</span>
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'raw'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Raw Markdown</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded-lg font-medium transition-colors cursor-pointer shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Markdown!' : 'Copy Markdown'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .md</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5">
        {viewMode === 'raw' ? (
          <div className="relative">
            <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed max-h-[600px]">
              {markdownContent}
            </pre>
          </div>
        ) : (
          <div className="prose prose-slate max-w-none text-xs leading-normal">
            <div className="border border-slate-200 rounded-lg p-5 bg-white">
              <div className="mb-4 text-center border-b border-slate-200 pb-4">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  OFFICIAL FINANCIAL RECONCILIATION STATEMENT (FORMAT B)
                </h2>
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Labour Court, Haripur (Government of Khyber Pakhtunkhwa)
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Grant No.: 21037 (030) · Functional Head: HR-4007 Labour Courts · DDO Code: HR-4007 · Month: {currentMonth}, 2026
                </p>
              </div>

              {/* Formatted Markdown rendered */}
              <div
                className="overflow-x-auto font-mono text-xs whitespace-pre-wrap bg-slate-50 p-4 rounded border border-slate-200 text-slate-800"
                style={{ tabSize: 4 }}
              >
                {markdownContent}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
