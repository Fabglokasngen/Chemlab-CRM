import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Edit2, 
  Trash2, 
  FileSpreadsheet, 
  FileText, 
  Presentation,
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ArrowUpDown, 
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Tag,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { useSalesData } from '../context/SalesDataContext';
import { MasterSalesRecord, ServiceCategory, ClientTier, Quotation } from '../types';
import { formatRupiah, generatePdfReport, generatePowerPointDeck } from '../utils/exportPresentation';
import { exportMasterDataToExcel } from '../utils/excelProcessor';
import { categorizeService } from '../data/rawAugustData';
import { generateQuotationPdf } from '../utils/quotationPdfGenerator';

export const MasterData: React.FC = () => {
  const { 
    records, 
    updateRecord, 
    deleteRecord, 
    addRecords, 
    toggleRecordCorrection,
    selectedPeriod,
    strategicMetrics,
    clients,
    services,
    quotations,
    addQuotation,
    isMasterDataLocked,
    toggleMasterDataLock,
    resolveDuplicates,
    dataEditLogs
  } = useSalesData();

  const [searchQuery, setSearchQuery] = useState('');
  // User Request: "Tetap tambahkan pengujian walet pada masterdata" -> Default to 'all' so Walet is always included!
  const [authorityFilter, setAuthorityFilter] = useState<'all' | 'my' | 'external'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [correctionFilter, setCorrectionFilter] = useState<'all' | 'correction' | 'normal'>('all');
  
  // Sort state: default dateParsed descending, supports 'layananPengujian' sorting
  const [sortField, setSortField] = useState<keyof MasterSalesRecord>('dateParsed');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Pagination state (Max 100 per page as requested)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(100);

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<MasterSalesRecord | null>(null);

  // Correction Modal State
  const [correctionModalRecord, setCorrectionModalRecord] = useState<MasterSalesRecord | null>(null);
  const [correctionNoteInput, setCorrectionNoteInput] = useState<string>('');

  // Quick Quotation Modal State
  const [quotationModalRecord, setQuotationModalRecord] = useState<MasterSalesRecord | null>(null);

  // Deduplication & Security Modal State
  const [isDedupModalOpen, setIsDedupModalOpen] = useState(false);
  const [dedupNotification, setDedupNotification] = useState<string | null>(null);

  // Company Multiple ELSA IDs Inspector Modal
  const [selectedCompanyForElsa, setSelectedCompanyForElsa] = useState<string | null>(null);

  // Add Record Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRecordData, setNewRecordData] = useState<Partial<MasterSalesRecord>>({
    tanggalSampel: '31 Agustus 2026',
    dateParsed: '2026-08-31',
    company: '',
    nomorId: '',
    invoice: 'ILI/202608/0220',
    layananPengujian: '',
    jumlahSampel: 1,
    hargaPerSampel: 1500000,
    paymentStatus: 'Belum Lunas',
    clientTier: 'Klien Baru',
    keterangan: '',
    needsCorrection: false,
    correctionNote: '',
  });

  // Extract distinct available months from records for monthly sorting & display
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.period) set.add(r.period);
      if (r.dateParsed && r.dateParsed.length >= 7) {
        set.add(r.dateParsed.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [records]);

  // Helper for month label
  const formatMonthLabel = (m: string) => {
    if (m === '2026-08' || m === 'Agustus 2026') return 'Agustus 2026';
    if (m === '2026-07') return 'Juli 2026';
    if (m === '2026-09') return 'September 2026';
    return m;
  };

  // Map of Company to all associated ELSA IDs across transactions
  const companyElsaMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    records.forEach(r => {
      const compKey = (r.company || '').trim().toLowerCase();
      if (!compKey) return;
      if (!map.has(compKey)) {
        map.set(compKey, new Set<string>());
      }
      if (r.nomorId && r.nomorId.trim()) {
        map.get(compKey)!.add(r.nomorId.trim());
      }
    });
    return map;
  }, [records]);

  // Deduplication Scanner: detects duplicate invoices and exact duplicate rows
  const duplicateReport = useMemo(() => {
    const invoiceCounts = new Map<string, MasterSalesRecord[]>();
    const exactSignatures = new Map<string, MasterSalesRecord[]>();

    records.forEach(r => {
      const inv = (r.invoice || '').trim().toUpperCase();
      if (inv) {
        const list = invoiceCounts.get(inv) || [];
        list.push(r);
        invoiceCounts.set(inv, list);
      }

      const sig = `${(r.company || '').trim().toLowerCase()}|${inv}|${r.tanggalSampel}|${r.layananPengujian}|${r.dppTotal}`;
      const sigList = exactSignatures.get(sig) || [];
      sigList.push(r);
      exactSignatures.set(sig, sigList);
    });

    const duplicateInvoices = Array.from(invoiceCounts.entries()).filter(([_, rows]) => rows.length > 1);
    const exactDuplicates = Array.from(exactSignatures.entries()).filter(([_, rows]) => rows.length > 1);

    return {
      hasDuplicates: duplicateInvoices.length > 0 || exactDuplicates.length > 0,
      duplicateInvoices,
      exactDuplicates,
      totalDuplicateRows: exactDuplicates.reduce((acc, [_, rows]) => acc + (rows.length - 1), 0),
      totalInvoiceIssues: duplicateInvoices.length
    };
  }, [records]);

  // Filter & Search Records (with support for sorting by layananPengujian, date, dpp, etc.)
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Month filter
      if (monthFilter !== 'all') {
        const rMonth = r.dateParsed ? r.dateParsed.slice(0, 7) : '';
        if (rMonth !== monthFilter && r.period !== monthFilter) return false;
      }

      // Authority filter: 'all' includes both Walet & Analytical
      if (authorityFilter === 'my' && !r.isMyAuthority) return false;
      if (authorityFilter === 'external' && r.isMyAuthority) return false;

      // Category filter
      if (categoryFilter !== 'all' && r.kategoriLayanan !== categoryFilter) return false;

      // Payment filter
      if (paymentFilter !== 'all' && r.paymentStatus !== paymentFilter) return false;

      // Tier filter
      if (tierFilter !== 'all' && r.clientTier !== tierFilter) return false;

      // Correction filter
      if (correctionFilter === 'correction' && !r.needsCorrection) return false;
      if (correctionFilter === 'normal' && r.needsCorrection) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          r.company.toLowerCase().includes(q) ||
          r.invoice.toLowerCase().includes(q) ||
          (r.nomorId && r.nomorId.toLowerCase().includes(q)) ||
          r.layananPengujian.toLowerCase().includes(q) ||
          (r.contactPersonName && r.contactPersonName.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    }).sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc 
        ? String(valA || '').localeCompare(String(valB || '')) 
        : String(valB || '').localeCompare(String(valA || ''));
    });
  }, [records, monthFilter, authorityFilter, categoryFilter, paymentFilter, tierFilter, correctionFilter, searchQuery, sortField, sortAsc]);

  // Total pages
  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage) || 1;
  const currentTotalDpp = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + (r.dppTotal || 0), 0);
  }, [filteredRecords]);

  // Paginated records
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredRecords.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredRecords, currentPage, rowsPerPage]);

  const handleSort = (field: keyof MasterSalesRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'layananPengujian' || field === 'company'); // A-Z by default for text
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    if (isMasterDataLocked) {
      alert('Master Data sedang dikunci. Harap buka kunci keamanan terlebih dahulu.');
      return;
    }

    const jumlah = editingRecord.jumlahSampel || 1;
    const harga = editingRecord.hargaPerSampel || 0;
    const dpp = jumlah * harga;
    const ppn = Math.round(dpp * 0.11);
    const total = dpp + ppn;
    const rate = editingRecord.clientTier === 'Klien Lama >1 Thn' ? 2.0 : 2.5;
    const incentive = Math.round(dpp * (rate / 100));

    const updated: MasterSalesRecord = {
      ...editingRecord,
      dppTotal: dpp,
      ppn11: ppn,
      totalPlusPpn: total,
      incentiveRate: rate,
      incentiveAmount: incentive,
      updatedAt: new Date().toISOString()
    };

    await updateRecord(updated);
    setEditingRecord(null);
  };

  const handleSaveCorrection = async () => {
    if (!correctionModalRecord) return;
    if (isMasterDataLocked) {
      alert('Master Data sedang dikunci. Buka kunci keamanan terlebih dahulu.');
      return;
    }
    await toggleRecordCorrection(correctionModalRecord.id, correctionNoteInput);
    setCorrectionModalRecord(null);
  };

  const handleCreateQuotationFromRecord = async (r: MasterSalesRecord) => {
    const now = new Date().toISOString().split('T')[0];
    const newQuoNumber = `QUO/${now.replace(/-/g, '').slice(0, 6)}/${Math.floor(100 + Math.random() * 900)}`;
    
    await addQuotation({
      quotationNumber: newQuoNumber,
      date: now,
      idElsa: r.nomorId || '24-001099',
      company: r.company,
      contactPerson: r.contactPersonName || 'Bpk/Ibu PIC',
      phone: r.mobilePhone || '0812-9988-7766',
      email: r.personalEmail || `pic@${r.company.toLowerCase().replace(/[^a-z]/g, '')}.com`,
      layananPengujian: r.layananPengujian,
      kategoriLayanan: r.kategoriLayanan,
      sampleCount: r.jumlahSampel,
      pricePerSample: r.hargaPerSampel,
      dppTotal: r.dppTotal,
      ppn11: r.ppn11,
      totalAmount: r.totalPlusPpn,
      status: 'Won',
      validUntil: '30 Hari Kalender',
      needsCorrection: r.needsCorrection,
      correctionNote: r.correctionNote,
      followUps: [
        {
          id: `fu-${Date.now()}`,
          date: now,
          actionType: 'Meeting Teknis',
          picName: r.contactPersonName || 'PIC',
          notes: `Quotation resmi diterbitkan otomatis dari transaksi invoice ${r.invoice} (${r.layananPengujian}).`
        }
      ],
      notes: `Ditautkan ke invoice ${r.invoice}`
    });

    await updateRecord({
      ...r,
      quotationNumber: newQuoNumber,
      quotationStatus: 'Won',
      quotationDate: now,
      updatedAt: new Date().toISOString()
    });

    setQuotationModalRecord(null);
  };

  const handleAddNewRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecordData.company || !newRecordData.layananPengujian) return;
    if (isMasterDataLocked) {
      alert('Master Data sedang dikunci. Harap buka kunci keamanan terlebih dahulu.');
      return;
    }

    const jumlah = newRecordData.jumlahSampel || 1;
    const harga = newRecordData.hargaPerSampel || 0;
    const dpp = jumlah * harga;
    const ppn = Math.round(dpp * 0.11);
    const total = dpp + ppn;
    const tier = newRecordData.clientTier || 'Klien Baru';
    const rate = tier === 'Klien Lama >1 Thn' ? 2.0 : 2.5;
    const incentive = Math.round(dpp * (rate / 100));

    const { category, isMyAuthority } = categorizeService(newRecordData.layananPengujian);

    const record: MasterSalesRecord = {
      id: `REC-${Date.now()}`,
      jamMasuk: '08:00',
      tanggalSampel: newRecordData.tanggalSampel || '31 Agustus 2026',
      dateParsed: newRecordData.dateParsed || '2026-08-31',
      company: newRecordData.company,
      nomorId: newRecordData.nomorId || '',
      contactPersonName: newRecordData.contactPersonName || '',
      mobilePhone: newRecordData.mobilePhone || '',
      personalEmail: newRecordData.personalEmail || '',
      npwp: newRecordData.npwp || '',
      invoice: newRecordData.invoice || `ILI/202608/${Date.now().toString().slice(-4)}`,
      layananPengujian: newRecordData.layananPengujian,
      kategoriLayanan: category,
      isMyAuthority,
      jumlahSampel: jumlah,
      hargaPerSampel: harga,
      dppTotal: dpp,
      ppn11: ppn,
      totalPlusPpn: total,
      payment: newRecordData.payment || '',
      paymentStatus: newRecordData.paymentStatus || 'Belum Lunas',
      keterangan: newRecordData.keterangan || '',
      clientTier: tier,
      incentiveRate: rate,
      incentiveAmount: incentive,
      isUrgent: false,
      needsCorrection: newRecordData.needsCorrection || false,
      correctionNote: newRecordData.correctionNote || '',
      period: '2026-08',
      salesPerson: 'Sales Executive',
      createdAt: new Date().toISOString()
    };

    await addRecords([record], 'append');
    setIsAddModalOpen(false);
  };

  // Check duplicate invoice warning when adding new record
  const isInvoiceDuplicateInAdd = useMemo(() => {
    if (!newRecordData.invoice) return false;
    const inv = newRecordData.invoice.trim().toLowerCase();
    return records.some(r => r.invoice.trim().toLowerCase() === inv);
  }, [newRecordData.invoice, records]);

  // Records for currently inspected company with multiple ELSA IDs
  const companyElsaTransactions = useMemo(() => {
    if (!selectedCompanyForElsa) return [];
    return records.filter(r => (r.company || '').trim().toLowerCase() === selectedCompanyForElsa.trim().toLowerCase());
  }, [selectedCompanyForElsa, records]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Enterprise Data Repository</span>
            <span>·</span>
            <span>{records.length} Total Baris Terdaftar</span>
            <span>·</span>
            <span className="text-emerald-700 font-bold">Walet &amp; Analitikal Terintegrasi</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Master Data Penjualan Laboratorium</span>
            {isMasterDataLocked && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold">
                <Lock className="w-3 h-3" />
                Read-Only
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Repositori data transaksi penjualan pengujian. Mendukung relasi multi-ID ELSA per perusahaan, sortir berdasarkan layanan pengujian, audit integritas anti-duplikasi, dan proteksi keamanan master data.
          </p>
        </div>

        {/* Action Controls & Security Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Master Data Security Lock Toggle */}
          <button
            onClick={toggleMasterDataLock}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              isMasterDataLocked 
                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title={isMasterDataLocked ? 'Buka proteksi edit master data' : 'Kunci master data (mencegah edit/hapus tak disengaja)'}
          >
            {isMasterDataLocked ? (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Kunci Aktif (Read-Only)</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-slate-500" />
                <span>Kunci Master Data</span>
              </>
            )}
          </button>

          {/* Deduplication & Security Scanner Button */}
          <button
            onClick={() => setIsDedupModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              duplicateReport.hasDuplicates
                ? 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100 animate-pulse'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Pemeriksaan keamanan integritas data & pencegahan data ganda"
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${duplicateReport.hasDuplicates ? 'text-rose-600' : 'text-slate-500'}`} />
            <span>Pencegahan Duplikat {duplicateReport.hasDuplicates && `(${duplicateReport.totalDuplicateRows + duplicateReport.totalInvoiceIssues})`}</span>
          </button>

          {/* Add Record */}
          <button
            onClick={() => {
              if (isMasterDataLocked) {
                alert('Master Data sedang dalam status terkunci (Read-Only). Buka kunci terlebih dahulu.');
                return;
              }
              setIsAddModalOpen(true);
            }}
            disabled={isMasterDataLocked}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Transaksi</span>
          </button>

          <button
            onClick={() => exportMasterDataToExcel(filteredRecords, `MasterData_${selectedPeriod.replace(/\s+/g, '_')}.xlsx`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            title="Download seluruh baris terfilter dalam format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => generatePowerPointDeck(strategicMetrics, clients, services, selectedPeriod)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            title="Download slide PowerPoint (.pptx)"
          >
            <Presentation className="w-3.5 h-3.5 text-slate-500" />
            <span>PPTX</span>
          </button>
        </div>
      </div>

      {/* Security Alert Banner if Duplicates Detected */}
      {duplicateReport.hasDuplicates && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong className="font-bold">Peringatan Integritas Master Data:</strong> Terdeteksi {duplicateReport.totalDuplicateRows} baris transaksi persis ganda dan {duplicateReport.totalInvoiceIssues} kelompok nomor invoice yang berulang.
            </div>
          </div>
          <button
            onClick={() => setIsDedupModalOpen(true)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shrink-0 transition-colors"
          >
            Pindai &amp; Bersihkan Duplikat Sekarang
          </button>
        </div>
      )}

      {/* Notification Toast */}
      {dedupNotification && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{dedupNotification}</span>
          </div>
          <button onClick={() => setDedupNotification(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar with Sort Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari perusahaan, invoice, ID ELSA, layanan..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
            />
          </div>

          {/* Month Filter */}
          <div>
            <select
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none font-medium"
            >
              <option value="all">Bulan: Semua Bulan</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>{formatMonthLabel(m)}</option>
              ))}
            </select>
          </div>

          {/* User Request: Fitur Sortir Berdasarkan Layanan Pengujian */}
          <div>
            <select
              value={`${sortField}-${sortAsc ? 'asc' : 'desc'}`}
              onChange={(e) => {
                const [f, d] = e.target.value.split('-');
                setSortField(f as keyof MasterSalesRecord);
                setSortAsc(d === 'asc');
              }}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none font-semibold text-slate-800"
            >
              <option value="layananPengujian-asc">Sortir: Layanan Uji (A-Z)</option>
              <option value="layananPengujian-desc">Sortir: Layanan Uji (Z-A)</option>
              <option value="dateParsed-desc">Sortir: Tanggal Terbaru</option>
              <option value="dateParsed-asc">Sortir: Tanggal Terlama</option>
              <option value="dppTotal-desc">Sortir: Nilai DPP Tertinggi</option>
              <option value="dppTotal-asc">Sortir: Nilai DPP Terendah</option>
              <option value="company-asc">Sortir: Nama Klien (A-Z)</option>
              <option value="nomorId-asc">Sortir: ID ELSA (Urut)</option>
            </select>
          </div>

          {/* Authority Filter: defaults to 'all' so Walet is included */}
          <div>
            <select
              value={authorityFilter}
              onChange={(e) => {
                setAuthorityFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none font-medium"
            >
              <option value="all">Semua Layanan (Analitikal + Walet)</option>
              <option value="my">Portofolio Analitikal Saja</option>
              <option value="external">Pengujian Walet Saja</option>
            </select>
          </div>

          {/* Correction Filter */}
          <div>
            <select
              value={correctionFilter}
              onChange={(e) => {
                setCorrectionFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none font-medium"
            >
              <option value="all">Koreksi: Semua Status</option>
              <option value="correction">⚠️ Perlu Koreksi Saja</option>
              <option value="normal">Pengujian Standar</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none font-medium"
            >
              <option value="all">Status Bayar: Semua</option>
              <option value="Lunas">Lunas</option>
              <option value="Belum Lunas">Belum Lunas</option>
            </select>
          </div>
        </div>

        {/* Live Filter Summary Strip (NO INCENTIVE AMOUNT AS REQUESTED) */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <span>Menampilkan <strong className="text-slate-900 font-semibold">{filteredRecords.length}</strong> transaksi</span>
            <span>·</span>
            <span>Total DPP: <strong className="text-slate-900 font-mono font-semibold">{formatRupiah(currentTotalDpp)}</strong></span>
            <span>·</span>
            <span className="text-slate-700">
              Walet: <strong>{filteredRecords.filter(r => !r.isMyAuthority).length}</strong> baris
            </span>
            <span>·</span>
            <span className="text-slate-700">
              Analitikal: <strong>{filteredRecords.filter(r => r.isMyAuthority).length}</strong> baris
            </span>
            {correctionFilter === 'all' && (
              <>
                <span>·</span>
                <span className="text-amber-800 font-medium">
                  {filteredRecords.filter(r => r.needsCorrection).length} pengujian perlu koreksi
                </span>
              </>
            )}
          </div>

          {(searchQuery || monthFilter !== 'all' || authorityFilter !== 'all' || paymentFilter !== 'all' || correctionFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setMonthFilter('all');
                setAuthorityFilter('all');
                setPaymentFilter('all');
                setCorrectionFilter('all');
                setCurrentPage(1);
              }}
              className="text-xs text-sky-700 hover:text-sky-900 font-semibold underline"
            >
              Reset Filter ke Default
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0 z-10 font-semibold">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">No</th>
                
                {/* ID ELSA (Prominent Column as Requested) */}
                <th 
                  onClick={() => handleSort('nomorId')} 
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-900 select-none whitespace-nowrap min-w-[100px]"
                >
                  <div className="flex items-center gap-1">
                    <span>ID ELSA</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('dateParsed')} 
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-900 select-none whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Tanggal</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                
                <th 
                  onClick={() => handleSort('company')} 
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-900 select-none min-w-[180px]"
                >
                  <div className="flex items-center gap-1">
                    <span>Perusahaan &amp; Multi-ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('invoice')} 
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-900 select-none whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Invoice</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* User Request: Fitur Sortir Berdasarkan Layanan Pengujian */}
                <th 
                  onClick={() => handleSort('layananPengujian')} 
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-900 select-none min-w-[220px]"
                >
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-sky-900">Layanan Pengujian</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-sky-600" />
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('jumlahSampel')} 
                  className="py-2.5 px-3 text-center cursor-pointer hover:text-slate-900 select-none whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Qty</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('hargaPerSampel')} 
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900 select-none whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Tarif/Sampel</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('dppTotal')} 
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900 select-none whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>DPP (IDR)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('paymentStatus')} 
                  className="py-2.5 px-3 text-center cursor-pointer hover:text-slate-900 select-none whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Bayar</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th className="py-2.5 px-3 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 italic">
                    Tidak ada transaksi yang cocok dengan kriteria filter atau pencarian.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r, idx) => {
                  const compKey = (r.company || '').trim().toLowerCase();
                  const allCompanyIds = compKey ? Array.from(companyElsaMap.get(compKey) || []) : [];
                  const hasMultipleIds = allCompanyIds.length > 1;

                  return (
                    <tr 
                      key={r.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        r.needsCorrection ? 'bg-amber-50/30' : (!r.isMyAuthority ? 'bg-slate-50/40' : '')
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">
                        {(currentPage - 1) * rowsPerPage + idx + 1}
                      </td>

                      {/* ID ELSA (Prominent Column) */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {r.nomorId ? (
                          <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {r.nomorId}
                          </span>
                        ) : (
                          <span className="text-slate-300 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Tanggal Sampel */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {r.tanggalSampel || r.dateParsed}
                      </td>

                      {/* Company Name & Multi-ID Indicator */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 truncate max-w-[200px]" title={r.company}>
                            {r.company}
                          </span>
                          {/* If company has multiple IDs, provide interactive badge to inspect */}
                          {hasMultipleIds && (
                            <button
                              onClick={() => setSelectedCompanyForElsa(r.company)}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition-colors"
                              title={`Perusahaan ini mengajukan ${allCompanyIds.length} ID ELSA. Klik untuk melihat seluruh riwayat ID.`}
                            >
                              <Layers className="w-2.5 h-2.5 text-sky-600" />
                              <span>{allCompanyIds.length} ID</span>
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-medium text-slate-600">{r.clientTier}</span>
                          {!r.isMyAuthority && (
                            <>
                              <span>·</span>
                              <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px] font-medium">
                                Pengujian Walet
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Invoice */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {r.invoice}
                      </td>

                      {/* Layanan Pengujian with Correction Badge */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-start gap-1.5">
                          <span className="font-medium text-slate-800 line-clamp-1 max-w-[240px]" title={r.layananPengujian}>
                            {r.layananPengujian}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px]">
                          <span className="text-slate-500 truncate max-w-[170px]">{r.kategoriLayanan}</span>
                          
                          {/* Penanda Perlu Koreksi Pengujian */}
                          {r.needsCorrection ? (
                            <span 
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold cursor-pointer"
                              onClick={() => {
                                setCorrectionModalRecord(r);
                                setCorrectionNoteInput(r.correctionNote || '');
                              }}
                              title={r.correctionNote || 'Klik untuk mengubah catatan koreksi'}
                            >
                              ⚠️ Perlu Koreksi
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                if (isMasterDataLocked) {
                                  alert('Master Data sedang dikunci. Buka kunci keamanan terlebih dahulu.');
                                  return;
                                }
                                setCorrectionModalRecord(r);
                                setCorrectionNoteInput('');
                              }}
                              disabled={isMasterDataLocked}
                              className="text-[10px] text-slate-400 hover:text-amber-700 hover:underline disabled:opacity-40"
                              title="Tandai jika pengujian ini memerlukan koreksi deviasi atau preparasi khusus"
                            >
                              +Tandai Koreksi
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Qty */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap font-mono text-slate-700">
                        {r.jumlahSampel}
                      </td>

                      {/* Harga per Sampel */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono text-slate-600">
                        {formatRupiah(r.hargaPerSampel)}
                      </td>

                      {/* DPP Total (Nilai sebelum PPN) */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono font-bold text-slate-900">
                        {formatRupiah(r.dppTotal)}
                      </td>

                      {/* Payment Status */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          r.paymentStatus === 'Lunas' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {r.paymentStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* Create/Link Quotation */}
                          <button
                            onClick={() => handleCreateQuotationFromRecord(r)}
                            className="p-1 text-slate-400 hover:text-sky-600 rounded transition-colors"
                            title="Buat / Sinkronkan Surat Penawaran (Quotation PDF) dari transaksi ini"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Record */}
                          <button
                            onClick={() => {
                              if (isMasterDataLocked) {
                                alert('Master Data sedang dalam status terkunci. Buka kunci keamanan terlebih dahulu.');
                                return;
                              }
                              setEditingRecord(r);
                            }}
                            disabled={isMasterDataLocked}
                            className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isMasterDataLocked ? 'Terkunci (Read-Only)' : 'Edit baris transaksi'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Record */}
                          <button
                            onClick={async () => {
                              if (isMasterDataLocked) {
                                alert('Master Data sedang dalam status terkunci. Buka kunci keamanan terlebih dahulu.');
                                return;
                              }
                              if (window.confirm(`Hapus transaksi invoice ${r.invoice} (${r.company})? Data tidak dapat dipulihkan.`)) {
                                await deleteRecord(r.id);
                              }
                            }}
                            disabled={isMasterDataLocked}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isMasterDataLocked ? 'Terkunci (Read-Only)' : 'Hapus baris transaksi'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Pagination & Rows-Per-Page Selector (Max 100 as requested) */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>
              Menampilkan{' '}
              <strong className="font-semibold text-slate-900">
                {filteredRecords.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
              </strong>{' '}
              sampai{' '}
              <strong className="font-semibold text-slate-900">
                {Math.min(currentPage * rowsPerPage, filteredRecords.length)}
              </strong>{' '}
              dari{' '}
              <strong className="font-semibold text-slate-900">{filteredRecords.length}</strong> transaksi
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
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100 (Maksimal)</option>
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

      {/* MODAL 1: Deduplication & Data Security System */}
      {isDedupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-700" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Sistem Keamanan &amp; Pencegahan Duplikasi Master Data
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Memastikan integritas basis data sales dan mencegah duplikasi invoice atau transaksi ganda.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsDedupModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-4 text-xs">
              {/* Scan summary metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Transaksi</span>
                  <span className="text-base font-bold font-mono text-slate-900">{records.length} Baris</span>
                </div>
                <div className={`p-3 rounded-lg border ${
                  duplicateReport.totalDuplicateRows > 0 
                    ? 'bg-rose-50 border-rose-200 text-rose-900' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <span className="text-[10px] uppercase font-semibold block">Duplikat Persis</span>
                  <span className="text-base font-bold font-mono">
                    {duplicateReport.totalDuplicateRows > 0 ? `${duplicateReport.totalDuplicateRows} Baris` : 'Bersih (0)'}
                  </span>
                </div>
                <div className={`p-3 rounded-lg border ${
                  duplicateReport.totalInvoiceIssues > 0 
                    ? 'bg-amber-50 border-amber-200 text-amber-900' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <span className="text-[10px] uppercase font-semibold block">Invoice Ganda</span>
                  <span className="text-base font-bold font-mono">
                    {duplicateReport.totalInvoiceIssues > 0 ? `${duplicateReport.totalInvoiceIssues} Invoice` : 'Unik (0)'}
                  </span>
                </div>
              </div>

              {/* Exact Duplicates Details */}
              {duplicateReport.exactDuplicates.length > 0 ? (
                <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Ditemukan Transaksi Identik Duplikat:</span>
                    </span>
                    <button
                      onClick={() => {
                        const res = resolveDuplicates('exact');
                        setDedupNotification(`Berhasil membersihkan ${res.removedCount} data transaksi duplikat persis.`);
                      }}
                      className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded font-semibold text-[11px]"
                    >
                      Bersihkan Duplikat Persis
                    </button>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 text-[11px] text-rose-800 font-mono">
                    {duplicateReport.exactDuplicates.map(([sig, rows], i) => (
                      <div key={i} className="p-1.5 bg-white/80 rounded border border-rose-200">
                        {rows[0].company} · {rows[0].invoice} · {rows[0].layananPengujian} ({rows.length}x ganda)
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tidak ada data transaksi yang berulang/duplikat persis dalam Master Data.</span>
                </div>
              )}

              {/* Duplicate Invoices Details */}
              {duplicateReport.duplicateInvoices.length > 0 && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Nomor Invoice Digunakan Lebih Dari Sekali:</span>
                    </span>
                    <button
                      onClick={() => {
                        const res = resolveDuplicates('invoice_suffix');
                        setDedupNotification(`Berhasil memberikan penomoran suffix unik pada ${res.fixedCount} nomor invoice.`);
                      }}
                      className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded font-semibold text-[11px]"
                    >
                      Beri Suffix Unik (-REV)
                    </button>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 text-[11px] text-amber-800 font-mono">
                    {duplicateReport.duplicateInvoices.map(([inv, rows], i) => (
                      <div key={i} className="p-1.5 bg-white/80 rounded border border-amber-200 flex justify-between">
                        <span>{inv} : digunakan {rows.length} transaksi</span>
                        <span className="text-slate-500 font-sans">{rows.map(r => r.company).join(', ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Audit Rules */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-slate-600">
                <span className="font-bold text-slate-800 block">Fitur Keamanan Terpasang:</span>
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                  <li><strong>Proteksi Kunci Read-Only:</strong> Mencegah modifikasi atau penghapusan data secara tidak sengaja oleh user lain.</li>
                  <li><strong>Validasi Input Real-Time:</strong> Sistem otomatis mendeteksi jika nomor invoice yang diketik sudah pernah ada.</li>
                  <li><strong>Log Book Perubahan:</strong> Setiap modifikasi dan penghapusan data tercatat dengan waktu dan identitas user.</li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setIsDedupModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Multiple ELSA IDs Inspector per Company */}
      {selectedCompanyForElsa && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{selectedCompanyForElsa}</h3>
                  <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded font-semibold text-[10px]">
                    Kumpulan ID ELSA
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Satu perusahaan dapat mengajukan beberapa ID ELSA berdasarkan layanan pengujian yang dilakukan.
                </p>
              </div>
              <button 
                onClick={() => setSelectedCompanyForElsa(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of distinct IDs for this company */}
            <div className="my-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Daftar ID Terdaftar:</span>
                {Array.from(companyElsaMap.get(selectedCompanyForElsa.toLowerCase()) || []).map(idElsa => (
                  <span key={idElsa} className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-800 rounded border border-slate-300">
                    ID: {idElsa}
                  </span>
                ))}
              </div>

              {/* Transactions Ledger for this company */}
              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-64">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2 px-3">ID ELSA</th>
                      <th className="py-2 px-3">Tanggal</th>
                      <th className="py-2 px-3">Invoice</th>
                      <th className="py-2 px-3">Layanan Pengujian</th>
                      <th className="py-2 px-3 text-right">DPP</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                    {companyElsaTransactions.map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-sky-800">{t.nomorId || '-'}</td>
                        <td className="py-2 px-3 text-slate-500">{t.tanggalSampel}</td>
                        <td className="py-2 px-3 text-slate-600">{t.invoice}</td>
                        <td className="py-2 px-3 font-sans font-medium text-slate-800">{t.layananPengujian}</td>
                        <td className="py-2 px-3 text-right font-bold">{formatRupiah(t.dppTotal)}</td>
                        <td className="py-2 px-3 text-center font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            t.paymentStatus === 'Lunas' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {t.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedCompanyForElsa(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Edit Data Transaksi Penjualan
              </h3>
              <button 
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Perusahaan / Klien</label>
                  <input
                    type="text"
                    value={editingRecord.company}
                    onChange={(e) => setEditingRecord({ ...editingRecord, company: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ID ELSA</label>
                  <input
                    type="text"
                    value={editingRecord.nomorId || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, nomorId: e.target.value })}
                    placeholder="e.g. 24-001099 atau 302089"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Layanan Pengujian</label>
                <input
                  type="text"
                  value={editingRecord.layananPengujian}
                  onChange={(e) => setEditingRecord({ ...editingRecord, layananPengujian: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Sampel (Qty)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingRecord.jumlahSampel}
                    onChange={(e) => setEditingRecord({ ...editingRecord, jumlahSampel: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Satuan DPP (IDR)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingRecord.hargaPerSampel}
                    onChange={(e) => setEditingRecord({ ...editingRecord, hargaPerSampel: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Pembayaran</label>
                  <select
                    value={editingRecord.paymentStatus}
                    onChange={(e) => setEditingRecord({ ...editingRecord, paymentStatus: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium"
                  >
                    <option value="Belum Lunas">Belum Lunas</option>
                    <option value="Lunas">Lunas</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tier Klien</label>
                  <select
                    value={editingRecord.clientTier}
                    onChange={(e) => setEditingRecord({ ...editingRecord, clientTier: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium"
                  >
                    <option value="Klien Baru">Klien Baru (Insentif 2.5%)</option>
                    <option value="Repeat Order <1 Thn">Repeat Order &lt;1 Thn (2.5%)</option>
                    <option value="Klien Lama >1 Thn">Klien Lama &gt;1 Thn (2.0%)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Catatan Khusus</label>
                <input
                  type="text"
                  value={editingRecord.keterangan || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, keterangan: e.target.value })}
                  placeholder="e.g. Urgent 200%, deviasi preparasi..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
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

      {/* MODAL 4: Add New Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Tambah Transaksi Penjualan Baru
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Real-time duplicate invoice warning */}
            {isInvoiceDuplicateInAdd && (
              <div className="mt-3 p-2.5 bg-amber-50 border border-amber-300 rounded-lg flex items-center gap-2 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Peringatan Keamanan:</strong> Nomor invoice "{newRecordData.invoice}" sudah digunakan dalam Master Data. Gunakan nomor invoice baru agar tidak terjadi tumpang tindih.
                </span>
              </div>
            )}

            <form onSubmit={handleAddNewRecord} className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Perusahaan / Klien</label>
                  <input
                    type="text"
                    value={newRecordData.company}
                    onChange={(e) => setNewRecordData({ ...newRecordData, company: e.target.value })}
                    placeholder="e.g. PT Geoservices Ltd"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ID ELSA</label>
                  <input
                    type="text"
                    value={newRecordData.nomorId || ''}
                    onChange={(e) => setNewRecordData({ ...newRecordData, nomorId: e.target.value })}
                    placeholder="e.g. 24-001099"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Invoice</label>
                  <input
                    type="text"
                    value={newRecordData.invoice || ''}
                    onChange={(e) => setNewRecordData({ ...newRecordData, invoice: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg text-xs font-mono ${
                      isInvoiceDuplicateInAdd ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Sampel</label>
                  <input
                    type="text"
                    value={newRecordData.tanggalSampel || '31 Agustus 2026'}
                    onChange={(e) => setNewRecordData({ ...newRecordData, tanggalSampel: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Layanan Pengujian</label>
                <input
                  type="text"
                  value={newRecordData.layananPengujian}
                  onChange={(e) => setNewRecordData({ ...newRecordData, layananPengujian: e.target.value })}
                  placeholder="e.g. Jasa Pengujian Isotop Rasio IRMS 13C & 15N"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Sampel (Qty)</label>
                  <input
                    type="number"
                    min={1}
                    value={newRecordData.jumlahSampel}
                    onChange={(e) => setNewRecordData({ ...newRecordData, jumlahSampel: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Satuan DPP (IDR)</label>
                  <input
                    type="number"
                    min={0}
                    value={newRecordData.hargaPerSampel}
                    onChange={(e) => setNewRecordData({ ...newRecordData, hargaPerSampel: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Correction Modal */}
      {correctionModalRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {correctionModalRecord.needsCorrection ? 'Ubah Penanda Koreksi' : 'Tandai Perlu Koreksi'}
                </h3>
              </div>
              <button 
                onClick={() => setCorrectionModalRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-700 space-y-1">
              <div><strong>Klien:</strong> {correctionModalRecord.company}</div>
              <div><strong>Layanan:</strong> {correctionModalRecord.layananPengujian}</div>
              <div><strong>Invoice:</strong> {correctionModalRecord.invoice}</div>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block font-semibold text-slate-700">
                Alasan / Catatan Koreksi Pengujian:
              </label>
              <textarea
                rows={3}
                value={correctionNoteInput}
                onChange={(e) => setCorrectionNoteInput(e.target.value)}
                placeholder="Contoh: Preparasi asam khusus, matriks minyak mentah, kalibrasi ulang detector..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between">
              {correctionModalRecord.needsCorrection ? (
                <button
                  type="button"
                  onClick={async () => {
                    await toggleRecordCorrection(correctionModalRecord.id);
                    setCorrectionModalRecord(null);
                  }}
                  className="px-3 py-2 text-rose-700 hover:text-rose-900 font-semibold text-xs"
                >
                  Hapus Penanda
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectionModalRecord(null)}
                  className="px-3 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveCorrection}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
                >
                  Simpan Koreksi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
