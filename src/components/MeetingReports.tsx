import React, { useState } from 'react';
import { 
  Presentation, 
  FileText, 
  FileSpreadsheet, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  CheckCircle2, 
  Sparkles,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { useSalesData } from '../context/SalesDataContext';
import { formatRupiah, formatCompactPortofolio, generatePowerPointDeck, generatePdfReport } from '../utils/exportPresentation';
import { exportMasterDataToExcel } from '../utils/excelProcessor';

export const MeetingReports: React.FC = () => {
  const { strategicMetrics, clients, services, records, selectedPeriod } = useSalesData();
  const [activeSlide, setActiveSlide] = useState(0);

  const topClients = clients.filter(c => c.portfolioDppSpend > 0).slice(0, 5);
  const myServices = services.filter(s => s.isMyAuthority).slice(0, 5);

  const slides = [
    {
      title: 'Cover & Konteks Pertemuan',
      subtitle: `Laporan Penjualan Dua Mingguan — Periode ${selectedPeriod}`,
      speakerNotes: 'Buka rapat dengan menegaskan fokus pada portofolio pengujian analitikal canggih dan evaluasi pencapaian kuota paruh bulan.',
      renderPreview: () => (
        <div className="bg-slate-900 text-white rounded-xl p-8 flex flex-col justify-center min-h-[320px]">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-widest mb-2">
            NULLIUS EXECUTIVE SALES INTELLIGENCE
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Bi-Monthly Sales Performance & Strategy Review
          </h2>
          <p className="text-slate-400 text-sm mt-3">
            Portofolio Pengujian Kimia, Spektrometri & Instrumentasi Khusus · {selectedPeriod}
          </p>
          <div className="mt-8 pt-4 border-t border-slate-800 text-xs text-slate-500">
            Disiapkan untuk Rapat Evaluasi Manajemen Dua Mingguan
          </div>
        </div>
      )
    },
    {
      title: 'Ringkasan Kinerja & Capaian Kuota Target',
      subtitle: `Pencapaian ${Math.round(strategicMetrics.achievementPercent)}% Kuota Portofolio Analitikal`,
      speakerNotes: 'Sampaikan total DPP yang berhasil dikumpulkan, pencapaian target kuota, serta rata-rata nilai order per pengujian (AOV).',
      renderPreview: () => (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 space-y-5 min-h-[320px]">
          <div>
            <span className="text-xs font-bold text-sky-700 uppercase">Key Performance Indicators</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">
              Pendapatan DPP Portofolio: {formatRupiah(strategicMetrics.myPortfolioDpp)}
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">Pencapaian Kuota</span>
              <span className="text-2xl font-bold font-mono text-sky-900 mt-1 block">
                {Math.round(strategicMetrics.achievementPercent)}%
              </span>
              <span className="text-[11px] text-slate-500">Target: {formatRupiah(strategicMetrics.portfolioTarget)}</span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">Rata-rata Order (AOV)</span>
              <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
                {formatRupiah(strategicMetrics.averageOrderValue)}
              </span>
              <span className="text-[11px] text-slate-500">{strategicMetrics.myPortfolioTransactions} Transaksi Uji</span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">Komisi Insentif Terakumulasi</span>
              <span className="text-2xl font-bold font-mono text-emerald-800 mt-1 block">
                {formatRupiah(strategicMetrics.totalIncentiveEstimated)}
              </span>
              <span className="text-[11px] text-slate-500">Lunas: {formatRupiah(strategicMetrics.paidIncentive)}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Analisis Pareto 80/20 & Akun Penggerak Utama',
      subtitle: `${strategicMetrics.topParetoClientsCount} Klien Utama Menyumbang ~80% Pendapatan Portofolio`,
      speakerNotes: 'Jelaskan ketergantungan revenue pada akun-akun besar seperti PT Valenza Engineering dan PT GEOSERVICES, serta strategi mitigasi konsentrasi.',
      renderPreview: () => (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 space-y-4 min-h-[320px]">
          <h3 className="text-base font-bold text-slate-900">
            Top 5 Akun Penggerak Revenue Terbesar (Pareto Drivers)
          </h3>
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Perusahaan</th>
                  <th className="py-2.5 px-3">Industri</th>
                  <th className="py-2.5 px-3 text-center">Order (RO)</th>
                  <th className="py-2.5 px-3 text-right">Total DPP (IDR)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {topClients.map(c => (
                  <tr key={c.id}>
                    <td className="py-2 px-3 font-semibold text-slate-900">{c.companyName}</td>
                    <td className="py-2 px-3">{c.industry}</td>
                    <td className="py-2 px-3 text-center font-mono">{c.totalOrdersCount}x</td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <span className="font-mono font-bold block">{formatRupiah(c.portfolioDppSpend)}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{formatCompactPortofolio(c.portfolioDppSpend)}</span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    },
    {
      title: 'Layanan Uji Instrumentasi Unggulan',
      subtitle: 'Distribusi Volume dan Pendapatan Pengujian Analitikal',
      speakerNotes: 'Paparkan instrumen dengan permintaan tertinggi (IRMS, HPLC, NMR, PSA) dan utilitas kapasitas lab.',
      renderPreview: () => (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 space-y-4 min-h-[320px]">
          <h3 className="text-base font-bold text-slate-900">
            Katalog Layanan Terlaris Portofolio Analitikal
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {myServices.map(s => (
              <div key={s.id} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{s.serviceName}</h4>
                  <span className="text-[11px] text-slate-500">{s.sampleCount} Sampel Diuji</span>
                </div>
                <span className="text-xs font-bold font-mono text-sky-800">
                  {formatRupiah(s.totalDppRevenue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Rencana Aksi & Tindak Lanjut Dua Minggu ke Depan',
      subtitle: 'Prioritas Penjualan Menuju Akhir Periode',
      speakerNotes: 'Tutup presentasi dengan 4 komitmen tindakan konkret: percepatan penawaran geothermal, reaktivasi akun dormant, dan cross-sell layanan farmasi.',
      renderPreview: () => (
        <div className="bg-slate-900 text-white rounded-xl p-8 space-y-4 min-h-[320px]">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-widest">
            ACTION PLAN
          </span>
          <h3 className="text-xl font-bold">Prioritas Kerja 2 Minggu ke Depan</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
              <span className="text-sky-400 font-bold block mb-1">01. Akselerasi IRMS Geothermal</span>
              <p className="text-slate-300 text-[11px]">
                Kirim proposal diskon volume dan bundling ICP-MS untuk PT Valenza Engineering & Geoservices.
              </p>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
              <span className="text-sky-400 font-bold block mb-1">02. Reaktivasi Klien Dormant</span>
              <p className="text-slate-300 text-[11px]">
                Hubungi {strategicMetrics.atRiskClientsCount} akun yang belum mengirim sampel dalam 14 hari terakhir.
              </p>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
              <span className="text-sky-400 font-bold block mb-1">03. Cross-Sell Zeta & NMR</span>
              <p className="text-slate-300 text-[11px]">
                Tawarkan Zeta Potensial ke klien PSA (Kalbe Nutritionals) dan NMR 700MHz ke klien farmasi.
              </p>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
              <span className="text-sky-400 font-bold block mb-1">04. Penagihan & Pelunasan PO</span>
              <p className="text-slate-300 text-[11px]">
                Pastikan seluruh invoice berstatus selesai dibayarkan tepat waktu sebelum cut-off insentif.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Executive Meeting Suite</span>
            <span>·</span>
            <span>Rapat Manajemen Dua Mingguan</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Paket Laporan & Presentasi Rapat Sales
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Buat slide presentasi otomatis untuk rapat dua mingguan Anda. Langsung unduh sebagai file PowerPoint (.pptx), memo ringkasan PDF, atau ledger audit Excel.
          </p>
        </div>

        {/* 1-Click Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => generatePowerPointDeck(strategicMetrics, clients, services, selectedPeriod)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
          >
            <Presentation className="w-4 h-4 text-sky-400" />
            <span>Download Slide Rapat (.PPTX)</span>
          </button>

          <button
            onClick={() => generatePdfReport(strategicMetrics, clients, selectedPeriod)}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Memo PDF</span>
          </button>

          <button
            onClick={() => exportMasterDataToExcel(records, `Ledger_Rapat_${selectedPeriod.replace(/\s+/g, '_')}.xlsx`)}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Audit XLSX</span>
          </button>
        </div>
      </div>

      {/* Interactive Slide Viewer & Speaker Deck */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Slide {activeSlide + 1} dari {slides.length}:
            </span>
            <span className="text-sm font-bold text-slate-900">
              {slides[activeSlide].title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
              disabled={activeSlide === 0}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setActiveSlide(Math.min(slides.length - 1, activeSlide + 1))}
              disabled={activeSlide === slides.length - 1}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Active Slide Canvas Preview */}
        <div>
          {slides[activeSlide].renderPreview()}
        </div>

        {/* Speaker Talking Points Box */}
        <div className="p-4 bg-sky-50/70 border border-sky-100 rounded-xl flex items-start gap-3 text-xs text-sky-950">
          <span className="font-bold uppercase tracking-wider text-[10px] text-sky-700 bg-sky-100 px-2 py-0.5 rounded mt-0.5 shrink-0">
            Panduan Berbicara Rapat
          </span>
          <p className="text-sky-900 leading-relaxed">
            {slides[activeSlide].speakerNotes}
          </p>
        </div>

        {/* Thumbnail Selector */}
        <div className="grid grid-cols-5 gap-2 pt-2">
          {slides.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`p-2 rounded-lg text-left text-[11px] border transition-all ${
                activeSlide === idx 
                  ? 'border-slate-900 bg-slate-900 text-white font-semibold shadow-xs' 
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="block text-[10px] text-slate-400">Slide {idx + 1}</span>
              <span className="line-clamp-1">{s.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
