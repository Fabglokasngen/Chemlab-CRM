import React, { useState } from 'react';
import { 
  Plus, Edit2, Phone, Mail, Globe, 
  MapPin, UserCheck, Trash2, Calendar, 
  BookOpen, Clock, StickyNote, RefreshCw,
  Search, ShieldAlert, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Client, ActivityNote, ClientStatus } from '../types';

interface NewClientProps {
  clients: Client[];
  onAddClient: (client: Omit<Client, 'id' | 'createdAt' | 'activityNotes'>) => void;
  onUpdateClient: (id: string, updated: Partial<Client>) => void;
  onDeleteClient: (id: string) => void;
  onAddActivityNote: (clientId: string, note: Omit<ActivityNote, 'id' | 'date'>) => void;
}

export default function NewClient({
  clients,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onAddActivityNote
}: NewClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [activeClientForNotes, setActiveClientForNotes] = useState<Client | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteAuthor, setNewNoteAuthor] = useState('Budi Santoso');

  // Form states
  const [formData, setFormData] = useState({
    companyName: '',
    industry: 'Makanan & Minuman',
    address: '',
    email: '',
    phone: '',
    website: '',
    picName: '',
    picPosition: 'QA/QC Manager',
    picEmail: '',
    picPhone: '',
    leadSource: 'Website',
    potentialRevenue: 5000000,
    assignedSales: 'Budi Santoso',
    status: 'Prospect' as ClientStatus,
    isFirstTransaction: true,
  });

  const [editFormData, setEditFormData] = useState<Partial<Client>>({});

  const industries = [
    'Makanan & Minuman', 'Farmasi & Kosmetik', 'Pertambangan & Energi', 
    'Pertanian & Perkebunan', 'Tekstil & Garment', 'Manufaktur', 'Lainnya'
  ];

  const leadSources = [
    'Website',
    'Referral',
    'LinkedIn',
    'Event',
    'Cold Call',
    'Email Campaign',
    'Partner',
    'Other'
  ];

  const clientStatuses: ClientStatus[] = [
    'Prospect', 'Contacted', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'
  ];

  const salesPeople = ['Budi Santoso', 'Siti Rahma', 'Andi Wijaya'];

  // Currency helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Submission
  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    onAddClient(formData);
    setIsAddModalOpen(false);
    
    // Reset
    setFormData({
      companyName: '',
      industry: 'Makanan & Minuman',
      address: '',
      email: '',
      phone: '',
      website: '',
      picName: '',
      picPosition: 'QA/QC Manager',
      picEmail: '',
      picPhone: '',
      leadSource: 'Website',
      potentialRevenue: 5000000,
      assignedSales: 'Budi Santoso',
      status: 'Prospect' as ClientStatus,
      isFirstTransaction: true,
    });
  };

  const handleEditClick = (c: Client) => {
    setEditingClient(c);
    setEditFormData({ ...c });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    onUpdateClient(editingClient.id, editFormData);
    setEditingClient(null);
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClientForNotes || !newNoteContent.trim()) return;

    onAddActivityNote(activeClientForNotes.id, {
      note: newNoteContent,
      author: newNoteAuthor
    });

    setNewNoteContent('');
    // refresh current client for notes display
    const updatedClient = clients.find(c => c.id === activeClientForNotes.id);
    if (updatedClient) {
      setActiveClientForNotes(updatedClient);
    }
  };

  // Funnel count
  const stats = {
    prospects: clients.filter(c => c.status === 'Prospect').length,
    negotiations: clients.filter(c => c.status === 'Negotiation').length,
    won: clients.filter(c => c.status === 'Won').length,
    lost: clients.filter(c => c.status === 'Lost').length,
  };

  // Filter lists
  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.picName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.assignedSales.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Lead & Client Intake Manager</h2>
          <p className="text-sm text-slate-400 mt-1">Registrasi profil perusahaan, data PIC penguji, pencatatan log kunjungan/follow-up harian sales.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-750 rounded-lg transition-all shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Tambah Klien Leads Baru
        </button>
      </div>

      {/* SALES LEAD PIPELINE STAGES COUNT */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg font-bold text-lg font-mono">
            {stats.prospects}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Prospects</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Database Klien Potensial</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-lg font-mono">
            {stats.negotiations}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Negotiation</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Quotation Sedang Direview</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-teal-50 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-lg font-bold text-lg font-mono">
            {stats.won}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Won / Active</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Sering Mengirim Sampel</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-slate-50 text-slate-500 rounded-lg font-bold text-lg font-mono">
            {stats.lost}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lost Deal</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Prospect Gagal Closing</p>
          </div>
        </div>
      </div>

      {/* FILTER SEARCH PANEL */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-3 items-center">
        <div className="relative w-full md:w-3/5">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama PT Klien, nama PIC penguji, atau industri..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden bg-slate-50/50"
          />
        </div>

        <div className="w-full md:w-2/5 flex items-center gap-2">
          <span className="text-xs text-slate-500 shrink-0">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-1.8 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-hidden"
          >
            <option value="All">Semua Funnel CRM</option>
            {clientStatuses.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>
      </div>

      {/* DETAILED CARDS OF CLIENTS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredClients.map((client) => {
          // Find follow up alert if status is Prospect/Negotiation and no note with over 7 days
          return (
            <div 
              key={client.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between space-y-4"
            >
              {/* Header card info */}
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="inline-block text-[9px] bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-sm text-slate-500 uppercase font-bold tracking-wider">{client.industry}</span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">{client.companyName}</h3>
                  </div>
                  
                  <span className={`px-2.5 py-0.8 rounded-full text-[9px] border font-bold ${
                    client.status === 'Won' 
                      ? 'bg-teal-50 text-teal-700 border-teal-200' 
                      : client.status === 'Lost' 
                      ? 'bg-slate-100 text-slate-500 border-slate-200' 
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200/50'
                  }`}>
                    {client.status}
                  </span>
                </div>

                {/* Potentials & contact */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-y border-slate-100/70 py-3 my-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Nilai Prospek</span>
                    <span className="font-mono font-bold text-teal-900">{formatIDR(client.potentialRevenue)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Atribusi Transaksi</span>
                    <span className="font-semibold text-slate-700">
                      {client.isFirstTransaction ? 'Perdana (Klien Baru)' : 'Retained (Klien Lama)'}
                    </span>
                  </div>
                </div>

                {/* PIC Card info */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <UserCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span><b>{client.picName}</b> ({client.picPosition})</span>
                  </div>

                  <div className="flex items-center gap-4 text-slate-500 text-[11px] pl-5">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {client.picPhone}</span>
                    <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3" /> {client.picEmail}</span>
                  </div>
                </div>
              </div>

              {/* Botton action controls */}
              <div className="pt-3 border-t border-slate-100/80 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">Sales: <b>{client.assignedSales}</b></span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveClientForNotes(client)}
                    className="flex items-center gap-1 bg-slate-50 hover:bg-slate-150 text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Interaction Notes ({client.activityNotes.length})
                  </button>
                  <button
                    onClick={() => handleEditClick(client)}
                    className="p-1.5 text-slate-550 hover:text-teal-600 hover:bg-slate-100 rounded-lg"
                    title="Edit Profil Klien"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus registrasi klien ${client.companyName}?`)) {
                        onDeleteClient(client.id);
                      }
                    }}
                    className="p-1.5 text-slate-450 hover:text-rose-600 hover:bg-slate-100 rounded-lg"
                    title="Hapus Klien"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= MODAL: EDIT CLIENT ================= */}
      {editingClient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-slate-100 shadow-xl animate-fade-in my-8">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Edit Profil Klien Perusahaan</h3>
                <p className="text-xs text-slate-300">Ubah detail PIC, draf alamat atau status pipeline penjualan</p>
              </div>
              <button onClick={() => setEditingClient(null)} className="text-slate-300 hover:text-white text-xl font-bold cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {/* Co name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Perusahaan Klien</label>
                <input
                  type="text"
                  value={editFormData.companyName || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              {/* Industry & Source */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sektor Industri</label>
                  <select
                    value={editFormData.industry || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, industry: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Asal Leads</label>
                  <select
                    value={editFormData.leadSource || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, leadSource: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {leadSources.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              {/* Status and sales */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status Pipeline Penjualan</label>
                  <select
                    value={editFormData.status || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as ClientStatus })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {clientStatuses.map(cs => <option key={cs} value={cs}>{cs}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sales Atribusi</label>
                  <select
                    value={editFormData.assignedSales || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, assignedSales: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {salesPeople.map(sp => <option key={sp} value={sp}>{sp}</option>)}
                  </select>
                </div>
              </div>

              {/* First transaction toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-150">
                <div className="text-xs">
                  <span className="font-semibold block text-slate-700">First-Time Client (Nasabah Baru)</span>
                  <span className="text-[10px] text-slate-450">Bila aktif, penugasan completed lunas akan digandakan komisi 2.5%</span>
                </div>
                <input
                  type="checkbox"
                  checked={editFormData.isFirstTransaction}
                  onChange={(e) => setEditFormData({ ...editFormData, isFirstTransaction: e.target.checked })}
                  className="h-4.5 w-4.5 accent-teal-600 cursor-pointer"
                />
              </div>

              {/* PIC fields */}
              <div className="border-t border-slate-200/60 pt-4 space-y-3">
                <span className="text-xs font-bold text-slate-800">Kontak PIC QC/Lab Klien</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-600">Nama Lengkap PIC</label>
                    <input
                      type="text"
                      value={editFormData.picName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, picName: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600">Jabatan PIC</label>
                    <input
                      type="text"
                      value={editFormData.picPosition || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, picPosition: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-600">Email Kerja PIC</label>
                    <input
                      type="email"
                      value={editFormData.picEmail || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, picEmail: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600">No. HP/WhatsApp</label>
                    <input
                      type="text"
                      value={editFormData.picPhone || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, picPhone: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Simpan Klien
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD CLIENT ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-100 shadow-xl overflow-hidden animate-fade-in my-8">
            <div className="bg-teal-700 text-white p-5">
              <h3 className="font-bold text-lg">Daftarkan Klien / Leads Baru</h3>
              <p className="text-xs text-teal-150">Profilkan prospek instansi atau komersial manufaktur di sistem penjualan</p>
            </div>

            <form onSubmit={handleSubmitAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Perusahaan / Institusi</label>
                <input
                  type="text"
                  placeholder="Misal: PT Aneka Pangan Sejahtera"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sektor Industri</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Asal Leads</label>
                  <select
                    value={formData.leadSource}
                    onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {leadSources.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Potensi Nilai Kontrak (Rp)</label>
                  <input
                    type="number"
                    value={formData.potentialRevenue}
                    onChange={(e) => setFormData({ ...formData, potentialRevenue: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sales Pendamping</label>
                  <select
                    value={formData.assignedSales}
                    onChange={(e) => setFormData({ ...formData, assignedSales: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {salesPeople.map(sp => <option key={sp} value={sp}>{sp}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Funnel Awal</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ClientStatus })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {clientStatuses.map(cs => <option key={cs} value={cs}>{cs}</option>)}
                  </select>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-lg text-xs">
                  <span className="font-semibold text-slate-600 text-[10px]">Tandai Klien Baru?</span>
                  <input
                    type="checkbox"
                    checked={formData.isFirstTransaction}
                    onChange={(e) => setFormData({ ...formData, isFirstTransaction: e.target.checked })}
                    className="h-4 w-4 accent-teal-600"
                  />
                </div>
              </div>

              {/* Address details */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Alamat Pabrik/Gedung Klien</label>
                <textarea
                  placeholder="Kawasan Industri, Blok, Jalan No..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs h-12"
                />
              </div>

              {/* PIC */}
              <div className="border-t border-slate-150 pt-3 space-y-2">
                <span className="text-xs font-bold text-slate-800">Kontak Person PIC Utama</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nama PIC QC"
                    value={formData.picName}
                    onChange={(e) => setFormData({ ...formData, picName: e.target.value })}
                    className="p-2 border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Jabatan PIC"
                    value={formData.picPosition}
                    onChange={(e) => setFormData({ ...formData, picPosition: e.target.value })}
                    className="p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="email"
                    placeholder="Email PIC"
                    value={formData.picEmail}
                    onChange={(e) => setFormData({ ...formData, picEmail: e.target.value })}
                    className="p-2 border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="No. Telp PIC"
                    value={formData.picPhone}
                    onChange={(e) => setFormData({ ...formData, picPhone: e.target.value })}
                    className="p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-teal-600 text-white hover:bg-teal-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Daftarkan Klien
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ACTIVITY LOGS & JOURNAL NOTE APPEND ================= */}
      {activeClientForNotes && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-100 shadow-xl overflow-hidden animate-fade-in my-8">
            <div className="bg-teal-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-wider font-semibold bg-teal-850 px-2 py-0.5 rounded-sm">INTERACTION JOURNAL</span>
                <h3 className="font-bold text-lg mt-1">{activeClientForNotes.companyName}</h3>
                <p className="text-xs text-teal-200">PIC: {activeClientForNotes.picName} ({activeClientForNotes.picPosition})</p>
              </div>
              <button onClick={() => setActiveClientForNotes(null)} className="text-teal-200 hover:text-white text-xl font-bold cursor-pointer">&times;</button>
            </div>

            <div className="p-6 space-y-4 max-h-[480px] overflow-y-auto">
              
              {/* Note input form */}
              <form onSubmit={handleAddNoteSubmit} className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/60">
                <span className="text-xs font-bold text-slate-800">Tambahkan Catatan Follow-up Baru</span>
                
                <div className="grid grid-cols-3 gap-2 items-center">
                  <label className="text-[10px] text-slate-400 font-semibold uppercase">Petugas Penulis:</label>
                  <select
                    value={newNoteAuthor}
                    onChange={(e) => setNewNoteAuthor(e.target.value)}
                    className="p-1 border border-slate-200 bg-white rounded-md text-xs col-span-2"
                  >
                    {salesPeople.map(sp => <option key={sp} value={sp}>{sp}</option>)}
                  </select>
                </div>

                <textarea
                  placeholder="Tulis interaksi... Misal: Menghubungi via WhatsApp, menanyakan perihal quotation nomor QT-0129..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="w-full p-2 border border-slate-200 bg-white rounded-lg text-xs h-16 focus:outline-hidden"
                  required
                />

                <div className="text-right">
                  <button 
                    type="submit"
                    className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-[10px] font-semibold cursor-pointer"
                  >
                    Simpan Catatan
                  </button>
                </div>
              </form>

              {/* Logs Timeline */}
              <div className="space-y-4 pt-4">
                <span className="text-xs font-bold text-slate-800 block">Riwayat Interaksi ({activeClientForNotes.activityNotes.length})</span>
                
                {activeClientForNotes.activityNotes.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 italic">Belum ada catatan aktivitas. Tim sales dapat menginput draf jurnal pertamanya di atas.</p>
                ) : (
                  <div className="space-y-3 relative before:absolute before:top-2 before:bottom-2 before:left-3.5 before:w-0.5 before:bg-slate-100 pl-8">
                    {[...activeClientForNotes.activityNotes].reverse().map((note) => (
                      <div key={note.id} className="relative bg-slate-50/40 p-3 rounded-lg border border-slate-100 text-xs">
                        <div className="absolute -left-7.5 top-3.5 w-2.5 h-2.5 rounded-full bg-teal-600 shadow-xs ring-4 ring-white"></div>
                        <div className="flex justify-between items-center text-slate-450 text-[10px] mb-1">
                          <span className="font-semibold text-slate-600">Oleh: {note.author}</span>
                          <span className="font-mono flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {note.date}
                          </span>
                        </div>
                        <p className="text-slate-800 leading-relaxed font-sans mt-1.5">{note.note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
              <button 
                type="button"
                onClick={() => setActiveClientForNotes(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-250 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer animate-fade-in"
              >
                Tutup Jurnal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
