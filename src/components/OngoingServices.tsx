import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, ArrowUpDown, Download, 
  Plus, Edit2, Trash2, CheckCircle2, 
  HelpCircle, Eye, RefreshCcw, DollarSign,
  Briefcase, Calendar, AlertCircle
} from 'lucide-react';
import { Project, Client, Service, ProjectStatus, PaymentStatus } from '../types';

interface OngoingServicesProps {
  projects: Project[];
  clients: Client[];
  services: Service[];
  onAddProject: (project: Omit<Project, 'id' | 'quotationNumber'>) => void;
  onUpdateProject: (id: string, updated: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
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
  const [sortField, setSortField] = useState<keyof Project>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal open states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

    // Calculate TAT based on urgency level
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
    const matchesSearch = 
      proj.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proj.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proj.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proj.assignedSales.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || proj.status === statusFilter;
    const matchesPayment = paymentFilter === 'All' || proj.paymentStatus === paymentFilter;
    const matchesCategory = categoryFilter === 'All' || proj.serviceCategory === categoryFilter;

    return matchesSearch && matchesStatus && matchesPayment && matchesCategory;
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
    
    // Numbers
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
      alert('Mohon pilih Klien dan Layanan Terlebih Dahulu!');
      return;
    }

    // Validate idElsa: 6-digit numeric
    if (!/^\d{6}$/.test(formData.idElsa)) {
      alert('ID ELSA harus diisi dengan format 6-digit angka (contoh: 120593)!');
      return;
    }

    const selectedClient = clients.find(c => c.id === formData.clientId);
    const selectedService = services.find(s => s.id === formData.serviceId);

    if (!selectedClient || !selectedService) return;

