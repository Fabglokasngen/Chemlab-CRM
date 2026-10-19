import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Award, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  FileText, 
  Presentation, 
  Download,
  Filter,
  CheckCircle2, 
  Calendar, 
  Sparkles, 
  ArrowUpRight,
  FileCheck,
  Target,
  Edit2,
  X
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Line, ComposedChart, Cell, PieChart, Pie } from 'recharts';
import { useSalesData } from '../context/SalesDataContext';
import { formatRupiah, formatCompactPortofolio, generatePowerPointDeck, generatePdfReport } from '../utils/exportPresentation';
import { exportMasterDataToExcel } from '../utils/excelProcessor';
import { computeParetoData } from '../utils/strategicAnalytics';
import { generateCrossSellRecommendations } from '../utils/clientROEngine';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { 
    records, 
    clients, 
    services, 
    strategicMetrics, 
    portfolioOnly, 
    setPortfolioOnly,
    selectedPeriod,
    monthlyTarget,
    yearlyTarget,
    setMonthlyTarget,
    setYearlyTarget,
    quotations
  } = useSalesData();

  // Target mode: 'month' or 'year'
  const [targetViewMode, setTargetViewMode] = useState<'month' | 'year'>('month');
  const [isEditingTargetModal, setIsEditingTargetModal] = useState(false);
  const [monthlyInput, setMonthlyInput] = useState(String(monthlyTarget));
  const [yearlyInput, setYearlyInput] = useState(String(yearlyTarget));

  const paretoData = computeParetoData(clients, portfolioOnly);
  const crossSellRecs = generateCrossSellRecommendations(clients, services);

  // Category breakdown for pie/bar chart
  const categoryData = React.useMemo(() => {
    const map = new Map<string, number>();
    records.forEach(r => {
      if (!portfolioOnly || r.isMyAuthority) {
        const cat = r.kategoriLayanan || 'Lainnya';
        map.set(cat, (map.get(cat) || 0) + (r.dppTotal || 0));
      }
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [records, portfolioOnly]);

  const COLORS = ['#0284C7', '#0D9488', '#6366F1', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899'];

  const handleSaveBothTargets = (e: React.FormEvent) => {
    e.preventDefault();
    const m = parseInt(monthlyInput.replace(/\D/g, ''), 10);
    const y = parseInt(yearlyInput.replace(/\D/g, ''), 10);
    if (!isNaN(m) && m > 0) setMonthlyTarget(m);
    if (!isNaN(y) && y > 0) setYearlyTarget(y);
    setIsEditingTargetModal(false);
  };

  const activeTargetValue = targetViewMode === 'month' ? monthlyTarget : yearlyTarget;
  const activeAttainment = targetViewMode === 'month' ? strategicMetrics.achievementPercent : strategicMetrics.yearlyAchievementPercent;

  return (
    <div className="space-y-6">
      {/* Top Banner & Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Executive Command Center</span>
            <span>·</span>
            <span className="text-emerald-700 font-bold">{selectedPeriod}</span>
            <span>·</span>
            <span>Kimia &amp; Instrumentasi Analitikal</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Strategi Penjualan &amp; Posisi Pasar
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Dasbor evaluasi performa penjualan dua mingguan. Pantau pencapaian kuota per bulan &amp; per tahun, rasio win rate penawaran, konsentrasi akun Pareto 80/20, dan radar reaktivasi klien.
          </p>
        </div>

        {/* View Switcher & Quick Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Portfolio Switch Toggle */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setPortfolioOnly(true)}
              className={`px-3 py-1.5 rounded-md transition-all ${
                portfolioOnly 
                  ? 'bg-white text-slate-900 shadow-xs font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Portofolio Saya Saja
            </button>
            <button
              onClick={() => setPortfolioOnly(false)}
              className={`px-3 py-1.5 rounded-md transition-all ${
                !portfolioOnly 
                  ? 'bg-white text-slate-900 shadow-xs font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Seluruh Omzet Lab
            </button>
          </div>

          {/* Quick Deck PPT Button */}
          <button
            onClick={() => generatePowerPointDeck(strategicMetrics, clients, services, selectedPeriod)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            title="Download slide presentasi rapat manajemen dalam format PowerPoint (.pptx)"
          >
            <Presentation className="w-3.5 h-3.5 text-sky-400" />
            <span>Export Slides (.PPTX)</span>
          </button>

          {/* Quick PDF Button */}
          <button
            onClick={() => generatePdfReport(strategicMetrics, clients, selectedPeriod)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            title="Download memo ringkasan eksekutif PDF"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>PDF Memo</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (4 Metrics with Zero-Pill Discipline) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Revenue DPP */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {portfolioOnly ? 'Pendapatan DPP Portofolio' : 'Total DPP Laboratorium'}
            </span>
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
              {formatRupiah(portfolioOnly ? strategicMetrics.myPortfolioDpp : strategicMetrics.totalCompanyDpp)}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span>{portfolioOnly ? strategicMetrics.myPortfolioTransactions : strategicMetrics.totalTransactions} Order</span>
              <span>·</span>
              <span className="font-mono text-sky-800 font-semibold">{formatCompactPortofolio(portfolioOnly ? strategicMetrics.myPortfolioDpp : strategicMetrics.totalCompanyDpp)}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Porsi terhadap total omzet:</span>
            <span className="font-semibold font-mono tabular-nums text-slate-900">
              {Math.round(strategicMetrics.portfolioSharePercent)}%
            </span>
          </div>
        </div>

        {/* KPI 2: Target Quota Attainment (Target Per Bulan & Per Tahun as Requested) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Target {targetViewMode === 'month' ? 'Bulanan' : 'Tahunan'}
              </span>
              <div className="inline-flex p-0.5 bg-slate-100 rounded text-[10px] font-medium border border-slate-200">
                <button
                  onClick={() => setTargetViewMode('month')}
                  className={`px-1.5 py-0.5 rounded ${targetViewMode === 'month' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-500'}`}
                >
                  Bulan
                </button>
                <button
                  onClick={() => setTargetViewMode('year')}
                  className={`px-1.5 py-0.5 rounded ${targetViewMode === 'year' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-500'}`}
                >
                  Tahun
                </button>
              </div>
            </div>
            <span className="p-1.5 bg-sky-50 text-sky-700 rounded-lg">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
                {Math.round(activeAttainment)}%
              </span>
              <span className="text-xs text-slate-500 font-medium">tercapai</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  activeAttainment >= 100 ? 'bg-emerald-600' : 'bg-sky-600'
                }`}
                style={{ width: `${Math.min(100, activeAttainment)}%` }}
              />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600">
              Target: <strong className="text-slate-900 font-mono">{formatCompactPortofolio(activeTargetValue)}</strong>
            </span>
            <button 
              onClick={() => {
                setMonthlyInput(String(monthlyTarget));
                setYearlyInput(String(yearlyTarget));
                setIsEditingTargetModal(true);
              }} 
              className="text-sky-700 hover:text-sky-900 text-xs font-semibold inline-flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              <span>Atur Target</span>
            </button>
          </div>
        </div>

        {/* KPI 3: Win Rate Penawaran (Quotation Winrate) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Win Rate Penawaran</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <FileCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-emerald-800 tabular-nums">
                {strategicMetrics.winRatePercent}%
              </span>
              <span className="text-xs text-slate-500 font-medium">Rasio Deal Won</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span>{strategicMetrics.wonQuotations} Won / {strategicMetrics.totalQuotations} Quotation</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Pipeline Berjalan:</span>
            <button
              onClick={() => onNavigate('penawaran')}
              className="font-semibold font-mono text-sky-700 hover:underline"
            >
              {formatCompactPortofolio(strategicMetrics.totalQuotationPipelineDpp)} →
            </button>
          </div>
        </div>

        {/* KPI 4: Average Order Value & Cadence */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Average Order Value</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
              {formatRupiah(strategicMetrics.averageOrderValue)}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span>Rata-rata DPP per Transaksi</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Ritme Dua Mingguan:</span>
            <span className="font-mono text-slate-700">1-15: {formatCompactPortofolio(strategicMetrics.midMonthDpp)}</span>
          </div>
        </div>
      </div>

      {/* Main Analytics Grid: Pareto 80/20 & Category Share */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pareto 80/20 Analysis (Span 2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Kurva Distribusi Pareto 80/20 Akun
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mengidentifikasi 20% klien kunci penggerak 80% pendapatan portofolio analitikal
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-sky-600 rounded-xs inline-block" />
                  <span>Pendapatan Klien (DPP)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-amber-500 inline-block" />
                  <span>Kumulatif %</span>
                </div>
              </div>
            </div>

            <div className="h-68 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={paretoData} margin={{ top: 10, right: 20, bottom: 25, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="clientName" 
                    tick={{ fontSize: 10, fill: '#64748B' }} 
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    tickFormatter={(val) => val.length > 14 ? `${val.slice(0, 12)}..` : val}
                  />
                  <YAxis 
                    yAxisId="left" 
                    tick={{ fontSize: 10, fill: '#64748B' }} 
                    tickFormatter={(val) => `${val / 1000000}M`}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: '#64748B' }} 
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip 
                    formatter={(val: any, name: string | undefined) => {
                      if (name === 'Kumulatif %') return [`${val}%`, name];
                      return [formatRupiah(val), 'Pendapatan DPP'];
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#0F172A', fontSize: 12 }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: 12 }}
                  />
                  <Bar 
                    yAxisId="left" 
                    dataKey="revenue" 
                    fill="#0284C7" 
                    radius={[4, 4, 0, 0]}
                  >
                    {paretoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isTop80 ? '#0284C7' : '#94A3B8'} />
                    ))}
                  </Bar>
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="cumulativePercentage" 
                    stroke="#D97706" 
                    strokeWidth={2}
                    name="Kumulatif %"
                    dot={{ r: 3, fill: '#D97706' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
            <span>
              <strong className="text-slate-900 font-semibold">{strategicMetrics.topParetoClientsCount} Klien Utama</strong> menghasilkan{' '}
              <strong className="text-slate-900 font-semibold">{formatCompactPortofolio(strategicMetrics.topParetoRevenue)}</strong> (~80% omzet).
            </span>
            <button 
              onClick={() => onNavigate('clients')} 
              className="text-sky-700 hover:text-sky-900 font-semibold inline-flex items-center gap-1"
            >
              <span>Lihat Detail Klien</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Category Contribution Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Kontribusi Layanan</h3>
                <p className="text-xs text-slate-500 mt-0.5">Proporsi revenue per kategori pengujian</p>
              </div>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cat-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => [formatRupiah(val), 'Revenue DPP']}
                    contentStyle={{ borderRadius: '8px', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Quiet text legend */}
            <div className="space-y-1.5 mt-2">
              {categoryData.slice(0, 4).map((c, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate max-w-[180px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-slate-700 truncate">{c.name}</span>
                  </div>
                  <span className="font-mono tabular-nums text-slate-900 font-medium">{formatCompactPortofolio(c.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <button 
              onClick={() => onNavigate('catalog')} 
              className="text-sky-700 hover:text-sky-900 font-semibold inline-flex items-center gap-1 w-full justify-end"
            >
              <span>Katalog Lengkap Instrumentasi</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Target Setting Modal for Monthly and Yearly Targets */}
      {isEditingTargetModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">Atur Target Penjualan</h3>
              </div>
              <button 
                onClick={() => setIsEditingTargetModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBothTargets} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Penjualan Per Bulan (IDR DPP)
                </label>
                <input
                  type="text"
                  value={monthlyInput}
                  onChange={(e) => setMonthlyInput(e.target.value)}
                  placeholder="e.g. 120000000"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-sm"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Nilai saat ini: {formatRupiah(parseInt(monthlyInput.replace(/\D/g, '') || '0', 10))} ({formatCompactPortofolio(parseInt(monthlyInput.replace(/\D/g, '') || '0', 10))})
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Penjualan Per Tahun (IDR DPP)
                </label>
                <input
                  type="text"
                  value={yearlyInput}
                  onChange={(e) => setYearlyInput(e.target.value)}
                  placeholder="e.g. 1440000000"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-sm"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Nilai saat ini: {formatRupiah(parseInt(yearlyInput.replace(/\D/g, '') || '0', 10))} ({formatCompactPortofolio(parseInt(yearlyInput.replace(/\D/g, '') || '0', 10))})
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingTargetModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold"
                >
                  Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
