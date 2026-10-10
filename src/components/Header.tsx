import React from 'react';
import { COURT_METADATA } from '../data/budgetConfig';
import { FiscalMonth, FISCAL_MONTHS } from '../types/reconciliation';
import { formatPKR } from '../utils/calculations';
import { Landmark, Calendar, RefreshCw, Upload, FileText, Printer } from 'lucide-react';

interface HeaderProps {
  currentMonth: FiscalMonth;
  onSelectMonth: (month: FiscalMonth) => void;
  onOpenUpload: () => void;
  onResetToSample: () => void;
  onPrint: () => void;
  activeTab: 'formatB' | 'formatA' | 'markdown' | 'certificate';
  setActiveTab: (tab: 'formatB' | 'formatA' | 'markdown' | 'certificate') => void;
  totalProgressiveDept: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentMonth,
  onSelectMonth,
  onOpenUpload,
  onResetToSample,
  onPrint,
  activeTab,
  setActiveTab,
  totalProgressiveDept,
}) => {
  const monthIndex = FISCAL_MONTHS.indexOf(currentMonth) + 1;

  return (
    <header className="border-b border-slate-200 bg-white shadow-xs sticky top-0 z-30">
      {/* Top Bar Contract: Brand Zone - Nav - Action */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 py-3.5 border-b border-slate-100">
          {/* Brand Zone */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-md bg-emerald-900 text-white flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
                  Labour Court, Haripur
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  · Govt of Khyber Pakhtunkhwa
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Grant 21037 (030) · DDO: HR-4007 · FY {COURT_METADATA.fiscalYear}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveTab('formatB')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'formatB'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              AG Reconciliation (Format B)
            </button>
            <button
              onClick={() => setActiveTab('formatA')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'formatA'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Budget & Exp (Format A)
            </button>
            <button
              onClick={() => setActiveTab('markdown')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'markdown'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Markdown Export
            </button>
            <button
              onClick={() => setActiveTab('certificate')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap hidden sm:inline-block ${
                activeTab === 'certificate'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Official Print Sheet
            </button>
          </nav>

          {/* Primary Action Zone */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              title="Parse uploaded PIFRA / SAP schedule or bill vouchers"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-700" />
              <span>Parse SAP / Bill</span>
            </button>
            <button
              onClick={onPrint}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              title="Print official reconciliation report"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {/* Sub-header: Month Selector & Fiscal Progress Strip */}
        <div className="py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Month selector tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <div className="flex items-center gap-1 text-slate-500 font-medium whitespace-nowrap shrink-0">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Month (M{monthIndex}/12):</span>
            </div>
            <div className="flex items-center gap-1">
              {FISCAL_MONTHS.map((m, idx) => {
                const isSelected = m === currentMonth;
                return (
                  <button
                    key={m}
                    onClick={() => onSelectMonth(m)}
                    className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-900 text-white font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {m.slice(0, 3)}
                    {idx === 0 && <span className="text-[10px] opacity-75 ml-0.5">(B/F:0)</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="flex items-center gap-3 text-slate-600 whitespace-nowrap ml-auto">
            <span>
              Sanctioned Grant:{' '}
              <strong className="text-slate-900 font-mono">
                {formatPKR(COURT_METADATA.grandTotalSanctioned, true)}
              </strong>
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>
              Dept Progressive:{' '}
              <strong className="text-emerald-900 font-mono">
                {formatPKR(totalProgressiveDept, true)}
              </strong>
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <button
              onClick={onResetToSample}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-[11px] underline cursor-pointer"
              title="Reload official sample schedule"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Sample
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
