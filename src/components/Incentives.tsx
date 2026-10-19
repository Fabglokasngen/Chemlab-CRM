import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Download, 
  Filter, 
  Search, 
  HelpCircle,
  FileSpreadsheet,
  TrendingUp,
  Percent,
  CheckSquare,
  Square,
  SlidersHorizontal,
  ChevronDown,
  X
} from 'lucide-react';
import { useSalesData } from '../context/SalesDataContext';
import { formatRupiah, formatCompactPortofolio } from '../utils/exportPresentation';
import { exportMasterDataToExcel } from '../utils/excelProcessor';

export const Incentives: React.FC = () => {
  const { 
    records, 
    strategicMetrics, 
    selectedPeriod,
    selectedIncentiveIds,
    toggleIncentiveRecord,
    toggleIncentiveByElsaId,
    selectAllIncentives,
    deselectAllIncentives 
  } = useSalesData();

  const [paymentFilter, setPaymentFilter] = useState<'all' | 'Lunas' | 'Belum Lunas'>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectionFilter, setSelectionFilter] = useState<'all' | 'selected' | 'unselected'>('all');
  const [elsaFilter, setElsaFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isElsaSelectorOpen, setIsElsaSelectorOpen] = useState(false);

  // Filter only user's analytical portfolio for their sales incentive
  const myRecords = useMemo(() => {
    return records.filter(r => r.isMyAuthority);
  }, [records]);

  // Distinct ID ELSAs with stats
  const distinctElsaList = useMemo(() => {
    const map = new Map<string, { company: string; count: number; totalDpp: number; allSelected: boolean; someSelected: boolean }>();
    
    myRecords.forEach(r => {
      const elsa = r.nomorId || 'Tanpa-ID';
      const existing = map.get(elsa);
      if (existing) {
        existing.count += 1;
        existing.totalDpp += (r.dppTotal || 0);
      } else {
        map.set(elsa, {
          company: r.company,
          count: 1,
          totalDpp: (r.dppTotal || 0),
          allSelected: false,
          someSelected: false
        });
      }
    });

    // Determine selection state per ELSA
    map.forEach((val, elsa) => {
      const elsaRecords = myRecords.filter(r => (r.nomorId || 'Tanpa-ID') === elsa);
      const selectedCount = elsaRecords.filter(r => selectedIncentiveIds.includes(r.id)).length;
      val.allSelected = selectedCount === elsaRecords.length && elsaRecords.length > 0;
      val.someSelected = selectedCount > 0 && selectedCount < elsaRecords.length;
    });

    return Array.from(map.entries()).map(([elsaId, data]) => ({
      elsaId,
      ...data
    })).sort((a, b) => b.totalDpp - a.totalDpp);
  }, [myRecords, selectedIncentiveIds]);

  // Filtered incentives
  const filteredIncentives = useMemo(() => {
    return myRecords.filter(r => {
      if (paymentFilter !== 'all' && r.paymentStatus !== paymentFilter) return false;
      if (tierFilter !== 'all' && r.clientTier !== tierFilter) return false;
      if (elsaFilter !== 'all' && r.nomorId !== elsaFilter) return false;

      const isSelected = selectedIncentiveIds.includes(r.id);
      if (selectionFilter === 'selected' && !isSelected) return false;
      if (selectionFilter === 'unselected' && isSelected) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.company.toLowerCase().includes(q) ||
          r.invoice.toLowerCase().includes(q) ||
          (r.nomorId && r.nomorId.toLowerCase().includes(q)) ||
          r.layananPengujian.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [myRecords, paymentFilter, tierFilter, elsaFilter, selectionFilter, searchQuery, selectedIncentiveIds]);

  // Calculate incentives ONLY for selected transactions
  const selectedRecords = useMemo(() => {
    return myRecords.filter(r => selectedIncentiveIds.includes(r.id));
  }, [myRecords, selectedIncentiveIds]);

  const totalCalculated = useMemo(() => {
    return selectedRecords.reduce((sum, r) => sum + (r.incentiveAmount || 0), 0);
  }, [selectedRecords]);

  const paidCalculated = useMemo(() => {
    return selectedRecords
      .filter(r => r.paymentStatus === 'Lunas')
      .reduce((sum, r) => sum + (r.incentiveAmount || 0), 0);
  }, [selectedRecords]);

  const pendingCalculated = useMemo(() => {
    return selectedRecords
      .filter(r => r.paymentStatus !== 'Lunas')
      .reduce((sum, r) => sum + (r.incentiveAmount || 0), 0);
  }, [selectedRecords]);

  const selectedDppTotal = useMemo(() => {
    return selectedRecords.reduce((sum, r) => sum + (r.dppTotal || 0), 0);
  }, [selectedRecords]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Perhitungan Komisi Sales Otomatis</span>
            <span>·</span>
            <span>{selectedPeriod}</span>
            <span>·</span>
            <span className="text-sky-700 font-bold">{selectedRecords.length} Penjualan Terpilih</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Kalkulator & Rekap Insentif Berdasarkan ID ELSA
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Pilih secara spesifik transaksi atau ID ELSA mana yang memenuhi syarat komisi insentif. Insentif dihitung akurat dari DPP sebelum PPN 11% (Klien Baru: 2.5%, Repeat &lt;1 Thn: 2.5%, Klien Lama: 2.0%).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsElsaSelectorOpen(!isElsaSelectorOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600" />
            <span>Pilih Berdasarkan ID ELSA</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          <button
            onClick={() => exportMasterDataToExcel(selectedRecords, `Rekap_Insentif_Terpilih_${selectedPeriod.replace(/\s+/g, '_')}.xlsx`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Rekap Insentif (.XLSX)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Total, Paid, Pending (Computed exclusively from Selected Sales) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Estimasi Insentif</span>
            <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
              {formatRupiah(totalCalculated)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Dari {selectedRecords.length} transaksi terpilih</span>
              <span className="font-mono text-slate-700">DPP: {formatCompactPortofolio(selectedDppTotal)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase">Sudah Dapat Dicairkan (Lunas)</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-emerald-800 tabular-nums">
              {formatRupiah(paidCalculated)}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">
              Dari invoice yang sudah lunas dibayar
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Menunggu Pelunasan (Pending)</span>
            <span className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-700 tabular-nums">
              {formatRupiah(pendingCalculated)}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">
              Menunggu konfirmasi pelunasan tagihan
            </span>
          </div>
        </div>
      </div>

      {/* ID ELSA Quick Multi-Selector Drawer / Panel */}
      {isElsaSelectorOpen && (
        <div className="bg-white border-2 border-sky-200 rounded-xl p-5 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Pilih Penjualan Berdasarkan ID ELSA</span>
                <span className="text-xs font-mono font-normal text-slate-500">
                  ({distinctElsaList.length} ID ELSA terdaftar)
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Centang ID ELSA di bawah untuk memasukkan atau mengecualikan seluruh transaksi dari klien tersebut ke dalam perhitungan insentif.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={selectAllIncentives}
                className="px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md transition-colors"
              >
                Pilih Semua
              </button>
              <button
                onClick={deselectAllIncentives}
                className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
              >
                Batalkan Semua
              </button>
              <button
                onClick={() => setIsElsaSelectorOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick chips / grid of ID ELSAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
            {distinctElsaList.map(item => {
              const isChecked = item.allSelected;
              const isPartial = item.someSelected;

              return (
                <div
                  key={item.elsaId}
                  onClick={() => toggleIncentiveByElsaId(item.elsaId, !isChecked)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                    isChecked 
                      ? 'bg-sky-50/80 border-sky-300 text-slate-900' 
                      : isPartial
                      ? 'bg-amber-50/60 border-amber-300 text-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    ref={input => {
                      if (input) input.indeterminate = isPartial;
                    }}
                    onChange={() => {}} // handled by parent onClick
                    className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono font-bold text-slate-900 truncate">
                        {item.elsaId}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {item.count} order
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-700 truncate mt-0.5" title={item.company}>
                      {item.company}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      DPP: {formatCompactPortofolio(item.totalDpp)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rules explainer card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <Percent className="w-4 h-4 text-sky-700 shrink-0" />
          <span>
            <strong>Aturan Resmi Perhitungan Insentif:</strong> Klien Baru = <strong>2,5%</strong> dari DPP · Repeat Order (&lt;1 Thn) = <strong>2,5%</strong> dari DPP · Klien Lama (&gt;1 Thn) = <strong>2,0%</strong> dari DPP.
          </span>
        </div>
        <span className="text-[11px] text-slate-500 shrink-0">
          PPN 11% dikecualikan secara otomatis
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari ID ELSA, perusahaan, invoice, layanan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          {/* Selection Filter */}
          <div>
            <select
              value={selectionFilter}
              onChange={(e) => setSelectionFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-medium"
            >
              <option value="all">Pilihan Insentif: Semua</option>
              <option value="selected">Terpilih Saja ({selectedRecords.length})</option>
              <option value="unselected">Belum Terpilih ({myRecords.length - selectedRecords.length})</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-medium"
            >
              <option value="all">Status Pencairan: Semua</option>
              <option value="Lunas">Lunas (Dapat Dicairkan)</option>
              <option value="Belum Lunas">Belum Lunas (Pending)</option>
            </select>
          </div>

          {/* Tier Filter */}
          <div>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-medium"
            >
              <option value="all">Tier Klien: Semua</option>
              <option value="Klien Baru">Klien Baru (2.5%)</option>
              <option value="Repeat Order <1 Thn">Repeat Order &lt;1 Thn (2.5%)</option>
              <option value="Klien Lama >1 Thn">Klien Lama &gt;1 Thn (2.0%)</option>
            </select>
          </div>
        </div>

        {/* Live Status Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span>
              Menampilkan <strong className="text-slate-900 font-semibold">{filteredIncentives.length}</strong> baris transaksi
            </span>
            <span>·</span>
            <span className="text-sky-800 font-semibold">
              {filteredIncentives.filter(r => selectedIncentiveIds.includes(r.id)).length} masuk insentif
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const filteredIds = filteredIncentives.map(r => r.id);
                const merged = Array.from(new Set([...selectedIncentiveIds, ...filteredIds]));
                useSalesData().setSelectedIncentiveIds(merged);
              }}
              className="text-xs text-sky-700 hover:text-sky-900 font-medium"
            >
              Pilih Semua Baris Ini
            </button>
            <span>·</span>
            <button
              onClick={() => {
                const filteredIds = filteredIncentives.map(r => r.id);
                const next = selectedIncentiveIds.filter(id => !filteredIds.includes(id));
                useSalesData().setSelectedIncentiveIds(next);
              }}
              className="text-xs text-slate-600 hover:text-rose-700 font-medium"
            >
              Batalkan Baris Ini
            </button>
          </div>
        </div>
      </div>

      {/* Incentives Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                {/* Select Checkbox Column */}
                <th className="py-3 px-3 w-10 text-center">Pilih</th>
                <th className="py-3 px-3 w-10 text-center">No</th>
                
                {/* Dedicated ID ELSA Column */}
                <th className="py-3 px-3 whitespace-nowrap min-w-[100px]">ID ELSA</th>
                
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3 min-w-[180px]">Perusahaan / Klien</th>
                <th className="py-3 px-3">Invoice</th>
                <th className="py-3 px-3 min-w-[220px]">Layanan Pengujian</th>
                <th className="py-3 px-3 text-right">Nilai DPP</th>
                <th className="py-3 px-3 text-center">Tier Klien</th>
                <th className="py-3 px-3 text-center">Rate</th>
                <th className="py-3 px-3 text-right">Komisi Insentif</th>
                <th className="py-3 px-3 text-center">Status Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredIncentives.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500">
                    Tidak ada data transaksi insentif yang cocok dengan kriteria.
                  </td>
                </tr>
              ) : (
                filteredIncentives.map((r, idx) => {
                  const isSelected = selectedIncentiveIds.includes(r.id);

                  return (
                    <tr 
                      key={r.id} 
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-white' : 'bg-slate-50/50 text-slate-400 opacity-60'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleIncentiveRecord(r.id)}
                          className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                          title="Centang untuk memasukkan ke perhitungan insentif"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>

                      {/* ID ELSA Column */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {r.nomorId ? (
                          <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {r.nomorId}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {r.tanggalSampel}
                      </td>

                      <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        {r.company}
                      </td>

                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {r.invoice}
                      </td>

                      <td className="py-2.5 px-3 max-w-xs truncate" title={r.layananPengujian}>
                        {r.layananPengujian}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-medium tabular-nums whitespace-nowrap">
                        {formatRupiah(r.dppTotal)}
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="text-[11px] font-medium text-slate-600">{r.clientTier}</span>
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                        {r.incentiveRate}%
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                        <span className={isSelected ? 'text-amber-700' : 'text-slate-400 line-through'}>
                          {formatRupiah(r.incentiveAmount)}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                          r.paymentStatus === 'Lunas' ? 'text-emerald-700' : 'text-slate-400'
                        }`}>
                          {r.paymentStatus === 'Lunas' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Lunas</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>Pending</span>
                            </>
                          )}
                        </span>
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
  );
};
