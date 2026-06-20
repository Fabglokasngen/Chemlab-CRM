export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Service {
  id: string;
  serviceCode: string;
  name: string;
  category: string;
  description: string;
  method: string;
  tatDays: number;
  price: number; // in IDR (Rp)
}

export type ClientStatus = 'Prospect' | 'Contacted' | 'Proposal Sent' | 'Negotiation' | 'Won' | 'Lost';

export interface ActivityNote {
  id: string;
  date: string;
  note: string;
  author: string;
}

export interface Client {
  id: string;
  companyName: string;
  industry: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  
  // PIC Info
  picName: string;
  picPosition: string;
  picEmail: string;
  picPhone: string;
  
  // Lead Info
  leadSource: string;
  potentialRevenue: number;
  assignedSales: string; // Name of sales officer
  status: ClientStatus;
  isFirstTransaction: boolean; // True for first transaction, triggers incentive calculation
  activityNotes: ActivityNote[];
  createdAt: string;
}

export type ProjectStatus = 
  | 'New Request' 
  | 'Accepted' 
  | 'Sample Received' 
  | 'In Progress' 
  | 'Review' 
  | 'Completed' 
  | 'Report Released';

export type PaymentStatus = 'Paid' | 'Unpaid';

export type UrgencyLevel = 'Regular' | 'Urgent' | 'Super Urgent';

export interface Project {
  id: string; // e.g. "SRV-2026-001"
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  serviceCategory: string;
  sampleQuantity: number;
  startDate: string;
  dueDate: string;
  assignedSales: string;
  status: ProjectStatus;
  progressPercent: number;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  quotationNumber: string;
  idElsa?: string; // 6-digit ELSA reference number
  discountPercent?: number; // 0-100% discount
  urgency?: UrgencyLevel; // Regular, Urgent, Super Urgent
}

export interface Incentive {
  id: string;
  projectId: string;
  clientName: string;
  serviceName: string;
  salesName: string;
  serviceValue: number;
  incentiveValue: number;
  paymentStatus: PaymentStatus;
  isPaid: boolean; // Paid to sales
  createdAt: string;
}

export interface SalesEmployee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  targetMonthly: number; // Target bulanan (IDR)
  achievedThisMonth: number; // Pencapaian transaksi selesai (IDR)
  status: 'Active' | 'Inactive';
  createdAt: string;
}

