import React from 'react';
import { 
  LayoutDashboard, 
  Database, 
  UploadCloud, 
  Users, 
  FlaskConical, 
  Presentation, 
  BookOpen, 
  Coins, 
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  Sparkles,
  FileCheck
} from 'lucide-react';
import { useSalesData } from '../context/SalesDataContext';
import { generatePowerPointDeck, generatePdfReport, formatCompactPortofolio } from '../utils/exportPresentation';

interface NavigationProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onSelectTab }) => {
  const { strategicMetrics, clients, services, selectedPeriod, portfolioOnly, setPortfolioOnly, monthlyTarget } = useSalesData();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Strategi & Dashboard',
      icon: LayoutDashboard,
      badge: 'Pareto 80/20'
    },
    {
      id: 'master',
      label: 'Master Data Penjualan',
      icon: Database,
      badge: 'Full Ledger'
    },
    {
      id: 'penawaran',
      label: 'Penawaran & Win Rate',
      icon: FileCheck,
      badge: `${strategicMetrics.winRatePercent}% Win`
    },
    {
      id: 'intake',
      label: 'Upload Excel (.XLSX)',
      icon: UploadCloud,
    },
    {
      id: 'clients',
      label: 'Direktori Klien & RO',
      icon: Users,
    },
    {
      id: 'catalog',
      label: 'Katalog Instrumentasi',
      icon: FlaskConical,
    },
    {
      id: 'meeting-reports',
      label: 'Laporan Rapat Sales',
      icon: Presentation,
      badge: 'Bi-Monthly'
    },
    {
      id: 'journal',
      label: 'Jurnal Penjualan',
      icon: BookOpen,
    },
    {
      id: 'incentives',
      label: 'Kalkulator Insentif',
      icon: Coins,
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 min-h-screen">
      {/* Brand Zone */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-base tracking-wider font-mono">
            N
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight text-white block leading-none">
              Nullius
            </span>
            <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold block mt-1">
              Sales Intelligence Workstation
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Modul Penjualan
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive 
                  ? 'bg-slate-800 text-white font-semibold shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                }`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                  isActive ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-900 text-slate-500'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quota Run-Rate Mini Widget */}
      <div className="p-4 m-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-slate-300">Capaian Kuota</span>
          <span className="font-mono font-bold text-sky-400">{Math.round(strategicMetrics.achievementPercent)}%</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-sky-500 rounded-full"
            style={{ width: `${Math.min(100, strategicMetrics.achievementPercent)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
          <span>{selectedPeriod}</span>
          <span>Target {formatCompactPortofolio(monthlyTarget)}</span>
        </div>
      </div>

      {/* User Context & Role Footer */}
      <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div className="truncate">
          <span className="font-bold text-slate-200 block truncate">Sales Executive</span>
          <span className="text-[11px] text-slate-400 truncate block">Chemical & Instrumentation</span>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online" />
      </div>
    </aside>
  );
};
