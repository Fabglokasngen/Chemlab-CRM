import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  Trash2,
  Tag,
  ArrowUpRight,
  X
} from 'lucide-react';
import { useSalesData } from '../context/SalesDataContext';
import { SalesJournalEntry, JournalEventType, ObjectionType } from '../types';

interface SalesJournalProps {
  initialClient?: string;
  initialPic?: string;
}

export const SalesJournal: React.FC<SalesJournalProps> = ({ initialClient, initialPic }) => {
  const { journals, addJournalEntry, updateJournalEntry, deleteJournalEntry, clients } = useSalesData();

  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SalesJournalEntry | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    company: initialClient || '',
    contactPerson: initialPic || '',
    eventType: 'Meeting Klien' as JournalEventType,
    discussionNotes: '',
    hasObjection: false,
    objectionCategory: 'Harga / Budget Terbatas' as ObjectionType,
    clientObjection: '',
    strategyAction: '',
    nextCommitment: '',
    commitmentDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    status: 'In Progress' as const,
    priority: 'Normal' as const,
    salesPerson: 'Sales Executive',
  });

  // Pre-fill if props provided
  React.useEffect(() => {
    if (initialClient) {
      setFormData(prev => ({
        ...prev,
        company: initialClient,
        contactPerson: initialPic || prev.contactPerson
      }));
      setIsModalOpen(true);
    }
  }, [initialClient, initialPic]);

  const filteredJournals = useMemo(() => {
    return journals.filter(j => {
      if (eventTypeFilter !== 'all' && j.eventType !== eventTypeFilter) return false;
      if (statusFilter !== 'all' && j.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          j.company.toLowerCase().includes(q) ||
          j.contactPerson.toLowerCase().includes(q) ||
          j.discussionNotes.toLowerCase().includes(q) ||
          (j.clientObjection && j.clientObjection.toLowerCase().includes(q)) ||
          j.strategyAction.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [journals, eventTypeFilter, statusFilter, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company || !formData.discussionNotes) return;

    if (editingEntry) {
      await updateJournalEntry({
        ...editingEntry,
        ...formData,
      });
      setEditingEntry(null);
    } else {
      await addJournalEntry(formData);
    }

    setIsModalOpen(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      company: '',
      contactPerson: '',
      eventType: 'Meeting Klien',
      discussionNotes: '',
      hasObjection: false,
      objectionCategory: 'Harga / Budget Terbatas',
      clientObjection: '',
      strategyAction: '',
      nextCommitment: '',
      commitmentDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'In Progress',
      priority: 'Normal',
      salesPerson: 'Sales Executive',
    });
  };

  const handleEditClick = (entry: SalesJournalEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      company: entry.company,
      contactPerson: entry.contactPerson,
      eventType: entry.eventType,
      discussionNotes: entry.discussionNotes,
      hasObjection: entry.hasObjection,
      objectionCategory: entry.objectionCategory || 'Harga / Budget Terbatas',
      clientObjection: entry.clientObjection || '',
      strategyAction: entry.strategyAction,
      nextCommitment: entry.nextCommitment,
      commitmentDate: entry.commitmentDate,
      status: entry.status,
      priority: entry.priority,
      salesPerson: entry.salesPerson,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Sales Field Log & Objections</span>
            <span>·</span>
            <span>{filteredJournals.length} Entri Jurnal</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Jurnal Penjualan & Riwayat Interaksi Klien
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Catat setiap negosiasi harga, objection klien (TAT/biaya/metode), diskusi teknis pengujian analitikal, dan komitmen aksi berikutnya yang terhubung langsung ke akun klien.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingEntry(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Catatan Jurnal Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari isi catatan, perusahaan, komitmen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-medium"
            >
              <option value="all">Jenis Interaksi: Semua</option>
              <option value="Meeting Klien">Meeting Klien</option>
              <option value="Negosiasi Harga">Negosiasi Harga</option>
              <option value="Diskusi Teknis">Diskusi Teknis</option>
              <option value="Follow-up Penawaran">Follow-up Penawaran</option>
              <option value="Objection / Kendala">Objection / Kendala</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-medium"
            >
              <option value="all">Status Tindak Lanjut: Semua</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved / Selesai</option>
              <option value="Open">Open</option>
            </select>
          </div>
        </div>
      </div>

      {/* Journal Entries Timeline */}
      <div className="space-y-4">
        {filteredJournals.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 text-xs">
            Belum ada catatan jurnal yang sesuai dengan filter pencarian.
          </div>
        ) : (
          filteredJournals.map(entry => (
            <div 
              key={entry.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                    {entry.eventType}
                  </span>
                  <span className="text-sm font-bold text-slate-900">{entry.company}</span>
                  {entry.contactPerson && (
                    <span className="text-xs text-slate-500 font-medium">· PIC: {entry.contactPerson}</span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                  <span>{entry.date}</span>
                  <span className={`px-2 py-0.5 rounded font-sans font-bold text-[10px] ${
                    entry.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {entry.status}
                  </span>
                </div>
              </div>

              {/* Discussion prose */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                  Inti Diskusi & Konteks Lapangan
                </span>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {entry.discussionNotes}
                </p>
              </div>

              {/* Objection Box if applicable */}
              {entry.hasObjection && entry.clientObjection && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Objection Klien ({entry.objectionCategory || 'Kendala'}):</span>
                  </div>
                  <p className="text-amber-900 italic">
                    "{entry.clientObjection}"
                  </p>
                </div>
              )}

              {/* Strategy & Next Commitment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                {entry.strategyAction && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-700 block mb-0.5">Strategi Sales:</span>
                    <p className="text-slate-600">{entry.strategyAction}</p>
                  </div>
                )}
                {entry.nextCommitment && (
                  <div className="p-3 bg-sky-50 rounded-lg border border-sky-100">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-sky-900">Komitmen Tindak Lanjut:</span>
                      <span className="text-[11px] font-mono text-sky-700">Due: {entry.commitmentDate}</span>
                    </div>
                    <p className="text-sky-800 font-medium">{entry.nextCommitment}</p>
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">Dicatat oleh {entry.salesPerson}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditClick(entry)}
                    className="p-1 text-slate-500 hover:text-slate-900 rounded"
                    title="Edit entri jurnal"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Hapus catatan jurnal ini?')) {
                        deleteJournalEntry(entry.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                    title="Hapus catatan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Journal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingEntry ? 'Edit Catatan Jurnal' : 'Tambah Catatan Jurnal Baru'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Interaksi</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Interaksi</label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Meeting Klien">Meeting Klien</option>
                    <option value="Negosiasi Harga">Negosiasi Harga</option>
                    <option value="Diskusi Teknis">Diskusi Teknis</option>
                    <option value="Follow-up Penawaran">Follow-up Penawaran</option>
                    <option value="Objection / Kendala">Objection / Kendala</option>
                    <option value="Kunjungan Lapangan">Kunjungan Lapangan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Perusahaan / Akun</label>
                  <input
                    type="text"
                    placeholder="e.g. PT GEOSERVICES / PT Combiphar"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kontak PIC</label>
                  <input
                    type="text"
                    placeholder="Nama PIC klien"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ringkasan Diskusi & Poin Pertemuan</label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan jalannya diskusi, parameter pengujian yang dibutuhkan, atau progress sampel..."
                  value={formData.discussionNotes}
                  onChange={(e) => setFormData({ ...formData, discussionNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              {/* Objection Checkbox */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.hasObjection}
                    onChange={(e) => setFormData({ ...formData, hasObjection: e.target.checked })}
                    className="rounded"
                  />
                  <span>Ada Objection / Kendala dari Klien?</span>
                </label>

                {formData.hasObjection && (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Kategori Kendala</label>
                      <select
                        value={formData.objectionCategory}
                        onChange={(e) => setFormData({ ...formData, objectionCategory: e.target.value as any })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                      >
                        <option value="Harga / Budget Terbatas">Harga / Budget Terbatas</option>
                        <option value="Turnaround Time (TAT) Terlalu Lama">Turnaround Time (TAT) Terlalu Lama</option>
                        <option value="Metode / Akreditasi Tertentu">Metode / Akreditasi Tertentu</option>
                        <option value="Kompetitor Menawarkan Diskon">Kompetitor Menawarkan Diskon</option>
                        <option value="Administrasi / PO Belum Terbit">Administrasi / PO Belum Terbit</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Detail Objection Klien</label>
                      <input
                        type="text"
                        placeholder="e.g. Klien minta diskon volume 10% untuk 10 sampel IRMS..."
                        value={formData.clientObjection}
                        onChange={(e) => setFormData({ ...formData, clientObjection: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Strategi Respon & Solusi Sales</label>
                <input
                  type="text"
                  placeholder="e.g. Berikan free express turnaround time sebagai pengganti diskon unit..."
                  value={formData.strategyAction}
                  onChange={(e) => setFormData({ ...formData, strategyAction: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Komitmen Tindak Lanjut</label>
                  <input
                    type="text"
                    placeholder="e.g. Kirimkan draft penawaran resmi..."
                    value={formData.nextCommitment}
                    onChange={(e) => setFormData({ ...formData, nextCommitment: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tenggat Waktu (Due Date)</label>
                  <input
                    type="date"
                    value={formData.commitmentDate}
                    onChange={(e) => setFormData({ ...formData, commitmentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Tindak Lanjut</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved / Selesai</option>
                    <option value="Open">Open</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prioritas</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">Tinggi (High)</option>
                    <option value="Urgent">Mendesak (Urgent)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-semibold"
                >
                  {editingEntry ? 'Simpan Perubahan Jurnal' : 'Simpan ke Jurnal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
