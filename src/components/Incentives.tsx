import React, { useState } from 'react';
import { 
  BadgePercent, Trophy, CircleDollarSign, 
  HelpCircle, CheckCircle, TrendingUp, DollarSign,
  Briefcase, Search, AlertCircle, Sparkles,
  Calendar, Filter, FileText, Download, BarChart2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Project, Client, Incentive } from '../types';
import { generateIncentivePDFReport } from '../utils/pdfGenerator';

interface IncentivesProps {
  projects: Project[];
  clients: Client[];
  incentives: Incentive[];
  onDisburseIncentive: (id: string) => void;
}

const monthNameMap: Record<string, string> = {
  '01': 'January',
  '02': 'February',
  '03': 'March',
  '04': 'April',
  '05': 'May',
  '06': 'June',
  '07': 'July',
  '08': 'August',
  '09': 'September',
  '10': 'October',
  '11': 'November',
  '12': 'December'
};

export default function Incentives({ 
  projects, 
  clients, 
  incentives,
  onDisburseIncentive
}: IncentivesProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Period filter states
  const currentYearStr = new Date().getFullYear().toString();
  const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, '0');

  const [periodMode, setPeriodMode] = useState<'all' | 'monthly' | 'yearly'>('all');
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // Currency formatter helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Dynamically derive available years from projects and incentives
  const allDateStrings = [
    ...projects.map(p => p.startDate),
    ...incentives.map(i => i.createdAt ? i.createdAt.slice(0, 10) : '')
  ].filter(Boolean);

  const yearSet = new Set<string>();
  yearSet.add(currentYearStr);
  allDateStrings.forEach(d => {
    if (d && d.length >= 4) {
      yearSet.add(d.slice(0, 4));
    }
  });
  const availableYears = Array.from(yearSet).sort((a, b) => b.localeCompare(a));

  // --- AUTOMATIC CALCULATION & FILTER LOGIC ---
  // A project qualifies for 2.5% incentive under these conditions:
  // 1. Client is a New Client (isFirstTransaction === true) OR registered within 1 year (< 365 days)
  // 2. Applies to initial testing as well as repeat testing (pengujian pengulangan)
  // 3. Project.status is 'Completed' or 'Report Released'
  // 4. Project.paymentStatus is 'Paid' (Invoice = Paid)
  // Incentive rate = 2.5% * Project.totalPrice
  
  const isClientUnderOneYear = (client: Client): boolean => {
    if (client.isFirstTransaction) return true;
    if (!client.createdAt) return true;
    const createdDate = new Date(client.createdAt);
    if (isNaN(createdDate.getTime())) return true;
    const diffDays = (new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
    return diffDays <= 365;
  };

  // Build a roster of current qualified candidates from projects + clients state
  const qualifiedCandidateProjects = projects.filter(proj => {
    const client = clients.find(c => c.id === proj.clientId);
    if (!client) return false;
    
    const isEligible = isClientUnderOneYear(client);
    const isFinished = proj.status === 'Completed' || proj.status === 'Report Released';
    const isPaid = proj.paymentStatus === 'Paid';

    return isEligible && isFinished && isPaid;
  });

  // Combine static seeder and dynamically derived ones for the visual audit trail list
  const allHistoryRecords: Incentive[] = [...incentives];
  
  qualifiedCandidateProjects.forEach(proj => {
    if (!allHistoryRecords.some(r => r.projectId === proj.id)) {
      allHistoryRecords.push({
        id: `inc-auto-${proj.id}`,
        projectId: proj.id,
        clientName: proj.clientName,
        serviceName: proj.serviceName,
        salesName: proj.assignedSales,
        serviceValue: proj.totalPrice,
        incentiveValue: proj.totalPrice * 0.025,
        paymentStatus: 'Paid',
        isPaid: false,
        createdAt: proj.startDate ? `${proj.startDate}T10:00:00.000Z` : new Date().toISOString()
      });
    }
  });

  // Helper to extract YYYY and MM from an incentive record
  const getRecordDate = (rec: Incentive): { year: string, month: string } => {
    let dateStr = rec.createdAt ? rec.createdAt.slice(0, 10) : '';
    if (!dateStr || dateStr.length < 10) {
      const proj = projects.find(p => p.id === rec.projectId);
      if (proj && proj.startDate) {
        dateStr = proj.startDate;
      }
    }
    if (dateStr && dateStr.length >= 7) {
      const parts = dateStr.split('-');
      return { year: parts[0], month: parts[1] };
    }
    return { year: currentYearStr, month: currentMonthStr };
  };

  // Filter history records based on selected period mode (monthly / yearly / all)
  const periodHistoryRecords = allHistoryRecords.filter(rec => {
    if (periodMode === 'all') return true;
    const { year, month } = getRecordDate(rec);
    if (periodMode === 'yearly') {
      return year === selectedYear;
    }
    if (periodMode === 'monthly') {
      return year === selectedYear && month === selectedMonth;
    }
    return true;
  });

  // Calculate dynamic incentive total for the chosen period
  const totalIncentivesValue = periodHistoryRecords.reduce((sum, inc) => sum + inc.incentiveValue, 0);
  
  // Pending projects for chosen period
  const pendingIncentivesValue = projects.filter(proj => {
    const client = clients.find(c => c.id === proj.clientId);
    if (!client) return false;
    
    const isEligible = isClientUnderOneYear(client);
    const isNotFinished = proj.status !== 'Completed' && proj.status !== 'Report Released';
    const isPaid = proj.paymentStatus === 'Paid';
    if (!isEligible || !isNotFinished || !isPaid) return false;

    if (periodMode === 'all') return true;
    if (proj.startDate && proj.startDate.length >= 7) {
      const [y, m] = proj.startDate.split('-');
      if (periodMode === 'yearly') return y === selectedYear;
      if (periodMode === 'monthly') return y === selectedYear && m === selectedMonth;
    }
    return true;
  }).reduce((sum, p) => sum + (p.totalPrice * 0.025), 0);

  // Search filter applied on top of period history records
  const filteredHistory = periodHistoryRecords.filter(h => 
    h.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.salesName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- SINGLE SALES INCENTIVE MONTHLY CHART DATA ---
  // Generate 12-month breakdown for selectedYear
  const monthCodes = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const monthlyChartData = monthCodes.map(mCode => {
    const recordsInMonth = allHistoryRecords.filter(rec => {
      const { year, month } = getRecordDate(rec);
      return year === selectedYear && month === mCode;
    });

    const cairVal = recordsInMonth.filter(r => r.isPaid).reduce((sum, r) => sum + r.incentiveValue, 0);
    const belumCairVal = recordsInMonth.filter(r => !r.isPaid).reduce((sum, r) => sum + r.incentiveValue, 0);

    return {
      monthCode: mCode,
      name: (monthNameMap[mCode] || `Bln ${mCode}`).slice(0, 3),
      fullName: `${monthNameMap[mCode] || mCode} ${selectedYear}`,
      cair: cairVal,
      belumCair: belumCairVal,
      total: cairVal + belumCairVal,
      count: recordsInMonth.length
    };
  });

  // KPI Calculations
  const totalCairValue = periodHistoryRecords.filter(r => r.isPaid).reduce((sum, r) => sum + r.incentiveValue, 0);
  const totalBelumCairValue = periodHistoryRecords.filter(r => !r.isPaid).reduce((sum, r) => sum + r.incentiveValue, 0);

  // Custom Tooltip for Chart
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 space-y-1">
          <p className="font-bold text-teal-300 border-b border-slate-700/80 pb-1 mb-1">{data.fullName}</p>
          <div className="space-y-0.5 font-mono text-[11px]">
            <p className="text-emerald-400">Disbursed: {formatIDR(data.cair)}</p>
            <p className="text-amber-400">Pending: {formatIDR(data.belumCair)}</p>
            <p className="font-bold text-white border-t border-slate-700/80 pt-1 mt-1">Total Commission: {formatIDR(data.total)}</p>
          </div>
          <p className="text-[10px] text-slate-400 pt-0.5">{data.count} Qualified Transactions</p>
        </div>
      );
    }
    return null;
  };

  // PDF Download Handler
  const handleDownloadPDF = () => {
    generateIncentivePDFReport({
      periodType: periodMode === 'all' ? 'all' : periodMode,
      month: selectedMonth,
      year: selectedYear,
      records: filteredHistory,
      monthNameMap,
      totalIncentivesValue,
      pendingIncentivesValue,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Sales Incentives Engine</h2>
            <span className="bg-teal-100 text-teal-800 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-teal-200">
              Single Sales Agent Mode
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">Automated 2.5% commission engine for single sales agent based on laboratory testing transactions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <FileText className="h-4 w-4 text-teal-200" /> Download Incentive PDF
          </button>
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl text-xs font-semibold border border-emerald-100">
            <Sparkles className="h-4 w-4 text-emerald-600 animate-spin" style={{ animationDuration: '4s' }} />
            2.5% Single Sales Formula
          </div>
        </div>
      </div>

      {/* PERIOD FILTER BAR (PER BULAN & PER TAHUN) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
            <Filter className="w-4 h-4 text-teal-600" /> Calculation Period Filter:
          </span>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => setPeriodMode('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                periodMode === 'all'
                  ? 'bg-white text-teal-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Periods
            </button>
            <button
              onClick={() => setPeriodMode('monthly')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                periodMode === 'monthly'
                  ? 'bg-white text-teal-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPeriodMode('yearly')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                periodMode === 'yearly'
                  ? 'bg-white text-teal-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Dynamic Selectors */}
        <div className="flex items-center gap-2">
          {periodMode === 'monthly' && (
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
                  <option key={m} value={m}>{monthNameMap[m]}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {periodMode === 'yearly' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-teal-50 text-teal-900 border border-teal-200 px-3 py-1.5 rounded-xl font-bold font-mono">
            {periodHistoryRecords.length} Items
          </div>
        </div>
      </div>

      {/* FOUR KPI SCOREBARS FOR SINGLE SALES PERFORMANCE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Insentif Terkumpul */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Total Incentives ({periodMode === 'monthly' ? `${monthNameMap[selectedMonth]} ${selectedYear}` : periodMode === 'yearly' ? `Year ${selectedYear}` : 'All'})
            </span>
            <h3 className="text-xl font-bold text-slate-900 font-mono">
              {formatIDR(totalIncentivesValue)}
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold">
              Accredited 2.5% commission
            </p>
          </div>
          <div className="bg-teal-50 text-teal-700 p-3 rounded-xl">
            <BadgePercent className="h-6 w-6" />
          </div>
        </div>

        {/* Sudah Cair */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Disbursed
            </span>
            <h3 className="text-xl font-bold text-emerald-600 font-mono">
              {formatIDR(totalCairValue)}
            </h3>
            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Transferred
            </p>
          </div>
          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl">
            <CircleDollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* Belum Cair */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Pending Disbursal
            </span>
            <h3 className="text-xl font-bold text-amber-600 font-mono">
              {formatIDR(totalBelumCairValue)}
            </h3>
            <p className="text-[10px] text-amber-600 font-semibold">
              Awaiting payout
            </p>
          </div>
          <div className="bg-amber-50 text-amber-700 p-3 rounded-xl">
            <Trophy className="h-6 w-6" />
          </div>
        </div>

        {/* Proyeksi Potential Komisi */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Potential Projection
            </span>
            <h3 className="text-xl font-bold text-blue-600 font-mono">
              {formatIDR(pendingIncentivesValue)}
            </h3>
            <p className="text-[10px] text-slate-500">
              Active testing in progress
            </p>
          </div>
          <div className="bg-blue-50 text-blue-700 p-3 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* RULE DETAILS CARD EXPLANATION */}
      <div className="bg-slate-50 p-5 rounded-xl border border-slate-150 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <HelpCircle className="h-5 w-5 text-teal-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 text-xs">Single Sales Incentive Formula Rule</h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              As the sole sales representative, you earn a <b>2.5% commission on testing value</b> for <b>New Clients and Clients under 1 year</b>, including <b>repeat testing</b>. Incentives qualify when project status is finished <i>(Completed / Report Released)</i> and payment status is <b>Paid</b>.
            </p>
          </div>
        </div>
        
        {/* Math explanation snippet */}
        <div className="bg-white border border-slate-200/80 p-3.5 rounded-lg text-xs font-mono shrink-0 select-none">
          <span className="text-slate-400 text-[10px] block font-sans">MATHEMATICAL FORMULA EXAMPLE:</span>
          <b>IDR 20,000,000 (Testing Price)</b><br/>
          <span className="text-slate-500">&times; 2.5% Commission</span><br/>
          <span className="font-bold text-teal-700">= IDR 500,000 Incentive</span>
        </div>
      </div>

      {/* CHART AND ACTIVE TRANSACTIONS LOGS LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Grafik Insentif Monthly Sales Component */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Monthly Incentive Trend ({selectedYear})</h3>
                <p className="text-[11px] text-slate-400">2.5% Commission Breakdown: Disbursed vs Pending</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] bg-teal-50 text-teal-800 px-2 py-1 rounded-lg font-bold border border-teal-100">
                <BarChart2 className="w-3.5 h-3.5 text-teal-600" /> Chart
              </div>
            </div>

            <div className="h-64 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : `${(val/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="cair" name="Disbursed" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="belumCair" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-100/80 text-[10px] text-slate-400 text-center">
            * Chart shows 12-month accumulation for {selectedYear}. Period filters above affect the transaction ledger.
          </div>
        </div>

        {/* Incentives History Ledger table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Accredited Commission Ledger</h3>
              <p className="text-xs text-slate-400">Audited commission transactions eligible for payout based on period filter</p>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search client, service, sales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-semibold">
                <tr>
                  <th className="p-3">Customer & Sales</th>
                  <th className="p-3">Service Catalog</th>
                  <th className="p-3 text-right">Contract Value</th>
                  <th className="p-3 text-right">Bonus (2.5%)</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                      <AlertCircle className="h-8 w-8 mx-auto text-slate-200 mb-2" />
                      No incentive records match your search query or selected period.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((rec) => {
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/40">
                        {/* Co & Sales */}
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{rec.clientName}</div>
                          <div className="text-[10px] text-slate-450 mt-0.5">Sales: {rec.salesName}</div>
                        </td>
                        
                        {/* Service name */}
                        <td className="p-3 max-w-xs">
                          <div className="font-medium truncate" title={rec.serviceName}>{rec.serviceName}</div>
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">Project ID: {rec.projectId}</div>
                        </td>

                        {/* Contract price */}
                        <td className="p-3 text-right font-mono font-bold text-slate-650">
                          {formatIDR(rec.serviceValue)}
                        </td>

                        {/* Commission */}
                        <td className="p-3 text-right font-mono font-bold text-teal-850">
                          {formatIDR(rec.incentiveValue)}
                        </td>

                        {/* Is Disbursed to sales */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => onDisburseIncentive(rec.id)}
                            className={`px-2 py-1 text-[10px] rounded-md font-semibold border cursor-pointer ${
                              rec.isPaid 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/50'
                            }`}
                            title="Click to toggle financial disbursement status"
                          >
                            {rec.isPaid ? 'Disbursed' : 'Disburse'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
