import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quotation } from '../types';
import { formatRupiah } from './exportPresentation';

export function generateQuotationPdf(quo: Quotation): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Colors
  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate-900
  const secondaryColor: [number, number, number] = [2, 132, 199]; // Sky-600
  const textDark: [number, number, number] = [30, 41, 59]; // Slate-800
  const textMuted: [number, number, number] = [100, 116, 139]; // Slate-500

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('NULLIUS TESTING & ANALYTICAL LABORATORY', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(186, 230, 253);
  doc.text('Layanan Pengujian Kimia Khusus, Spektrometri, Kromatografi & Instrumentasi Tingkat Lanjut', 14, 18);
  doc.text('Kawasan Sains & Riset Terpadu · Kontak: sales@nullius-lab.co.id · Telp: (021) 7888-0123', 14, 22);

  // 2. Title & Quotation Number
  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('SURAT PENAWARAN HARGA (QUOTATION)', 14, 37);

  // Top info bar
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 42, 182, 32, 2, 2, 'FD');

  // Left col: Quotation details
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('Nomor Penawaran', 18, 48);
  doc.text('Tanggal Terbit', 18, 54);
  doc.text('Masa Berlaku', 18, 60);
  doc.text('Status Dokumen', 18, 66);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text(`: ${quo.quotationNumber}`, 48, 48);
  doc.text(`: ${quo.date}`, 48, 54);
  doc.text(`: ${quo.validUntil || '30 Hari kalender'}`, 48, 60);

  // Status with color
  doc.setFont('helvetica', 'bold');
  if (quo.status === 'Won') {
    doc.setTextColor(5, 150, 105);
  } else if (quo.status === 'Lost') {
    doc.setTextColor(225, 29, 72);
  } else {
    doc.setTextColor(2, 132, 199);
  }
  doc.text(`: ${quo.status.toUpperCase()}`, 48, 66);

  // Right col: Customer / Client details
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('Kepada Yth.', 108, 48);
  doc.text('ID ELSA Klien', 108, 54);
  doc.text('UP (PIC)', 108, 60);
  doc.text('Email / Kontak', 108, 66);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text(`: ${quo.company}`, 134, 48);
  doc.text(`: ${quo.idElsa || '-'}`, 134, 54);
  doc.text(`: ${quo.contactPerson || '-'}`, 134, 60);
  doc.text(`: ${quo.email || quo.phone || '-'}`, 134, 66);

  // 3. Opening greeting
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textDark);
  doc.setFontSize(8.5);
  doc.text(
    'Sehubungan dengan kebutuhan analisis dan pengujian laboratorium yang Saudara sampaikan, bersama ini kami sampaikan rincian penawaran harga pengujian laboratorium sebagai berikut:',
    14,
    81,
    { maxWidth: 182 }
  );

  // 4. Scope Table
  const tableRows = [
    [
      '1',
      quo.layananPengujian + (quo.needsCorrection ? `\n(⚠️ Perhatian: ${quo.correctionNote || 'Kondisi matriks/metode spesifik'})` : ''),
      quo.kategoriLayanan,
      `${quo.sampleCount} Sampel`,
      formatRupiah(quo.pricePerSample),
      formatRupiah(quo.dppTotal)
    ]
  ];

  autoTable(doc, {
    startY: 88,
    head: [['No', 'Deskripsi Layanan Pengujian', 'Kategori Instrumen', 'Qty Sampel', 'Tarif Satuan (DPP)', 'Subtotal (DPP)']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: textDark,
      cellPadding: 3
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 65 },
      2: { cellWidth: 40 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'right', cellWidth: 23 },
      5: { halign: 'right', cellWidth: 24 }
    }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 120;

  // 5. Total Financial Summary Block
  const summaryBoxX = 115;
  const summaryBoxW = 81;
  const summaryY = finalY + 4;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryBoxX, summaryY, summaryBoxW, 26, 1.5, 1.5, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textDark);
  doc.text('Total DPP (Sebelum Pajak):', summaryBoxX + 4, summaryY + 7);
  doc.text(formatRupiah(quo.dppTotal), summaryBoxX + summaryBoxW - 4, summaryY + 7, { align: 'right' });

  doc.text('PPN 11%:', summaryBoxX + 4, summaryY + 13);
  doc.text(formatRupiah(quo.ppn11), summaryBoxX + summaryBoxW - 4, summaryY + 13, { align: 'right' });

  doc.setDrawColor(203, 213, 225);
  doc.line(summaryBoxX + 4, summaryY + 16, summaryBoxX + summaryBoxW - 4, summaryY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Grand Total (Termasuk PPN):', summaryBoxX + 4, summaryY + 22);
  doc.text(formatRupiah(quo.totalAmount), summaryBoxX + summaryBoxW - 4, summaryY + 22, { align: 'right' });

  // 6. Terms & Conditions
  const tcY = summaryY + 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...textDark);
  doc.text('Syarat & Ketentuan Pengujian Laboratorium:', 14, tcY);

  const tcList = [
    '1. Sampel uji diserahkan dalam kemasan yang bersih, aman, berlabel jelas, dan disertai Formulir Permohonan Pengujian (FPP).',
    '2. Waktu pengerjaan (Turnaround Time) standar adalah 7–14 hari kerja terhitung sejak sampel dan kelengkapan dokumen diterima lengkap.',
    '3. Apabila diperlukan preparasi khusus atau analisis ulang di luar lingkup baku, biaya tambahan akan dikonfirmasikan terlebih dahulu.',
    '4. Pembayaran dilakukan via transfer rekening resmi laboratorium setelah penerbitan invoice dan penyelesaian laporan hasil uji (LHU).',
    '5. Penawaran harga ini berlaku selama 30 hari kalender sejak tanggal diterbitkan.'
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  let curY = tcY + 5;
  tcList.forEach(item => {
    doc.text(item, 14, curY, { maxWidth: 182 });
    curY += 4.5;
  });

  // 7. Signature & Authorization
  const signY = curY + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textDark);
  doc.text('Diterima & Disetujui oleh Klien,', 14, signY);
  doc.text('Hormat kami,', 140, signY);
  doc.text('Nullius Analytical Services', 140, signY + 4);

  // Sign boxes
  doc.setDrawColor(203, 213, 225);
  doc.line(14, signY + 26, 68, signY + 26);
  doc.text('( Tanda Tangan & Cap Perusahaan )', 14, signY + 30);

  doc.line(140, signY + 26, 194, signY + 26);
  doc.setFont('helvetica', 'bold');
  doc.text('Sales Executive & Customer Relations', 140, signY + 30);

  // Footer bar
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...textMuted);
  doc.text('Dokumen ini sah dan diterbitkan secara digital oleh Sistem Nullius Executive Workstation.', 14, 287);

  // Save/Download PDF
  const filename = `Penawaran_${quo.quotationNumber.replace(/[\/\\]/g, '_')}_${quo.company.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
}
