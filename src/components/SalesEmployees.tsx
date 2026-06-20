import React, { useState } from 'react';
import { 
  Search, Plus, Edit2, Trash2, Download, 
  UserPlus, Mail, Phone, Award, TrendingUp, CheckCircle, XCircle, Briefcase, DollarSign
} from 'lucide-react';
import { SalesEmployee } from '../types';

interface SalesEmployeesProps {
  employees: SalesEmployee[];
  onAddEmployee: (employee: Omit<SalesEmployee, 'id' | 'createdAt' | 'achievedThisMonth'>) => void;
  onUpdateEmployee: (id: string, updated: Partial<SalesEmployee>) => void;
  onDeleteEmployee: (id: string) => void;
}

export default function SalesEmployees({
  employees,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee
}: SalesEmployeesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<SalesEmployee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<SalesEmployee | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Sales Representative',
    targetMonthly: 30000000,
    status: 'Active' as 'Active' | 'Inactive'
  });

  const [editFormData, setEditFormData] = useState<Partial<SalesEmployee>>({});

  // Helper formatting currency
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Handle Add Submit
  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert('Nama dan Email wajib diisi!');
      return;
    }
    
    // Check duplication name
    if (employees.some(emp => emp.name.toLowerCase() === formData.name.toLowerCase())) {
      alert('Karyawan sales dengan nama ini sudah terdaftar!');
      return;
    }

    onAddEmployee(formData);
    setIsAddModalOpen(false);

    // Reset Form
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'Sales Representative',
      targetMonthly: 30000000,
      status: 'Active'
    });
  };

  // Handle Edit Click
  const handleEditClick = (emp: SalesEmployee) => {
    setEditingEmployee(emp);
    setEditFormData({ ...emp });
  };

  // Handle Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    if (!editFormData.name || !editFormData.email) {
      alert('Nama dan Email wajib diisi!');
      return;
    }

    onUpdateEmployee(editingEmployee.id, editFormData);
    setEditingEmployee(null);
  };

  // Filter & Search Logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' ? true : emp.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate quick stats
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'Active').length;
  const totalTarget = employees.reduce((acc, curr) => acc + (curr.status === 'Active' ? curr.targetMonthly : 0), 0);
  const totalAchieved = employees.reduce((acc, curr) => acc + (curr.status === 'Active' ? curr.achievedThisMonth : 0), 0);
  const avgAchievementPercent = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;

  // Export to CSV helper
  const handleExportCSV = () => {
    const headers = ['ID', 'Nama Karyawan', 'Email', 'No Telepon', 'Jabatan/Role', 'Target Bulanan', 'Pencapaian Bulan Ini', 'Status', 'Tanggal Bergabung'];
    const rows = filteredEmployees.map(emp => [
      emp.id,
      emp.name,
      emp.email,
      emp.phone,
      emp.role,
      emp.targetMonthly,
      emp.achievedThisMonth,
      emp.status,
      emp.createdAt ? new Date(emp.createdAt).toLocaleDateString('id-ID') : '-'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `chemlab_sales_employees_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="sales-employees-section" className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-teal-600" />
            Kelola Sales Karyawan
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau performa target, kelola data sales representative lab, dan rekap kinerja bulanan masing-masing karyawan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-sm font-medium transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Ekspor CSV
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition shadow-sm hover:shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Sales Baru
          </button>
        </div>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* STAT 1: TOTAL SALES */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Sales Karyawan</p>
            <h3 className="text-xl font-bold text-slate-800">{totalEmployees} Orang</h3>
            <p className="text-xs text-slate-500 mt-0.5">{activeEmployees} Karyawan Aktif</p>
          </div>
        </div>

        {/* STAT 2: TOTAL MONTHLY TARGET */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Target Bulanan (Aktif)</p>
            <h3 className="text-xl font-bold text-slate-800">{formatIDR(totalTarget)}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Kumulatif seluruh divisi sales</p>
          </div>
        </div>

        {/* STAT 3: TOTAL ACHIEVED */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Pencapaian Bulan Ini</p>
            <h3 className="text-xl font-bold text-slate-800 text-indigo-600">{formatIDR(totalAchieved)}</h3>
            <p className="text-xs text-indigo-500 font-medium mt-0.5">
              {avgAchievementPercent.toFixed(1)}% dari Total Target
            </p>
          </div>
        </div>

        {/* STAT 4: AVERAGE ACHIEVEMENT RATE */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Persentase Capaian Kumulatif</p>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-bold text-slate-800">{avgAchievementPercent.toFixed(1)}%</h3>
              <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, avgAchievementPercent)}%` }}
                ></div>
              </div>
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">Progression Rate</p>
          </div>
        </div>
      </div>

      {/* FILTER AND SEARCH CONTROLS */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Cari nama, email, telepon, jabatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700 bg-slate-50/50"
          />
        </div>

        {/* Segmented Filter Status */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('All')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-transform transition ${statusFilter === 'All' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Semua ({totalEmployees})
          </button>
          <button
            onClick={() => setStatusFilter('Active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${statusFilter === 'Active' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Aktif ({activeEmployees})
          </button>
          <button
            onClick={() => setStatusFilter('Inactive')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${statusFilter === 'Inactive' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Non-Aktif ({totalEmployees - activeEmployees})
          </button>
        </div>
      </div>

      {/* THE EMPLOYEES GRID VIEW */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white py-16 px-4 rounded-2xl border border-slate-100 text-center shadow-sm">
          <div className="mx-auto w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
            <Search className="w-8 h-8" />
          </div>
          <p className="text-slate-500 font-medium">Data sales karyawan tidak ditemukan</p>
          <p className="text-slate-400 text-xs mt-1">Coba sesuaikan kata kunci pencarian atau filter status Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((emp) => {
            const achievementRate = emp.targetMonthly > 0 ? (emp.achievedThisMonth / emp.targetMonthly) * 100 : 0;
            const progressColor = achievementRate >= 100 
              ? 'bg-emerald-500' 
              : achievementRate >= 75 
                ? 'bg-indigo-500' 
                : achievementRate >= 40 
                  ? 'bg-amber-500' 
                  : 'bg-rose-500';

            return (
              <div 
                key={emp.id} 
                className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200 transition shadow-sm hover:shadow duration-200 flex flex-col overflow-hidden relative"
              >
                {/* Top decorative badge */}
                <div className={`h-1.5 w-full ${emp.status === 'Active' ? 'bg-teal-500' : 'bg-slate-300'}`} />
                
                <div className="p-6 flex-1 flex flex-col justify-between">
                  {/* Avatar & Basic Info */}
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                          emp.status === 'Active' 
                            ? 'bg-teal-50 text-teal-600' 
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 leading-tight flex items-center gap-1.5">
                            {emp.name}
                            {emp.status === 'Active' ? (
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50" title="Aktif" />
                            ) : (
                              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" title="Non-Aktif" />
                            )}
                          </h3>
                          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase block mt-0.5">{emp.role}</span>
                        </div>
                      </div>

                      {/* Pill Status */}
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        emp.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-slate-50 text-slate-400 border border-slate-100'
                      }`}>
                        {emp.status === 'Active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>

                    {/* Contacts block */}
                    <div className="mt-5 space-y-2 border-t border-slate-50 pt-4 text-xs text-slate-500">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{emp.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{emp.phone || '-'}</span>
                      </div>
                    </div>

                    {/* Target performance bars */}
                    <div className="mt-5 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-400 font-semibold">Pencapaian Bulan Ini</span>
                        <span className="font-bold text-slate-700">{achievementRate.toFixed(1)}%</span>
                      </div>
                      
                      {/* Progress meter */}
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${progressColor}`} 
                          style={{ width: `${Math.min(100, achievementRate)}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-xs mt-2">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Selesai (Revenue)</span>
                          <span className="font-bold text-teal-600">{formatIDR(emp.achievedThisMonth)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[10px] uppercase">Target</span>
                          <span className="font-semibold text-slate-600">{formatIDR(emp.targetMonthly)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="mt-6 pt-4 border-t border-slate-150 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleEditClick(emp)}
                      className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                      title="Edit Data Sales"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingEmployee(emp);
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Hapus Sales"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: TAMBAH SALES BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-5">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Registrasi Sales Karyawan Baru
              </h3>
              <p className="text-teal-100 text-xs mt-1">Masukkan spesifikasi identitas & target kerja marketing baru.</p>
            </div>
            
            <form onSubmit={handleSubmitAdd} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nama Lengkap*</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Aditya Wijaya"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-705 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Kantor*</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. aditya@chemlab.co.id"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">No. Handphone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 0812-xxxx-xxxx"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Jabatan / Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700"
                  >
                    <option value="Senior Sales Executive">Senior Sales Executive</option>
                    <option value="Sales Representative">Sales Representative</option>
                    <option value="Account Executive">Account Executive</option>
                    <option value="Head of Sales">Head of Sales</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status Karyawan</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700"
                  >
                    <option value="Active">Aktif</option>
                    <option value="Inactive">Non-Aktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Target Bulanan (IDR/Rp)*</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm font-semibold">Rp</span>
                  <input
                    type="number"
                    required
                    value={formData.targetMonthly}
                    onChange={(e) => setFormData({ ...formData, targetMonthly: Number(e.target.value) })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 text-sm font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
                >
                  Simpan Sales
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT DATA SALES */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="bg-slate-800 text-white p-5">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-teal-400" />
                Ubah Profil Sales Karyawan
              </h3>
              <p className="text-slate-300 text-xs mt-1">Perbarui rincian, jabatan, target bulanan, atau pencapaian.</p>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nama Lengkap*</label>
                <input
                  type="text"
                  required
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Kantor*</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">No. Handphone</label>
                  <input
                    type="text"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Jabatan / Role</label>
                  <select
                    value={editFormData.role || 'Sales Representative'}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-750"
                  >
                    <option value="Senior Sales Executive">Senior Sales Executive</option>
                    <option value="Sales Representative">Sales Representative</option>
                    <option value="Account Executive">Account Executive</option>
                    <option value="Head of Sales">Head of Sales</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 font-bold">Status Keaktifan</label>
                  <select
                    value={editFormData.status || 'Active'}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as 'Active' | 'Inactive' })}
                    className="w-full px-3 py-2 border border-slate-205 rounded-xl text-sm bg-white font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-750"
                  >
                    <option value="Active" className="text-emerald-600 font-bold">Aktif</option>
                    <option value="Inactive" className="text-rose-500 font-bold">Non-aktif</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Target Bulanan (Rp)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs font-semibold">Rp</span>
                    <input
                      type="number"
                      value={editFormData.targetMonthly ?? 0}
                      onChange={(e) => setEditFormData({ ...editFormData, targetMonthly: Number(e.target.value) })}
                      className="w-full pl-8 pr-2.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Capaian Transaksi (Rp)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs font-semibold">Rp</span>
                    <input
                      type="number"
                      value={editFormData.achievedThisMonth ?? 0}
                      onChange={(e) => setEditFormData({ ...editFormData, achievedThisMonth: Number(e.target.value) })}
                      className="w-full pl-8 pr-2.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-teal-650 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="flex-1 px-4 py-2 border border-slate-205 hover:bg-slate-50 rounded-xl text-slate-500 text-sm font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DISMISS / DELETE CONFIRMATION */}
      {deletingEmployee && (
        <div id="modal-delete-employee" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="bg-rose-600 text-white p-5 flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Trash2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Konfirmasi Hapus Karyawan</h3>
                <p className="text-rose-100 text-xs mt-0.5">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-sm text-rose-800 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-rose-900">Perhatian Penting</p>
                  <p className="text-xs text-rose-700 mt-1">
                    Menghapus data partner sales akan menghilangkan keterkaitannya pada laporan insentif & histori rekonsiliasi yang belum diselesaikan.
                  </p>
                </div>
              </div>

              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Identitas Karyawan</p>
                <p className="font-bold text-slate-800 text-base mt-1">{deletingEmployee.name}</p>
                <p className="text-xs text-slate-500 font-medium">{deletingEmployee.role} • {deletingEmployee.email}</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingEmployee(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 text-sm font-medium transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteEmployee(deletingEmployee.id);
                    setDeletingEmployee(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition shadow-sm cursor-pointer"
                >
                  Ya, Hapus Karyawan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
