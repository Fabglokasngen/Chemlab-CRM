import React, { useState, useEffect } from 'react';
import { 
  Search, CheckCircle, Clock, AlertTriangle, 
  FlaskConical, Calendar, Filter, Plus, 
  Eye, Edit3, ArrowUpRight, ShieldCheck, CheckCircle2,
  ChevronDown, X, Sparkles, RefreshCw, FileText
} from 'lucide-react';
import { Project, Client, Service, ProjectStatus, PaymentStatus } from '../types';
import PDFDownloadModal from './PDFDownloadModal';

interface ServiceTrackerProps {
  projects: Project[];
  clients: Client[];
  services: Service[];
  onUpdateProjectStatus: (id: string, nextStatus: Project['status'], nextProgress: number) => void;
  onAddProject: (project: Omit<Project, 'id' | 'quotationNumber'>) => void;
}

// Helper to get strictly 6-digit testing ID (removes LAB-2026- prefix)
export function get6DigitId(proj: Project): string {
  if (proj.idElsa && /^\d{6}$/.test(proj.idElsa)) {
    return proj.idElsa;
  }
  // Extract numbers or convert ID into 6-digit representation
  const digitsOnly = proj.id.replace(/\D/g, '');
  if (digitsOnly.length >= 6) {
    return digitsOnly.slice(-6);
  }
  if (digitsOnly.length > 0) {
    return digitsOnly.padStart(6, '4');
  }
  // Fallback hash-like 6 digit for legacy string IDs
  let hash = 0;
  for (let i = 0; i < proj.id.length; i++) {
    hash = (hash * 31 + proj.id.charCodeAt(i)) % 1000000;
  }
  return String(Math.abs(hash)).padStart(6, '1');
}

