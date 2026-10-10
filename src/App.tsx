import React, { useState, useMemo } from 'react';
import { FiscalMonth, RowMonthlyExpenditure } from './types/reconciliation';
import {
  buildInitialYearData,
  recomputeYearProgressive,
  verifySubtotals,
  formatPKR,
} from './utils/calculations';
import { COURT_METADATA, MASTER_SCHEDULE_ROWS } from './data/budgetConfig';
import { Header } from './components/Header';
import { SubtotalsAuditBar } from './components/SubtotalsAuditBar';
import { FormatBTable } from './components/FormatBTable';
import { FormatATable } from './components/FormatATable';
import { MarkdownReportView } from './components/MarkdownReportView';
import { PrintableOfficialCertificate } from './components/PrintableOfficialCertificate';
import { PifraUploadModal } from './components/PifraUploadModal';
import { VariationExplainerModal } from './components/VariationExplainerModal';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';

export default function App() {
  const [yearData, setYearData] = useState<Record<FiscalMonth, Record<number, RowMonthlyExpenditure>>>(
    () => buildInitialYearData()
  );
  // Default to October 2026 per current date context
  const [currentMonth, setCurrentMonth] = useState<FiscalMonth>('October');
  const [activeTab, setActiveTab] = useState<'formatB' | 'formatA' | 'markdown' | 'certificate'>(
    'formatB'
  );

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [explainerRow, setExplainerRow] = useState<number | null>(null);

  // Active month rows
  const monthRows = useMemo(() => {
    return yearData[currentMonth] || {};
  }, [yearData, currentMonth]);

  // Subtotals verification statuses
  const auditStatuses = useMemo(() => {
    return verifySubtotals(monthRows);
  }, [monthRows]);

  // Key KPI numbers
  const grandRow = monthRows[27] || {
    currentMonthDept: 0,
    progressiveDept: 0,
    progressiveAg: 0,
    variation: 0,
  };

  const currentMonthExpDept = grandRow.currentMonthDept || 0;
  const progressiveDeptTotal = grandRow.progressiveDept || 0;
  const progressiveAgTotal = grandRow.progressiveAg || 0;
  const netVariation = grandRow.variation || 0;
  const totalSanctioned = COURT_METADATA.grandTotalSanctioned;
  const unspentBalance = totalSanctioned - progressiveDeptTotal;
  const utilizationPercent = (progressiveDeptTotal / totalSanctioned) * 100;

  // Handle cell edit
  const handleUpdateRowExpenditure = (
    rowNumber: number,
    field: 'currentMonthDept' | 'currentMonthAg',
    value: number
  ) => {
    setYearData((prev) => {
      const updatedYear = { ...prev };
      const currentMonthRows = { ...updatedYear[currentMonth] };
      const targetRow = { ...(currentMonthRows[rowNumber] || {}) };

      if (field === 'currentMonthDept') {
        targetRow.currentMonthDept = value;
      } else {
        targetRow.currentMonthAg = value;
      }

      currentMonthRows[rowNumber] = targetRow as RowMonthlyExpenditure;
      updatedYear[currentMonth] = currentMonthRows;

      return recomputeYearProgressive(updatedYear);
    });
  };

  // Handle applying parsed SAP / PIFRA batch data
  const handleApplyParsedData = (
    matches: { rowNumber: number; detectedAmount: number }[],
    targetField: 'dept' | 'ag' | 'both',
    monthToApply: FiscalMonth
  ) => {
    setYearData((prev) => {
      const updatedYear = { ...prev };
      const targetMonthRows = { ...updatedYear[monthToApply] };

      matches.forEach((m) => {
        const def = MASTER_SCHEDULE_ROWS.find((r) => r.rowNumber === m.rowNumber);
        if (def && !def.isSubtotal) {
          const row = { ...(targetMonthRows[m.rowNumber] || {}) } as RowMonthlyExpenditure;
          if (targetField === 'dept' || targetField === 'both') {
            row.currentMonthDept = m.detectedAmount;
          }
          if (targetField === 'ag' || targetField === 'both') {
            row.currentMonthAg = m.detectedAmount;
          }
          targetMonthRows[m.rowNumber] = row;
        }
      });

      updatedYear[monthToApply] = targetMonthRows;
      return recomputeYearProgressive(updatedYear);
    });

    setCurrentMonth(monthToApply);
  };

  // Handle saving variation reason
  const handleSaveReason = (rowNumber: number, reason: string, ref: string) => {
    setYearData((prev) => {
      const updatedYear = { ...prev };
      const currentMonthRows = { ...updatedYear[currentMonth] };
      const targetRow = { ...(currentMonthRows[rowNumber] || {}) } as RowMonthlyExpenditure;

      targetRow.variationReason = reason;
      targetRow.chequeOrTokenRef = ref;

      currentMonthRows[rowNumber] = targetRow;
      updatedYear[currentMonth] = currentMonthRows;

      return updatedYear;
    });
  };

  // Reset to initial sample
  const handleResetToSample = () => {
    setYearData(buildInitialYearData());
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Official Government Header */}
      <Header
        currentMonth={currentMonth}
        onSelectMonth={(m) => setCurrentMonth(m)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onResetToSample={handleResetToSample}
        onPrint={handlePrint}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalProgressiveDept={progressiveDeptTotal}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* KPI Metric Strip */}
        <section className="no-print grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
          {/* Card 1: Sanctioned Budget */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
              Approved Budget (FY 26-27)
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-bold text-slate-900 font-mono">
                {formatPKR(totalSanctioned, true)}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Grant 21037 (030) · HR-4007
            </span>
          </div>

          {/* Card 2: Current Month Dept */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
              Current Month Exp ({currentMonth})
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-bold text-emerald-900 font-mono">
                {formatPKR(currentMonthExpDept, true)}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Departmental Cash Book
            </span>
          </div>

          {/* Card 3: Dept Progressive */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
              Progressive Exp (Dept)
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-bold text-slate-900 font-mono">
                {formatPKR(progressiveDeptTotal, true)}
              </span>
              <span className="text-xs font-semibold text-emerald-800">
                {utilizationPercent.toFixed(1)}%
              </span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {currentMonth === 'July' ? 'Month 1 (B/F = 0)' : 'Current + Previous B/F'}
            </span>
          </div>

          {/* Card 4: AG Progressive */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
              AG Progressive (PIFRA)
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-bold text-slate-800 font-mono">
                {formatPKR(progressiveAgTotal, true)}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              DAO Haripur Ledger
            </span>
          </div>

          {/* Card 5: Net Variation */}
          <div
            className={`border rounded-lg p-3 shadow-2xs col-span-2 lg:col-span-1 ${
              netVariation !== 0
                ? 'bg-amber-50/70 border-amber-300'
                : 'bg-white border-slate-200'
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
              Reconciliation Variation
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span
                className={`text-base font-bold font-mono ${
                  netVariation !== 0 ? 'text-amber-900' : 'text-slate-800'
                }`}
              >
                {netVariation === 0 ? 'Rs. 0/-' : formatPKR(netVariation, true)}
              </span>
              {netVariation === 0 ? (
                <span className="text-[11px] font-medium text-emerald-700">Reconciled</span>
              ) : (
                <span className="text-[11px] font-medium text-amber-800">Timing/Uncashed</span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Dept Progressive - AG Progressive
            </span>
          </div>
        </section>

        {/* Subtotals Verification Bar (Rule 6) */}
        <section className="no-print">
          <SubtotalsAuditBar auditStatuses={auditStatuses} currentMonth={currentMonth} />
        </section>

        {/* Active View Tab */}
        <section>
          {activeTab === 'formatB' && (
            <FormatBTable
              currentMonth={currentMonth}
              rows={monthRows}
              onUpdateRowExpenditure={handleUpdateRowExpenditure}
              onOpenVariationReason={(rNum) => setExplainerRow(rNum)}
            />
          )}

          {activeTab === 'formatA' && (
            <FormatATable currentMonth={currentMonth} rows={monthRows} />
          )}

          {activeTab === 'markdown' && (
            <MarkdownReportView currentMonth={currentMonth} rows={monthRows} />
          )}

          {activeTab === 'certificate' && (
            <PrintableOfficialCertificate
              currentMonth={currentMonth}
              rows={monthRows}
              onPrint={handlePrint}
            />
          )}
        </section>
      </main>

      {/* Official Footer */}
      <footer className="no-print border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-700">Labour Court, Haripur</span>
            <span className="mx-1.5">·</span>
            <span>Government of Khyber Pakhtunkhwa</span>
            <span className="mx-1.5">·</span>
            <span>Grant No. 21037 (030)</span>
            <span className="mx-1.5">·</span>
            <span className="font-mono">DDO: HR-4007</span>
          </div>
          <div className="flex items-center gap-4">
            <span>PIFRA / SAP R/3 & District Accounts Office Reconciliation Engine</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PifraUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        currentMonth={currentMonth}
        onApplyParsedData={handleApplyParsedData}
      />

      <VariationExplainerModal
        isOpen={explainerRow !== null}
        onClose={() => setExplainerRow(null)}
        rowNumber={explainerRow}
        rowRecord={explainerRow !== null ? monthRows[explainerRow] || null : null}
        onSaveReason={handleSaveReason}
      />
    </div>
  );
}