    // Calculate total price based on sample qty, discount and urgency
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
      dueDate: formData.dueDate, // auto-computed live by useEffect
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
    // Reset forms
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
      discountPercent: proj.discountPercent || 0,
      urgency: proj.urgency || 'Regular',
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    // Validate ID ELSA format if entered
    if (editFormData.idElsa && !/^\d{6}$/.test(editFormData.idElsa)) {
      alert('ID ELSA harus berupa 6-digit angka (contoh: 120593)!');
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
    // Generate simple csv file downloadable
    const headers = ['Service ID', 'Customer Name', 'Quotation No', 'Service Name', 'Category', 'Quantity', 'Start Date', 'Due Date', 'Assigned Sales', 'Progress %', 'Total Bill', 'Status', 'Payment'];
    const rows = projects.map(p => [
      p.id,
      p.clientName,
      p.quotationNumber,
      `"${p.serviceName}"`,
      p.serviceCategory,
      p.sampleQuantity,
      p.startDate,
      p.dueDate,
      p.assignedSales,
      p.progressPercent,
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

  // Helper function to calculate due date warnings
  const getDueDateWarning = (dueDateStr: string, status: ProjectStatus) => {
    if (status === 'Completed' || status === 'Report Released') {
      return { 
        level: 'completed', 
        text: 'Selesai & Rilis', 
        badgeClass: 'text-emerald-700 bg-emerald-50/80 border border-emerald-250',
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
          text: `Terlambat ${Math.abs(diffDays)} hari`,
          badgeClass: 'text-rose-700 bg-rose-50 border border-rose-300 font-bold animate-pulse',
          bgColor: 'bg-rose-50/40 hover:bg-rose-50/60'
        };
      } else if (diffDays === 0) {
        return {
          level: 'today',
          text: 'HARI INI SLOT SELESAI!',
          badgeClass: 'text-amber-800 bg-amber-50 border border-amber-400 font-bold animate-pulse',
          bgColor: 'bg-amber-50/20 hover:bg-amber-50/40'
        };
      } else if (diffDays <= 3) {
        return {
          level: 'warning',
          text: `${diffDays} hari lagi`,
          badgeClass: 'text-orange-700 bg-orange-50 border border-orange-300 font-semibold',
          bgColor: 'bg-orange-50/15 hover:bg-orange-50/30'
        };
      }

      return {
        level: 'safe',
        text: `${diffDays} hari lagi`,
        badgeClass: 'text-slate-600 bg-slate-50 border border-slate-150',
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
          <p className="text-sm text-slate-400 mt-1">Pemantauan antrean pengujian sampel, estimasi selesai, progres teknis laboratorium, dan tagihan invoice.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            <Plus className="h-3.5 w-3.5" /> Buat Penugasan Baru
          </button>
        </div>
      </div>

      {/* SEARCH AND GENERAL CONTROLS BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Search */}
        <div className="relative md:col-span-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari ID, Klien, Layanan, atau Sales..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.8 text-sm text-slate-950 border border-slate-200 rounded-lg focus:outline-hidden focus:border-teal-500 bg-slate-50/50"
          />
        </div>

        {/* Filter Status */}
        <div className="flex items-center gap-1.5 md:col-span-3">
          <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-1.8 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-teal-500"
          >
            <option value="All">Semua Status Progres</option>
            {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        {/* Filter Payment */}
        <div className="md:col-span-2">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full py-1.8 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-hidden"
          >
            <option value="All">Semua Tagihan</option>
            <option value="Paid">Sudah Bayar (Paid)</option>
            <option value="Unpaid">Belum Bayar (Unpaid)</option>
          </select>
        </div>

        {/* Filter Category */}
        <div className="md:col-span-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full py-1.8 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-hidden"
          >
            <option value="All">Semua Kategori</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {/* DUE DATE WARNING LEGEND BANNER */}
      <div id="due-date-legend-banner" className="bg-slate-50 rounded-2xl border border-slate-100 p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 animate-pulse">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Sistem Deteksi Tenggat Waktu (Due Date Warning)</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Sistem secara otomatis mengalkulasi sisa waktu penyelesaian pengujian berdasarkan tanggal target saat ini.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-bold">
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200/80">
            <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping"></span>
            Terlambat (Overdue)
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-550 animate-pulse"></span>
            Selesai Hari Ini
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-200">
            <span className="h-2 w-2 rounded-full bg-orange-500"></span>
            Mendekati Deadline (≤ 3 Hari)
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200/60 font-medium">
            <span className="h-2 w-2 rounded-full bg-slate-400"></span>
            Aman (On Track)
          </span>
        </div>
      </div>

      {/* MAIN DATA TABLE / GRID */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-[11px] font-semibold tracking-wider uppercase border-b border-slate-100">
              <tr>
                <th className="p-4 cursor-pointer select-none" onClick={() => handleSort('id')}>
                  <div className="flex items-center gap-1">
                    ID Layanan <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-4 cursor-pointer select-none" onClick={() => handleSort('clientName')}>
                  <div className="flex items-center gap-1">
                    Customer <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-4 cursor-pointer select-none max-w-xs" onClick={() => handleSort('serviceName')}>
                  <div className="flex items-center gap-1">
                    Layanan Pengujian / Kategori <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-4 text-center">Jumlah Sampel</th>
                <th className="p-4 cursor-pointer select-none" onClick={() => handleSort('dueDate')}>
                  <div className="flex items-center gap-1">
                    Due Date <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-4 text-center">Progres %</th>
                <th className="p-4 text-center">Status Teknis</th>
                <th className="p-4 text-right">Biaya / Pembayaran</th>
                <th className="p-4 text-center">Kolaborasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-750 text-xs">
              {sortedProjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400 text-sm">
                    <AlertCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    Tidak ada antrean pengujian layanan berjalan yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                sortedProjects.map((proj) => {
                  const warn = getDueDateWarning(proj.dueDate, proj.status);
                  return (
                    <tr key={proj.id} className={`transition-colors ${warn.bgColor ? warn.bgColor : 'hover:bg-slate-50/50'}`}>
                      {/* ID */}
                      <td className="p-4">
                        <div className="font-mono font-bold text-slate-900">{proj.id}</div>
                        {proj.idElsa && (
                          <div className="mt-1">
                            <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider">
                              ELSA: {proj.idElsa}
                            </span>
                          </div>
                        )}
                      </td>
                      
                      {/* Customer */}
                      <td className="p-4">
                        <div className="font-semibold text-slate-900">{proj.clientName}</div>
                        <div className="text-[10px] text-slate-400 font-medium">Sales: {proj.assignedSales}</div>
                      </td>
                      
                      {/* Service & Category */}
                      <td className="p-4 max-w-xs">
                        <div className="font-medium text-slate-800 line-clamp-1">{proj.serviceName}</div>
                        <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-500 font-medium">{proj.serviceCategory}</span>
                      </td>
                      
                      {/* Qty */}
                      <td className="p-4 text-center font-bold font-mono text-slate-700">{proj.sampleQuantity} Botol/Pack</td>
                      
                      {/* Due date */}
                      <td className="p-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Calendar className={`h-3.5 w-3.5 ${warn.level === 'overdue' ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
                          <span>{proj.dueDate}</span>
                        </div>
                        <div className="mt-1">
                          <span className={`inline-block text-[9px] px-1.8 py-0.5 rounded font-bold uppercase tracking-wide ${warn.badgeClass}`}>
                            {warn.text}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Mulai: {proj.startDate}</div>
                      </td>
                    
                    {/* Progress Bar */}
                    <td className="p-4">
                      <div className="flex items-center gap-2 max-w-[124px] mx-auto">
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-teal-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${proj.progressPercent}%` }}
                          ></div>
                        </div>
                        <span className="font-mono font-bold text-slate-800 shrink-0">{proj.progressPercent}%</span>
                      </div>
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
                        className={`mt-1 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-semibold cursor-pointer border ${
                          proj.paymentStatus === 'Paid' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                        title="Klik untuk mengubah status pembayaran"
                      >
                        <DollarSign className="h-2.5 w-2.5" />
                        {proj.paymentStatus}
                      </button>
                    </td>

                    {/* Collaborative Edit Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewingDetailProject(proj)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                          title="Detail view"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleEditClick(proj)}
                          className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-md transition-colors"
                          title="Edit Service"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus penugasan sampel ${proj.id}?`)) {
                              onDeleteProject(proj.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
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
          <p className="font-semibold text-slate-800">💡 Antarmuka Terbuka Kolaboratif (Tidak Ada Pembatasan Role)</p>
          <p>Sesuai permintaan Anda, halaman ini bebas diedit oleh siapapun. Staf laboratorium dapat menaikkan status pengujian langsung ke <b>"Completed"</b> dan menyesuaikan persen progres, sementara tim Sales dapat memantau kapan saja serta mengganti status pembayaran menjadi <b>"Paid"</b> untuk mencairkan bonus insentif secara transparan di dashboard.</p>
        </div>
      </div>

      {/* ================= MODAL: DETAIL VIEW ================= */}
      {viewingDetailProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-slate-100 shadow-xl animate-fade-in">
            <div className="bg-teal-900 text-white p-6">
              <span className="text-[10px] font-mono tracking-widest bg-teal-800 px-2 py-0.5 rounded-full">TECHNICAL DETAIL SHEET</span>
              <h3 className="text-xl font-bold mt-2">{viewingDetailProject.id}</h3>
              <p className="text-xs text-teal-200 mt-1">{viewingDetailProject.serviceName}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Klien</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewingDetailProject.clientName}</p>
                </div>
                <div>
                  <span className="text-slate-400">Quotation No</span>
                  <p className="font-mono font-semibold text-slate-800 mt-0.5">{viewingDetailProject.quotationNumber}</p>
                </div>
                <div>
                  <span className="text-slate-400">ID ELSA Ref</span>
                  <p className="font-mono font-bold text-indigo-700 mt-0.5 bg-indigo-50 px-2 py-0.5 rounded block text-[11px] border border-indigo-150 max-w-max">
                    {viewingDetailProject.idElsa ? `ELSA-${viewingDetailProject.idElsa}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Mulai Layanan</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewingDetailProject.startDate}</p>
                </div>
                <div>
                  <span className="text-slate-400">Due Date Selesai</span>
                  <p className="font-semibold text-slate-850 mt-0.5 text-teal-700">{viewingDetailProject.dueDate}</p>
                </div>
                <div>
                  <span className="text-slate-400">Volume Sampel</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewingDetailProject.sampleQuantity} Wadah</p>
                </div>
                <div>
                  <span className="text-slate-400">Faktur Tagihan</span>
                  <p className="font-bold text-slate-900 mt-0.5">{formatIDR(viewingDetailProject.totalPrice)}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-400">Progress Jalur Lab ({viewingDetailProject.progressPercent}%)</span>
                <div className="w-full bg-slate-100 rounded-full h-3 mt-1.5 overflow-hidden">
                  <div className="bg-teal-600 h-full rounded-full" style={{ width: `${viewingDetailProject.progressPercent}%` }}></div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 flex items-center gap-3">
                <div className="bg-white p-1.5 rounded-md text-teal-800 shadow-xs">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Petugas Sales Pendamping</p>
                  <p className="text-xs text-slate-500">{viewingDetailProject.assignedSales}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setViewingDetailProject(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 bg-slate-150 rounded-lg transition-colors cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD ATTACHMENT / PROJECT ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-slate-100 shadow-xl animate-fade-in my-8">
            <div className="bg-teal-700 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Buat Registrasi Layanan Baru</h3>
                <p className="text-xs text-teal-100">Daftarkan pengujian laboratorium untuk klien baru atau lama</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-teal-200 hover:text-white text-xl font-bold cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleSubmitAdd} className="p-6 space-y-4">
              {/* Client Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pilih Klien Perusahaan</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  required
                >
                  <option value="">-- Pilih Perusahaan --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.companyName} ({c.isFirstTransaction ? 'Baru' : 'Repeat'})</option>
                  ))}
                </select>
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Pengujian (Catalog)</label>
                <select
                  value={formData.serviceId}
                  onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  required
                >
                  <option value="">-- Pilih Analisis Katalog --</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - {formatIDR(s.price)}</option>
                  ))}
                </select>
              </div>

              {/* ID ELSA */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex justify-between">
                  <span>ID ELSA <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-teal-600 font-normal">Format: 6-digit angka</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Contoh: 120593"
                  value={formData.idElsa}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ''); // keep only numbers
                    setFormData({ ...formData, idElsa: val });
                  }}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-mono tracking-wider"
                  required
                />
              </div>

              {/* Sample Qty */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Jumlah Sampel</label>
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sales Pendamping</label>
                  <select
                    value={formData.assignedSales}
                    onChange={(e) => setFormData({ ...formData, assignedSales: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {salesStaff.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Urgency and Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Prioritas (Urgency)
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-semibold text-teal-800"
                  >
                    <option value="Regular">Regular (Normal TAT)</option>
                    <option value="Urgent">Urgent (50% TAT, +100% Biaya)</option>
                    <option value="Super Urgent">Super Urgent (25% TAT, +200% Biaya)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex justify-between">
                    <span>Diskon Khusus (%)</span>
                    <span className="text-[10px] text-teal-650 font-normal">Rentang 0-100%</span>
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

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Estimasi Selesai (Dynamic TAT)</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    placeholder="Auto-calculated"
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Status and payment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status Progres Awal</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {statusOptions.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Pembayaran Awal</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as PaymentStatus })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {paymentOptions.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {formData.serviceId && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-xs">
                  <div className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider mb-1">Rincian Perhitungan Biaya</div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Harga Katalog x Sampel</span>
                    <span className="font-mono text-slate-700">
                      {formatIDR(services.find(s => s.id === formData.serviceId)?.price || 0)} x {formData.sampleQuantity} Wadah
                    </span>
                  </div>
                  {formData.discountPercent > 0 && (
                    <div className="flex justify-between text-[11px] text-emerald-650 font-medium">
                      <span>Pemberian Diskon ({formData.discountPercent}%)</span>
                      <span className="font-mono">
                        -{formatIDR(((services.find(s => s.id === formData.serviceId)?.price || 0) * formData.sampleQuantity) * (formData.discountPercent / 100))}
                      </span>
                    </div>
                  )}
                  {formData.urgency !== 'Regular' && (
                    <div className="flex justify-between text-[11px] text-indigo-650 font-medium">
                      <span>Layanan Tambahan ({formData.urgency})</span>
                      <span className="font-mono">
                        {formData.urgency === 'Urgent' ? '+100% (+1x)' : '+200% (+2x)'}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-teal-850 text-xs">
                    <span>Estimasi Biaya Akhir</span>
                    <span className="font-mono">
                      {formatIDR(getCalculatedPrice(formData.serviceId, formData.sampleQuantity, formData.discountPercent, formData.urgency))}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Daftarkan Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT COLLABORATIVE ================= */}
      {editingProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-slate-100 shadow-xl animate-fade-in my-8">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Edit Progres & Detil Pengujian</h3>
                <p className="text-xs text-slate-300">Update status lab real-time dan tagihan keuangan</p>
              </div>
              <button onClick={() => setEditingProject(null)} className="text-slate-300 hover:text-white text-xl font-bold cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">ID Layanan</span>
                  <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 inline-block">{editingProject.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Perusahaan Klien</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 inline-block truncate max-w-full">{editingProject.clientName}</span>
                </div>
              </div>

              {/* Status dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status Laboratorium</label>
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

              {/* Progress Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-600">Progres Pengujian (%)</label>
                  <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">{editFormData.progressPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={editFormData.progressPercent || 0}
                  onChange={(e) => setEditFormData({ ...editFormData, progressPercent: Number(e.target.value) })}
                  className="w-full accent-teal-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>

              {/* ID ELSA (6-Digit) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex justify-between">
                  <span>ID ELSA <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-teal-600 font-normal">Format: 6-digit angka</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Contoh: 120593"
                  value={editFormData.idElsa || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ''); // keep only numbers
                    setEditFormData({ ...editFormData, idElsa: val });
                  }}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-mono tracking-wider"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Sample Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Jumlah Sampel</label>
                  <input
                    type="number"
                    min="1"
                    value={editFormData.sampleQuantity || 1}
                    onChange={(e) => setEditFormData({ ...editFormData, sampleQuantity: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                {/* Assigned sales */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sales Pengawal</label>
                  <select
                    value={editFormData.assignedSales || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, assignedSales: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {salesStaff.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Urgency and Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Prioritas (Urgency)
                  </label>
                  <select
                    value={editFormData.urgency || 'Regular'}
                    onChange={(e) => setEditFormData({ ...editFormData, urgency: e.target.value as any })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-semibold text-teal-800"
                  >
                    <option value="Regular">Regular (Normal TAT)</option>
                    <option value="Urgent">Urgent (50% TAT, +100% Biaya)</option>
                    <option value="Super Urgent">Super Urgent (25% TAT, +200% Biaya)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex justify-between">
                    <span>Diskon Khusus (%)</span>
                    <span className="text-[10px] text-teal-650 font-normal">Rentang 0-100%</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editFormData.discountPercent !== undefined ? editFormData.discountPercent : 0}
                      onChange={(e) => {
                        let val = Number(e.target.value);
                        if (val < 0) val = 0;
                        if (val > 100) val = 100;
                        setEditFormData({ ...editFormData, discountPercent: val });
                      }}
                      className="w-full p-2 pr-7 border border-slate-200 rounded-lg text-xs bg-white font-mono"
                      placeholder="0"
                    />
                    <span className="absolute right-2.5 top-2 text-slate-400 font-bold">%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Due Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date Selesai</label>
                  <input
                    type="date"
                    value={editFormData.dueDate || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold text-teal-800"
                    required
                  />
                </div>

                {/* Payment status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status Faktur / Bayar</label>
                  <select
                    value={editFormData.paymentStatus || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, paymentStatus: e.target.value as PaymentStatus })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {paymentOptions.map(po => <option key={po} value={po}>{po}</option>)}
                  </select>
                </div>
              </div>

              {editFormData.serviceId && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-xs">
                  <div className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider mb-1">Rincian Perubahan Biaya</div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Harga Katalog x Sampel</span>
                    <span className="font-mono text-slate-700">
                      {formatIDR(services.find(s => s.id === editFormData.serviceId)?.price || 0)} x {editFormData.sampleQuantity || 1} Wadah
                    </span>
                  </div>
                  {editFormData.discountPercent !== undefined && editFormData.discountPercent > 0 && (
                    <div className="flex justify-between text-[11px] text-emerald-650 font-medium">
                      <span>Pemberian Diskon ({editFormData.discountPercent}%)</span>
                      <span className="font-mono">
                        -{formatIDR(((services.find(s => s.id === editFormData.serviceId)?.price || 0) * (editFormData.sampleQuantity || 1)) * (editFormData.discountPercent / 100))}
                      </span>
                    </div>
                  )}
                  {editFormData.urgency && editFormData.urgency !== 'Regular' && (
                    <div className="flex justify-between text-[11px] text-indigo-650 font-medium">
                      <span>Layanan Tambahan ({editFormData.urgency})</span>
                      <span className="font-mono">
                        {editFormData.urgency === 'Urgent' ? '+100% (+1x)' : '+200% (+2x)'}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-teal-850 text-xs">
                    <span>Tagihan Akhir Baru</span>
                    <span className="font-mono">
                      {formatIDR(getCalculatedPrice(editFormData.serviceId || '', editFormData.sampleQuantity || 1, editFormData.discountPercent || 0, editFormData.urgency || 'Regular'))}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-750 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
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
}
