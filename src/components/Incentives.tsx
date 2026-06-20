import React, { useState } from 'react';
import { 
  BadgePercent, Trophy, CircleDollarSign, 
  HelpCircle, CheckCircle, TrendingUp, DollarSign,
  Briefcase, Search, AlertCircle, Sparkles
} from 'lucide-react';
import { Project, Client, Incentive } from '../types';

interface IncentivesProps {
  projects: Project[];
  clients: Client[];
  incentives: Incentive[];
  onDisburseIncentive: (id: string) => void;
}

export default function Incentives({ 
  projects, 
  clients, 
  incentives,
  onDisburseIncentive
}: IncentivesProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Currency formatter helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // --- AUTOMATIC CALCULATION & FILTER LOGIC ---
  // A project qualifies for incentive under these conditions (Rule):
  // 1. Client.isFirstTransaction is true (Customer Baru / First Transaction)
  // 2. Project.status is 'Completed' or 'Report Released'
  // 3. Project.paymentStatus is 'Paid' (Invoice = Paid)
  // Incentive size = 2.5% * Project.totalPrice
  
  // Let's dynamically find ALL projects in our database that potentially qualify but aren't in the incentive history,
  // or compile a dynamic list to show how the system detects them in real-time!
  
  // Let's build a roster of current qualified candidates from projects + clients state
  const qualifiedCandidateProjects = projects.filter(proj => {
    // Find the associated client
    const client = clients.find(c => c.id === proj.clientId);
    if (!client) return false;
    
    const isFirstTime = client.isFirstTransaction;
    const isFinished = proj.status === 'Completed' || proj.status === 'Report Released';
    const isPaid = proj.paymentStatus === 'Paid';

    return isFirstTime && isFinished && isPaid;
  });

  // Calculate dynamic incentive total from completed records
  const totalIncentivesValue = incentives.reduce((sum, inc) => sum + inc.incentiveValue, 0);
  
  // Upcoming pending validation incentives (First Transaction, Paid, but status is not Completed yet - e.g. In Progress)
  const pendingIncentivesValue = projects.filter(proj => {
    const client = clients.find(c => c.id === proj.clientId);
    if (!client) return false;
    
    const isFirstTime = client.isFirstTransaction;
    const isNotFinished = proj.status !== 'Completed' && proj.status !== 'Report Released';
    const isPaid = proj.paymentStatus === 'Paid';
    return isFirstTime && isNotFinished && isPaid;
  }).reduce((sum, p) => sum + (p.totalPrice * 0.025), 0);

  // Combine static seeder and dynamically derived ones for the visual audit trail list
  // Merging them with distinct keys
  const allHistoryRecords: Incentive[] = [...incentives];
  
  // Also append dynamic current ones that aren't already represented in incentives
  qualifiedCandidateProjects.forEach(proj => {
    if (!allHistoryRecords.some(r => r.projectId === proj.id)) {
      allHistoryRecords.push({
        id: `inc-auto-${proj.id}`,
        projectId: proj.id,
        clientName: proj.clientName,
        serviceName: proj.serviceName,
        salesName: proj.assignedSales,
        serviceValue: proj.totalPrice,
        incentiveValue: proj.totalPrice * 0.025,
        paymentStatus: 'Paid',
        isPaid: false,
        createdAt: new Date().toISOString()
      });
    }
  });

  const filteredHistory = allHistoryRecords.filter(h => 
    h.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.salesName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- SALES RANKING & PERFORMANCE MATRICES ---
  // Create mapping of Sales Performance
  // Budi Santoso, Siti Rahma, Andi Wijaya
  const salesRankingsMap: { [key: string]: { name: string, newClientsCount: number, totalIncentiveAmount: number } } = {
    'Budi Santoso': { name: 'Budi Santoso', newClientsCount: 0, totalIncentiveAmount: 0 },
    'Siti Rahma': { name: 'Siti Rahma', newClientsCount: 0, totalIncentiveAmount: 0 },
    'Andi Wijaya': { name: 'Andi Wijaya', newClientsCount: 0, totalIncentiveAmount: 0 },
  };

  // Compile new clients won count per sales
  clients.filter(c => c.status === 'Won').forEach(c => {
    const s = c.assignedSales || 'Lainnya';
    if (!salesRankingsMap[s]) {
      salesRankingsMap[s] = { name: s, newClientsCount: 0, totalIncentiveAmount: 0 };
    }
    salesRankingsMap[s].newClientsCount += 1;
  });

  // Compile bonus amounts won as per all compiled history records
  allHistoryRecords.forEach(rec => {
    const s = rec.salesName;
    if (!salesRankingsMap[s]) {
      salesRankingsMap[s] = { name: s, newClientsCount: 0, totalIncentiveAmount: 0 };
    }
    salesRankingsMap[s].totalIncentiveAmount += rec.incentiveValue;
  });

  // Sort by top incentive amount
  const salesRankings = Object.values(salesRankingsMap).sort((a, b) => b.totalIncentiveAmount - a.totalIncentiveAmount);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sales Incentives Engine</h2>
          <p className="text-sm text-slate-400 mt-1">Sistem penggajian komisi otomatis 2,5% untuk memacu tingkat perolehan pelanggan baru laboratorium.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-100">
          <Sparkles className="h-4.5 w-4.5 text-emerald-600 animate-spin" style={{ animationDuration: '4s' }} />
          Sistem Formula 2.5% Auto-Kalkulasi Aktif
        </div>
      </div>

      {/* THREE MAIN SCOREBARS FOR QUICK PERFORMANCE CHECKS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Monthly Incentive Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Insentif Terkumpul</span>
            <h3 className="text-2xl font-bold text-slate-900 font-mono">
              {formatIDR(totalIncentivesValue)}
            </h3>
            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Akumulasi disetujui cair
            </p>
          </div>
          <div className="bg-teal-50 text-teal-700 p-4 rounded-xl">
            <BadgePercent className="h-7 w-7" />
          </div>
        </div>

        {/* Dynamic Detected candidate projection */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Potential Proyeksi Komisi</span>
            <h3 className="text-2xl font-bold text-amber-900 font-mono">
              {formatIDR(pendingIncentivesValue)}
            </h3>
            <p className="text-[10px] text-slate-500">
              Uji berjalan, lunas, tapi status belum Completed
            </p>
          </div>
          <div className="bg-amber-50 text-amber-700 p-4 rounded-xl">
            <TrendingUp className="h-7 w-7" />
          </div>
        </div>

        {/* Sales ranking top dog */}
        <div className="bg-white p-5 rounded-2xl border border-teal-100 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-teal-50/5">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Top Performer Sales</span>
            <h3 className="text-lg font-bold text-slate-950 truncate max-w-[160px]">
              {salesRankings[0]?.name || 'N/A'}
            </h3>
            <p className="text-[10px] text-teal-700 font-semibold">
              Kompilasi insentif: {formatIDR(salesRankings[0]?.totalIncentiveAmount || 0)}
            </p>
          </div>
          <div className="bg-teal-600 text-white p-4 rounded-xl shadow-xs">
            <Trophy className="h-7 w-7" />
          </div>
        </div>

      </div>

      {/* RULE DETAILS CARD EXPLANATION */}
      <div className="bg-slate-50 p-5 rounded-xl border border-slate-150 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <HelpCircle className="h-5 w-5 text-teal-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 text-xs">Aturan Rumusan Insentif Laboratorium Kimia</h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Sales berhak mendapatkan insentif instan sebesar <b>2,5% dari Nilai Dasar Pengujian</b> apabila didaftarkan atas nama <b>Customer Baru (First Transaction = true)</b> dan status pengujian laboratorium telah selesai dikerjakan lab <i>(Status Completed atau Report Released)</i> serta tagihan invoice bernilai <b>"Paid" (Sudah lunas)</b>. Sesuai request user, edit status bayar/selesai bersifat terbuka kolaboratif!
            </p>
          </div>
        </div>
        
        {/* Math explanation snippet */}
        <div className="bg-white border border-slate-200/80 p-3.5 rounded-lg text-xs font-mono shrink-0 select-none">
          <span className="text-slate-400 text-[10px] block font-sans">CONTOH FORMULA MATEMATIS:</span>
          <b>Rp 20.000.000 (Harga Uji)</b><br/>
          <span className="text-slate-500">&times; 2,5% Komisi</span><br/>
          <span className="font-bold text-teal-700">= Rp 500.050 Insentif</span>
        </div>
      </div>

      {/* RANKINGS AND ACTIVE TRANSACTIONS LOGS LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Sales rankings dashboard list */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-4">Klasemen Posisi Tim Sales</h3>
            <div className="space-y-4">
              {salesRankings.map((sls, idx) => {
                return (
                  <div key={sls.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-150/60 text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        idx === 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{sls.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{sls.newClientsCount} Klien Won Baru</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-teal-900 block">{formatIDR(sls.totalIncentiveAmount)}</span>
                      <span className="text-[9px] text-teal-600 block font-semibold uppercase">Total Bonus</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t border-slate-100/60 text-[10px] text-slate-450 leading-relaxed text-center">
            * Peringkat di atas dinilai secara kumulatif berdasarkan total nasabah baru dan pembayaran lunas di CRM.
          </div>
        </div>

        {/* Incentives History Ledger table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Riwayat Komisi Terakreditasi</h3>
              <p className="text-xs text-slate-400">Draf komisi yang sah dicairkan berdasarkan kondisi filter</p>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari PT, parameter, sales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-semibold">
                <tr>
                  <th className="p-3">Customer & Sales</th>
                  <th className="p-3">Katalog Layanan</th>
                  <th className="p-3 text-right">Nilai Kontrak</th>
                  <th className="p-3 text-right">Bonus (2.5%)</th>
                  <th className="p-3 text-center">Disburse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                      <AlertCircle className="h-8 w-8 mx-auto text-slate-200 mb-2" />
                      Tidak ada catatan history insentif yang cocok dengan pencarian Anda.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((rec) => {
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/40">
                        {/* Co & Sales */}
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{rec.clientName}</div>
                          <div className="text-[10px] text-slate-450 mt-0.5">Sales: {rec.salesName}</div>
                        </td>
                        
                        {/* Service name */}
                        <td className="p-3 max-w-xs">
                          <div className="font-medium truncate" title={rec.serviceName}>{rec.serviceName}</div>
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">Project ID: {rec.projectId}</div>
                        </td>

                        {/* Contract price */}
                        <td className="p-3 text-right font-mono font-bold text-slate-650">
                          {formatIDR(rec.serviceValue)}
                        </td>

                        {/* Commission */}
                        <td className="p-3 text-right font-mono font-bold text-teal-850">
                          {formatIDR(rec.incentiveValue)}
                        </td>

                        {/* Is Disbursed to sales */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => onDisburseIncentive(rec.id)}
                            className={`px-2 py-1 text-[10px] rounded-md font-semibold border cursor-pointer ${
                              rec.isPaid 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/50'
                            }`}
                            title="Klik untuk mengubah konfirmasi pencairan tim keuangan"
                          >
                            {rec.isPaid ? 'Sudah Cair' : 'Cairkan'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
