import React, { useState, useMemo } from 'react';
import { 
  FlaskConical, 
  Search, 
  Filter, 
  Activity, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import { useSalesData } from '../context/SalesDataContext';
import { formatRupiah, formatCompactPortofolio } from '../utils/exportPresentation';
import { TestingServiceSummary } from '../types';

export const TestingCatalog: React.FC = () => {
  const { services, records } = useSalesData();

  const [searchQuery, setSearchQuery] = useState('');
  const [authorityFilter, setAuthorityFilter] = useState<'all' | 'my' | 'external'>('my');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach(s => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set);
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      if (authorityFilter === 'my' && !s.isMyAuthority) return false;
      if (authorityFilter === 'external' && s.isMyAuthority) return false;
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return s.serviceName.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [services, authorityFilter, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Katalog Instrumen & Pengujian</span>
            <span>·</span>
            <span>{filteredServices.length} Metode Aktif</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Katalog Layanan Instrumentasi & Pengujian Analitikal
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Tinjau portofolio metodologi instrumen canggih (IRMS, HPLC, GCMS, NMR, PSA, ICP-MS, XRF, TGA, Chemisorption). Evaluasi kontribusi volume sampel dan tarif unit DPP.
          </p>
        </div>

        {/* Quick summary strip */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-50 border border-sky-100 rounded-lg text-center">
            <span className="text-[11px] font-semibold text-sky-700 block">Metode Portofolio Saya</span>
            <span className="text-lg font-bold font-mono text-sky-900">
              {services.filter(s => s.isMyAuthority).length} Layanan
            </span>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-center">
            <span className="text-[11px] font-semibold text-emerald-700 block">Total Volume Sampel</span>
            <span className="text-lg font-bold font-mono text-emerald-900">
              {filteredServices.reduce((a, b) => a + b.sampleCount, 0)} Sampel
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama layanan, instrumen, metodologi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          {/* Authority */}
          <div>
            <select
              value={authorityFilter}
              onChange={(e) => setAuthorityFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-medium"
            >
              <option value="my">Portofolio Saya (Analitikal)</option>
              <option value="all">Semua Layanan Lab</option>
              <option value="external">Pengujian Walet (Non-Authority)</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-medium"
            >
              <option value="all">Kategori: Semua</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Services List Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Nama Layanan Pengujian</th>
                <th className="py-3 px-4">Kategori Instrumen</th>
                <th className="py-3 px-4 text-center">Volume Sampel</th>
                <th className="py-3 px-4 text-right">Rata-rata Tarif Unit (DPP)</th>
                <th className="py-3 px-4 text-right">Total Pendapatan (DPP)</th>
                <th className="py-3 px-4">Klien Utama Pengguna</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Tidak ada layanan yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredServices.map((srv, idx) => (
                  <tr key={srv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-sm">
                      <div className="flex items-start gap-2">
                        <span className="p-1 bg-slate-100 rounded text-slate-600 mt-0.5 shrink-0">
                          <FlaskConical className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <span>{srv.serviceName}</span>
                          {!srv.isMyAuthority && (
                            <span className="text-[10px] text-slate-400 block font-normal italic">
                              Non-Authority (Layanan Sarang Walet)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {srv.category}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                      {srv.sampleCount} Sampel
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {formatRupiah(srv.basePrice)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="font-mono font-bold tabular-nums text-slate-900 block">
                        {formatRupiah(srv.totalDppRevenue)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatCompactPortofolio(srv.totalDppRevenue)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs">
                      {srv.topClients && srv.topClients.length > 0 ? (
                        <div className="truncate" title={srv.topClients.join(', ')}>
                          {srv.topClients.slice(0, 3).join(', ')}
                          {srv.topClients.length > 3 && ` (+${srv.topClients.length - 3})`}
                        </div>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
