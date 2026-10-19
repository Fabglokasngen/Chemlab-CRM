import pptxgen from 'pptxgenjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MasterSalesRecord, ClientProfile, TestingServiceSummary } from '../types';
import { StrategicMetrics } from './strategicAnalytics';

export function formatRupiah(val: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val);
}

/**
 * Format spend portofolio:
 * - If >= 1 Juta (Jutaan): use 'M' (e.g. "Rp 15.5 M" or "15.5 M")
 * - If < 1 Juta Rupiah: use 'K' (e.g. "Rp 400 K" or "400 K")
 */
export function formatCompactPortofolio(val: number, withPrefix = true): string {
  if (val === undefined || val === null || isNaN(val)) return withPrefix ? 'Rp 0' : '0';
  const prefix = withPrefix ? 'Rp ' : '';
  
  if (val >= 1_000_000_000) {
    const num = (val / 1_000_000_000).toFixed(1).replace(/\.0$/, '');
    return `${prefix}${num} B`;
  } else if (val >= 1_000_000) {
    const num = (val / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `${prefix}${num} M`;
  } else if (val >= 1_000) {
    const num = Math.round(val / 1_000);
    return `${prefix}${num} K`;
  }
  return `${prefix}${val}`;
}

export const formatCompactSpend = formatCompactPortofolio;

export function generatePowerPointDeck(
  metrics: StrategicMetrics,
  topClients: ClientProfile[],
  services: TestingServiceSummary[],
  period = 'Agustus 2026'
): void {
  const pptx = new pptxgen();

  // Configure presentation properties
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Sales Executive';
  pptx.company = 'Nullius Lab Intelligence';
  pptx.title = `Sales Review & Strategy Deck - ${period}`;

  // Theme colors
  const NAVY = '0F172A';
  const BLUE = '1E40AF';
  const EMERALD = '059669';
  const AMBER = 'D97706';
  const SLATE = '475569';
  const WHITE = 'FFFFFF';
  const LIGHT_BG = 'F8FAFC';

  // SLIDE 1: Cover Slide
  const slide1 = pptx.addSlide();
  slide1.background = { color: NAVY };

  slide1.addText('NULLIUS SALES INTELLIGENCE', {
    x: 0.8,
    y: 1.5,
    w: 8.5,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: '38BDF8',
    fontFace: 'Arial'
  });

  slide1.addText(`Bi-Monthly Sales Performance\n& Executive Strategy Review`, {
    x: 0.8,
    y: 2.1,
    w: 9.0,
    h: 1.8,
    fontSize: 34,
    bold: true,
    color: WHITE,
    fontFace: 'Arial',
    lineSpacing: 40
  });

  slide1.addText(`Periode Pelaporan: ${period} | Portofolio Pengujian Analitikal & Instrumentasi`, {
    x: 0.8,
    y: 4.2,
    w: 9.0,
    h: 0.5,
    fontSize: 14,
    color: '94A3B8',
    fontFace: 'Arial'
  });

  slide1.addText(`Disiapkan untuk Rapat Evaluasi Manajemen Dua Mingguan`, {
    x: 0.8,
    y: 4.8,
    w: 9.0,
    h: 0.4,
    fontSize: 12,
    italic: true,
    color: '64748B',
    fontFace: 'Arial'
  });

  // SLIDE 2: Executive Summary & Performance KPI
  const slide2 = pptx.addSlide();
  slide2.background = { color: LIGHT_BG };

  slide2.addText('RINGKASAN EKSEKUTIF & PENCAPAIAN KUOTA', {
    x: 0.8,
    y: 0.6,
    w: 9.0,
    h: 0.5,
    fontSize: 20,
    bold: true,
    color: NAVY,
    fontFace: 'Arial'
  });

  slide2.addText(`Evaluasi Pencapaian Portofolio Analitikal & Instrumentasi Periode ${period}`, {
    x: 0.8,
    y: 1.1,
    w: 9.0,
    h: 0.3,
    fontSize: 12,
    color: SLATE,
    fontFace: 'Arial'
  });

  // KPI Boxes
  const kpis = [
    { title: 'Pendapatan DPP Portofolio', val: formatRupiah(metrics.myPortfolioDpp), sub: `${metrics.myPortfolioTransactions} Transaksi Analitikal`, color: EMERALD },
    { title: 'Pencapaian Kuota Target', val: `${Math.round(metrics.achievementPercent)}%`, sub: `Target: ${formatRupiah(metrics.portfolioTarget)}`, color: BLUE },
    { title: 'Average Order Value (AOV)', val: formatRupiah(metrics.averageOrderValue), sub: 'Rata-rata Nilai Uji per Order', color: NAVY },
    { title: 'Estimasi Komisi Insentif', val: formatRupiah(metrics.totalIncentiveEstimated), sub: `Lunas: ${formatRupiah(metrics.paidIncentive)}`, color: AMBER },
  ];

  kpis.forEach((kpi, idx) => {
    const xPos = 0.8 + idx * 2.8;
    slide2.addShape(pptx.ShapeType.rect, {
      x: xPos,
      y: 1.6,
      w: 2.6,
      h: 1.8,
      fill: { color: WHITE },
      line: { color: 'CBD5E1', width: 1 }
    });

    slide2.addText(kpi.title, {
      x: xPos + 0.15,
      y: 1.8,
      w: 2.3,
      h: 0.4,
      fontSize: 10,
      color: SLATE,
      fontFace: 'Arial',
      bold: true
    });

    slide2.addText(kpi.val, {
      x: xPos + 0.15,
      y: 2.2,
      w: 2.3,
      h: 0.6,
      fontSize: 16,
      color: kpi.color,
      fontFace: 'Arial',
      bold: true
    });

    slide2.addText(kpi.sub, {
      x: xPos + 0.15,
      y: 2.8,
      w: 2.3,
      h: 0.4,
      fontSize: 9,
      color: '64748B',
      fontFace: 'Arial'
    });
  });

  // Bullet insights
  slide2.addText([
    { text: 'Highlight Strategis Bulan Ini:\n', options: { bold: true, fontSize: 13, color: NAVY } },
    { text: `• Kontribusi revenue portofolio analitikal menyumbang ${Math.round(metrics.portfolioSharePercent)}% terhadap total perusahaan (${formatRupiah(metrics.totalCompanyDpp)} DPP).\n`, options: { fontSize: 11, color: SLATE } },
    { text: `• Sektor energi & geothermal (PT Valenza Engineering & PT GEOSERVICES) mendominasi dengan pengujian IRMS bernilai tinggi.\n`, options: { fontSize: 11, color: SLATE } },
    { text: `• Akun industri farmasi & riset (Combiphar, UGM, IPB) mempertahankan volume stabil pengujian GCMS, PSA, dan NMR 700MHz.\n`, options: { fontSize: 11, color: SLATE } },
  ], {
    x: 0.8,
    y: 3.7,
    w: 11.2,
    h: 1.8,
    fill: { color: WHITE },
    line: { color: 'CBD5E1', width: 1 }
  });

  // SLIDE 3: Top Accounts & Pareto Drivers
  const slide3 = pptx.addSlide();
  slide3.background = { color: LIGHT_BG };

  slide3.addText('ANALISIS KONSENTRASI KLIEN (PARETO 80/20)', {
    x: 0.8,
    y: 0.6,
    w: 9.0,
    h: 0.5,
    fontSize: 20,
    bold: true,
    color: NAVY,
    fontFace: 'Arial'
  });

  slide3.addText('Top Key Accounts Penggerak 80% Pendapatan Portofolio Analitikal', {
    x: 0.8,
    y: 1.1,
    w: 9.0,
    h: 0.3,
    fontSize: 12,
    color: SLATE,
    fontFace: 'Arial'
  });

  const tableHeaders = [
    { text: 'No', options: { bold: true, fill: { color: '1E293B' }, color: WHITE } },
    { text: 'Nama Perusahaan', options: { bold: true, fill: { color: '1E293B' }, color: WHITE } },
    { text: 'Sektor Industri', options: { bold: true, fill: { color: '1E293B' }, color: WHITE } },
    { text: 'Total Orders', options: { bold: true, fill: { color: '1E293B' }, color: WHITE } },
    { text: 'Total DPP (IDR)', options: { bold: true, fill: { color: '1E293B' }, color: WHITE } },
    { text: 'Status Akun', options: { bold: true, fill: { color: '1E293B' }, color: WHITE } }
  ];

  const tableRows = topClients.slice(0, 7).map((c, idx) => [
    { text: String(idx + 1), options: { align: 'center' as const } },
    { text: c.companyName, options: { bold: true } },
    { text: c.industry },
    { text: `${c.totalOrdersCount}x Order`, options: { align: 'center' as const } },
    { text: formatRupiah(c.portfolioDppSpend || c.totalDppSpend), options: { align: 'right' as const, bold: true } },
    { text: c.status, options: { align: 'center' as const, color: c.status === 'Active' ? EMERALD : AMBER } }
  ]);

  slide3.addTable([tableHeaders, ...tableRows], {
    x: 0.8,
    y: 1.6,
    w: 11.2,
    colW: [0.6, 3.5, 2.5, 1.4, 2.0, 1.2],
    fontSize: 10,
    fill: { color: WHITE },
    border: { color: 'CBD5E1', pt: 0.5 }
  });

  // SLIDE 4: Testing Services Breakdown
  const slide4 = pptx.addSlide();
  slide4.background = { color: LIGHT_BG };

  slide4.addText('KATALOG & KONTRIBUSI LAYANAN INSTRUMENTASI', {
    x: 0.8,
    y: 0.6,
    w: 9.0,
    h: 0.5,
    fontSize: 20,
    bold: true,
    color: NAVY,
    fontFace: 'Arial'
  });

  slide4.addText('Daftar Layanan Uji Unggulan Portofolio Berdasarkan Pendapatan DPP', {
    x: 0.8,
    y: 1.1,
    w: 9.0,
    h: 0.3,
    fontSize: 12,
    color: SLATE,
    fontFace: 'Arial'
  });

  const srvHeaders = [
    { text: 'Layanan Pengujian', options: { bold: true, fill: { color: '1E293B' }, color: WHITE } },
    { text: 'Kategori', options: { bold: true, fill: { color: '1E293B' }, color: WHITE } },
    { text: 'Sampel', options: { bold: true, fill: { color: '1E293B' }, color: WHITE } },
    { text: 'Harga Unit (DPP)', options: { bold: true, fill: { color: '1E293B' }, color: WHITE } },
    { text: 'Total Revenue (DPP)', options: { bold: true, fill: { color: '1E293B' }, color: WHITE } }
  ];

  const mySrv = services.filter(s => s.isMyAuthority).slice(0, 7);
  const srvRows = mySrv.map(s => [
    { text: s.serviceName, options: { bold: true } },
    { text: s.category },
    { text: `${s.sampleCount}`, options: { align: 'center' as const } },
    { text: formatRupiah(s.basePrice), options: { align: 'right' as const } },
    { text: formatRupiah(s.totalDppRevenue), options: { align: 'right' as const, bold: true } }
  ]);

  slide4.addTable([srvHeaders, ...srvRows], {
    x: 0.8,
    y: 1.6,
    w: 11.2,
    colW: [4.2, 2.5, 1.0, 1.8, 1.7],
    fontSize: 10,
    fill: { color: WHITE },
    border: { color: 'CBD5E1', pt: 0.5 }
  });

  // SLIDE 5: Action Plan & Next Steps
  const slide5 = pptx.addSlide();
  slide5.background = { color: NAVY };

  slide5.addText('STRATEGI PENJUALAN & RENCANA AKSI DUA MINGGU KE DEPAN', {
    x: 0.8,
    y: 0.8,
    w: 10.0,
    h: 0.5,
    fontSize: 22,
    bold: true,
    color: WHITE,
    fontFace: 'Arial'
  });

  const actionItems = [
    {
      num: '01',
      title: 'Akselerasi Pengujian IRMS & Geotermal',
      desc: 'Follow-up proposal bundling Isotop O&H dengan ICP-MS untuk PT Valenza Engineering dan PT GEOSERVICES guna mengunci target revenue kuartal berikutnya.'
    },
    {
      num: '02',
      title: 'Re-engagement Akun Dormant (>14 Hari)',
      desc: 'Kirimkan katalog update dan promo turnaround time express kepada akun riset & farmasi yang belum mengirimkan sampel dalam 2 minggu terakhir.'
    },
    {
      num: '03',
      title: 'Cross-Sell Layanan Komplementer',
      desc: 'Tawarkan Zeta Potensial ke klien PSA (seperti Kalbe Nutritionals) dan NMR 700MHz ke klien HPLC farmasi untuk memaksimalkan wallet share.'
    },
    {
      num: '04',
      title: 'Monitoring Kelancaran Pembayaran & PO',
      desc: 'Koordinasi dengan tim finance klien untuk memastikan PO tertagih tepat waktu sebelum cut-off periode pembagian komisi insentif.'
    }
  ];

  actionItems.forEach((item, idx) => {
    const yPos = 1.6 + idx * 1.2;
    slide5.addShape(pptx.ShapeType.rect, {
      x: 0.8,
      y: yPos,
      w: 11.2,
      h: 1.0,
      fill: { color: '1E293B' },
      line: { color: '334155', width: 1 }
    });

    slide5.addText(item.num, {
      x: 1.0,
      y: yPos + 0.2,
      w: 0.8,
      h: 0.6,
      fontSize: 20,
      bold: true,
      color: '38BDF8',
      fontFace: 'Arial'
    });

    slide5.addText(item.title, {
      x: 1.8,
      y: yPos + 0.15,
      w: 10.0,
      h: 0.35,
      fontSize: 13,
      bold: true,
      color: WHITE,
      fontFace: 'Arial'
    });

    slide5.addText(item.desc, {
      x: 1.8,
      y: yPos + 0.5,
      w: 10.0,
      h: 0.45,
      fontSize: 10.5,
      color: '94A3B8',
      fontFace: 'Arial'
    });
  });

  // Export file
  pptx.writeFile({ fileName: `Slide_Meeting_Sales_Nullius_${period.replace(/\s+/g, '_')}.pptx` });
}

// Generate PDF Report Memo
export function generatePdfReport(
  metrics: StrategicMetrics,
  topClients: ClientProfile[],
  period = 'Agustus 2026'
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header banner
  doc.setFillColor(15, 23, 42); // Navy
  doc.rect(0, 0, 210, 32, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('NULLIUS — EXECUTIVE SALES REPORT', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(`Laporan Evaluasi & Strategi Penjualan Dua Mingguan | Periode: ${period}`, 14, 23);

  // Key Metrics Grid
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Ringkasan Kinerja & Capaian Kuota', 14, 42);

  const startY = 48;
  const colW = 45;

  const summaryBoxes = [
    { label: 'Revenue DPP Portofolio', val: formatRupiah(metrics.myPortfolioDpp) },
    { label: 'Capaian Kuota Target', val: `${Math.round(metrics.achievementPercent)}%` },
    { label: 'Total Transaksi Uji', val: `${metrics.myPortfolioTransactions} Order` },
    { label: 'Estimasi Komisi Insentif', val: formatRupiah(metrics.totalIncentiveEstimated) },
  ];

  summaryBoxes.forEach((box, i) => {
    const x = 14 + i * colW;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(x, startY, colW - 3, 22, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(box.label, x + 3, startY + 7);

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(box.val, x + 3, startY + 16);
  });

  // Table of Key Clients
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. Top Key Accounts (Penggerak Utama 80% Revenue)', 14, 82);

  const tableData = topClients.slice(0, 8).map((c, i) => [
    i + 1,
    c.companyName,
    c.industry,
    `${c.totalOrdersCount}x`,
    formatRupiah(c.portfolioDppSpend || c.totalDppSpend),
    c.clientTier,
    c.status
  ]);

  autoTable(doc, {
    startY: 86,
    head: [['No', 'Perusahaan', 'Industri', 'Order', 'Nilai DPP', 'Tier', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 55, fontStyle: 'bold' },
      2: { cellWidth: 40 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 25 },
      6: { cellWidth: 20, halign: 'center' }
    }
  });

  // Final Action Notes
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. Catatan Strategis & Rekomendasi Rapat', 14, finalY);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const notes = [
    `• Portofolio instrumen analitikal mencapai ${Math.round(metrics.portfolioSharePercent)}% dari total omzet laboratorium. Klien panas bumi dan eksplorasi menjadi kontributor terbesar.`,
    `• Insentif penjualan yang telah berstatus lunas mencapai ${formatRupiah(metrics.paidIncentive)}, dengan sisa ${formatRupiah(metrics.pendingIncentive)} menunggu proses pelunasan invoice klien.`,
    `• Terdapat ${metrics.atRiskClientsCount} akun klien yang perlu di-reaktivasi dalam 14 hari ke depan untuk mencegah perpindahan sampel ke lab kompetitor.`
  ];

  let noteY = finalY + 6;
  notes.forEach(n => {
    doc.text(n, 14, noteY, { maxWidth: 180 });
    noteY += 8;
  });

  doc.save(`Laporan_Sales_Meeting_Nullius_${period.replace(/\s+/g, '_')}.pdf`);
}
