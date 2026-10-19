import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
  X,
  FileSpreadsheet,
  FileText,
  Briefcase,
  Layers,
  History,
  Tag,
  Download,
  Calendar
} from 'lucide-react';
import { useSalesData } from '../context/SalesDataContext';
import { ClientProfile, ClientElsaRecord, MasterSalesRecord } from '../types';
import { formatCompactPortofolio, formatRupiah } from '../utils/exportPresentation';
import { exportMasterDataToExcel } from '../utils/excelProcessor';

interface ClientListProps {
  onOpenJournalForClient: (clientName: string, picName: string) => void;
}

export const ClientList: React.FC<ClientListProps> = ({ onOpenJournalForClient }) => {
  const { clients, records } = useSalesData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  
  // Selected Client for Profile Card & Full ELSA ID History Modal
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [selectedElsaIdFilter, setSelectedElsaIdFilter] = useState<string>('all');

  // Pagination state (Max 50 per page as requested)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(50);

  // Unique industries
  const industries = useMemo(() => {
    const set = new Set<string>();
    clients.forEach(c => {
      if (c.industry) set.add(c.industry);
    });
    return Array.from(set);
  }, [clients]);

  // Filtered clients
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (tierFilter !== 'all' && c.clientTier !== tierFilter) return false;
      if (industryFilter !== 'all' && c.industry !== industryFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          c.companyName.toLowerCase().includes(q) ||
          c.contactPerson.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.nomorId && c.nomorId.toLowerCase().includes(q)) ||
          (c.allNomorIds && c.allNomorIds.some(id => id.toLowerCase().includes(q))) ||
          c.phone.includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [clients, statusFilter, tierFilter, industryFilter, searchQuery]);

  // Pagination calculation (Max 50 per page)
  const totalPages = Math.ceil(filteredClients.length / rowsPerPage) || 1;
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredClients.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredClients, currentPage, rowsPerPage]);

  // Selected client transactions and ELSA records
  const clientHistoryRecords = useMemo(() => {
    if (!selectedClient) return [];
    const history = selectedClient.elsaHistory || [];
    if (selectedElsaIdFilter === 'all') return history;
    return history.filter(h => h.nomorId === selectedElsaIdFilter);
  }, [selectedClient, selectedElsaIdFilter]);

  // Count orders per ELSA ID for selected client
  const elsaIdOrderCounts = useMemo(() => {
    if (!selectedClient) return new Map<string, number>();
    const map = new Map<string, number>();
    (selectedClient.elsaHistory || []).forEach(h => {
      const id = h.nomorId || selectedClient.nomorId || 'Tanpa ID';
      map.set(id, (map.get(id) || 0) + 1);
    });
    return map;
  }, [selectedClient]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Customer Relationship &amp; Loyalty</span>
            <span>·</span>
            <span>{filteredClients.length} Akun Terdaftar</span>
            <span>·</span>
            <span>Multi-ID ELSA Terintegrasi</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Direktori Klien &amp; Kumpulan Riwayat ID ELSA
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Pusat penyimpanan data klien tetap laboratorium. Satu klien dapat mengajukan beberapa ID ELSA dengan riwayat pengujian terperinci, spend portofolio disajikan dalam format M/K, dan monitoring akun churn risk.
          </p>
        </div>

        {/* Quick Stats Summary */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <span className="text-slate-500 block">Total Klien</span>
            <span className="text-lg font-bold font-mono text-slate-900">{clients.length}</span>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
            <span className="text-emerald-700 block">Akun Aktif</span>
            <span className="text-lg font-bold font-mono text-emerald-900">
              {clients.filter(c => c.status === 'Active').length}
            </span>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
            <span className="text-amber-700 block">Perlu Follow-up</span>
            <span className="text-lg font-bold font-mono text-amber-900">
              {clients.filter(c => c.status !== 'Active').length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Query */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari perusahaan, ID ELSA, kontak PIC, email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none font-medium"
            >
              <option value="all">Status Akun: Semua</option>
              <option value="Active">Active (Aktif)</option>
              <option value="At Risk">At Risk (Risiko Churn)</option>
              <option value="Dormant">Dormant (Pasif)</option>
            </select>
          </div>

          {/* Tier Filter */}
          <div>
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none font-medium"
            >
              <option value="all">Tier Loyalitas: Semua</option>
              <option value="Klien Baru">Klien Baru (2.5%)</option>
              <option value="Repeat Order <1 Thn">Repeat Order &lt;1 Thn (2.5%)</option>
              <option value="Klien Lama >1 Thn">Klien Lama &gt;1 Thn (2.0%)</option>
            </select>
          </div>

          {/* Industry Filter */}
          <div>
            <select
              value={industryFilter}
              onChange={(e) => {
                setIndustryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none font-medium"
            >
              <option value="all">Sektor Industri: Semua</option>
              {industries.map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Row-Based Clients Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0 z-10 font-semibold">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">No</th>
                
                {/* ID ELSA Column (User Request: 1 klien dapat memiliki banyak ID) */}
                <th className="py-2.5 px-3 min-w-[130px]">
                  <span>Kumpulan ID ELSA</span>
                </th>

                <th className="py-2.5 px-3 min-w-[180px]">
                  <span>Nama Perusahaan</span>
                </th>

                <th className="py-2.5 px-3 min-w-[140px]">
                  <span>Sektor Industri</span>
                </th>

                <th className="py-2.5 px-3 min-w-[180px]">
                  <span>PIC &amp; Kontak</span>
                </th>

                <th className="py-2.5 px-3 text-center whitespace-nowrap">
                  <span>Frekuensi RO</span>
                </th>

                {/* Spend Portofolio (M/K format) */}
                <th className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-sky-900">
                  <span>Spend Portofolio (M/K)</span>
                </th>

                {/* Total Spend DPP */}
                <th className="py-2.5 px-3 text-right whitespace-nowrap">
                  <span>Total Spend DPP</span>
                </th>

                <th className="py-2.5 px-3 text-center whitespace-nowrap">
                  <span>Status Loyalitas</span>
                </th>

                <th className="py-2.5 px-3 text-right whitespace-nowrap">
                  <span>Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedClients.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 italic">
                    Tidak ada akun klien yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client, idx) => {
                  const elsaIds = client.allNomorIds || (client.nomorId ? [client.nomorId] : []);
                  const primaryId = elsaIds[0] || client.nomorId || '-';
                  const extraIdsCount = elsaIds.length > 1 ? elsaIds.length - 1 : 0;

                  return (
                    <tr 
                      key={client.id} 
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-3 text-center font-mono text-slate-400 text-[11px]">
                        {(currentPage - 1) * rowsPerPage + idx + 1}
                      </td>

                      {/* Kumpulan ID ELSA (Prominent Column showing primary ID and extra IDs badge) */}
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                            {primaryId}
                          </span>
                          {extraIdsCount > 0 && (
                            <button
                              onClick={() => {
                                setSelectedClient(client);
                                setSelectedElsaIdFilter('all');
                              }}
                              className="font-mono text-[10px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-1.5 py-0.5 rounded border border-sky-200 transition-colors inline-flex items-center gap-0.5"
                              title={`Klien ini memiliki total ${elsaIds.length} ID ELSA terdaftar. Klik untuk melihat riwayat.`}
                            >
                              <Layers className="w-2.5 h-2.5" />
                              <span>+{extraIdsCount} ID</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Company Name */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 truncate max-w-[210px]" title={client.companyName}>
                          {client.companyName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Tier: <span className="font-medium text-slate-700">{client.clientTier}</span>
                        </div>
                      </td>

                      {/* Industry */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                        {client.industry || 'Umum'}
                      </td>

                      {/* Contact Info */}
                      <td className="py-3 px-3">
                        {client.contactPerson && (
                          <div className="font-medium text-slate-800 truncate max-w-[170px]" title={client.contactPerson}>
                            {client.contactPerson}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          {client.phone && <span>{client.phone}</span>}
                          {client.email && (
                            <>
                              <span>·</span>
                              <span className="truncate max-w-[120px]" title={client.email}>{client.email}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* RO Count */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-xs text-slate-900 px-2 py-0.5 bg-slate-100 rounded-md">
                          {client.totalOrdersCount}x Order
                        </span>
                      </td>

                      {/* Spend Portofolio Formatted as M and K (e.g. Rp 15.2 M or Rp 400 K) */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-bold text-xs text-sky-800">
                        {formatCompactPortofolio(client.portfolioDppSpend)}
                      </td>

                      {/* Total Spend DPP */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-xs text-slate-700">
                        {formatCompactPortofolio(client.totalDppSpend)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          client.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : client.status === 'At Risk'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {client.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onOpenJournalForClient(client.companyName, client.contactPerson)}
                            className="text-sky-700 hover:text-sky-900 font-semibold inline-flex items-center gap-0.5 px-2 py-1 hover:bg-sky-50 rounded"
                            title="Tulis jurnal follow-up untuk klien ini"
                          >
                            <span>Jurnal</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>

                          {/* Open Comprehensive Profile Card & All ELSA IDs History */}
                          <button
                            onClick={() => {
                              setSelectedClient(client);
                              setSelectedElsaIdFilter('all');
                            }}
                            className="text-slate-700 hover:text-slate-900 font-semibold inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                            title="Buka Kartu Profil Klien dan Riwayat Lengkap Seluruh ID ELSA"
                          >
                            <History className="w-3 h-3 text-slate-500" />
                            <span>Riwayat ID</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls (Max 50 per page as requested) */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>
              Menampilkan{' '}
              <strong className="font-semibold text-slate-900">
                {filteredClients.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
              </strong>{' '}
              sampai{' '}
              <strong className="font-semibold text-slate-900">
                {Math.min(currentPage * rowsPerPage, filteredClients.length)}
              </strong>{' '}
              dari{' '}
              <strong className="font-semibold text-slate-900">{filteredClients.length}</strong> akun klien
            </span>

            <span>·</span>

            <div className="flex items-center gap-1.5">
              <span>Baris per halaman:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold focus:outline-none"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50 (Maksimal)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
              title="Halaman sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 font-mono font-medium">
              Halaman {currentPage} dari {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
              title="Halaman berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* USER REQUESTED MODAL: Kartu Profil & Modal Riwayat Lengkap Seluruh ID ELSA Per Klien */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-xl border border-slate-200 animate-fade-in max-h-[92vh] overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold text-slate-900">{selectedClient.companyName}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    selectedClient.status === 'Active' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {selectedClient.status}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                    {selectedClient.clientTier}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                  <span>Sektor: <strong>{selectedClient.industry}</strong></span>
                  <span>·</span>
                  <span>Transaksi Pertama: <strong>{selectedClient.firstTransactionDate}</strong></span>
                  <span>·</span>
                  <span>Transaksi Terakhir: <strong>{selectedClient.lastTransactionDate}</strong></span>
                </p>
              </div>

              <button 
                onClick={() => setSelectedClient(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SECTION 1: KARTU PROFIL KLIEN & KUMPULAN SELURUH ID ELSA */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-sky-700" />
                  <span>Kumpulan ID ELSA Terdaftar Pada Klien Ini (Total {(selectedClient.allNomorIds || []).length} ID)</span>
                </h4>
                <span className="text-[11px] text-slate-500 italic">
                  Klik ID untuk memfilter riwayat di bawah
                </span>
              </div>

              {/* Chips / Cards for all ELSA IDs */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSelectedElsaIdFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedElsaIdFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Semua ID ({selectedClient.elsaHistory?.length || selectedClient.totalOrdersCount} Transaksi)
                </button>

                {(selectedClient.allNomorIds || [selectedClient.nomorId]).map(elsaId => {
                  const count = elsaIdOrderCounts.get(elsaId) || 0;
                  const isSelected = selectedElsaIdFilter === elsaId;

                  return (
                    <button
                      key={elsaId}
                      onClick={() => setSelectedElsaIdFilter(isSelected ? 'all' : elsaId)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-sky-600 text-white shadow-xs ring-2 ring-sky-300'
                          : 'bg-white text-slate-800 border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50'
                      }`}
                    >
                      <Tag className="w-3 h-3 text-sky-500" />
                      <span>ID: {elsaId}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-sans font-semibold ${
                        isSelected ? 'bg-sky-800 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {count}x Order
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* PIC Contact Strip */}
              <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Nama PIC</span>
                  <span className="font-semibold text-slate-900">{selectedClient.contactPerson || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Kontak Telepon</span>
                  <span className="font-mono text-slate-900">{selectedClient.phone || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Email PIC</span>
                  <span className="font-mono text-slate-900 truncate block">{selectedClient.email || '-'}</span>
                </div>
              </div>
            </div>

            {/* Financial Overview (Spend format M/K) */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Total Order Ulang</span>
                <span className="text-lg font-bold font-mono text-slate-900">{selectedClient.totalOrdersCount}x Transaksi</span>
              </div>
              <div className="p-3 bg-sky-50 rounded-lg border border-sky-200">
                <span className="text-[10px] text-sky-700 block uppercase font-semibold">Spend Portofolio (M &amp; K)</span>
                <span className="text-lg font-bold font-mono text-sky-900">{formatCompactPortofolio(selectedClient.portfolioDppSpend)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Total Nilai DPP</span>
                <span className="text-lg font-bold font-mono text-slate-900">{formatRupiah(selectedClient.totalDppSpend)}</span>
              </div>
            </div>

            {/* SECTION 2: MODAL RIWAYAT LENGKAP SELURUH ID ELSA PER KLIEN */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-700" />
                  <span>
                    Tabel Riwayat Lengkap Seluruh Order ({clientHistoryRecords.length} Transaksi
                    {selectedElsaIdFilter !== 'all' && ` untuk ID ELSA ${selectedElsaIdFilter}`})
                  </span>
                </h4>
                {selectedElsaIdFilter !== 'all' && (
                  <button
                    onClick={() => setSelectedElsaIdFilter('all')}
                    className="text-xs text-sky-700 hover:text-sky-900 underline font-medium"
                  >
                    Tampilkan Semua ID
                  </button>
                )}
              </div>

              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal</th>
                      {/* Prominent ID ELSA Column in History */}
                      <th className="py-2.5 px-3 font-bold text-sky-900">ID ELSA</th>
                      <th className="py-2.5 px-3">Invoice</th>
                      <th className="py-2.5 px-3 min-w-[200px]">Layanan Pengujian</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">DPP (IDR)</th>
                      <th className="py-2.5 px-3 text-center">Portofolio</th>
                      <th className="py-2.5 px-3 text-center">Bayar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {clientHistoryRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                          Tidak ada riwayat pengujian untuk ID ELSA ini.
                        </td>
                      </tr>
                    ) : (
                      clientHistoryRecords.map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                            {t.date}
                          </td>
                          {/* ID ELSA Badge */}
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-slate-900">
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {t.nomorId || '-'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {t.invoice}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-slate-900 line-clamp-1" title={t.service}>
                              {t.service}
                            </div>
                            {t.needsCorrection && (
                              <span className="text-[10px] font-bold text-amber-700">
                                ⚠️ Memerlukan koreksi khusus
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">{t.sampleCount}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                            {formatRupiah(t.dpp)}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              t.isMyAuthority ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {t.isMyAuthority ? 'Analitikal' : 'Walet'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              t.paymentStatus === 'Lunas' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {t.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  onOpenJournalForClient(selectedClient.companyName, selectedClient.contactPerson);
                  setSelectedClient(null);
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <span>Catat Jurnal Follow-up Klien Ini</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setSelectedClient(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