export default function ServiceTracker({ 
  projects, 
  clients, 
  services, 
  onUpdateProjectStatus,
  onAddProject
}: ServiceTrackerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter States
  const [filterMonth, setFilterMonth] = useState<string>('All');
  const [filterYear, setFilterYear] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  // Modal States
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<Project | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [quickStatusModalProject, setQuickStatusModalProject] = useState<Project | null>(null);

  // Form State for Add Project
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

  // Calculate Due Date based on service TAT
  useEffect(() => {
    if (!formData.serviceId) return;
    const selectedService = services.find(s => s.id === formData.serviceId);
    if (!selectedService) return;

    let computedTat = selectedService.tatDays;
    if (formData.urgency === 'Urgent') {
      computedTat = Math.ceil(computedTat * 0.5);
    } else if (formData.urgency === 'Super Urgent') {
      computedTat = Math.max(1, Math.ceil(computedTat * 0.25));
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

  const getCalculatedPrice = (serviceId: string, sampleQuantity: number, discountPercent: number, urgency: 'Regular' | 'Urgent' | 'Super Urgent') => {
    const selectedService = services.find(s => s.id === serviceId);
    if (!selectedService) return 0;

    const basePrice = selectedService.price * sampleQuantity;
    const discountAmount = basePrice * (discountPercent / 100);
    const priceAfterDiscount = basePrice - discountAmount;

    let urgencyMultiplier = 1;
    if (urgency === 'Urgent') urgencyMultiplier = 2;
    if (urgency === 'Super Urgent') urgencyMultiplier = 3;

    return Math.round(priceAfterDiscount * urgencyMultiplier);
  };

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

  // Available Years from Projects
  const availableYears = Array.from(new Set(projects.map(p => {
    if (!p.startDate) return '';
    return p.startDate.split('-')[0];
  }))).filter(Boolean).sort().reverse();

  // Available Months from Projects
  const availableMonths = Array.from(new Set(projects.map(p => {
    if (!p.startDate) return '';
    return p.startDate.split('-')[1];
  }))).filter(Boolean).sort();

  // Categories
  const availableCategories = Array.from(new Set(projects.map(p => p.serviceCategory))).filter(Boolean).sort();

  // Filtering Logic
  const filteredProjects = projects.filter(proj => {
    const testingId = get6DigitId(proj);
    const query = searchQuery.trim().toLowerCase();

    const matchesSearch = query === '' ||
      testingId.toLowerCase().includes(query) ||
      proj.clientName.toLowerCase().includes(query) ||
      proj.serviceName.toLowerCase().includes(query) ||
      proj.quotationNumber.toLowerCase().includes(query) ||
      proj.assignedSales.toLowerCase().includes(query);

    const projYear = proj.startDate ? proj.startDate.split('-')[0] : '';
    const matchesYear = filterYear === 'All' || projYear === filterYear;

    const projMonth = proj.startDate ? proj.startDate.split('-')[1] : '';
    const matchesMonth = filterMonth === 'All' || projMonth === filterMonth;

    const matchesStatus = filterStatus === 'All' || proj.status === filterStatus;
    const matchesCategory = filterCategory === 'All' || proj.serviceCategory === filterCategory;

    return matchesSearch && matchesYear && matchesMonth && matchesStatus && matchesCategory;
  });

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const getStatusBadgeStyle = (status: ProjectStatus) => {
    switch (status) {
      case 'Report Released':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Completed':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'In Progress':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Review':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Sample Received':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'Accepted':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleQuickStatusUpdate = (proj: Project, newStatus: ProjectStatus) => {
    let progress = proj.progressPercent;
    if (newStatus === 'New Request') progress = 10;
    if (newStatus === 'Accepted') progress = 25;
    if (newStatus === 'Sample Received') progress = 45;
    if (newStatus === 'In Progress') progress = 65;
    if (newStatus === 'Review') progress = 80;
    if (newStatus === 'Completed') progress = 95;
    if (newStatus === 'Report Released') progress = 100;

    onUpdateProjectStatus(proj.id, newStatus, progress);
    setQuickStatusModalProject(null);
    if (selectedProjectForDetail?.id === proj.id) {
      setSelectedProjectForDetail({ ...proj, status: newStatus, progressPercent: progress });
    }
  };

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

    const totalPrice = getCalculatedPrice(formData.serviceId, formData.sampleQuantity, formData.discountPercent, formData.urgency);

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

  const statusOptionsList: ProjectStatus[] = [
    'New Request', 'Accepted', 'Sample Received', 'In Progress', 'Review', 'Completed', 'Report Released'
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Service Tracker</h2>
          <p className="text-sm text-slate-400 mt-1">Monitor laboratory testing status based on 6-digit testing ID.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            type="button"
            onClick={() => setIsPDFModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
          >
            <FileText className="h-4 w-4" /> Download PDF
          </button>
          <button 
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" /> New Service Registration
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-center gap-3 justify-between">
          
          {/* Search bar */}
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3.5 top-2.8 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search 6-digit ID (e.g. 381902), Client, or Service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 bg-slate-50/50"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters: Month & Year & Status */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto text-xs">
            
            {/* Filter Year */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Year:</span>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="All">All Years</option>
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Filter Month */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Month:</span>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="All">All Months</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{monthNameMap[m] || `Month ${m}`}</option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                {statusOptionsList.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Filter Category */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Category:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {(filterMonth !== 'All' || filterYear !== 'All' || filterStatus !== 'All' || filterCategory !== 'All' || searchQuery) && (
              <button
                onClick={() => {
                  setFilterMonth('All');
                  setFilterYear('All');
                  setFilterStatus('All');
                  setFilterCategory('All');
                  setSearchQuery('');
                }}
                className="text-[11px] text-teal-600 font-semibold hover:underline px-2 py-1 cursor-pointer"
              >
                Reset Filters
              </button>
            )}

          </div>

        </div>

        {/* Counter Info */}
        <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
          <span>Showing <b>{filteredProjects.length}</b> service tests</span>
          <span className="text-[11px] font-mono text-slate-400">Total Database: {projects.length} Services</span>
        </div>
      </div>

      {/* 3 COLUMNS PER ROW GRID CONTAINER */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center space-y-3">
          <FlaskConical className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-700 text-base">No Testing Data Found</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your search query, month/year filters, or register a new testing service.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((proj) => {
            const testingId = get6DigitId(proj);
            return (
              <div 
                key={proj.id}
                className="bg-white rounded-2xl border border-slate-200/80 hover:border-teal-300 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 group"
              >
                <div>
                  {/* Card Header: 6-Digit ID & Status Badge */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-900 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-lg shadow-2xs">
                        ID: {testingId}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => setQuickStatusModalProject(proj)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 ${getStatusBadgeStyle(proj.status)}`}
                      title="Click to update status"
                    >
                      <span>{proj.status}</span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </button>
                  </div>

                  {/* Company & Service details */}
                  <div className="mt-3 space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition-colors line-clamp-1">
                      {proj.clientName}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium line-clamp-2">
                      {proj.serviceName}
                    </p>
                    <div className="pt-1">
                      <span className="inline-block text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                        {proj.serviceCategory}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-slate-500">Analysis Progress</span>
                      <span className="font-mono text-teal-800">{proj.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          proj.status === 'Report Released' ? 'bg-emerald-500' : 'bg-teal-600'
                        }`}
                        style={{ width: `${proj.progressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Dates & Samples */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-100 font-sans">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Start Date</span>
                      <span className="font-mono text-slate-700 font-bold">{proj.startDate || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Est. Completion</span>
                      <span className="font-mono text-teal-700 font-bold">{proj.dueDate || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Footer Info & Detail Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">{proj.sampleQuantity} Samples</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      proj.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {proj.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedProjectForDetail(proj)}
                    className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Details
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL: QUICK STATUS UPDATE ================= */}
      {quickStatusModalProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-100 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">Update Testing Status</span>
                <h3 className="font-bold text-slate-900 text-base">ID #{get6DigitId(quickStatusModalProject)}</h3>
                <p className="text-xs text-slate-500">{quickStatusModalProject.clientName}</p>
              </div>
              <button onClick={() => setQuickStatusModalProject(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">&times;</button>
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-slate-700">Select New Status:</label>
              <div className="space-y-1.5">
                {statusOptionsList.map((st) => (
                  <button
                    key={st}
                    onClick={() => handleQuickStatusUpdate(quickStatusModalProject, st)}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                      quickStatusModalProject.status === st
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{st}</span>
                    {quickStatusModalProject.status === st && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button 
                onClick={() => setQuickStatusModalProject(null)}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: TESTING DETAILS ================= */}
      {selectedProjectForDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-slate-100 shadow-2xl my-8">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="bg-teal-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">
                  TESTING ID #{get6DigitId(selectedProjectForDetail)}
                </span>
                <h3 className="font-bold text-lg text-white mt-1">{selectedProjectForDetail.clientName}</h3>
                <p className="text-xs text-slate-300">{selectedProjectForDetail.serviceName}</p>
              </div>
              <button onClick={() => setSelectedProjectForDetail(null)} className="text-slate-300 hover:text-white text-xl font-bold cursor-pointer">&times;</button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-150">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Service Category</span>
                  <span className="font-semibold text-slate-800">{selectedProjectForDetail.serviceCategory}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Status</span>
                  <span className="font-bold text-teal-700">{selectedProjectForDetail.status} ({selectedProjectForDetail.progressPercent}%)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Sample Quantity</span>
                  <span className="font-semibold text-slate-800">{selectedProjectForDetail.sampleQuantity} Test Containers</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Sales Rep</span>
                  <span className="font-semibold text-slate-800">{selectedProjectForDetail.assignedSales}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs border-y border-slate-100 py-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Registration Date</span>
                  <span className="font-mono font-semibold text-slate-700">{selectedProjectForDetail.startDate || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Est. Completion (Due Date)</span>
                  <span className="font-mono font-bold text-teal-800">{selectedProjectForDetail.dueDate || '-'}</span>
                </div>
              </div>

              <div className="bg-teal-50/60 p-4 rounded-xl border border-teal-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Testing Fee</span>
                  <span className="font-mono font-bold text-teal-900 text-sm">{formatIDR(selectedProjectForDetail.totalPrice)}</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  selectedProjectForDetail.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {selectedProjectForDetail.paymentStatus === 'Paid' ? 'Status: Paid' : 'Status: Unpaid'}
                </span>
              </div>

              {selectedProjectForDetail.quotationNumber && (
                <div className="text-xs text-slate-500">
                  <span>Quotation Reference No: <b className="font-mono text-slate-700">{selectedProjectForDetail.quotationNumber}</b></span>
                </div>
              )}

            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center">
              <button
                onClick={() => {
                  setQuickStatusModalProject(selectedProjectForDetail);
                }}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Update Status
              </button>
              <button 
                type="button"
                onClick={() => setSelectedProjectForDetail(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: NEW SERVICE REGISTRATION ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in text-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-slate-100 shadow-xl animate-fade-in my-8 text-left text-slate-700">
            <div className="bg-teal-700 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">New Service Registration</h3>
                <p className="text-xs text-teal-100">Register laboratory testing directly from the tracker panel</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-teal-200 hover:text-white text-xl font-bold cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleSubmitAdd} className="p-6 space-y-4">
              {/* Client Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Client Company</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                  required
                >
                  <option value="">-- Select Company --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.companyName} ({c.isFirstTransaction ? 'New' : 'Repeat'})</option>
                  ))}
                </select>
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Testing Service (Catalog)</label>
                <select
                  value={formData.serviceId}
                  onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                  required
                >
                  <option value="">-- Select Catalog Analysis --</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - {formatIDR(s.price)}</option>
                  ))}
                </select>
              </div>

              {/* ID Pengujian 6-Digit */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex justify-between">
                  <span>Testing ID (6-Digit Code) <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-teal-600 font-normal">Example: 120593, 381902</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="120593"
                  value={formData.idElsa}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, idElsa: val });
                  }}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-mono tracking-wider font-bold"
                  required
                />
              </div>

              {/* Sample Qty */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sample Quantity</label>
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned Sales Rep</label>
                  <select
                    value={formData.assignedSales}
                    onChange={(e) => setFormData({ ...formData, assignedSales: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    {['Budi Santoso', 'Siti Rahma', 'Andi Wijaya'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Urgency and Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex justify-between">
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

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Est. Completion (TAT)</label>
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Progress Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    {statusOptionsList.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Payment Status</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as PaymentStatus })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-250 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 cursor-pointer"
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

      {/* PDF Download Modal */}
      <PDFDownloadModal
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
        type="tracker"
        projects={projects}
        availableYears={availableYears}
        availableMonths={availableMonths}
        monthNameMap={monthNameMap}
        currentFilteredProjects={filteredProjects}
      />

    </div>
  );
}
