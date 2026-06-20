import React, { useState, useEffect } from 'react';
import { 
  Search, CheckCircle, Clock, AlertTriangle, 
  MapPin, FlaskConical, ClipboardCheck, FileCheck,
  Calendar, RotateCcw, ShieldCheck, ChevronRight, Plus
} from 'lucide-react';
import { Project, Client, Service, ProjectStatus, PaymentStatus } from '../types';

interface ServiceTrackerProps {
  projects: Project[];
  clients: Client[];
  services: Service[];
  onUpdateProjectStatus: (id: string, nextStatus: Project['status'], nextProgress: number) => void;
  onAddProject: (project: Omit<Project, 'id' | 'quotationNumber'>) => void;
}

export default function ServiceTracker({ 
  projects, 
  clients, 
  services, 
  onUpdateProjectStatus,
  onAddProject
}: ServiceTrackerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  // State for sorting & filtering
  const [filterMonth, setFilterMonth] = useState<string>('All'); // 'All' or '01', '02', '03'...
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'client-a-z' | 'test-a-z'>('date-desc');

  // Dynamic live calculation of dueDate and price based on selected service, startDate, sampleQty, discount, urgency
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

    // Set auto-computed due date
    const start = new Date(formData.startDate);
    start.setDate(start.getDate() + computedTat);
    const calculatedDueDate = start.toISOString().split('T')[0];

    setFormData(prev => {
      // Prevents infinite loop by checking if values are actually different
      if (prev.dueDate !== calculatedDueDate) {
        return { ...prev, dueDate: calculatedDueDate };
      }
      return prev;
    });
  }, [formData.serviceId, formData.startDate, formData.urgency, services]);

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

  const [prevProjectsCount, setPrevProjectsCount] = useState(projects.length);

  // Auto-select latest project when added
  useEffect(() => {
    if (projects.length > prevProjectsCount) {
      const latestProject = projects[projects.length - 1];
      if (latestProject) {
        setSelectedProjectId(latestProject.id);
      }
    }
    setPrevProjectsCount(projects.length);
  }, [projects.length, prevProjectsCount]);

  // List of unique months from projects' start dates
  const availableMonths = Array.from(new Set(projects.map(proj => {
    if (!proj.startDate) return '';
    const parts = proj.startDate.split('-');
    return parts[1]; // e.g. "06"
  })))
  .filter(Boolean)
  .sort();

  const monthNameMap: Record<string, string> = {
    '01': 'Januari',
    '02': 'Februari',
    '03': 'Maret',
    '04': 'April',
    '05': 'Mei',
    '06': 'Juni',
    '07': 'Juli',
    '08': 'Agustus',
    '09': 'September',
    '10': 'Oktober',
    '11': 'November',
    '12': 'Desember'
  };

  // List of unique categories from projects
  const availableCategories = Array.from(new Set(projects.map(proj => proj.serviceCategory))).filter(Boolean).sort();

  // Filter and Sort implementation
  const filteredProjects = projects.filter(proj => {
    // Search query matching
    const matchesSearch = searchQuery === '' || 
      proj.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.serviceName.toLowerCase().includes(searchQuery.toLowerCase());

    // Month matching
    const projParts = proj.startDate ? proj.startDate.split('-') : [];
    const projMonth = projParts[1] || '';
    const matchesMonth = filterMonth === 'All' || projMonth === filterMonth;

    // Category matching
    const matchesCategory = filterCategory === 'All' || proj.serviceCategory === filterCategory;

    return matchesSearch && matchesMonth && matchesCategory;
  });

  const sortedAndFilteredProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'date-desc') {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    }
    if (sortBy === 'date-asc') {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    }
    if (sortBy === 'client-a-z') {
      return a.clientName.localeCompare(b.clientName);
    }
    if (sortBy === 'test-a-z') {
      return a.serviceName.localeCompare(b.serviceName);
    }
    return 0;
  });

  // Find the currently tracked project
  const currentProject = projects.find(
    p => p.id.toLowerCase() === selectedProjectId.toLowerCase() || 
         p.quotationNumber.toLowerCase() === selectedProjectId.toLowerCase()
  ) || sortedAndFilteredProjects[0] || projects[0];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    // Attempt searching
    const matched = projects.find(
      p => p.id.toLowerCase() === searchQuery.toLowerCase() ||
           p.quotationNumber.toLowerCase() === searchQuery.toLowerCase() ||
           p.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (matched) {
      setSelectedProjectId(matched.id);
    }
  };

  // Map ProjectStatus to Tracker Pipeline Nodes
  // Pipeline nodes requested in prompt:
  // 1. Request Submitted (New Request, Accepted)
  // 2. Quotation Approved (Accepted)
  // 3. Sample Received (Sample Received)
  // 4. Testing Process (In Progress)
  // 5. Technical Review (Review)
  // 6. Report Issued (Completed, Report Released)
  
  const pipelineSteps = [
    { id: 1, label: 'Request Submitted', desc: 'Permohonan pengujian diterima oleh sistem admin sales', matchingStatuses: ['New Request'] },
    { id: 2, label: 'Quotation Approved', desc: 'Penawaran harga disetujui, pembayaran DP dikonfirmasi', matchingStatuses: ['Accepted'] },
    { id: 3, label: 'Sample Received', desc: 'Kondisi fisik sampel divalidasi oleh lab Analyst', matchingStatuses: ['Sample Received'] },
    { id: 4, label: 'Testing Process', desc: 'Proses destruksi & analisis instrumen kimia laboratorium', matchingStatuses: ['In Progress'] },
    { id: 5, label: 'Technical Review', desc: 'Hasil uji direview oleh supervisor lab & dewan pakar', matchingStatuses: ['Review', 'Completed'] },
    { id: 6, label: 'Report Issued', desc: 'Sertifikat laporan hasil analisis (LHA) diserahkan ke sales', matchingStatuses: ['Report Released'] },
  ];

  // Determine current active node index
  const getActiveStepIndex = (status: Project['status']): number => {
    switch (status) {
      case 'New Request': return 0;
      case 'Accepted': return 1;
      case 'Sample Received': return 2;
      case 'In Progress': return 3;
      case 'Review': return 4;
      case 'Completed': return 4; // Completed is finishing verification, before final report release
      case 'Report Released': return 5;
      default: return 0;
    }
  };

  const activeStepIndex = currentProject ? getActiveStepIndex(currentProject.status) : 0;

  // Manual status quick controller for collaborative editing directly on the timeline tracker
  const handleQuickStatusChange = (statusName: Project['status'], stepIdx: number) => {
    if (!currentProject) return;
    
    // Auto calculate matching progress
    let progress = 0;
    if (stepIdx === 0) progress = 10;
    if (stepIdx === 1) progress = 25;
    if (stepIdx === 2) progress = 45;
    if (stepIdx === 3) progress = 65;
    if (stepIdx === 4) progress = 85;
    if (stepIdx === 5) progress = 100;

    onUpdateProjectStatus(currentProject.id, statusName, progress);
  };

  const statusOptions: ProjectStatus[] = [
    'New Request', 'Accepted', 'Sample Received', 'In Progress', 'Review', 'Completed', 'Report Released'
  ];

  const paymentOptions: PaymentStatus[] = ['Paid', 'Unpaid'];

  const salesStaff = ['Budi Santoso', 'Siti Rahma', 'Andi Wijaya'];

  const formatIDRPrices = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

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
    const totalPrice = getCalculatedPrice(formData.serviceId, formData.sampleQuantity, formData.discountPercent, formData.urgency);

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

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Lab Service Tracker</h2>
          <p className="text-sm text-slate-400 mt-1">Audit trail kepatuhan regulasi pengujian, monitoring deviasi estimasi selesai, dan riwayat draf laporan.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-750 rounded-lg transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Registrasi Service Baru
          </button>
          <span className="text-xs bg-teal-50 border border-teal-200 text-teal-700 font-semibold px-2.5 py-2 rounded-full">
            LIMS Interactive Live Sync
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIVE SEARCH & LIST OF JOBS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-slate-800 text-sm">Cari/Pilih Order Sampel</h3>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-2 py-1 text-[11px] font-bold text-teal-600 hover:text-white hover:bg-teal-600 border border-teal-250 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              title="Registrasi pengujian sampel baru"
            >
              <Plus className="h-3 w-3" /> Baru
            </button>
          </div>
          
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-2.8 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Ketik ID, PT Klien, atau No. Penawaran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-teal-500 bg-slate-50/50"
            />
          </form>

          {/* Sorter & Filter Panel */}
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-2 text-[11px]">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-500 mb-0.5">Filter Bulan</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full p-1.5 border border-slate-200 rounded-md bg-white text-[11px] focus:outline-none focus:border-teal-500"
                >
                  <option value="All">Semua Bulan</option>
                  {availableMonths.map(m => (
                    <option key={m} value={m}>{monthNameMap[m] || `Bulan ${m}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-500 mb-0.5">Jenis Pengujian</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full p-1.5 border border-slate-200 rounded-md bg-white text-[11px] focus:outline-none focus:border-teal-500 truncate"
                >
                  <option value="All">Semua Jenis</option>
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-500 mb-0.5">Urutkan Berdasarkan</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full p-1.5 border border-slate-200 rounded-md bg-white text-[11px] focus:outline-none focus:border-teal-500"
              >
                <option value="date-desc">Tanggal Layanan (Terbaru)</option>
                <option value="date-asc">Tanggal Layanan (Terlama)</option>
                <option value="client-a-z">Nama Klien (A - Z)</option>
                <option value="test-a-z">Jenis Analisis (A - Z)</option>
              </select>
            </div>
          </div>

          {/* Quick List Toggles */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {sortedAndFilteredProjects.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-medium">
                Tidak ada sampel yang cocok
              </div>
            ) : (
              sortedAndFilteredProjects.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => {
                    setSelectedProjectId(proj.id);
                    setSearchQuery('');
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer block ${
                    currentProject?.id === proj.id 
                      ? 'bg-teal-50/50 border-teal-550/40 shadow-xs ring-1 ring-teal-500/10' 
                      : 'bg-white hover:bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-center font-bold">
                    <span className="font-mono text-slate-900">{proj.id}</span>
                    <div className="flex items-center gap-1">
                      {proj.idElsa && (
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-tight">
                          ID: {proj.idElsa}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        proj.status === 'Report Released' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>{proj.status}</span>
                    </div>
                  </div>
                  
                  <h4 className="font-semibold text-slate-800 mt-1.5 truncate">{proj.clientName}</h4>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{proj.serviceName}</p>
                  
                  <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-100/60 text-[9px] text-slate-500">
                    <span className="font-semibold">{proj.sampleQuantity} Sampel</span>
                    <span className="font-mono text-[9px]">Est: {proj.dueDate}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE TRACKER TIMELINE DETAILED VIEW */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-8 space-y-6">
          {currentProject ? (
            <>
              {/* CURRENT JOB PREVIEW PANEL */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-150/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">TRACKING ORDER</span>
                    <span className="bg-teal-100 text-teal-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">{currentProject.id}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{currentProject.clientName}</h3>
                  <p className="text-xs text-slate-500">{currentProject.serviceName} ({currentProject.serviceCategory})</p>
                </div>
                
                <div className="text-left sm:text-right font-mono self-start sm:self-center">
                  <span className="text-[10px] block text-slate-400">ESTIMATED COMPLETION</span>
                  <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-1 rounded-md mt-1 inline-block border border-teal-100 font-mono">
                    {currentProject.dueDate}
                  </span>
                </div>
              </div>

              {/* ESTIMATIONS & ADVISORY DETAILS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4.5 rounded-xl border border-slate-105 shadow-xs text-xs space-y-1">
                  <span className="text-slate-450 block font-semibold text-[10px] uppercase tracking-wider">Nomor Quotation</span>
                  <span className="font-mono font-bold text-slate-800 block text-xs">{currentProject.quotationNumber}</span>
                  <span className="text-[10px] text-green-600 font-semibold block">✓ Approved</span>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-105 shadow-xs text-xs space-y-1">
                  <span className="text-slate-450 block font-semibold text-[10px] uppercase tracking-wider">ID ELSA Ref</span>
                  <span className="font-mono font-bold text-indigo-700 block text-xs">
                    {currentProject.idElsa ? `ELSA-${currentProject.idElsa}` : 'N/A'}
                  </span>
                  <span className="text-[10px] text-indigo-500 font-semibold block">✓ Validated 6-Digit</span>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-105 shadow-xs text-xs space-y-1">
                  <span className="text-slate-450 block font-semibold text-[10px] uppercase tracking-wider">Beban Sampel</span>
                  <span className="font-semibold text-slate-800 block text-xs truncate">{currentProject.sampleQuantity} Wadah Uji</span>
                  <span className="text-[10px] text-slate-450 block">Protokol: {currentProject.serviceCategory === 'Lingkungan' ? 'SNI 6989' : 'AOAC Standards'}</span>
                </div>

                <div className="bg-white p-4.5 rounded-xl border border-slate-110 shadow-xs text-xs space-y-1">
                  <span className="text-slate-450 block font-semibold text-[10px] uppercase tracking-wider">Akumulasi Biaya</span>
                  <span className="font-semibold text-teal-900 block font-mono text-xs truncate">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(currentProject.totalPrice)}
                  </span>
                  <span className={`text-[10px] font-bold block ${
                    currentProject.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {currentProject.paymentStatus === 'Paid' ? '● Tagihan Lunas' : '○ Belum Dibayar'}
                  </span>
                </div>
              </div>

              {/* TIMELINE VISUAL STEPPER CONTROLS */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-slate-800 text-sm">Workflow Alur Laboratorium</h4>
                  <span className="text-[10px] font-mono font-bold text-slate-400">STATUS SEKARANG: <b className="text-teal-700">{currentProject.status}</b></span>
                </div>

                {/* VISUAL LAYOUT STEPPER */}
                <div className="relative pl-6 lg:pl-8 space-y-6 before:absolute before:top-2 before:bottom-2 before:left-3 before:w-0.5 before:bg-slate-200">
                  {pipelineSteps.map((step, idx) => {
                    const isCompleted = idx < activeStepIndex;
                    const isActive = idx === activeStepIndex;
                    const isUpcoming = idx > activeStepIndex;

                    return (
                      <div key={step.id} className="relative group text-xs animate-fade-in">
                        {/* Bullet Marker */}
                        <div className="absolute -left-[18px] lg:-left-[24px] top-1">
                          {isCompleted ? (
                            <div className="h-4 w-4 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                              <CheckCircle className="h-3 w-3" />
                            </div>
                          ) : isActive ? (
                            <div className="h-4 w-4 rounded-full bg-white text-teal-600 flex items-center justify-center border-2 border-teal-600 animate-pulse font-bold text-[9px] shadow-xs">
                              ●
                            </div>
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-slate-100 border border-slate-300 text-slate-400 flex items-center justify-center font-bold text-[9px]">
                              {step.id}
                            </div>
                          )}
                        </div>

                        {/* Node Details Container */}
                        <div className={`p-4 rounded-xl border transition-all ${
                          isActive 
                            ? 'bg-teal-50/20 border-teal-500/20 shadow-xs' 
                            : isCompleted 
                            ? 'bg-slate-50/40 border-slate-100' 
                            : 'bg-white border-slate-100/70 opacity-70'
                        }`}>
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                            <div>
                              <h5 className={`font-bold ${isActive ? 'text-teal-900 text-sm' : 'text-slate-800'}`}>
                                {step.label}
                              </h5>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>
                            </div>
                            
                            {/* Collaborator update button on each target node */}
                            <button
                              type="button"
                              onClick={() => {
                                // Maps step nodes to actual system ProjectStatus values
                                let targetStatus: Project['status'] = 'New Request';
                                if (step.id === 1) targetStatus = 'New Request';
                                if (step.id === 2) targetStatus = 'Accepted';
                                if (step.id === 3) targetStatus = 'Sample Received';
                                if (step.id === 4) targetStatus = 'In Progress';
                                if (step.id === 5) targetStatus = 'Review';
                                if (step.id === 6) targetStatus = 'Report Released';
                                handleQuickStatusChange(targetStatus, idx);
                              }}
                              className={`px-2.5 py-1 text-[10px] font-semibold rounded-md border cursor-pointer hover:shadow-xs transition-shadow ${
                                isActive 
                                  ? 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700' 
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {isCompleted ? 'Rollback ke sini' : isActive ? 'Sedang Aktif' : 'Set Aktif ke sini'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DUMMY LIMS DEV PORT INDICATOR */}
              <div className="bg-yellow-50/30 border border-yellow-200/50 p-4 rounded-xl text-xs text-slate-600 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <p>Status LIMS pengujian ini dapat diperbarui kapan saja oleh siapapun. CRM mensimulasikan perubahan alur pengujian kimia tanpa hambatan otorisasi agar cepat digunakan oleh tim penjualan.</p>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400">
              <Clock className="h-12 w-12 mx-auto text-slate-300 mb-2" />
              Mohon daftarkan minimal 1 Project Layanan untuk dapat dipantau timelinernya.
            </div>
          )}
        </div>

      </div>

      {/* ================= MODAL: REGISTRASI SERVICE BARU ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in text-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-slate-100 shadow-xl animate-fade-in my-8 text-left text-slate-700">
            <div className="bg-teal-700 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Buat Registrasi Layanan Baru</h3>
                <p className="text-xs text-teal-100">Daftarkan pengujian laboratorium langsung dari panel pelacak</p>
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
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
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
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                  required
                >
                  <option value="">-- Pilih Analisis Katalog --</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - {formatIDRPrices(s.price)}</option>
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
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sales Pendamping</label>
                  <select
                    value={formData.assignedSales}
                    onChange={(e) => setFormData({ ...formData, assignedSales: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
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
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Estimasi Selesai (Dynamic TAT)</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-semibold"
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
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    {statusOptions.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Pembayaran Awal</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as PaymentStatus })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
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
                      {formatIDRPrices(services.find(s => s.id === formData.serviceId)?.price || 0)} x {formData.sampleQuantity} Wadah
                    </span>
                  </div>
                  {formData.discountPercent > 0 && (
                    <div className="flex justify-between text-[11px] text-emerald-650 font-medium">
                      <span>Pemberian Diskon ({formData.discountPercent}%)</span>
                      <span className="font-mono">
                        -{formatIDRPrices(((services.find(s => s.id === formData.serviceId)?.price || 0) * formData.sampleQuantity) * (formData.discountPercent / 100))}
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
                      {formatIDRPrices(getCalculatedPrice(formData.serviceId, formData.sampleQuantity, formData.discountPercent, formData.urgency))}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-250 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 cursor-pointer"
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

    </div>
  );
}
