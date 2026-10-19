import React, { useState, useMemo, useRef } from 'react';
import { 
  FileCheck, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  Phone, 
  Mail, 
  ArrowUpRight,
  AlertTriangle,
  Building2,
  ChevronDown,
  X,
  FileText,
  PieChart,
  BarChart3,
  Upload,
  Edit2,
  Trash2,
  Eye,
  FileSpreadsheet,
  Paperclip,
  Sparkles,
  Calculator
} from 'lucide-react';
import { useSalesData } from '../context/SalesDataContext';
import { Quotation, QuotationStatus, QuotationFollowUp, ServiceCategory } from '../types';
import { formatRupiah, formatCompactPortofolio } from '../utils/exportPresentation';
import { generateQuotationPdf } from '../utils/quotationPdfGenerator';
import { parseQuotationPdf, ExtractedQuotationData } from '../utils/quotationPdfParser';

export const Quotations: React.FC = () => {
  const { 
    quotations, 
    addQuotation, 
    updateQuotation, 
    deleteQuotation, 
    addQuotationFollowUp,
    clients,
    services,
    selectedPeriod 
  } = useSalesData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingQuo, setEditingQuo] = useState<Quotation | null>(null);
  const [activeFollowUpQuo, setActiveFollowUpQuo] = useState<Quotation | null>(null);

  // PDF Upload & Extraction State
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [extractedPdfData, setExtractedPdfData] = useState<ExtractedQuotationData | null>(null);

  // PDF Preview Modal
  const [previewPdfQuo, setPreviewPdfQuo] = useState<Quotation | null>(null);

  // Follow-up form state
  const [fuActionType, setFuActionType] = useState<QuotationFollowUp['actionType']>('Telepon / WhatsApp');
  const [fuPicName, setFuPicName] = useState('');
  const [fuNotes, setFuNotes] = useState('');
  const [fuNextDate, setFuNextDate] = useState('');
  const [fuNextPlan, setFuNextPlan] = useState('');
  const [fuStatusUpdate, setFuStatusUpdate] = useState<QuotationStatus | ''>('');

  // New Quotation form state
  const [newQuoForm, setNewQuoForm] = useState({
    company: '',
    idElsa: '',
    contactPerson: '',
    phone: '',
    email: '',
    layananPengujian: '',
    kategoriLayanan: 'Isotop Rasio IRMS' as ServiceCategory,
    sampleCount: 1,
    pricePerSample: 1500000,
    status: 'Terkirim' as QuotationStatus,
    validUntil: '30 Hari Kalender',
    needsCorrection: false,
    correctionNote: '',
    notes: '',
  });

  // Calculate Win Rate & Metrics
  const winRateMetrics = useMemo(() => {
    const total = quotations.length;
    const won = quotations.filter(q => q.status === 'Won').length;
    const lost = quotations.filter(q => q.status === 'Lost').length;
    const inProgress = quotations.filter(q => q.status === 'Terkirim' || q.status === 'Negosiasi' || q.status === 'Follow Up').length;

    const decisive = won + lost;
    const winRate = decisive > 0 ? Math.round((won / decisive) * 100) : (total > 0 ? Math.round((won / total) * 100) : 0);

    const totalPipelineDpp = quotations.reduce((acc, q) => acc + (q.dppTotal || 0), 0);
    const wonDpp = quotations.filter(q => q.status === 'Won').reduce((acc, q) => acc + (q.dppTotal || 0), 0);
    const activePipelineDpp = quotations
      .filter(q => q.status !== 'Won' && q.status !== 'Lost')
      .reduce((acc, q) => acc + (q.dppTotal || 0), 0);

    return {
      total,
      won,
      lost,
      inProgress,
      winRate,
      totalPipelineDpp,
      wonDpp,
      activePipelineDpp
    };
  }, [quotations]);

  // Filtered quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      if (statusFilter !== 'all' && q.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && q.kategoriLayanan !== categoryFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          q.quotationNumber.toLowerCase().includes(query) ||
          q.company.toLowerCase().includes(query) ||
          (q.idElsa && q.idElsa.toLowerCase().includes(query)) ||
          q.contactPerson.toLowerCase().includes(query) ||
          q.layananPengujian.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [quotations, statusFilter, categoryFilter, searchQuery]);

  // Handle PDF File Upload & Extraction
  const handlePdfUpload = async (file: File) => {
    if (!file.name.match(/\.pdf$/i)) {
      alert('Harap pilih file dokumen berformat .pdf.');
      return;
    }

    setIsExtractingPdf(true);
    setIsPdfModalOpen(true);

    try {
      const parsed = await parseQuotationPdf(file);
      setExtractedPdfData(parsed);
    } catch (err: any) {
      alert(`Gagal mengekstrak data dari file PDF: ${err.message}`);
      setIsPdfModalOpen(false);
    } finally {
      setIsExtractingPdf(false);
    }
  };

  // Provide realistic sample PDF input when requested
  const handleLoadSamplePdf = async () => {
    setIsExtractingPdf(true);
    setIsPdfModalOpen(true);

    // Simulate extraction from a typical Indonesian lab quotation document
    setTimeout(() => {
      const sampleParsed: ExtractedQuotationData = {
        quotationNumber: `QUO/202608/${Math.floor(100 + Math.random() * 900)}`,
        company: 'PT Bio Corpora Indonesia',
        contactPerson: 'Dr. Hendra Gunawan',
        phone: '0811-2345-6789',
        email: 'hendra@biocorpora.co.id',
        idElsa: '24-001099',
        layananPengujian: 'Jasa Pengujian Isotop Rasio IRMS 13C dan 15N (Batch Presisi Tinggi)',
        sampleCount: 4,
        pricePerSample: 2500000,
        dppTotal: 10000000, // Nilai sebelum PPN (DPP)
        vatRate: 11,
        vatAmount: 1100000,
        totalWithVat: 11100000, // Nilai setelah PPN 11%
        date: new Date().toISOString().slice(0, 10),
        rawText: 'SURAT PENAWARAN HARGA LABORATORIUM RESMI\nPT Bio Corpora Indonesia\nNomor: QUO/202608/088\nDPP: Rp 10.000.000\nPPN 11%: Rp 1.100.000\nGrand Total: Rp 11.100.000',
        fileName: 'Contoh_Penawaran_Pengujian_IRMS_BioCorpora.pdf',
        fileDataUrl: ''
      };
      setExtractedPdfData(sampleParsed);
      setIsExtractingPdf(false);
    }, 600);
  };

  // Commit Extracted Quotation from PDF
  const handleCommitPdfQuotation = async () => {
    if (!extractedPdfData) return;

    await addQuotation({
      quotationNumber: extractedPdfData.quotationNumber,
      date: extractedPdfData.date,
      idElsa: extractedPdfData.idElsa || '24-001099',
      company: extractedPdfData.company,
      contactPerson: extractedPdfData.contactPerson,
      phone: extractedPdfData.phone,
      email: extractedPdfData.email,
      layananPengujian: extractedPdfData.layananPengujian,
      kategoriLayanan: 'Isotop Rasio IRMS',
      sampleCount: extractedPdfData.sampleCount,
      pricePerSample: extractedPdfData.pricePerSample,
      dppTotal: extractedPdfData.dppTotal, // Adjusted to nominal before VAT (DPP)
      ppn11: extractedPdfData.vatAmount,
      totalAmount: extractedPdfData.totalWithVat,
      status: 'Terkirim',
      validUntil: '30 Hari Kalender',
      attachmentPdfName: extractedPdfData.fileName,
      attachmentPdfDataUrl: extractedPdfData.fileDataUrl,
      extractedDppBeforeVat: extractedPdfData.dppTotal,
      notes: `Diimpor otomatis dari lampiran PDF "${extractedPdfData.fileName}". Nominal disesuaikan berdasarkan nilai sebelum PPN (DPP).`,
      followUps: [
        {
          id: `fu-${Date.now()}`,
          date: extractedPdfData.date,
          actionType: 'Email Follow-up',
          picName: extractedPdfData.contactPerson,
          notes: `Quotation PDF resmi diunggah dan disimpan ke sistem. Nominal sebelum PPN: ${formatRupiah(extractedPdfData.dppTotal)}.`
        }
      ]
    });

    setIsPdfModalOpen(false);
    setExtractedPdfData(null);
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuoForm.company || !newQuoForm.layananPengujian) return;

    const dpp = (newQuoForm.sampleCount || 1) * (newQuoForm.pricePerSample || 0);
    const ppn = Math.round(dpp * 0.11);
    const total = dpp + ppn;
    const now = new Date().toISOString().split('T')[0];
    const newQuoNumber = `QUO/${now.replace(/-/g, '').slice(0, 6)}/${Math.floor(100 + Math.random() * 900)}`;

    await addQuotation({
      quotationNumber: newQuoNumber,
      date: now,
      idElsa: newQuoForm.idElsa || '24-001099',
      company: newQuoForm.company,
      contactPerson: newQuoForm.contactPerson || 'Bpk/Ibu PIC',
      phone: newQuoForm.phone || '08...',
      email: newQuoForm.email || 'pic@company.com',
      layananPengujian: newQuoForm.layananPengujian,
      kategoriLayanan: newQuoForm.kategoriLayanan,
      sampleCount: newQuoForm.sampleCount,
      pricePerSample: newQuoForm.pricePerSample,
      dppTotal: dpp,
      ppn11: ppn,
      totalAmount: total,
      status: newQuoForm.status,
      validUntil: newQuoForm.validUntil,
      needsCorrection: newQuoForm.needsCorrection,
      correctionNote: newQuoForm.correctionNote,
      notes: newQuoForm.notes,
      followUps: [
        {
          id: `fu-${Date.now()}`,
          date: now,
          actionType: 'Email Follow-up',
          picName: newQuoForm.contactPerson || 'PIC',
          notes: `Surat penawaran harga diterbitkan untuk ${newQuoForm.sampleCount} sampel ${newQuoForm.layananPengujian}.`
        }
      ]
    });

    setIsNewModalOpen(false);
  };

  const handleSaveEditQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuo) return;

    const dpp = (editingQuo.sampleCount || 1) * (editingQuo.pricePerSample || 0);
    const ppn = Math.round(dpp * 0.11);
    const total = dpp + ppn;

    const updated: Quotation = {
      ...editingQuo,
      dppTotal: dpp,
      ppn11: ppn,
      totalAmount: total,
      updatedAt: new Date().toISOString()
    };

    await updateQuotation(updated);
    setEditingQuo(null);
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFollowUpQuo || !fuNotes.trim()) return;

    const now = new Date().toISOString().split('T')[0];
    await addQuotationFollowUp(activeFollowUpQuo.id, {
      date: now,
      actionType: fuActionType,
      picName: fuPicName || activeFollowUpQuo.contactPerson,
      notes: fuNotes,
      nextActionDate: fuNextDate || undefined,
      nextActionPlan: fuNextPlan || undefined,
    });

    if (fuStatusUpdate && fuStatusUpdate !== activeFollowUpQuo.status) {
      await updateQuotation({
        ...activeFollowUpQuo,
        status: fuStatusUpdate as QuotationStatus,
        updatedAt: new Date().toISOString()
      });
    }

    setFuNotes('');
    setFuNextPlan('');
    setActiveFollowUpQuo(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Commercial Quotations &amp; Opportunity Funnel</span>
            <span>·</span>
            <span>Win Rate {winRateMetrics.winRate}%</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Penawaran Harga, Ekstraksi PDF &amp; Win Rate
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Input surat penawaran harga via upload PDF (otomatis ekstraksi nomor, klien, dan penyesuaian nominal sebelum PPN), kelola data penawaran (ubah &amp; hapus), serta pantau konversi win rate per kategori pengujian.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Hidden PDF File input */}
          <input
            type="file"
            ref={pdfInputRef}
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handlePdfUpload(e.target.files[0]);
              }
            }}
          />

          {/* USER REQUESTED: Upload / Input Quotation dalam bentuk PDF */}
          <button
            onClick={() => pdfInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-900 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-lg shadow-xs transition-colors"
            title="Upload file penawaran harga PDF untuk diekstrak otomatis"
          >
            <Upload className="w-3.5 h-3.5 text-sky-700" />
            <span>Upload Quotation PDF (Ekstraksi DPP)</span>
          </button>

          {/* USER REQUESTED: Contoh input file PDF */}
          <button
            onClick={handleLoadSamplePdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
            title="Muat contoh input file PDF penawaran untuk demonstrasi"
          >
            <Paperclip className="w-3.5 h-3.5 text-slate-500" />
            <span>Contoh Input PDF</span>
          </button>

          {/* Create Manual Quotation */}
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Penawaran Manual</span>
          </button>
        </div>
      </div>

      {/* KPI Funnel & Win Rate Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Win Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Win Rate Rasio</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{winRateMetrics.winRate}%</span>
            <span className="text-[11px] text-slate-500">
              ({winRateMetrics.won} Won / {winRateMetrics.won + winRateMetrics.lost} Selesai)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-medium">
            Nilai Disetujui (Won): <strong>{formatCompactPortofolio(winRateMetrics.wonDpp)}</strong>
          </div>
        </div>

        {/* Active Pipeline */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Pipeline Aktif</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{winRateMetrics.inProgress}</span>
            <span className="text-[11px] text-slate-500">Proposal Berjalan</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-800 font-medium">
            Potensi DPP: <strong>{formatCompactPortofolio(winRateMetrics.activePipelineDpp)}</strong>
          </div>
        </div>

        {/* Total Proposal */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Total Penawaran</span>
            <FileText className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{winRateMetrics.total}</span>
            <span className="text-[11px] text-slate-500">Surat Penawaran</span>
          </div>
          <div className="mt-2 text-[11px] text-sky-800 font-medium">
            Total Pipeline: <strong>{formatCompactPortofolio(winRateMetrics.totalPipelineDpp)}</strong>
          </div>
        </div>

        {/* Won vs Lost */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Status Akhir</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>{winRateMetrics.won} Won</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-rose-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              <span>{winRateMetrics.lost} Lost</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Penawaran Resmi Laboratorium Terakreditasi
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari no penawaran, klien, ID ELSA, layanan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none font-medium"
            >
              <option value="all">Status: Semua</option>
              <option value="Terkirim">Terkirim</option>
              <option value="Negosiasi">Negosiasi</option>
              <option value="Follow Up">Follow Up</option>
              <option value="Won">Won (Disetujui)</option>
              <option value="Lost">Lost (Ditolak)</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none font-medium"
            >
              <option value="all">Kategori: Semua</option>
              <option value="Isotop Rasio IRMS">Isotop Rasio IRMS</option>
              <option value="Kromatografi (HPLC / GCMS)">Kromatografi (HPLC / GCMS)</option>
              <option value="Spektrometri & Partikel (PSA / ICP-MS / XRF)">Spektrometri &amp; Partikel</option>
              <option value="Termal & Sorpsi (TGA / Chemisorption)">Termal &amp; Sorpsi</option>
              <option value="Spektroskopi (FTIR / NMR)">Spektroskopi (FTIR / NMR)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0 z-10 font-semibold">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">No</th>
                <th className="py-2.5 px-3 whitespace-nowrap">No Penawaran</th>
                <th className="py-2.5 px-3 whitespace-nowrap">ID ELSA</th>
                <th className="py-2.5 px-3 min-w-[170px]">Nama Klien</th>
                <th className="py-2.5 px-3 min-w-[140px]">PIC &amp; Kontak</th>
                <th className="py-2.5 px-3 min-w-[200px]">Layanan Pengujian</th>
                {/* Nominal disesuaikan nilai sebelum PPN (DPP) */}
                <th className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-sky-900">
                  DPP Sebelum PPN (IDR)
                </th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Status</th>
                <th className="py-2.5 px-3 min-w-[120px]">Lampiran PDF</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400 italic">
                    Tidak ada surat penawaran harga yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((quo, idx) => {
                  return (
                    <tr key={quo.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>

                      {/* No Penawaran */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-slate-900">
                        {quo.quotationNumber}
                        <span className="text-[10px] text-slate-500 block font-normal font-sans">
                          {quo.date}
                        </span>
                      </td>

                      {/* ID ELSA */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {quo.idElsa ? (
                          <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {quo.idElsa}
                          </span>
                        ) : (
                          <span className="text-slate-300 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Company Name */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 truncate max-w-[190px]" title={quo.company}>
                          {quo.company}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800 truncate max-w-[150px]">
                          {quo.contactPerson}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {quo.phone || quo.email}
                        </div>
                      </td>

                      {/* Layanan Pengujian */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800 line-clamp-1" title={quo.layananPengujian}>
                          {quo.layananPengujian}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                          <span>{quo.kategoriLayanan}</span>
                          <span>·</span>
                          <span className="font-mono">{quo.sampleCount} Sampel</span>
                        </div>
                      </td>

                      {/* DPP Value (Sebelum PPN) */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span className="font-mono font-bold text-xs text-slate-900 block">
                          {formatRupiah(quo.dppTotal)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatCompactPortofolio(quo.dppTotal)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          quo.status === 'Won'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : quo.status === 'Lost'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : quo.status === 'Negosiasi'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : quo.status === 'Follow Up'
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {quo.status}
                        </span>
                      </td>

                      {/* Attached PDF Lampiran */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {quo.attachmentPdfName ? (
                          <button
                            onClick={() => setPreviewPdfQuo(quo)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-800 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded border border-sky-200 transition-colors"
                            title={`Lihat lampiran file PDF: ${quo.attachmentPdfName}`}
                          >
                            <Paperclip className="w-3 h-3 text-sky-600" />
                            <span className="max-w-[100px] truncate">{quo.attachmentPdfName}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Generate Otomatis</span>
                        )}
                      </td>

                      {/* USER REQUESTED: Aksi Ubah dan Hapus Data Penawaran */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* Official PDF Download */}
                          <button
                            onClick={() => generateQuotationPdf(quo)}
                            className="p-1 text-slate-500 hover:text-slate-900 rounded"
                            title="Download Surat Penawaran Resmi (PDF)"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Follow-up Button */}
                          <button
                            onClick={() => {
                              setActiveFollowUpQuo(quo);
                              setFuPicName(quo.contactPerson);
                              setFuStatusUpdate(quo.status);
                            }}
                            className="p-1 text-sky-600 hover:text-sky-900 rounded"
                            title="Opsi Follow Up"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit / Ubah Penawaran */}
                          <button
                            onClick={() => setEditingQuo(quo)}
                            className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors"
                            title="Ubah data penawaran"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete / Hapus Penawaran */}
                          <button
                            onClick={async () => {
                              if (window.confirm(`Hapus surat penawaran ${quo.quotationNumber} (${quo.company})? Data tidak dapat dipulihkan.`)) {
                                await deleteQuotation(quo.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Hapus surat penawaran"
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
      </div>

      {/* USER REQUESTED MODAL: HASIL EKSTRAKSI OTOMATIS DARI PDF PENAWARAN */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-700" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Ekstraksi Otomatis Input Penawaran PDF
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Nomor, klien, dan nominal disesuaikan berdasarkan nilai sebelum PPN (DPP).
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsPdfModalOpen(false);
                  setExtractedPdfData(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isExtractingPdf ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-600 font-medium">
                  Membaca struktur teks PDF dan menghitung DPP sebelum PPN...
                </p>
              </div>
            ) : extractedPdfData ? (
              <div className="space-y-4 my-4 text-xs">
                {/* File info badge */}
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-slate-700">
                  <span className="font-mono font-semibold flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-sky-600" />
                    <span>{extractedPdfData.fileName}</span>
                  </span>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                    Lampiran Tersimpan
                  </span>
                </div>

                {/* Extracted Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nomor Penawaran (Hasil Ekstraksi)</label>
                    <input
                      type="text"
                      value={extractedPdfData.quotationNumber}
                      onChange={(e) => setExtractedPdfData({ ...extractedPdfData, quotationNumber: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ID ELSA</label>
                    <input
                      type="text"
                      value={extractedPdfData.idElsa}
                      onChange={(e) => setExtractedPdfData({ ...extractedPdfData, idElsa: e.target.value })}
                      placeholder="e.g. 24-001099"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nama Perusahaan / Klien</label>
                    <input
                      type="text"
                      value={extractedPdfData.company}
                      onChange={(e) => setExtractedPdfData({ ...extractedPdfData, company: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nama PIC</label>
                    <input
                      type="text"
                      value={extractedPdfData.contactPerson}
                      onChange={(e) => setExtractedPdfData({ ...extractedPdfData, contactPerson: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Layanan Pengujian</label>
                  <input
                    type="text"
                    value={extractedPdfData.layananPengujian}
                    onChange={(e) => setExtractedPdfData({ ...extractedPdfData, layananPengujian: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded"
                  />
                </div>

                {/* USER SPECIFICATION: Penyesuaian nominal berdasarkan nilai sebelum PPN (DPP) */}
                <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                    <Calculator className="w-4 h-4 text-sky-700" />
                    <span>Penyesuaian Nilai Nominal Sebelum PPN (DPP)</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
                    <div className="p-2 bg-white rounded border border-sky-200">
                      <span className="text-[10px] text-slate-500 uppercase block font-sans">DPP Sebelum PPN</span>
                      <span className="text-sm font-bold text-sky-900">{formatRupiah(extractedPdfData.dppTotal)}</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-sky-200">
                      <span className="text-[10px] text-slate-500 uppercase block font-sans">PPN (11%)</span>
                      <span className="text-sm font-semibold text-slate-700">{formatRupiah(extractedPdfData.vatAmount)}</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-sky-200">
                      <span className="text-[10px] text-slate-500 uppercase block font-sans">Total Termasuk PPN</span>
                      <span className="text-sm font-semibold text-slate-700">{formatRupiah(extractedPdfData.totalWithVat)}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-sky-800 italic mt-1">
                    ✓ Nilai omzet dan performa insentif dihitung akurat dari DPP (Rp {extractedPdfData.dppTotal.toLocaleString('id-ID')}), bukan nilai sesudah pajak.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPdfModalOpen(false);
                      setExtractedPdfData(null);
                    }}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleCommitPdfQuotation}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Konfirmasi &amp; Simpan Penawaran</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* USER REQUESTED MODAL: EDIT / UBAH PENAWARAN */}
      {editingQuo && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Ubah Data Surat Penawaran ({editingQuo.quotationNumber})
              </h3>
              <button onClick={() => setEditingQuo(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditQuotation} className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Penawaran</label>
                  <input
                    type="text"
                    value={editingQuo.quotationNumber}
                    onChange={(e) => setEditingQuo({ ...editingQuo, quotationNumber: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ID ELSA</label>
                  <input
                    type="text"
                    value={editingQuo.idElsa}
                    onChange={(e) => setEditingQuo({ ...editingQuo, idElsa: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Perusahaan</label>
                  <input
                    type="text"
                    value={editingQuo.company}
                    onChange={(e) => setEditingQuo({ ...editingQuo, company: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PIC Klien</label>
                  <input
                    type="text"
                    value={editingQuo.contactPerson}
                    onChange={(e) => setEditingQuo({ ...editingQuo, contactPerson: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Layanan Pengujian</label>
                <input
                  type="text"
                  value={editingQuo.layananPengujian}
                  onChange={(e) => setEditingQuo({ ...editingQuo, layananPengujian: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Sampel</label>
                  <input
                    type="number"
                    min={1}
                    value={editingQuo.sampleCount}
                    onChange={(e) => setEditingQuo({ ...editingQuo, sampleCount: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tarif DPP/Sampel</label>
                  <input
                    type="number"
                    min={0}
                    value={editingQuo.pricePerSample}
                    onChange={(e) => setEditingQuo({ ...editingQuo, pricePerSample: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Penawaran</label>
                  <select
                    value={editingQuo.status}
                    onChange={(e) => setEditingQuo({ ...editingQuo, status: e.target.value as QuotationStatus })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-semibold"
                  >
                    <option value="Terkirim">Terkirim</option>
                    <option value="Negosiasi">Negosiasi</option>
                    <option value="Follow Up">Follow Up</option>
                    <option value="Won">Won (Disetujui)</option>
                    <option value="Lost">Lost (Ditolak)</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingQuo(null)}
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

      {/* PDF ATTACHMENT PREVIEW MODAL */}
      {previewPdfQuo && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200 animate-fade-in text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-700" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Lampiran Dokumen PDF Penawaran
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {previewPdfQuo.attachmentPdfName || 'Dokumen Penawaran Asli'}
                  </p>
                </div>
              </div>
              <button onClick={() => setPreviewPdfQuo(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor Dokumen:</span>
                <span className="font-mono font-bold text-slate-900">{previewPdfQuo.quotationNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Perusahaan Klien:</span>
                <span className="font-semibold text-slate-900">{previewPdfQuo.company}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nilai DPP Sebelum PPN:</span>
                <span className="font-mono font-bold text-sky-900">{formatRupiah(previewPdfQuo.dppTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Termasuk PPN 11%:</span>
                <span className="font-mono font-bold text-slate-800">{formatRupiah(previewPdfQuo.totalAmount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => generateQuotationPdf(previewPdfQuo)}
                className="px-3 py-2 bg-slate-900 text-white rounded-lg font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Surat Penawaran Resmi</span>
              </button>

              <button
                onClick={() => setPreviewPdfQuo(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual New Quotation Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Terbitkan Surat Penawaran Baru
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Perusahaan / Klien</label>
                  <input
                    type="text"
                    value={newQuoForm.company}
                    onChange={(e) => setNewQuoForm({ ...newQuoForm, company: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ID ELSA</label>
                  <input
                    type="text"
                    value={newQuoForm.idElsa}
                    onChange={(e) => setNewQuoForm({ ...newQuoForm, idElsa: e.target.value })}
                    placeholder="e.g. 24-001099"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Layanan Pengujian</label>
                <input
                  type="text"
                  value={newQuoForm.layananPengujian}
                  onChange={(e) => setNewQuoForm({ ...newQuoForm, layananPengujian: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Sampel</label>
                  <input
                    type="number"
                    min={1}
                    value={newQuoForm.sampleCount}
                    onChange={(e) => setNewQuoForm({ ...newQuoForm, sampleCount: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tarif DPP/Sampel</label>
                  <input
                    type="number"
                    min={0}
                    value={newQuoForm.pricePerSample}
                    onChange={(e) => setNewQuoForm({ ...newQuoForm, pricePerSample: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Awal</label>
                  <select
                    value={newQuoForm.status}
                    onChange={(e) => setNewQuoForm({ ...newQuoForm, status: e.target.value as QuotationStatus })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="Terkirim">Terkirim</option>
                    <option value="Negosiasi">Negosiasi</option>
                    <option value="Follow Up">Follow Up</option>
                    <option value="Won">Won (Disetujui)</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold"
                >
                  Terbitkan Penawaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Follow-Up Modal */}
      {activeFollowUpQuo && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200 animate-fade-in text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Follow-Up Penawaran</h3>
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                  {activeFollowUpQuo.quotationNumber} · {activeFollowUpQuo.company}
                </p>
              </div>
              <button onClick={() => setActiveFollowUpQuo(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFollowUp} className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Aktivitas Follow-Up</label>
                  <select
                    value={fuActionType}
                    onChange={(e) => setFuActionType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="Telepon / WhatsApp">Telepon / WhatsApp</option>
                    <option value="Email Follow-up">Email Follow-up</option>
                    <option value="Meeting Teknis">Meeting Teknis</option>
                    <option value="Negosiasi Harga">Negosiasi Harga</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PIC Klien</label>
                  <input
                    type="text"
                    value={fuPicName}
                    onChange={(e) => setFuPicName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Respon Klien</label>
                <textarea
                  rows={3}
                  value={fuNotes}
                  onChange={(e) => setFuNotes(e.target.value)}
                  placeholder="Klien mengonfirmasi persetujuan penawaran..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jadwal Tindak Lanjut</label>
                  <input
                    type="date"
                    value={fuNextDate}
                    onChange={(e) => setFuNextDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ubah Status</label>
                  <select
                    value={fuStatusUpdate}
                    onChange={(e) => setFuStatusUpdate(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="Terkirim">Terkirim</option>
                    <option value="Follow Up">Follow Up</option>
                    <option value="Negosiasi">Negosiasi</option>
                    <option value="Won">Won (Disetujui)</option>
                    <option value="Lost">Lost (Ditolak)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveFollowUpQuo(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold"
                >
                  Simpan Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
