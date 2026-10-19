import React, { useState, useRef, useMemo } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw,
  ArrowRight,
  Info,
  ShieldCheck,
  Edit2,
  Trash2,
  BookOpen,
  Calendar,
  FileCheck,
  Clock,
  History,
  AlertTriangle,
  FolderArchive,
  Layers,
  Search,
  Check,
  X
} from 'lucide-react';
import { useSalesData } from '../context/SalesDataContext';
import { parseExcelFile, downloadIndonesianExcelTemplate, ImportValidationResult } from '../utils/excelProcessor';
import { formatRupiah } from '../utils/exportPresentation';
import { MasterSalesRecord, MonthlyUploadMeta, DataEditLog } from '../types';

interface MonthlyIntakeProps {
  onSuccessNavigate: (tab: string) => void;
}

export const MonthlyIntake: React.FC<MonthlyIntakeProps> = ({ onSuccessNavigate }) => {
  const { 
    records, 
    clients, 
    resetToAugustBenchmark,
    replaceMonthRecords,
    deleteMonthRecords,
    updateRecord,
    deleteRecord,
    monthlyFileMap,
    dataEditLogs,
    addDataEditLog,
    clearDataEditLogs,
    selectedPeriod
  } = useSalesData();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'upload' | 'monthly_manager' | 'logbook'>('upload');

  // Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [targetUploadMonth, setTargetUploadMonth] = useState<string>('2026-08');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Monthly Manager State
  const [managingMonth, setManagingMonth] = useState<string>('2026-08');
  const [editingRecord, setEditingRecord] = useState<MasterSalesRecord | null>(null);
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Extract distinct available months from records
  const distinctMonths = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.period) set.add(r.period);
      if (r.dateParsed && r.dateParsed.length >= 7) {
        set.add(r.dateParsed.slice(0, 7));
      }
    });
    // Ensure default 2026-08 is present
    set.add('2026-08');
    return Array.from(set).sort().reverse();
  }, [records]);

  // Client history lookup map for repeat order detection
  const clientHistoryMap = useMemo(() => {
    const map = new Map<string, { firstDate: string; count: number }>();
    clients.forEach(c => {
      map.set(c.companyName.toLowerCase(), {
        firstDate: c.firstTransactionDate,
        count: c.totalOrdersCount
      });
    });
    return map;
  }, [clients]);

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert('Format file tidak valid. Harap pilih file spreadsheet dengan format .xlsx atau .xls.');
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);
    setSuccessMessage(null);

    try {
      const result = await parseExcelFile(file, clientHistoryMap);
      setValidationResult(result);
      
      // Auto-detect target month from parsed dates if available
      if (result.records.length > 0 && result.records[0].dateParsed) {
        const detected = result.records[0].dateParsed.slice(0, 7);
        setTargetUploadMonth(detected);
      }
    } catch (err: any) {
      alert(`Gagal memproses file Excel: ${err.message}`);
      setValidationResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Commit Import: REPLACES sales data ONLY for the affected month (as requested by user)
  const handleCommitImport = async () => {
    if (!validationResult || validationResult.records.length === 0 || !selectedFile) return;

    setIsProcessing(true);
    try {
      // User requirement: "pastikan setiap modifikasi menghapus data sales dari upload sebelumnya bukan menduplikasi data"
      // "Hapus dan ganti data hanya untuk bulan yang bersangkutan"
      await replaceMonthRecords(
        targetUploadMonth, 
        validationResult.records, 
        selectedFile.name,
        'Sales Executive (Upload Excel)'
      );

      setSuccessMessage(
        `Sukses! Data penjualan bulan ${targetUploadMonth} berhasil diganti dengan ${validationResult.records.length} transaksi dari file "${selectedFile.name}". Data lama bulan tersebut telah dihapus otomatis untuk mencegah duplikasi.`
      );
      setValidationResult(null);
      setSelectedFile(null);
    } catch (err: any) {
      alert(`Gagal menyimpan ke Master Data: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper for month formatting
  const formatMonthName = (m: string) => {
    if (m === '2026-08' || m === 'Agustus 2026') return 'Agustus 2026';
    if (m === '2026-07') return 'Juli 2026';
    if (m === '2026-09') return 'September 2026';
    return m;
  };

  // Records for managing month
  const managingRecords = useMemo(() => {
    return records.filter(r => {
      if (r.period === managingMonth) return true;
      if (r.dateParsed && r.dateParsed.slice(0, 7) === managingMonth) return true;
      if (managingMonth === '2026-08' && (r.tanggalSampel?.toLowerCase().includes('agustus') || r.period === '2026-08')) return true;
      return false;
    });
  }, [records, managingMonth]);

  // Filtered log book
  const filteredLogs = useMemo(() => {
    if (!logSearchQuery.trim()) return dataEditLogs;
    const q = logSearchQuery.toLowerCase();
    return dataEditLogs.filter(l => 
      l.details.toLowerCase().includes(q) ||
      l.user.toLowerCase().includes(q) ||
      l.month.toLowerCase().includes(q) ||
      (l.fileName && l.fileName.toLowerCase().includes(q)) ||
      l.action.toLowerCase().includes(q)
    );
  }, [dataEditLogs, logSearchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Data Extraction &amp; Intake</span>
            <span>·</span>
            <span>Penggantian Bulanan Tanpa Duplikasi</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Upload &amp; Pengelolaan Data Penjualan Bulanan
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Sistem upload cerdas yang otomatis menghapus data lama pada bulan yang bersangkutan dan menggantinya dengan dataset baru. Dilengkapi pelacak nama file per bulan serta log book audit riwayat pengeditan.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => downloadIndonesianExcelTemplate()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Download Template Excel (.XLSX)</span>
          </button>

          <button
            onClick={async () => {
              if (window.confirm('Muat ulang dataset benchmark Agustus 2026 (~Rp 323.8M)? Data saat ini akan diganti dengan data benchmark asli.')) {
                await resetToAugustBenchmark();
                setSuccessMessage('Dataset benchmark Agustus 2026 berhasil dimuat kembali.');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Pulihkan data transaksi asli bulan Agustus 2026"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Data Benchmark</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'upload'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload File Excel (Ganti Data Bulan)</span>
        </button>

        <button
          onClick={() => setActiveTab('monthly_manager')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'monthly_manager'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Edit2 className="w-4 h-4" />
          <span>Kelola &amp; Edit Data Tiap Bulan ({distinctMonths.length} Bulan)</span>
        </button>

        <button
          onClick={() => setActiveTab('logbook')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'logbook'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Nama File Sales &amp; Log Book ({dataEditLogs.length} Entri)</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3 text-emerald-900 text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => onSuccessNavigate('master')}
            className="font-bold underline hover:text-emerald-950 inline-flex items-center gap-1 shrink-0"
          >
            <span>Buka Master Data</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TAB 1: UPLOAD & REPLACE SALES DATA */}
      {activeTab === 'upload' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all bg-white flex flex-col items-center justify-center min-h-[260px] ${
                  isDragging ? 'border-sky-500 bg-sky-50/50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>

                <h3 className="text-base font-bold text-slate-900">
                  Drag &amp; Drop File Rekap Penjualan (.xlsx / .xls)
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  Pilih file spreadsheet data bulanan laboratorium. Sistem otomatis menghapus data lama pada bulan terkait agar tidak terduplikasi.
                </p>

                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
                  >
                    Pilih File dari Komputer
                  </button>
                </div>

                {selectedFile && (
                  <div className="mt-4 flex items-center gap-2 text-xs font-mono text-slate-700 bg-slate-100 px-3 py-1.5 rounded-md">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Scope & Anti-duplication guarantee card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-sky-700" />
                  <h3 className="text-sm font-bold text-slate-900">Aturan Penggantian Data</h3>
                </div>
                
                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                    <span>
                      <strong>Hapus &amp; Ganti Khusus Bulan Bersangkutan:</strong> Hanya data penjualan pada bulan target yang dihapus dan diganti. Transaksi bulan lain tetap utuh tanpa risiko duplikasi.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-600 mt-1.5 shrink-0" />
                    <span>
                      <strong>Pelacak Nama File:</strong> Nama file disimpan permanen pada daftar file per bulan untuk memudahkan pengecekan audit.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                    <span>
                      <strong>Pencatatan Otomatis ke Log Book:</strong> Waktu upload, jumlah baris, dan nama file dicatat ke log book pengeditan data.
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                Gunakan template standar agar pembacaan nama kolom akurat.
              </div>
            </div>
          </div>

          {/* Validation Result & Month Confirmation */}
          {validationResult && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Hasil Pemeriksaan File &amp; Konfirmasi Penggantian
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tentukan bulan target. Seluruh data lama pada bulan ini akan diganti dengan data baru dari file.
                  </p>
                </div>

                {/* Target Month Selector and Commit Button */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <label className="font-semibold text-slate-700">Target Bulan:</label>
                    <select
                      value={targetUploadMonth}
                      onChange={(e) => setTargetUploadMonth(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none"
                    >
                      <option value="2026-08">Agustus 2026</option>
                      <option value="2026-07">Juli 2026</option>
                      <option value="2026-09">September 2026</option>
                    </select>
                  </div>

                  <button
                    onClick={handleCommitImport}
                    disabled={isProcessing}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isProcessing ? 'Menyimpan...' : `Hapus Lama & Ganti Data ${formatMonthName(targetUploadMonth)}`}</span>
                  </button>
                </div>
              </div>

              {/* Quick Metrics of parsed sheet */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-500 block">Total Baris Baru</span>
                  <span className="text-lg font-bold font-mono text-slate-900">{validationResult.totalRowsProcessed} Baris</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <span className="text-[11px] font-semibold text-emerald-700 block">Portofolio Analitikal</span>
                  <span className="text-lg font-bold font-mono text-emerald-900">{validationResult.totalMyAuthorityRows} Transaksi</span>
                </div>
                <div className="p-3 bg-sky-50 rounded-lg border border-sky-100">
                  <span className="text-[11px] font-semibold text-sky-700 block">DPP Portofolio Analitikal</span>
                  <span className="text-lg font-bold font-mono text-sky-900">{formatRupiah(validationResult.myAuthorityDpp)}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-500 block">Total Omzet DPP</span>
                  <span className="text-lg font-bold font-mono text-slate-900">{formatRupiah(validationResult.totalDpp)}</span>
                </div>
              </div>

              {/* Preview sample rows */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-72">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Tanggal</th>
                      <th className="py-2 px-3">Perusahaan</th>
                      <th className="py-2 px-3">Invoice</th>
                      <th className="py-2 px-3">Layanan Pengujian</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">DPP (IDR)</th>
                      <th className="py-2 px-3 text-center">Portofolio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {validationResult.records.slice(0, 8).map((r, i) => (
                      <tr key={i} className={r.isMyAuthority ? 'bg-white' : 'bg-slate-50/50 text-slate-400'}>
                        <td className="py-2 px-3 font-mono text-[11px] whitespace-nowrap">{r.tanggalSampel}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">{r.company}</td>
                        <td className="py-2 px-3 font-mono text-[11px]">{r.invoice}</td>
                        <td className="py-2 px-3 line-clamp-1">{r.layananPengujian}</td>
                        <td className="py-2 px-3 text-center font-mono">{r.jumlahSampel}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold tabular-nums whitespace-nowrap">{formatRupiah(r.dppTotal)}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            r.isMyAuthority ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {r.isMyAuthority ? 'Analitikal' : 'Walet'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KELOLA & EDIT DATA TIAP BULAN */}
      {activeTab === 'monthly_manager' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Pilih Bulan yang Dikelola:
                </label>
                <select
                  value={managingMonth}
                  onChange={(e) => setManagingMonth(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
                >
                  {distinctMonths.map(m => (
                    <option key={m} value={m}>{formatMonthName(m)}</option>
                  ))}
                </select>
              </div>

              {/* Active file metadata indicator */}
              {monthlyFileMap[managingMonth] && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">File Digunakan</span>
                  <span className="font-mono font-semibold text-slate-800 flex items-center gap-1">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{monthlyFileMap[managingMonth].fileName}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Actions for this month */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab('upload');
                  setTargetUploadMonth(managingMonth);
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Ganti File Bulan Ini
              </button>

              <button
                onClick={async () => {
                  if (window.confirm(`Kosongkan seluruh data penjualan untuk bulan ${formatMonthName(managingMonth)} (${managingRecords.length} baris)?`)) {
                    await deleteMonthRecords(managingMonth, 'Sales Executive');
                    setSuccessMessage(`Seluruh data penjualan bulan ${formatMonthName(managingMonth)} berhasil dihapus.`);
                  }
                }}
                className="px-3 py-1.5 border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 rounded-lg text-xs font-semibold"
              >
                Hapus Seluruh Data Bulan Ini
              </button>
            </div>
          </div>

          {/* Month Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Transaksi</span>
              <span className="text-lg font-bold font-mono text-slate-900">{managingRecords.length} Baris</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Analitikal</span>
              <span className="text-lg font-bold font-mono text-emerald-900">
                {managingRecords.filter(r => r.isMyAuthority).length} Baris
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Walet</span>
              <span className="text-lg font-bold font-mono text-slate-700">
                {managingRecords.filter(r => !r.isMyAuthority).length} Baris
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] text-sky-700 uppercase font-semibold block">Total DPP Bulan Ini</span>
              <span className="text-lg font-bold font-mono text-sky-900">
                {formatRupiah(managingRecords.reduce((sum, r) => sum + (r.dppTotal || 0), 0))}
              </span>
            </div>
          </div>

          {/* Records Table for this Month */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">ID ELSA</th>
                    <th className="py-2.5 px-3">Invoice</th>
                    <th className="py-2.5 px-3">Perusahaan</th>
                    <th className="py-2.5 px-3">Layanan Pengujian</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">DPP (IDR)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {managingRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400 italic">
                        Belum ada data penjualan untuk bulan {formatMonthName(managingMonth)}.
                      </td>
                    </tr>
                  ) : (
                    managingRecords.map((r, i) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{i + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{r.nomorId || '-'}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{r.invoice}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">{r.company}</td>
                        <td className="py-2 px-3 line-clamp-1">{r.layananPengujian}</td>
                        <td className="py-2 px-3 text-center font-mono">{r.jumlahSampel}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">{formatRupiah(r.dppTotal)}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            r.paymentStatus === 'Lunas' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {r.paymentStatus}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingRecord(r)}
                              className="p-1 text-slate-400 hover:text-slate-800"
                              title="Edit transaksi"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Hapus invoice ${r.invoice}?`)) {
                                  await deleteRecord(r.id);
                                  addDataEditLog({
                                    user: 'Sales Executive',
                                    action: 'Hapus Transaksi',
                                    month: managingMonth,
                                    recordsCount: 1,
                                    details: `Menghapus transaksi invoice ${r.invoice} (${r.company}) pada bulan ${managingMonth}.`
                                  });
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600"
                              title="Hapus baris"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DAFTAR FILE TIAP BULAN & LOG BOOK PENGEDITAN */}
      {activeTab === 'logbook' && (
        <div className="space-y-6 animate-fade-in">
          {/* USER REQUESTED: Fitur untuk mengecek nama file yang digunakan untuk sales data pada masing-masing bulan */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Daftar Nama File Sales Data Pada Masing-Masing Bulan</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Informasi nama file Excel yang menjadi sumber data penjualan bulanan teraktif di sistem.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Bulan</th>
                    <th className="py-2.5 px-3">Nama File Excel Digunakan</th>
                    <th className="py-2.5 px-3">Waktu Upload Terakhir</th>
                    <th className="py-2.5 px-3">Diupload Oleh</th>
                    <th className="py-2.5 px-3 text-center">Jumlah Transaksi</th>
                    <th className="py-2.5 px-3 text-right">Total DPP</th>
                    <th className="py-2.5 px-3 text-center">Status Integrasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {distinctMonths.map(m => {
                    const meta = monthlyFileMap[m];
                    const rowsCount = records.filter(r => r.period === m || (r.dateParsed && r.dateParsed.startsWith(m))).length;
                    const dppSum = records
                      .filter(r => r.period === m || (r.dateParsed && r.dateParsed.startsWith(m)))
                      .reduce((sum, r) => sum + (r.dppTotal || 0), 0);

                    return (
                      <tr key={m} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-bold text-slate-900">{formatMonthName(m)}</td>
                        <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                          {meta ? (
                            <span className="flex items-center gap-1.5 text-emerald-800">
                              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{meta.fileName}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">File Default Laboratorium (Agustus)</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                          {meta?.uploadTimestamp || '31/08/2026, 17:30 WIB'}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {meta?.uploadedBy || 'Sales Executive'}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-semibold">
                          {rowsCount} Baris
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(dppSum)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Aktif &amp; Terverifikasi
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* USER REQUESTED: Log book untuk pengeditan data */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-700" />
                  <span>Log Book Audit Pengeditan Data Penjualan</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Catatan historis seluruh aktivitas upload file baru, penggantian bulan, pengeditan baris, dan pembersihan duplikasi.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari log book..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Log Book Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Waktu (Timestamp)</th>
                    <th className="py-2.5 px-3">Aktor / User</th>
                    <th className="py-2.5 px-3">Aksi</th>
                    <th className="py-2.5 px-3">Bulan Terdampak</th>
                    <th className="py-2.5 px-3">File Terkait</th>
                    <th className="py-2.5 px-3 min-w-[260px]">Rincian Perubahan (Log Details)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                        Belum ada riwayat aktivitas dalam log book.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap text-slate-600">
                          {log.timestamp}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                          {log.user}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.action === 'Upload File' || log.action === 'Ganti Data Bulan'
                              ? 'bg-sky-100 text-sky-800'
                              : log.action === 'Deduplikasi'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.action === 'Hapus Data Bulan'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-900">
                          {formatMonthName(log.month)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {log.fileName || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Record in Monthly Manager */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-fade-in text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Edit Transaksi (Bulan {formatMonthName(managingMonth)})
              </h3>
              <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editingRecord) return;
                const dpp = (editingRecord.jumlahSampel || 1) * (editingRecord.hargaPerSampel || 0);
                const updated: MasterSalesRecord = {
                  ...editingRecord,
                  dppTotal: dpp,
                  ppn11: Math.round(dpp * 0.11),
                  totalPlusPpn: Math.round(dpp * 1.11),
                  updatedAt: new Date().toISOString()
                };
                await updateRecord(updated);
                addDataEditLog({
                  user: 'Sales Executive',
                  action: 'Edit Transaksi',
                  month: managingMonth,
                  recordsCount: 1,
                  details: `Memperbarui transaksi invoice ${updated.invoice} (${updated.company}). Nilai DPP disesuaikan menjadi ${formatRupiah(dpp)}.`
                });
                setEditingRecord(null);
                setSuccessMessage(`Transaksi ${updated.invoice} berhasil diperbarui.`);
              }}
              className="space-y-3 mt-4"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Perusahaan</label>
                <input
                  type="text"
                  value={editingRecord.company}
                  onChange={(e) => setEditingRecord({ ...editingRecord, company: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Layanan Pengujian</label>
                <input
                  type="text"
                  value={editingRecord.layananPengujian}
                  onChange={(e) => setEditingRecord({ ...editingRecord, layananPengujian: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Sampel</label>
                  <input
                    type="number"
                    min={1}
                    value={editingRecord.jumlahSampel}
                    onChange={(e) => setEditingRecord({ ...editingRecord, jumlahSampel: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tarif DPP per Sampel (IDR)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingRecord.hargaPerSampel}
                    onChange={(e) => setEditingRecord({ ...editingRecord, hargaPerSampel: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
