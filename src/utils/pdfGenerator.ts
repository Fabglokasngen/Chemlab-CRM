import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, Incentive } from '../types';

export function get6DigitId(proj: Project): string {
  if (proj.idElsa && /^\d{6}$/.test(proj.idElsa)) {
    return proj.idElsa;
  }
  const digitsOnly = proj.id.replace(/\D/g, '');
  if (digitsOnly.length >= 6) {
    return digitsOnly.slice(-6);
  }
  if (digitsOnly.length > 0) {
    return digitsOnly.padStart(6, '4');
  }
  let hash = 0;
  for (let i = 0; i < proj.id.length; i++) {
    hash = (hash * 31 + proj.id.charCodeAt(i)) % 1000000;
  }
  return String(Math.abs(hash)).padStart(6, '1');
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export interface PDFExportOptions {
  type: 'ongoing' | 'tracker';
  periodType: 'monthly' | 'yearly' | 'current_filter';
  month?: string; // '01' to '12'
  year?: string;  // e.g. '2026'
  projects: Project[];
  monthNameMap: Record<string, string>;
}

export function generatePDFReport(options: PDFExportOptions): void {
  const { type, periodType, month, year, projects, monthNameMap } = options;

  // Filter projects according to period selection
  let filtered = [...projects];

  if (periodType === 'monthly' && month && year) {
    filtered = filtered.filter(p => {
      if (!p.startDate) return false;
      const [pYear, pMonth] = p.startDate.split('-');
      return pYear === year && pMonth === month;
    });
  } else if (periodType === 'yearly' && year) {
    filtered = filtered.filter(p => {
      if (!p.startDate) return false;
      const [pYear] = p.startDate.split('-');
      return pYear === year;
    });
  }

  // Create jsPDF instance (landscape for multi-column table)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner / Title
  doc.setFillColor(15, 118, 110); // Teal 700 (#0f766e)
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Title text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const titleText = type === 'ongoing' 
    ? 'ONGOING LABORATORY SERVICES REPORT'
    : 'LABORATORY SERVICE TRACKER & MONITORING REPORT';
  doc.text(titleText, 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('PT. CHEMLAB INDONESIA - CHEMICAL LABORATORY MANAGEMENT SYSTEM', 14, 20);

  // Period subtitle on banner right
  let periodLabel = 'ALL PERIODS';
  if (periodType === 'monthly' && month && year) {
    const monthName = monthNameMap[month] || `Month ${month}`;
    periodLabel = `PERIOD: ${monthName.toUpperCase()} ${year}`;
  } else if (periodType === 'yearly' && year) {
    periodLabel = `PERIOD: YEAR ${year}`;
  } else if (periodType === 'current_filter') {
    periodLabel = 'PERIOD: ACTIVE FILTER';
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(periodLabel, pageWidth - 14, 15, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const nowStr = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Printed: ${nowStr}`, pageWidth - 14, 21, { align: 'right' });

  // Summary Metrics Section
  const totalCount = filtered.length;
  const totalPrice = filtered.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
  const paidCount = filtered.filter(p => p.paymentStatus === 'Paid').length;
  const completedCount = filtered.filter(p => p.status === 'Completed' || p.status === 'Report Released').length;

  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(14, 32, pageWidth - 28, 16, 2, 2, 'FD');

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  // Col 1: Total Project
  doc.text(`Total Services: ${totalCount} Items`, 20, 42);
  // Col 2: Status Completed
  doc.text(`Completed/Released: ${completedCount} Services`, 85, 42);
  // Col 3: Payment Paid
  doc.text(`Paid: ${paidCount} / ${totalCount}`, 160, 42);
  // Col 4: Total Revenue
  doc.text(`Total Revenue: ${formatCurrency(totalPrice)}`, 220, 42);

  // Prepare table data
  const tableHead = type === 'ongoing' 
    ? [['Test ID', 'Client / Company Name', 'Testing Service', 'Sales Rep', 'Start Date', 'Due Date', 'Progress Status', 'Payment', 'Total (IDR)']]
    : [['Test ID', 'Client Name', 'Testing Service', 'Category', 'Qty', 'Start Date', 'Due Date', 'Status', 'Payment', 'Total (IDR)']];

  const tableRows = filtered.map(p => {
    const id = get6DigitId(p);
    if (type === 'ongoing') {
      return [
        id,
        p.clientName || '-',
        p.serviceName || '-',
        p.assignedSales || '-',
        p.startDate || '-',
        p.dueDate || '-',
        p.status || '-',
        p.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid',
        formatCurrency(p.totalPrice || 0),
      ];
    } else {
      return [
        id,
        p.clientName || '-',
        p.serviceName || '-',
        p.serviceCategory || '-',
        `${p.sampleQuantity || 1} Samples`,
        p.startDate || '-',
        p.dueDate || '-',
        p.status || '-',
        p.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid',
        formatCurrency(p.totalPrice || 0),
      ];
    }
  });

  // Generate Table using autoTable
  autoTable(doc, {
    startY: 52,
    head: tableHead,
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110], // Teal
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
    columnStyles: type === 'ongoing' ? {
      0: { fontStyle: 'bold', halign: 'center', cellWidth: 20 },
      1: { cellWidth: 48 },
      2: { cellWidth: 55 },
      3: { cellWidth: 30 },
      4: { halign: 'center', cellWidth: 22 },
      5: { halign: 'center', cellWidth: 22 },
      6: { halign: 'center', cellWidth: 28 },
      7: { halign: 'center', cellWidth: 18 },
      8: { halign: 'right', fontStyle: 'bold', cellWidth: 26 },
    } : {
      0: { fontStyle: 'bold', halign: 'center', cellWidth: 18 },
      1: { cellWidth: 45 },
      2: { cellWidth: 48 },
      3: { cellWidth: 28 },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'center', cellWidth: 20 },
      6: { halign: 'center', cellWidth: 20 },
      7: { halign: 'center', cellWidth: 26 },
      8: { halign: 'center', cellWidth: 18 },
      9: { halign: 'right', fontStyle: 'bold', cellWidth: 28 },
    },
    didDrawPage: (data) => {
      // Footer on every page
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Halaman ${data.pageNumber} dari ${pageCount} - PT. Chemlab Indonesia Confidential Document`,
        14,
        doc.internal.pageSize.getHeight() - 8
      );
    },
  });

  // Construct filename
  let fileName = type === 'ongoing' ? 'Ongoing_Services_Laporan' : 'Service_Tracker_Laporan';
  if (periodType === 'monthly' && month && year) {
    const monthName = monthNameMap[month] || month;
    fileName += `_${monthName}_${year}.pdf`;
  } else if (periodType === 'yearly' && year) {
    fileName += `_Tahun_${year}.pdf`;
  } else {
    fileName += `_${new Date().toISOString().split('T')[0]}.pdf`;
  }

  doc.save(fileName);
}

