import React, { useState } from 'react';
import { FileText, Download, Calendar, Filter, X, CheckCircle2 } from 'lucide-react';
import { Project } from '../types';
import { generatePDFReport } from '../utils/pdfGenerator';

interface PDFDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'ongoing' | 'tracker';
  projects: Project[];
  availableYears: string[];
  availableMonths: string[];
  monthNameMap: Record<string, string>;
  currentFilteredProjects: Project[];
}

export default function PDFDownloadModal({
  isOpen,
  onClose,
  type,
  projects,
  availableYears,
  availableMonths,
  monthNameMap,
  currentFilteredProjects,
}: PDFDownloadModalProps) {
  if (!isOpen) return null;

  const currentYearStr = new Date().getFullYear().toString();
  const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, '0');

  const [periodType, setPeriodType] = useState<'monthly' | 'yearly' | 'current_filter'>('monthly');
  const [selectedYear, setSelectedYear] = useState<string>(
    availableYears.length > 0 ? availableYears[0] : currentYearStr
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    availableMonths.includes(currentMonthStr) ? currentMonthStr : (availableMonths[0] || '01')
  );

  // Compute how many items match the chosen period
  const getMatchingCount = (): number => {
    if (periodType === 'current_filter') {
      return currentFilteredProjects.length;
    }
    if (periodType === 'monthly') {
      return projects.filter(p => {
        if (!p.startDate) return false;
        const [y, m] = p.startDate.split('-');
        return y === selectedYear && m === selectedMonth;
      }).length;
    }
    if (periodType === 'yearly') {
      return projects.filter(p => {
        if (!p.startDate) return false;
        const [y] = p.startDate.split('-');
        return y === selectedYear;
      }).length;
    }
    return projects.length;
  };

  const matchingCount = getMatchingCount();

  const handleDownload = () => {
    const targetProjects = periodType === 'current_filter' ? currentFilteredProjects : projects;

    generatePDFReport({
      type,
      periodType,
      year: selectedYear,
      month: selectedMonth,
      projects: targetProjects,
      monthNameMap,
    });

    onClose();
  };

  const titleText = type === 'ongoing' ? 'Download Ongoing Services PDF' : 'Download Service Tracker PDF';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-100 shadow-2xl space-y-0">
        
        {/* Header */}
        <div className="bg-teal-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-700 rounded-xl">
              <FileText className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{titleText}</h3>
              <p className="text-[11px] text-teal-200 mt-0.5">Select monthly or yearly report period</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-teal-200 hover:text-white text-lg font-bold p-1 cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {/* Period Type Selection */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">Select Report Period Mode:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPeriodType('monthly')}
                className={`p-2.5 rounded-xl border text-center font-semibold transition cursor-pointer ${
                  periodType === 'monthly'
                    ? 'bg-teal-50 text-teal-800 border-teal-500 ring-1 ring-teal-500'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-4 h-4 mx-auto mb-1 text-teal-600" />
                Monthly
              </button>

              <button
                type="button"
                onClick={() => setPeriodType('yearly')}
                className={`p-2.5 rounded-xl border text-center font-semibold transition cursor-pointer ${
                  periodType === 'yearly'
                    ? 'bg-teal-50 text-teal-800 border-teal-500 ring-1 ring-teal-500'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-4 h-4 mx-auto mb-1 text-teal-600" />
                Yearly
              </button>

              <button
                type="button"
                onClick={() => setPeriodType('current_filter')}
                className={`p-2.5 rounded-xl border text-center font-semibold transition cursor-pointer ${
                  periodType === 'current_filter'
                    ? 'bg-teal-50 text-teal-800 border-teal-500 ring-1 ring-teal-500'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Filter className="w-4 h-4 mx-auto mb-1 text-teal-600" />
                Active Filter
              </button>
            </div>
          </div>

          {/* Conditional Selectors */}
          {periodType === 'monthly' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Select Month:</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
                      <option key={m} value={m}>{monthNameMap[m] || `Month ${m}`}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Select Year:</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    {availableYears.length > 0 ? (
                      availableYears.map(y => <option key={y} value={y}>{y}</option>)
                    ) : (
                      <option value={currentYearStr}>{currentYearStr}</option>
                    )}
                  </select>
                </div>
              </div>
            </div>
          )}

          {periodType === 'yearly' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-slate-600 font-semibold mb-1">Select Report Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
              >
                {availableYears.length > 0 ? (
                  availableYears.map(y => <option key={y} value={y}>Year {y}</option>)
                ) : (
                  <option value={currentYearStr}>Year {currentYearStr}</option>
                )}
              </select>
            </div>
          )}

          {periodType === 'current_filter' && (
            <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-amber-900 text-xs">
              <p className="font-semibold">Using Current View Filter</p>
              <p className="text-[11px] text-amber-800 mt-0.5">The PDF report will generate data according to search keywords and active filters visible on your screen.</p>
            </div>
          )}

          {/* Result Info Card */}
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
            <span className="font-semibold text-teal-900">Matching Services Found:</span>
            <span className="font-mono font-bold bg-teal-700 text-white px-2.5 py-0.5 rounded-lg text-xs">
              {matchingCount} Projects
            </span>
          </div>

        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={matchingCount === 0}
            className={`px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow-xs transition cursor-pointer ${
              matchingCount > 0
                ? 'bg-teal-600 hover:bg-teal-700 text-white'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>

      </div>
    </div>
  );
}
