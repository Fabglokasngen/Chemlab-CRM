import React, { useState } from 'react';
import { 
  Search, Filter, Plus, Edit2, 
  Trash2, Download, FlaskConical, 
  Clock, DollarSign, ListFilter, HelpCircle,
  CheckCircle, FileText
} from 'lucide-react';
import { Service } from '../types';

interface ServiceCatalogProps {
  services: Service[];
  onAddService: (service: Omit<Service, 'id'>) => void;
  onUpdateService: (id: string, updated: Partial<Service>) => void;
  onDeleteService: (id: string) => void;
}

export default function ServiceCatalog({
  services,
  onAddService,
  onUpdateService,
  onDeleteService
}: ServiceCatalogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [viewingDetailService, setViewingDetailService] = useState<Service | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    serviceCode: '',
    name: '',
    category: 'Kimia Anorganik',
    description: '',
    method: '',
    tatDays: 7,
    price: 1500000,
  });

  const [editFormData, setEditFormData] = useState<Partial<Service>>({});

  // Categories list
  const categories = Array.from(new Set(services.map(s => s.category)));

  // Currency helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Submit
  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serviceCode || !formData.name) return;

    // Check code unique
    if (services.some(s => s.serviceCode.toUpperCase() === formData.serviceCode.toUpperCase())) {
      alert('Kode Layanan sudah terdaftar, mohon gunakan kode unik!');
      return;
    }

    onAddService(formData);
    setIsAddModalOpen(false);

    // Reset code
    const lastNum = services.length + 1;
    setFormData({
      serviceCode: `CHEM-00${lastNum}`,
      name: '',
      category: 'Kimia Anorganik',
      description: '',
      method: '',
      tatDays: 7,
      price: 1500000,
    });
  };

  const handleEditClick = (srv: Service) => {
    setEditingService(srv);
    setEditFormData({ ...srv });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    onUpdateService(editingService.id, editFormData);
    setEditingService(null);
  };

  // Filter list
  const filteredServices = services.filter(s => {
    const matchesSearch = 
      s.serviceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Printer-friendly Catalog PDF Trigger
  // Instead of installing heavy PDF plugins that easily crash during compilation, we use
  // CSS window.print() style formatting to trigger the system's native Print to PDF engine.
  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHTML = services.map(s => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-family: monospace; font-weight: bold;">${s.serviceCode}</td>
        <td style="padding: 10px;">
          <strong style="color: #0f172a;">${s.name}</strong><br/>
          <small style="color: #64748b;">Metode: ${s.method}</small>
        </td>
        <td style="padding: 10px; color: #4f46e5; font-weight: 500;">${s.category}</td>
        <td style="padding: 10px; text-align: center;">${s.tatDays} Hari</td>
        <td style="padding: 10px; text-align: right; font-weight: bold; font-family: monospace;">
          ${formatIDR(s.price)}
        </td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Daftar Harga & Katalog Layanan Laboratorium Kimia</title>
          <style>
            body { font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; color: #334155; padding: 40px; }
            header { text-align: center; border-bottom: 3px double #0d9488; padding-bottom: 20px; margin-bottom: 30px; }
            h1 { color: #0f172a; margin: 0 0 10px 0; font-size: 24px; text-transform: uppercase; }
            p { margin: 2px 0; font-size: 11px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            th { background-color: #0f172a; color: white; padding: 12px 10px; text-align: left; }
            footer { margin-top: 50px; font-size: 9px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <header>
            <h1>ChemLab Laboratories Inc.</h1>
            <p>Jalan Scientia Boulevard Raya Terpadu No. 90, Kawasan Pusat Penelitian Sains Indonesia</p>
            <p>Telp: (021) 880-990-21 | Email: support@chemlab-labs.com | Website: www.chemlab-labs.com</p>
          </header>
          
          <h2 style="color: #0f766e; text-align: center; font-size: 16px;">SPESIFIKASI DAFTAR HARGA & METODE PENGUJIAN LENGKAP</h2>
          
          <table>
            <thead>
              <tr>
                <th style="width: 12%;">KODE</h3>
                <th style="width: 45%;">LAYANAN ANALISIS & METODE STANDARD</th>
                <th style="width: 20%;">KATEGORI</th>
                <th style="width: 10%; text-align: center;">TAT (HARI)</th>
                <th style="width: 13%; text-align: right;">BIAYA PRICE (RP)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <footer>
            <p>Seluruh harga di atas belum termasuk PPN 11% dan biaya akomodasi pengambilan sampel di luar lab.</p>
            <p>Dokumen katalog ini diterbitkan secara digital pada tanggal ${new Date().toLocaleDateString('id-ID')} dan valid sebagai patokan quotation legal.</p>
          </footer>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Lab Service Catalog Manager</h2>
          <p className="text-sm text-slate-400 mt-1">Daftar harga satuan pengujian kimia, spesifikasi alat uji instrumen (ICP-OES, GC-MS), and standardisasi akreditasi SNI/ISO.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Download booklet */}
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" /> Download PDF Katalog
          </button>
          
          {/* New catalogue */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Katalog Baru
          </button>
        </div>
      </div>

      {/* FILTER SEARCH LIST */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <div className="relative md:col-span-8">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode layanan, detail instrumen alat, metode pengujian (ICP, GC-MS)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-1.5 md:col-span-4 w-full">
          <ListFilter className="h-3 w-3 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full py-1.8 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-teal-500"
          >
            <option value="All">Tampilkan Semua Kategori</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {/* DETAILED RESPONSIVE GRIDS OF SERVICES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((srv) => (
          <div 
            key={srv.id}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex justify-between items-start gap-2">
                <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.8 rounded-md">{srv.serviceCode}</span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">{srv.category}</span>
              </div>

              <h3 className="font-bold text-slate-900 text-sm mt-3 line-clamp-2" title={srv.name}>{srv.name}</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed mt-2 line-clamp-3">{srv.description}</p>
              
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-150/70 text-xs text-slate-600 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Metode Standar</span>
                  <span className="font-semibold text-slate-800 bg-white border border-slate-100 rounded-sm px-1.5 py-0.5 max-w-[150px] truncate" title={srv.method}>{srv.method}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Durasi Pengerjaan (TAT)</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {srv.tatDays} Hari Kerja
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100/80 flex items-center justify-between gap-2">
              <div className="text-left font-mono">
                <span className="text-[9px] block text-slate-400 font-sans uppercase">Biaya Dasar</span>
                <span className="font-bold text-slate-900 text-sm">{formatIDR(srv.price)}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setViewingDetailService(srv)}
                  className="p-1.8 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                  title="Lihat Detail Uji"
                >
                  <FileText className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEditClick(srv)}
                  className="p-1.8 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-md transition-colors"
                  title="Edit Layanan"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Apakah Anda yakin ingin menghapus katalog ${srv.serviceCode}?`)) {
                      onDeleteService(srv.id);
                    }
                  }}
                  className="p-1.8 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
                  title="Hapus Katalog"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ================= MODAL: NEW CATALOG ENTRY ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-100 shadow-xl overflow-hidden animate-fade-in my-8">
            <div className="bg-teal-700 text-white p-5">
              <h3 className="font-bold text-lg">Input Layanan Pengujian Baru</h3>
              <p className="text-xs text-teal-150">Tambahkan daftar parameter uji baru ke dalam etalase penjualan</p>
            </div>

            <form onSubmit={handleSubmitAdd} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kode Layanan</label>
                  <input
                    type="text"
                    value={formData.serviceCode}
                    onChange={(e) => setFormData({ ...formData, serviceCode: e.target.value.toUpperCase() })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                    placeholder="Contoh: CHEM-021"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kategori Analisis</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Kimia Anorganik">Kimia Anorganik</option>
                    <option value="Pangan & Nutrisi">Pangan & Nutrisi</option>
                    <option value="Lingkungan">Lingkungan</option>
                    <option value="Kimia Organik">Kimia Organik</option>
                    <option value="Agrokontrol">Agrokontrol</option>
                    <option value="Mikrobiologi">Mikrobiologi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Parameter Analisis</label>
                <input
                  type="text"
                  placeholder="Misal: Uji Kadar Formalin & Pengawet Buatan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Metode Standard Pengujian</label>
                <input
                  type="text"
                  placeholder="ICP-OES / AOAC / Standard SNI..."
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Turnaround Time (HARI)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="7"
                    value={formData.tatDays}
                    onChange={(e) => setFormData({ ...formData, tatDays: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    min="50000"
                    placeholder="1500000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Deskripsi & Spek Akreditasi</label>
                <textarea
                  placeholder="Alat instrumentasi GC-MS, jenis wadah pengiriman sampel..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs h-18"
                />
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
                  className="px-5 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs hover:bg-teal-700"
                >
                  Simpan Layanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT CATALOG ================= */}
      {editingService && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-100 shadow-xl overflow-hidden animate-fade-in my-8">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Edit Layanan {editingService.serviceCode}</h3>
                <p className="text-xs text-slate-300">Modifikasi harga dasar, jenis instrumen uji, dan akreditasi standardisasi</p>
              </div>
              <button onClick={() => setEditingService(null)} className="text-slate-300 hover:text-white text-xl font-bold cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Kategori Analisis</label>
                <select
                  value={editFormData.category || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Kimia Anorganik">Kimia Anorganik</option>
                  <option value="Pangan & Nutrisi">Pangan & Nutrisi</option>
                  <option value="Lingkungan">Lingkungan</option>
                  <option value="Kimia Organik">Kimia Organik</option>
                  <option value="Agrokontrol">Agrokontrol</option>
                  <option value="Mikrobiologi">Mikrobiologi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Parameter Analisis</label>
                <input
                  type="text"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Metode Standard Pengujian</label>
                <input
                  type="text"
                  value={editFormData.method || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, method: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Turnaround Time (HARI)</label>
                  <input
                    type="number"
                    min="1"
                    value={editFormData.tatDays || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, tatDays: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    min="1"
                    value={editFormData.price || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, price: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Deskripsi Detil Wadah & Alat</label>
                <textarea
                  value={editFormData.description || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs h-18"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-750 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DETAIL CATALOG VIEW ================= */}
      {viewingDetailService && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-100 shadow-xl animate-fade-in">
            <div className="bg-teal-900 text-white p-6">
              <span className="text-[9px] font-mono tracking-widest bg-teal-800 px-2 py-0.5 rounded-full uppercase">{viewingDetailService.category}</span>
              <h3 className="text-xl font-bold mt-2">{viewingDetailService.name}</h3>
              <p className="text-xs text-teal-200 mt-1">ID Kode: {viewingDetailService.serviceCode}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-xs space-y-3">
                <div>
                  <span className="text-slate-400 block font-semibold uppercase">Informasi Singkat</span>
                  <p className="text-slate-700 leading-relaxed mt-1 text-xs">{viewingDetailService.description || 'Tidak ada deskripsi spesifik.'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  <div>
                    <span className="text-slate-400">Metode Standar</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{viewingDetailService.method}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Turnaround Time</span>
                    <p className="font-semibold text-teal-700 mt-0.5">{viewingDetailService.tatDays} Hari Kerja</p>
                  </div>
                </div>

                <div className="bg-teal-50/20 p-3.5 rounded-xl border border-teal-500/10 grid grid-cols-2 gap-2 items-center">
                  <div>
                    <span className="text-[10px] text-teal-850 uppercase font-bold tracking-wider">Harga Dasar</span>
                    <p className="text-lg font-mono font-bold text-teal-900 mt-0.5">{formatIDR(viewingDetailService.price)}</p>
                  </div>
                  <div className="text-[10px] text-teal-700 font-medium">
                    * Berlaku kelipatan per kuantiti sampel di Ongoing Services. Included akreditasi komite KAN/ISO.
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setViewingDetailService(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-705 hover:bg-slate-200 bg-slate-150 rounded-lg transition-colors cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