export interface IncentivePDFExportOptions {
  periodType: 'monthly' | 'yearly' | 'current_filter' | 'all';
  month?: string;
  year?: string;
  records: Incentive[];
  monthNameMap: Record<string, string>;
  totalIncentivesValue: number;
  pendingIncentivesValue: number;
}

export function generateIncentivePDFReport(options: IncentivePDFExportOptions): void {
  const { periodType, month, year, records, monthNameMap, totalIncentivesValue, pendingIncentivesValue } = options;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(15, 118, 110); // Teal 700
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('SINGLE SALES INCENTIVE REPORT (2.5% COMMISSION)', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('PT. CHEMLAB INDONESIA - SINGLE SALES COMMISSION ALLOCATION (NEW CLIENTS & < 1 YEAR)', 14, 20);

  // Period subtitle
  let periodLabel = 'ALL PERIODS';
  if (periodType === 'monthly' && month && year && month !== 'All') {
    const monthName = monthNameMap[month] || `Month ${month}`;
    periodLabel = `PERIOD: ${monthName.toUpperCase()} ${year}`;
  } else if (periodType === 'yearly' && year && year !== 'All') {
    periodLabel = `PERIOD: YEAR ${year}`;
  } else if (periodType === 'current_filter') {
    periodLabel = 'PERIOD: ACTIVE FILTER';
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(periodLabel, pageWidth - 14, 15, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const nowStr = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Printed: ${nowStr}`, pageWidth - 14, 21, { align: 'right' });

  // Summary Metrics Section
  const totalContractVal = records.reduce((sum, r) => sum + r.serviceValue, 0);
  const totalBonusVal = records.reduce((sum, r) => sum + r.incentiveValue, 0);
  const disbursedVal = records.filter(r => r.isPaid).reduce((sum, r) => sum + r.incentiveValue, 0);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 32, pageWidth - 28, 16, 2, 2, 'FD');

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  doc.text(`Total Transactions: ${records.length} Items`, 20, 42);
  doc.text(`Testing Contract Value: ${formatCurrency(totalContractVal)}`, 80, 42);
  doc.text(`Total 2.5% Incentive: ${formatCurrency(totalBonusVal)}`, 150, 42);
  doc.text(`Disbursed: ${formatCurrency(disbursedVal)}`, 220, 42);

  // Table
  const tableHead = [['No', 'Customer / Company', 'Assigned Sales', 'Testing Service', 'Contract Value (IDR)', 'Incentive Bonus (2.5%)', 'Disbursement Status']];

  const tableRows = records.map((r, index) => [
    index + 1,
    r.clientName || '-',
    r.salesName || '-',
    r.serviceName || '-',
    formatCurrency(r.serviceValue || 0),
    formatCurrency(r.incentiveValue || 0),
    r.isPaid ? 'Disbursed' : 'Pending',
  ]);

  autoTable(doc, {
    startY: 52,
    head: tableHead,
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'center', cellWidth: 12 },
      1: { cellWidth: 55 },
      2: { cellWidth: 35 },
      3: { cellWidth: 65 },
      4: { halign: 'right', fontStyle: 'bold', cellWidth: 35 },
      5: { halign: 'right', fontStyle: 'bold', cellWidth: 35 },
      6: { halign: 'center', fontStyle: 'bold', cellWidth: 30 },
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Halaman ${data.pageNumber} dari ${pageCount} - PT. Chemlab Indonesia Laporan Resmi Insentif Sales`,
        14,
        doc.internal.pageSize.getHeight() - 8
      );
    },
  });

  let fileName = 'Laporan_Insentif_Sales';
  if (periodType === 'monthly' && month && year && month !== 'All') {
    const monthName = monthNameMap[month] || month;
    fileName += `_${monthName}_${year}.pdf`;
  } else if (periodType === 'yearly' && year && year !== 'All') {
    fileName += `_Tahun_${year}.pdf`;
  } else {
    fileName += `_${new Date().toISOString().split('T')[0]}.pdf`;
  }

  doc.save(fileName);
}

