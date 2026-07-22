import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, ArrowUpDown, Download, 
  Plus, Edit2, Trash2, CheckCircle2, 
  HelpCircle, Eye, DollarSign,
  Briefcase, Calendar, AlertCircle, X, FileText
} from 'lucide-react';
import { Project, Client, Service, ProjectStatus, PaymentStatus } from '../types';
import PDFDownloadModal from './PDFDownloadModal';

interface OngoingServicesProps {
  projects: Project[];
  clients: Client[];
  services: Service[];
  onAddProject: (project: Omit<Project, 'id' | 'quotationNumber'>) => void;
  onUpdateProject: (id: string, updated: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
}

// Helper to extract or generate clean 6-digit testing ID (removes LAB-xxxx-xxx)
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

export default function OngoingServices({ 
  projects, 
  clients, 
  services, 
  onAddProject, 
  onUpdateProject, 
  onDeleteProject 
}: OngoingServicesProps) {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [paymentFilter, setPaymentFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [filterMonth, setFilterMonth] = useState<string>('All');
  const [filterYear, setFilterYear] = useState<string>('All');

  const [sortField, setSortField] = useState<keyof Project>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal open states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingDetailProject, setViewingDetailProject] = useState<Project | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    clientId: '',
    serviceId: '',
    sampleQuantity: 1,
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    assignedSales: 'Budi Santoso',
    status: 'New Request' as ProjectStatus,
    progressPercent: 0,
    paymentStatus: 'Unpaid' as PaymentStatus,
    idElsa: '',
    discountPercent: 0,
    urgency: 'Regular' as 'Regular' | 'Urgent' | 'Super Urgent',
  });

  const [editFormData, setEditFormData] = useState<Partial<Project>>({});

  const monthNameMap: Record<string, string> = {
    '01': 'January',
    '02': 'February',
    '03': 'March',
    '04': 'April',
    '05': 'May',
    '06': 'June',
    '07': 'July',
    '08': 'August',
    '09': 'September',
    '10': 'October',
    '11': 'November',
    '12': 'December'
  };

  // Available Years & Months from Projects
  const availableYears = Array.from(new Set(projects.map(p => {
    if (!p.startDate) return '';
    return p.startDate.split('-')[0];
  }))).filter(Boolean).sort().reverse();

  const availableMonths = Array.from(new Set(projects.map(p => {
    if (!p.startDate) return '';
    return p.startDate.split('-')[1];
  }))).filter(Boolean).sort();

  const getCalculatedPrice = (serviceId: string, sampleQuantity: number, discountPercent: number, urgency: 'Regular' | 'Urgent' | 'Super Urgent') => {
    const selectedService = services.find(s => s.id === serviceId);
    if (!selectedService) return 0;

    const basePrice = selectedService.price * sampleQuantity;
    const discountAmount = basePrice * (discountPercent / 100);
    const priceAfterDiscount = basePrice - discountAmount;

    let urgencyMultiplier = 1;
    if (urgency === 'Urgent') {
      urgencyMultiplier = 2; // +100%
    } else if (urgency === 'Super Urgent') {
      urgencyMultiplier = 3; // +200%
    }

    return Math.round(priceAfterDiscount * urgencyMultiplier);
  };

  // Auto TAT effects for new request registration
  useEffect(() => {
    if (!formData.serviceId) return;
    const selectedService = services.find(s => s.id === formData.serviceId);
    if (!selectedService) return;

    // Calculate TAT based on urgency level
    const baseTat = selectedService.tatDays;
    let computedTat = baseTat;
    if (formData.urgency === 'Urgent') {
      computedTat = Math.ceil(baseTat * 0.5);
    } else if (formData.urgency === 'Super Urgent') {
      computedTat = Math.max(1, Math.ceil(baseTat * 0.25));
    }

    const start = new Date(formData.startDate);
    start.setDate(start.getDate() + computedTat);
    const calculatedDueDate = start.toISOString().split('T')[0];

    setFormData(prev => {
      if (prev.dueDate !== calculatedDueDate) {
        return { ...prev, dueDate: calculatedDueDate };
      }
      return prev;
    });
  }, [formData.serviceId, formData.startDate, formData.urgency, services]);

  // Auto TAT effects for editing existing request
  useEffect(() => {
    if (!editFormData.serviceId || !editFormData.startDate) return;
    const selectedService = services.find(s => s.id === editFormData.serviceId);
    if (!selectedService) return;

    const baseTat = selectedService.tatDays;
    let computedTat = baseTat;
    const urgencyLvl = editFormData.urgency || 'Regular';
    if (urgencyLvl === 'Urgent') {
      computedTat = Math.ceil(baseTat * 0.5);
    } else if (urgencyLvl === 'Super Urgent') {
      computedTat = Math.max(1, Math.ceil(baseTat * 0.25));
    }

    const start = new Date(editFormData.startDate);
    start.setDate(start.getDate() + computedTat);
    const calculatedDueDate = start.toISOString().split('T')[0];

    setEditFormData(prev => {
      if (prev.dueDate !== calculatedDueDate) {
        return { ...prev, dueDate: calculatedDueDate };
      }
      return prev;
    });
  }, [editFormData.serviceId, editFormData.startDate, editFormData.urgency, services]);

  // Dropdown options
  const statusOptions: ProjectStatus[] = [
    'New Request', 'Accepted', 'Sample Received', 'In Progress', 'Review', 'Completed', 'Report Released'
  ];

  const paymentOptions: PaymentStatus[] = ['Paid', 'Unpaid'];
  const salesStaff = ['Budi Santoso', 'Siti Rahma', 'Andi Wijaya'];

  // Handle Sort
  const handleSort = (field: keyof Project) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter & Search Logic
  const filteredProjects = projects.filter(proj => {
    const testingId = get6DigitId(proj);
    const term = searchTerm.trim().toLowerCase();

    const matchesSearch = term === '' ||
      testingId.toLowerCase().includes(term) ||
      proj.clientName.toLowerCase().includes(term) ||
      proj.serviceName.toLowerCase().includes(term) ||
      proj.assignedSales.toLowerCase().includes(term);

    const projYear = proj.startDate ? proj.startDate.split('-')[0] : '';
    const matchesYear = filterYear === 'All' || projYear === filterYear;

    const projMonth = proj.startDate ? proj.startDate.split('-')[1] : '';
    const matchesMonth = filterMonth === 'All' || projMonth === filterMonth;

    const matchesStatus = statusFilter === 'All' || proj.status === statusFilter;
    const matchesPayment = paymentFilter === 'All' || proj.paymentStatus === paymentFilter;
    const matchesCategory = categoryFilter === 'All' || proj.serviceCategory === categoryFilter;

    return matchesSearch && matchesYear && matchesMonth && matchesStatus && matchesPayment && matchesCategory;
  });

  // Sorted Results
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' 
        ? aVal.localeCompare(bVal) 
        : bVal.localeCompare(aVal);
    }
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    return 0;
  });

  // Categories extracted dynamically
  const categories = Array.from(new Set(services.map(s => s.category)));

  // Currency helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Submit handers
  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.serviceId) {
      alert('Please select Client and Testing Service first!');
      return;
    }

    if (!/^\d{6}$/.test(formData.idElsa)) {
      alert('Testing ID must be a 6-digit number (e.g. 120593)!');
      return;
    }

    const selectedClient = clients.find(c => c.id === formData.clientId);
    const selectedService = services.find(s => s.id === formData.serviceId);

    if (!selectedClient || !selectedService) return;

    const totalPrice = getCalculatedPrice(
      formData.serviceId,
      formData.sampleQuantity,
      formData.discountPercent,
      formData.urgency
    );

    onAddProject({
      clientId: formData.clientId,
      clientName: selectedClient.companyName,
      serviceId: formData.serviceId,
      serviceName: selectedService.name,
      serviceCategory: selectedService.category,
      sampleQuantity: Number(formData.sampleQuantity),
      startDate: formData.startDate,
      dueDate: formData.dueDate,
      assignedSales: formData.assignedSales,
      status: formData.status,
      progressPercent: Number(formData.progressPercent),
      totalPrice: totalPrice,
      paymentStatus: formData.paymentStatus,
      idElsa: formData.idElsa,
      discountPercent: Number(formData.discountPercent),
      urgency: formData.urgency,
    });

    setIsAddModalOpen(false);
    setFormData({
      clientId: '',
      serviceId: '',
      sampleQuantity: 1,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      assignedSales: 'Budi Santoso',
      status: 'New Request',
      progressPercent: 0,
      paymentStatus: 'Unpaid',
      idElsa: '',
      discountPercent: 0,
      urgency: 'Regular',
    });
  };

  const handleEditClick = (proj: Project) => {
    setEditingProject(proj);
    setEditFormData({
      ...proj,
      idElsa: get6DigitId(proj),
      discountPercent: proj.discountPercent || 0,
      urgency: proj.urgency || 'Regular',
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    if (editFormData.idElsa && !/^\d{6}$/.test(editFormData.idElsa)) {
      alert('Testing ID must be a 6-digit number (e.g. 120593)!');
      return;
    }

    const finalPrice = getCalculatedPrice(
      editFormData.serviceId || '',
      editFormData.sampleQuantity || 1,
      editFormData.discountPercent || 0,
      editFormData.urgency || 'Regular'
    );

    onUpdateProject(editingProject.id, {
      ...editFormData,
      totalPrice: finalPrice,
    });
    setEditingProject(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Testing ID', 'Customer Name', 'Quotation No', 'Service Name', 'Category', 'Quantity', 'Start Date', 'Due Date', 'Assigned Sales', 'Total Bill', 'Status', 'Payment'];
    const rows = projects.map(p => [
      get6DigitId(p),
      p.clientName,
      p.quotationNumber,
      `"${p.serviceName}"`,
      p.serviceCategory,
      p.sampleQuantity,
      p.startDate,
      p.dueDate,
      p.assignedSales,
      p.totalPrice,
      p.status,
      p.paymentStatus
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `chemlab_ongoing_services_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status badges color picker
  const getStatusStyle = (status: ProjectStatus) => {
    switch (status) {
      case 'New Request':
        return 'bg-blue-50 text-blue-700 border-blue-200/50';
      case 'Accepted':
        return 'bg-slate-50 text-slate-700 border-slate-200/50';
      case 'Sample Received':
        return 'bg-amber-50 text-amber-700 border-amber-200/50';
      case 'In Progress':
        return 'bg-sky-50 text-sky-700 border-sky-200/50 animate-pulse';
      case 'Review':
        return 'bg-purple-50 text-purple-700 border-purple-200/50';
      case 'Completed':
        return 'bg-teal-50 text-teal-700 border-teal-200/30';
      case 'Report Released':
        return 'bg-emerald-500 text-white border-emerald-500';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Clear helper for due date warnings
  const getDueDateWarning = (dueDateStr: string, status: ProjectStatus) => {
    if (status === 'Completed' || status === 'Report Released') {
      return { 
        level: 'completed', 
        text: 'Completed & Released', 
        badgeClass: 'text-emerald-800 bg-emerald-50 border border-emerald-300 font-bold',
        bgColor: ''
      };
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dueDate = new Date(dueDateStr);
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return {
          level: 'overdue',
          text: `OVERDUE BY ${Math.abs(diffDays)} DAYS`,
          badgeClass: 'text-rose-800 bg-rose-100 border border-rose-400 font-extrabold animate-pulse',
          bgColor: 'bg-rose-50/50 hover:bg-rose-50/70'
        };
      } else if (diffDays === 0) {
        return {
          level: 'today',
          text: 'DUE TODAY!',
          badgeClass: 'text-amber-900 bg-amber-100 border border-amber-400 font-extrabold animate-pulse',
          bgColor: 'bg-amber-50/30 hover:bg-amber-50/50'
        };
      } else if (diffDays <= 3) {
        return {
          level: 'warning',
          text: `${diffDays} Days Left`,
          badgeClass: 'text-orange-800 bg-orange-100 border border-orange-300 font-bold',
          bgColor: 'bg-orange-50/20 hover:bg-orange-50/40'
        };
      }

      return {
        level: 'safe',
        text: `On Track (${diffDays} Days Left)`,
        badgeClass: 'text-slate-700 bg-slate-100 border border-slate-200 font-semibold',
        bgColor: ''
      };
    } catch (e) {
      return {
        level: 'unknown',
        text: 'N/A',
        badgeClass: 'text-slate-400 bg-slate-50 border border-slate-100',
        bgColor: ''
      };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Ongoing Lab Services</h2>
          <p className="text-sm text-slate-400 mt-1">Real-time tracking of active laboratory testing queue by 6-digit testing ID and SLA due dates.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setIsPDFModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-all shadow-2xs cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5" /> Download PDF
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-750 rounded-lg transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> New Service Registration
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTER CONTROLS BAR WITH MONTH & YEAR FILTERS */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Search bar */}
          <div className="relative md:col-span-4">
            <Search className="absolute left-3.5 top-2.8 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search 6-digit ID, client, service, sales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-8 py-2 text-xs text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 bg-slate-50/50"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Year */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.8 rounded-xl border border-slate-200 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="All">All Years</option>
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Month */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.8 rounded-xl border border-slate-200 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="All">All Months</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{monthNameMap[m] || `Month ${m}`}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Status */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-2.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="All">All Progress Status</option>
              {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Filter Payment */}
          <div className="md:col-span-2">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full py-2 px-2.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="All">All Invoices</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>

        </div>

        {/* Active Filter Indicators & Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Showing <b>{sortedProjects.length}</b> active services</span>
          {(filterYear !== 'All' || filterMonth !== 'All' || statusFilter !== 'All' || paymentFilter !== 'All' || categoryFilter !== 'All' || searchTerm) && (
            <button
              onClick={() => {
                setFilterYear('All');
                setFilterMonth('All');
                setStatusFilter('All');
                setPaymentFilter('All');
                setCategoryFilter('All');
                setSearchTerm('');
              }}
              className="text-teal-600 font-semibold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* DUE DATE WARNING LEGEND BANNER */}
      <div id="due-date-legend-banner" className="bg-slate-50 rounded-2xl border border-slate-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 animate-pulse">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Turnaround & SLA Due Date Alert Status</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Real-time system tracking of remaining turnaround days for sample testing completion.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-100 text-rose-800 border border-rose-300">
            <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping"></span>
            Overdue
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-550 animate-pulse"></span>
            Due Today
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-100 text-orange-800 border border-orange-200">
            <span className="h-2 w-2 rounded-full bg-orange-500"></span>
            Due Soon (≤3 Days)
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-medium">
            <span className="h-2 w-2 rounded-full bg-slate-400"></span>
            On Track
          </span>
        </div>
      </div>

      {/* MAIN DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-[11px] font-semibold tracking-wider uppercase border-b border-slate-100">
              <tr>
                <th className="p-4">
                  Testing ID
                </th>
                <th className="p-4 cursor-pointer select-none" onClick={() => handleSort('clientName')}>
                  <div className="flex items-center gap-1">
                    Customer & Sales Rep <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-4 cursor-pointer select-none max-w-xs" onClick={() => handleSort('serviceName')}>
                  <div className="flex items-center gap-1">
                    Testing Service & Category <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-4 text-center">Sample Quantity</th>
                <th className="p-4 cursor-pointer select-none" onClick={() => handleSort('dueDate')}>
                  <div className="flex items-center gap-1">
                    Due Date SLA <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-4 text-center">Technical Status</th>
                <th className="p-4 text-right">Total & Invoice</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-750 text-xs">
              {sortedProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 text-sm">
                    <AlertCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    No testing service entries found matching your search or filter criteria.
                  </td>
                </tr>
              ) : (
                sortedProjects.map((proj) => {
                  const testingId = get6DigitId(proj);
                  const warn = getDueDateWarning(proj.dueDate, proj.status);
                  return (
                    <tr key={proj.id} className={`transition-colors ${warn.bgColor ? warn.bgColor : 'hover:bg-slate-50/50'}`}>
                      
                      {/* ID Pengujian 6-Digit */}
                      <td className="p-4">
                        <span className="bg-slate-900 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-lg shadow-2xs inline-block">
                          ID: {testingId}
                        </span>
                      </td>
                      
                      {/* Customer & Sales */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{proj.clientName}</div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">Sales: {proj.assignedSales}</div>
                      </td>
                      
                      {/* Service & Category */}
                      <td className="p-4 max-w-xs">
                        <div className="font-medium text-slate-800 line-clamp-1">{proj.serviceName}</div>
                        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                          {proj.serviceCategory}
                        </span>
                      </td>
                      
                      {/* Qty */}
                      <td className="p-4 text-center font-bold font-mono text-slate-700">
                        {proj.sampleQuantity} Samples
                      </td>
                      
                      {/* Due date with prominent status styling */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Calendar className={`h-3.5 w-3.5 ${warn.level === 'overdue' ? 'text-rose-600 animate-bounce' : 'text-slate-500'}`} />
                          <span>{proj.dueDate || '-'}</span>
                        </div>
                        <div className="mt-1">
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide ${warn.badgeClass}`}>
                            {warn.text}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">Start: {proj.startDate || '-'}</div>
                      </td>
                    
                      {/* Status badge */}
                      <td className="p-4 text-center">
                        <span className={`inline-block border px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusStyle(proj.status)}`}>
                          {proj.status}
                        </span>
                      </td>
                      
                      {/* Total & Payment */}
                      <td className="p-4 text-right">
                        <div className="font-mono font-bold text-slate-900">{formatIDR(proj.totalPrice)}</div>
                        <button
                          onClick={() => {
                            const nextPay: PaymentStatus = proj.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid';
                            onUpdateProject(proj.id, { paymentStatus: nextPay });
                          }}
                          className={`mt-1 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-semibold cursor-pointer border ${
                            proj.paymentStatus === 'Paid' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                          title="Click to toggle payment status"
                        >
                          <DollarSign className="h-2.5 w-2.5" />
                          {proj.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid'}
                        </button>
                      </td>

                      {/* Collaborative Edit Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingDetailProject(proj)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="Detail View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleEditClick(proj)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="Edit Service"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete sample testing assignment ID #${testingId}?`)) {
                                onDeleteProject(proj.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* COLLABORATIVE QUICK TIP PANEL */}
      <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex items-start gap-3">
        <HelpCircle className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800">💡 Collaborative Access</p>
          <p>Authorized laboratory personnel can update testing status and adjust target due dates directly. All updates are automatically saved.</p>
        </div>
      </div>

      {/* ================= MODAL: DETAIL VIEW ================= */}
      {viewingDetailProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-slate-100 shadow-xl animate-fade-in">
            <div className="bg-teal-900 text-white p-6 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono tracking-wider bg-teal-800 px-2 py-0.5 rounded-md font-bold">TECHNICAL DETAIL SHEET</span>
                <h3 className="text-xl font-bold mt-2">Testing ID #{get6DigitId(viewingDetailProject)}</h3>
                <p className="text-xs text-teal-200 mt-1">{viewingDetailProject.serviceName}</p>
              </div>
              <button onClick={() => setViewingDetailProject(null)} className="text-teal-300 hover:text-white text-xl font-bold cursor-pointer">&times;</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-150">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Client Company</span>
                  <p className="font-bold text-slate-800 mt-0.5">{viewingDetailProject.clientName}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Technical Status</span>
                  <p className="font-bold text-teal-700 mt-0.5">{viewingDetailProject.status}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Start Date</span>
                  <p className="font-mono font-semibold text-slate-800 mt-0.5">{viewingDetailProject.startDate || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Estimated Due Date</span>
                  <p className="font-mono font-bold text-teal-800 mt-0.5">{viewingDetailProject.dueDate || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Sample Volume</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewingDetailProject.sampleQuantity} Containers</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Bill</span>
                  <p className="font-bold text-slate-900 mt-0.5 font-mono">{formatIDR(viewingDetailProject.totalPrice)}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg text-teal-800 shadow-xs">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-800">Assigned Sales Representative</p>
                  <p className="text-slate-500">{viewingDetailProject.assignedSales}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setViewingDetailProject(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 bg-slate-150 rounded-xl transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD PROJECT ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-slate-100 shadow-xl animate-fade-in my-8">
            <div className="bg-teal-700 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">New Testing Service Registration</h3>
                <p className="text-xs text-teal-100">Register sample testing for client accounts</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-teal-200 hover:text-white text-xl font-bold cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleSubmitAdd} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Select Client Company</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  required
                >
                  <option value="">-- Select Company --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.companyName} ({c.isFirstTransaction ? 'New' : 'Repeat'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Testing Analysis Service</label>
                <select
                  value={formData.serviceId}
                  onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  required
                >
                  <option value="">-- Select Catalog Service --</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - {formatIDR(s.price)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1 flex justify-between">
                  <span>Testing ID (6-Digit Code) <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-teal-600 font-normal">Example: 120593</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Example: 120593"
                  value={formData.idElsa}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, idElsa: val });
                  }}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-mono tracking-wider font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Sample Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.sampleQuantity}
                    onChange={(e) => setFormData({ ...formData, sampleQuantity: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Assigned Sales</label>
                  <select
                    value={formData.assignedSales}
                    onChange={(e) => setFormData({ ...formData, assignedSales: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {salesStaff.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Priority Level (Urgency)
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-semibold text-teal-800"
                  >
                    <option value="Regular">Regular (Standard TAT)</option>
                    <option value="Urgent">Urgent (50% TAT, +100% Fee)</option>
                    <option value="Super Urgent">Super Urgent (25% TAT, +200% Fee)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1 flex justify-between">
                    <span>Discount (%)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discountPercent}
                      onChange={(e) => {
                        let val = Number(e.target.value);
                        if (val < 0) val = 0;
                        if (val > 100) val = 100;
                        setFormData({ ...formData, discountPercent: val });
                      }}
                      className="w-full p-2 pr-7 border border-slate-200 rounded-lg text-xs bg-white font-mono"
                      placeholder="0"
                    />
                    <span className="absolute right-2.5 top-2 text-slate-400 font-bold">%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs text-slate-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Target Due Date (Dynamic SLA)</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {statusOptions.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Payment Status</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as PaymentStatus })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {paymentOptions.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Register Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT ================= */}
      {editingProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-slate-100 shadow-xl animate-fade-in my-8 text-xs">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Edit Testing Service Details & Due Date</h3>
                <p className="text-xs text-slate-300">Update laboratory progress status and SLA target completion date</p>
              </div>
              <button onClick={() => setEditingProject(null)} className="text-slate-300 hover:text-white text-xl font-bold cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Testing ID</span>
                  <span className="bg-slate-900 text-white font-mono font-bold text-xs px-2 py-0.5 rounded-md mt-1 inline-block">
                    #{get6DigitId(editingProject)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Client Company</span>
                  <span className="font-bold text-slate-800 text-xs mt-1 inline-block truncate max-w-full">{editingProject.clientName}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Laboratory Status</label>
                <select
                  value={editFormData.status || ''}
                  onChange={(e) => {
                    const nextStatus = e.target.value as ProjectStatus;
                    let progress = editFormData.progressPercent || 0;
                    if (nextStatus === 'New Request') progress = 0;
                    if (nextStatus === 'Completed' || nextStatus === 'Report Released') progress = 100;
                    
                    setEditFormData({ 
                      ...editFormData, 
                      status: nextStatus,
                      progressPercent: progress
                    });
                  }}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                >
                  {statusOptions.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1 flex justify-between">
                  <span>Testing ID (6-Digit Code) <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Example: 120593"
                  value={editFormData.idElsa || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setEditFormData({ ...editFormData, idElsa: val });
                  }}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-mono tracking-wider font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Sample Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={editFormData.sampleQuantity || 1}
                    onChange={(e) => setEditFormData({ ...editFormData, sampleQuantity: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Assigned Sales</label>
                  <select
                    value={editFormData.assignedSales || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, assignedSales: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {salesStaff.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Target Due Date</label>
                  <input
                    type="date"
                    value={editFormData.dueDate || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold text-teal-800"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Payment Status</label>
                  <select
                    value={editFormData.paymentStatus || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, paymentStatus: e.target.value as PaymentStatus })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {paymentOptions.map(po => <option key={po} value={po}>{po}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-750 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Download Modal */}
      <PDFDownloadModal
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
        type="ongoing"
        projects={projects}
        availableYears={availableYears}
        availableMonths={availableMonths}
        monthNameMap={monthNameMap}
        currentFilteredProjects={sortedProjects}
      />

    </div>
  );
}
