export type ClientTier = 'Klien Baru' | 'Repeat Order <1 Thn' | 'Klien Lama >1 Thn';

export type PaymentStatus = 'Lunas' | 'Belum Lunas';

export type ServiceCategory = 
  | 'Isotop Rasio IRMS'
  | 'Kromatografi (HPLC / GCMS)'
  | 'Spektrometri & Partikel (PSA / ICP-MS / XRF)'
  | 'Termal & Sorpsi (TGA / Chemisorption)'
  | 'Spektroskopi (FTIR / NMR)'
  | 'Kimia Khusus & Validasi'
  | 'Pengujian Walet (Non-Authority)'
  | 'Lainnya';

export interface MasterSalesRecord {
  id: string; // generated unique ID or invoice
  jamMasuk: string;
  tanggalSampel: string; // original e.g. "3 Agustus 2026"
  dateParsed: string; // YYYY-MM-DD for accurate sorting
  company: string;
  nomorId: string; // ELSA / Customer ID
  contactPersonName: string;
  mobilePhone: string;
  personalEmail: string;
  npwp: string;
  invoice: string;
  layananPengujian: string;
  kategoriLayanan: ServiceCategory;
  isMyAuthority: boolean; // True for user's Analytical & Instrumentation portfolio, False for Walet services
  jumlahSampel: number;
  hargaPerSampel: number;
  dppTotal: number; // Price before taxes
  ppn11: number;
  totalPlusPpn: number;
  payment: string; // raw payment string or date
  paymentStatus: PaymentStatus;
  keterangan: string; // Notes, urgent flags, etc.
  clientTier: ClientTier;
  incentiveRate: number; // 2.5 or 2.0
  incentiveAmount: number; // dppTotal * (incentiveRate / 100)
  isUrgent: boolean;
  urgentNote?: string;
  needsCorrection?: boolean; // Marker for non-standard tests needing correction
  correctionNote?: string; // Reason why correction is needed
  quotationNumber?: string; // e.g. "QUO/202608/001"
  quotationStatus?: QuotationStatus;
  quotationDate?: string;
  period: string; // e.g. "2026-08"
  salesPerson?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientElsaRecord {
  id: string; // Transaction record id
  nomorId: string; // e.g. "302089" or "24-001099"
  invoice: string;
  date: string;
  service: string;
  sampleCount: number;
  dpp: number;
  paymentStatus: string;
  isMyAuthority: boolean;
  keterangan?: string;
  needsCorrection?: boolean;
}

export interface ClientProfile {
  id: string;
  companyName: string;
  nomorId: string; // Primary or latest ELSA ID
  allNomorIds: string[]; // List of all ELSA IDs ever submitted by this company
  elsaHistory: ClientElsaRecord[]; // Full historical ledger of all ELSA orders
  contactPerson: string;
  phone: string;
  email: string;
  npwp: string;
  industry: string;
  clientTier: ClientTier;
  firstTransactionDate: string;
  lastTransactionDate: string;
  totalOrdersCount: number; // Total RO count
  totalDppSpend: number;
  portfolioDppSpend: number; // Spend specifically on user's Analytical & Instrumentation portfolio
  orderedServices: string[];
  status: 'Active' | 'At Risk' | 'Dormant';
  notes?: string;
}

export interface TestingServiceSummary {
  id: string;
  serviceName: string;
  category: ServiceCategory;
  isMyAuthority: boolean;
  basePrice: number;
  sampleCount: number;
  totalDppRevenue: number;
  clientCount: number;
  topClients: string[];
  hasCorrectionFlag?: boolean;
}

export type JournalEventType = 
  | 'Meeting Klien'
  | 'Negosiasi Harga'
  | 'Diskusi Teknis'
  | 'Follow-up Penawaran'
  | 'Objection / Kendala'
  | 'Kunjungan Lapangan';

export type ObjectionType = 
  | 'Harga / Budget Terbatas'
  | 'Turnaround Time (TAT) Terlalu Lama'
  | 'Metode / Akreditasi Tertentu'
  | 'Kompetitor Menawarkan Diskon'
  | 'Administrasi / PO Belum Terbit'
  | 'Lainnya';

export interface SalesJournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  company: string;
  contactPerson: string;
  eventType: JournalEventType;
  discussionNotes: string;
  hasObjection: boolean;
  objectionCategory?: ObjectionType;
  clientObjection?: string;
  strategyAction: string;
  nextCommitment: string;
  commitmentDate: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Normal' | 'High' | 'Urgent';
  salesPerson: string;
  createdAt: string;
}