export interface DashboardPDFExportOptions {
  totalContacts: number;
  totalCompanies: number;
  openDeals: number;
  pipelineValue: number;
  wonValueYtd: number;
  wonDealsCount: number;
  totalActive: number;
  clientGrowthPercent: number;
  newClientsThisMonth: number;
  repeatRate: number;
  conversionRate: number;
  totalUnrealizedRevenue: number;
  currentMonthRevenue: number;
  totalRevenueYear: number;
  topCustomersData: { name: string; Revenue: number }[];
  categoryData: { name: string; value: number }[];
  testingServicesData: { code: string; name: string; category: string; activeSamples: number; tatDays: number; totalRevenue: number }[];
}

export function generateDashboardPDFReport(data: DashboardPDFExportOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(15, 118, 110); // Teal 700
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('EXECUTIVE LAB DASHBOARD KPI REPORT', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('PT. CHEMLAB INDONESIA - EXECUTIVE CRM & LAB PERFORMANCE METRICS SUMMARY', 14, 22);

  const nowStr = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Printed: ${nowStr}`, pageWidth - 14, 15, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text('Status: Secure Lab Workspace', pageWidth - 14, 21, { align: 'right' });

  let currentY = 38;

  // SECTION 1: CRM & PIPELINE SUMMARY
  doc.setTextColor(15, 118, 110);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. CRM & SALES PIPELINE METRICS', 14, currentY);

  currentY += 4;

  const crmHead = [['Total Contacts', 'Total Companies', 'Open Deals', 'Pipeline Value', 'Won YTD (Deals)']];
  const crmRows = [[
    `${data.totalContacts} Contacts`,
    `${data.totalCompanies} Companies`,
    `${data.openDeals} Open Deals`,
    formatCurrency(data.pipelineValue),
    `${formatCurrency(data.wonValueYtd)} (${data.wonDealsCount} Deals)`
  ]];

  autoTable(doc, {
    startY: currentY,
    head: crmHead,
    body: crmRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [15, 23, 42],
      halign: 'center',
      fontStyle: 'bold',
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // SECTION 2: EXECUTIVE LAB KPI SUMMARY
  doc.setTextColor(15, 118, 110);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. KEY PERFORMANCE INDICATORS (KPI)', 14, currentY);

  currentY += 4;

  const kpiHead = [['KPI Metric', 'Current Value', 'Description & Growth Trend']];
  const kpiRows = [
    ['Client Growth', `${data.totalActive} Active Clients`, `+${data.clientGrowthPercent}% vs last month (+${data.newClientsThisMonth} new)`],
    ['Repeat Rate', `${data.repeatRate}%`, 'Percentage of clients placing recurring laboratory test orders'],
    ['Conversion Rate', `${data.conversionRate}%`, 'Percentage of sales pipeline leads successfully converted to deals'],
    ['Unrealized Pipeline', formatCurrency(data.totalUnrealizedRevenue), 'Valuation of open proposals plus unbilled active laboratory testing'],
    ['Monthly Lab Revenue', formatCurrency(data.currentMonthRevenue), 'Realized billing from completed testing services in current month'],
    ['Annual Projected Revenue', formatCurrency(data.totalRevenueYear), 'Estimated cumulative annual laboratory billing projection']
  ];

  autoTable(doc, {
    startY: currentY,
    head: kpiHead,
    body: kpiRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { fontStyle: 'bold', cellWidth: 45 },
      2: { cellWidth: 87 }
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // SECTION 3: TOP ENTERPRISE CLIENTS
  doc.setTextColor(15, 118, 110);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. TOP ENTERPRISE CLIENTS', 14, currentY);

  currentY += 4;

  const topCustHead = [['No', 'Company / Client Name', 'Total Contract Value / Revenue']];
  const topCustRows = data.topCustomersData.map((c, idx) => [
    idx + 1,
    c.name,
    formatCurrency(c.Revenue)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: topCustHead,
    body: topCustRows,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'center', cellWidth: 12 },
      1: { cellWidth: 110 },
      2: { fontStyle: 'bold', halign: 'right', cellWidth: 60 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // SECTION 4: TESTING SERVICES DEMAND & TURNAROUND PERFORMANCE
  doc.setTextColor(15, 118, 110);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('4. TESTING SERVICES DEMAND & TURNAROUND PERFORMANCE', 14, currentY);

  currentY += 4;

  const servHead = [['Service Code & Name', 'Category', 'Active Samples', 'SLA Turnaround', 'Total Billing']];
  const servRows = data.testingServicesData.map(s => [
    `${s.code} - ${s.name}`,
    s.category,
    `${s.activeSamples} samples`,
    `${s.tatDays} days`,
    formatCurrency(s.totalRevenue)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: servHead,
    body: servRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 70 },
      1: { cellWidth: 35 },
      2: { halign: 'center', cellWidth: 25 },
      3: { halign: 'center', cellWidth: 25 },
      4: { fontStyle: 'bold', halign: 'right', cellWidth: 27 }
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount} - PT. Chemlab Indonesia Confidential Executive Dashboard Report`,
        14,
        doc.internal.pageSize.getHeight() - 8
      );
    }
  });

  doc.save(`Dashboard_KPI_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