export type QuotationStatus = 'Draft' | 'Terkirim' | 'Negosiasi' | 'Won' | 'Lost' | 'Follow Up';

export interface QuotationFollowUp {
  id: string;
  date: string;
  actionType: 'Telepon / WhatsApp' | 'Email Follow-up' | 'Meeting Teknis' | 'Negosiasi Harga';
  picName: string;
  notes: string;
  nextActionDate?: string;
  nextActionPlan?: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string; // e.g. "QUO/202608/014"
  date: string;
  idElsa: string;
  company: string;
  contactPerson: string;
  phone: string;
  email: string;
  layananPengujian: string;
  kategoriLayanan: ServiceCategory;
  sampleCount: number;
  pricePerSample: number;
  dppTotal: number; // Nilai sebelum PPN (DPP)
  ppn11: number; // Nilai PPN (default 11% / 12%)
  totalAmount: number; // Total termasuk PPN
  vatRate?: number; // e.g. 11 or 12
  status: QuotationStatus;
  validUntil: string;
  followUps: QuotationFollowUp[];
  notes?: string;
  needsCorrection?: boolean;
  correctionNote?: string;
  attachmentPdfName?: string; // Lampiran file PDF asli
  attachmentPdfDataUrl?: string; // Base64 data URL untuk preview/unduh PDF
  extractedDppBeforeVat?: number; // DPP yang diekstrak dari PDF sebelum PPN
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyUploadMeta {
  month: string; // e.g. "2026-08" or "Agustus 2026"
  fileName: string;
  fileSize?: number;
  uploadTimestamp: string;
  uploadedBy: string;
  rowCount: number;
  totalDpp: number;
  myAuthorityDpp: number;
}

export interface DataEditLog {
  id: string;
  timestamp: string;
  user: string;
  action: 'Upload File' | 'Ganti Data Bulan' | 'Edit Transaksi' | 'Hapus Transaksi' | 'Hapus Data Bulan' | 'Deduplikasi' | 'Reset Benchmark';
  month: string;
  fileName?: string;
  recordsCount: number;
  details: string;
}

export interface SalesTarget {
  period: string; // e.g. "2026-08"
  targetDpp: number; // Monthly quota in IDR
  portfolioTargetDpp: number; // Monthly Quota for user's Analytical services
  targetYearlyDpp: number; // Annual quota in IDR
  portfolioTargetYearlyDpp: number; // Annual Quota for user's Analytical services
  notes?: string;
}

export type UserRole = 'Administrator' | 'Manager Sales' | 'Sales Executive' | 'Laboratorium Tech';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole | string;
  department?: string;
  monthlyTarget?: number;
  photoURL?: string;
  phoneNumber?: string;
  lastLoginAt?: string;
  createdAt?: string;
}

// Backward compatibility interfaces
export interface Service {
  id: string;
  serviceCode: string;
  name: string;
  category: string;
  description: string;
  method: string;
  tatDays: number;
  price: number;
  userId?: string;
  ownerEmail?: string;
}

export interface Client {
  id: string;
  companyName: string;
  industry: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  picName: string;
  picPosition: string;
  picEmail: string;
  picPhone: string;
  contacts?: any[];
  activityNotes?: any[];
  leadSource?: string;
  potentialRevenue?: number;
  assignedSales?: string;
  status?: string;
  isFirstTransaction?: boolean;
  createdAt?: string;
  userId?: string;
  ownerEmail?: string;
}

export interface Project {
  id: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  idElsa?: string;
  serviceCategory?: string;
  sampleQuantity?: number;
  startDate?: string;
  dueDate?: string;
  assignedSales?: string;
  status?: string;
  progressPercent?: number;
  totalPrice?: number;
  paymentStatus?: string;
  quotationNumber?: string;
  userId?: string;
  ownerEmail?: string;
}

export interface Incentive {
  id: string;
  projectId: string;
  clientName: string;
  serviceName: string;
  salesName?: string;
  serviceValue?: number;
  incentiveValue: number;
  paymentStatus?: string;
  isPaid?: boolean;
  createdAt?: string;
  userId?: string;
  ownerEmail?: string;
}

export interface SalesEmployee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  targetMonthly: number;
  achievedThisMonth: number;
  status: 'Active' | 'Inactive';
  createdAt: string;
}


