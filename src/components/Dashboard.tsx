import React from 'react';
import { 
  AreaChart, Area, 
  BarChart, Bar, 
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  Users, RefreshCw, Milestone, 
  Coins, Wallet, TrendingUp, TrendingDown,
  Building2, Award, ClipboardCheck
} from 'lucide-react';
import { Client, Project, Service } from '../types';

interface DashboardProps {
  clients: Client[];
  projects: Project[];
  services: Service[];
}

export default function Dashboard({ clients, projects, services }: DashboardProps) {
  // --- STATS CALCULATIONS ---
  const totalClients = clients.length;
  
  // Active Customer defined as Won
  const activeClients = clients.filter(c => c.status === 'Won');
  const totalActive = activeClients.length;
  
  // New clients created this month (e.g. 2026-06)
  const currentMonth = '2026-06';
  const lastMonth = '2026-05';
  
  const newClientsThisMonth = clients.filter(c => c.createdAt.startsWith(currentMonth)).length;
  const newClientsLastMonth = clients.filter(c => c.createdAt.startsWith(lastMonth)).length;
  
  // Growth compare
  let clientGrowthPercent = 0;
  if (newClientsLastMonth > 0) {
    clientGrowthPercent = Math.round(((newClientsThisMonth - newClientsLastMonth) / newClientsLastMonth) * 100);
  } else if (newClientsThisMonth > 0) {
    clientGrowthPercent = 100; // infinite from 0
  }

  // Repeat Rate = (Jumlah Customer Repeat / Total Customer) * 100%
  // A repeat customer is a customer with isFirstTransaction === false
  const repeatCustomers = clients.filter(c => !c.isFirstTransaction && c.status === 'Won').length;
  const repeatRate = totalActive > 0 ? Math.round((repeatCustomers / totalActive) * 100) : 0;

  // Conversion Rate = (Won Opportunities / Total Opportunities) * 100%
  // Total opportunities are all clients in sales pipeline (Won, Lost, Negotiation, Proposal Sent, Contacted, Prospect)
  const totalLeads = clients.length;
  const wonLeads = clients.filter(c => c.status === 'Won').length;
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  // Unrealized Revenue = Total nilai quotation belum closing + potential revenues from prospects/negotiations
  // Let's sum up projects with unpaid status or status not completed, plus clients with potential revenue that aren't Won/Lost yet
  const openLeadsPotential = clients
    .filter(c => c.status !== 'Won' && c.status !== 'Lost')
    .reduce((sum, c) => sum + (c.potentialRevenue || 0), 0);
  
  const pendingProjectsRevenue = projects
    .filter(p => p.status !== 'Completed' && p.status !== 'Report Released')
    .reduce((sum, p) => sum + p.totalPrice, 0);

  const totalUnrealizedRevenue = openLeadsPotential + pendingProjectsRevenue;

  // Revenue
  // Current month revenue (completed or released services with paid or unpaid status, let's include completed service items)
  const currentMonthRevenue = projects
    .filter(p => (p.status === 'Completed' || p.status === 'Report Released'))
    .reduce((sum, p) => sum + p.totalPrice, 0);

  // Yearly estimation
  const totalRevenueYear = currentMonthRevenue + 45000000; // adding baseline mock past history

  // --- CRM & PIPELINE METRICS (USER REQUESTED) ---
  const totalContacts = clients.filter(c => c.picName).length;
  const totalCompanies = clients.length; // Each client registered represents a company / institution
  const openDeals = clients.filter(c => c.status !== 'Won' && c.status !== 'Lost').length;
  const pipelineValue = clients
    .filter(c => c.status !== 'Won' && c.status !== 'Lost')
    .reduce((sum, c) => sum + (c.potentialRevenue || 0), 0);
  const wonDealsCount = clients.filter(c => c.status === 'Won').length;
  const wonValueYtd = projects
    .filter(p => p.status === 'Completed' || p.status === 'Report Released')
    .reduce((sum, p) => sum + p.totalPrice, 0) + 45000000;

  // Format currency helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // --- CHART DATA PREPARATION ---

  // 1. Customer Growth Trend (Monthly chart)
  const customerGrowthData = [
    { month: 'Jan', Total: 2, Baru: 1 },
    { month: 'Feb', Total: 3, Baru: 1 },
    { month: 'Mar', Total: 3, Baru: 0 },
    { month: 'Apr', Total: 5, Baru: 2 },
    { month: 'May', Total: 8, Baru: 3 },
    { month: 'Jun', Total: totalClients, Baru: newClientsThisMonth },
  ];

  // 2. Revenue Trend
  const revenueTrendData = [
    { month: 'Jan', Revenue: 12000000, Target: 15000000 },
    { month: 'Feb', Revenue: 18500000, Target: 15000000 },
    { month: 'Mar', Revenue: 14000000, Target: 18000000 },
    { month: 'Apr', Revenue: 22000000, Target: 18000000 },
    { month: 'May', Revenue: 29000000, Target: 25000000 },
    { month: 'Jun', Revenue: currentMonthRevenue, Target: 30000000 },
  ];

  // 3. Service Category Distribution
  // Count projects or services grouped by category
  const categoryCounts: { [key: string]: number } = {};
  projects.forEach(p => {
    categoryCounts[p.serviceCategory] = (categoryCounts[p.serviceCategory] || 0) + 1;
  });
  
  // if empty, add default visual
  if (Object.keys(categoryCounts).length === 0) {
    categoryCounts['Kimia Anorganik'] = 2;
    categoryCounts['Pangan & Nutrisi'] = 1;
    categoryCounts['Lingkungan'] = 1;
  }

  const COLORS = ['#0f766e', '#0284c7', '#4f46e5', '#f59e0b', '#ec4899', '#8b5cf6'];
  const categoryData = Object.keys(categoryCounts).map(cat => ({
    name: cat,
    value: categoryCounts[cat]
  }));

  // 4. Top Customers (Group project prices by client name)
  const clientRevenues: { [key: string]: number } = {};
  projects.forEach(p => {
    clientRevenues[p.clientName] = (clientRevenues[p.clientName] || 0) + p.totalPrice;
  });
  
  // ensure lead records with potential revenue also have space
  clients.filter(c => c.status === 'Won').forEach(c => {
    if (!clientRevenues[c.companyName]) {
      clientRevenues[c.companyName] = c.potentialRevenue * 0.5 || 5000000;
    }
  });

  const topCustomersData = Object.keys(clientRevenues)
    .map(name => ({ name, Revenue: clientRevenues[name] }))
    .sort((a, b) => b.Revenue - a.Revenue)
    .slice(0, 5);

  // 5. Sales Performance (grouped by sales agent)
  // Sales agents: Budi Santoso, Siti Rahma, Andi Wijaya
  const salesPerformanceMap: { [key: string]: { newClients: number, totalContract: number, wonCount: number, totalLeads: number } } = {
    'Budi Santoso': { newClients: 2, totalContract: 13500000, wonCount: 2, totalLeads: 3 },
    'Siti Rahma': { newClients: 3, totalContract: 23400000, wonCount: 2, totalLeads: 4 },
    'Andi Wijaya': { newClients: 1, totalContract: 0, wonCount: 0, totalLeads: 2 },
  };

  // Dynamically aggregate from live data state
  clients.forEach(c => {
    const s = c.assignedSales || 'Lainnya';
    if (!salesPerformanceMap[s]) {
      salesPerformanceMap[s] = { newClients: 0, totalContract: 0, wonCount: 0, totalLeads: 0 };
    }
    salesPerformanceMap[s].totalLeads += 1;
    if (c.status === 'Won') {
      salesPerformanceMap[s].wonCount += 1;
    }
    if (c.createdAt.startsWith(currentMonth)) {
      salesPerformanceMap[s].newClients += 1;
    }
  });

  projects.forEach(p => {
    const s = p.assignedSales || 'Lainnya';
    if (!salesPerformanceMap[s]) {
      salesPerformanceMap[s] = { newClients: 0, totalContract: 0, wonCount: 0, totalLeads: 0 };
    }
    salesPerformanceMap[s].totalContract += p.totalPrice;
  });

  const salesPerformanceData = Object.keys(salesPerformanceMap).map(agent => {
    const data = salesPerformanceMap[agent];
    const rate = data.totalLeads > 0 ? Math.round((data.wonCount / data.totalLeads) * 100) : 0;
    return {
      name: agent,
      'Pelanggan Baru': data.newClients,
      'Nilai Kontrak': data.totalContract,
      'Conversion Rate (%)': rate
    };
  });

  // 6. Service Status Summary
  const statusCounts = {
    'New Request': 0,
    'Accepted': 0,
    'Sample Received': 0,
    'In Progress': 0,
    'Review': 0,
    'Completed': 0,
    'Report Released': 0
  };
  
  projects.forEach(p => {
    if (p.status in statusCounts) {
      statusCounts[p.status as keyof typeof statusCounts] += 1;
    }
  });

  const serviceStatusData = Object.keys(statusCounts).map(status => ({
    name: status,
    Jumlah: statusCounts[status as keyof typeof statusCounts]
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Lab Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time business trends, testing progress metrics, and sales incentives metrics.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-100 self-start md:self-center">
          <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
          LAB WORKSPACE SECURE & OPEN ACCESS
        </div>
      </div>

      {/* CRM & SALES PIPELINE METRICS PANEL (USER REQUESTED) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
            CRM &amp; Sales Pipeline Summary
          </h2>
          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">YTD Penjualan</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Contacts */}
          <div id="crm-total-contacts" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-250">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Contacts</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Users className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-1">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalContacts}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Narahubung PIC aktif lab</p>
            </div>
          </div>

          {/* Total Companies */}
          <div id="crm-total-companies" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-250">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Companies</span>
              <div className="p-2 bg-slate-50 text-slate-600 rounded-xl">
                <Building2 className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-1">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalCompanies}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Perusahaan/PT terdaftar</p>
            </div>
          </div>

          {/* Open Deals */}
          <div id="crm-open-deals" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-250">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Open Deals</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <ClipboardCheck className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-1">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{openDeals}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Prospek &amp; Negosiasi aktif</p>
            </div>
          </div>

          {/* Pipeline Value */}
          <div id="crm-pipeline-value" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-250">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pipeline Value</span>
              <div className="p-2 bg-rose-50/60 text-rose-600 rounded-xl">
                <Wallet className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-1">
              <h3 className="text-lg font-bold text-slate-900 truncate tracking-tight">{formatIDR(pipelineValue)}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Nilai estimasi negosiasi</p>
            </div>
          </div>

          {/* Won YTD */}
          <div id="crm-won-ytd" className="bg-white p-5 rounded-2xl border border-teal-500/20 shadow-xs hover:shadow-md transition-all duration-250 bg-gradient-to-br from-white to-teal-50/10">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">Won (YTD)</span>
              <div className="p-2 bg-teal-600 text-white rounded-xl shadow-xs">
                <Coins className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-1">
              <h3 className="text-lg font-bold text-teal-900 truncate tracking-tight">{formatIDR(wonValueYtd)}</h3>
              <p className="text-[10px] text-teal-600 font-medium mt-1">Success: {wonDealsCount} Closing</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100/50 pt-1"></div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Customer Growth */}
        <div id="kpi-customer-growth" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Growth</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-slate-900">{totalActive} <span className="text-xs font-medium text-slate-400">Aktif</span></h3>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
              {clientGrowthPercent >= 0 ? (
                <span className="text-emerald-600 font-semibold flex items-center">
                  <TrendingUp className="h-3 w-3 mr-0.5" /> +{clientGrowthPercent}%
                </span>
              ) : (
                <span className="text-rose-600 font-semibold flex items-center">
                  <TrendingDown className="h-3 w-3 mr-0.5" /> {clientGrowthPercent}%
                </span>
              )}
              vs bulan lalu (+{newClientsThisMonth} baru)
            </p>
          </div>
        </div>

        {/* KPI 2: Repeat Rate */}
        <div id="kpi-repeat-rate" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Repeat Rate</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <RefreshCw className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-slate-900">{repeatRate}%</h3>
            <p className="text-xs text-slate-500 mt-2">
              <span className="font-semibold text-slate-700">{repeatCustomers} dari {totalActive}</span> customer adalah konsumen loyal (repeat order)
            </p>
          </div>
        </div>

        {/* KPI 3: Conversion Rate */}
        <div id="kpi-conversion-rate" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conversion Rate</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Milestone className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-slate-900">{conversionRate}%</h3>
            <p className="text-xs text-slate-500 mt-2">
              <span className="font-semibold text-slate-700">{wonLeads} won</span> dari {totalLeads} total records kesepakatan sales
            </p>
          </div>
        </div>

        {/* KPI 4: Unrealized Revenue */}
        <div id="kpi-unrealized-revenue" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow col-span-1">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unrealized Revenue</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-bold text-slate-900 truncate">{formatIDR(totalUnrealizedRevenue)}</h3>
            <p className="text-xs text-slate-500 mt-2">
              Peluang negosiasi & progres lab berjalan yang belum tertagih
            </p>
          </div>
        </div>

        {/* KPI 5: Revenue */}
        <div id="kpi-revenue" className="bg-white p-5 rounded-2xl border border-teal-500/20 shadow-xs hover:shadow-md transition-shadow bg-gradient-to-br from-white to-teal-50/10">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider">Revenue Bulan Ini</span>
            <div className="p-2 bg-teal-600 text-white rounded-xl shadow-xs">
              <Coins className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-bold text-teal-900 truncate">{formatIDR(currentMonthRevenue)}</h3>
            <p className="text-xs text-slate-500 mt-2">
              Est. Tahunan: <span className="font-semibold text-slate-700">{formatIDR(totalRevenueYear)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* CHART GRID SECTION 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Revenue and Target Trend Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900">Revenue & Target Monthly Trend</h3>
              <p className="text-xs text-slate-400">Membandingkan realisasi billing lab selesai dengan target target penjualan bulanan</p>
            </div>
            <div className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md font-semibold">
              Realisasi Rp 13.5M
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `Rp ${val / 1000000}jt`} />
                <Tooltip 
                  formatter={(value: any) => [formatIDR(value), "Nilai"]}
                  contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
                <Legend iconSize={10} verticalAlign="top" height={36} />
                <Area type="monotone" dataKey="Revenue" stroke="#0f766e" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Billing Realisasi" />
                <Line type="monotone" dataKey="Target" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Target Sales" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Category Selection Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Service Category Distribution</h3>
            <p className="text-xs text-slate-400 mb-6 font-sans">Kategori pengujian terbesar berdasarkan volume sampel</p>
          </div>
          <div className="h-48 flex justify-center items-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center pointer-events-none">
              <span className="text-3xl font-bold text-slate-800">{projects.length}</span>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Layanan Total</p>
            </div>
          </div>
          <div className="space-y-1.5 mt-4">
            {categoryData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span className="text-slate-600 font-medium truncate max-w-[140px]">{item.name}</span>
                </div>
                <span className="text-slate-900 font-semibold font-mono">{item.value} order</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CHART GRID SECTION 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Customer growth line chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-6">
          <h3 className="font-bold text-slate-900 mb-1">Customer Acquisition Growth Trend</h3>
          <p className="text-xs text-slate-400 mb-6">Pertumbuhan database perusahaan mendaftar & customer mendaftar per bulan</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerGrowthData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }} />
                <Legend iconSize={10} verticalAlign="top" height={36} />
                <Bar dataKey="Total" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Total Pelanggan" />
                <Bar dataKey="Baru" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Perolehan Baru" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service status summary */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-6">
          <h3 className="font-bold text-slate-900 mb-1">Laboratory Testing Pipeline Summary</h3>
          <p className="text-xs text-slate-400 mb-6 font-sans">Distribusi load antrean sampel pengujian yang sedang berjalan di lab</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceStatusData} layout="vertical" margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }} />
                <Bar dataKey="Jumlah" fill="#0f766e" radius={[0, 4, 4, 0]} name="Beban Pekerjaan" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TOP CLIENTS AND SALES PERFORMANCE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top 5 Customers List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900">Top 5 Pelanggan Terbesar</h3>
              <p className="text-xs text-slate-400">Kontribusi nilai transaksi tertinggi dalam portofolio laboratorium</p>
            </div>
            <Building2 className="text-slate-400 h-5 w-5" />
          </div>
          <div className="divide-y divide-slate-100 space-y-4">
            {topCustomersData.map((cust, i) => (
              <div key={cust.name} className="flex items-center justify-between pt-4 first:pt-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">{cust.name}</h4>
                    <p className="text-xs text-slate-400">Peringkat loyalitas ke-{i + 1}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm font-bold text-teal-800">{formatIDR(cust.Revenue)}</span>
                  <p className="text-[10px] text-emerald-600 font-semibold font-sans">Premium Client</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales performance table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900">Performa Sales Karyawan</h3>
              <p className="text-xs text-slate-400">Metrik kepemilikan lead, perolehan klien baru, dan volume kontrak</p>
            </div>
            <Award className="text-slate-400 h-5 w-5" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3 rounded-l-md">Nama Sales</th>
                  <th className="p-3 text-center">Nasabah Baru</th>
                  <th className="p-3 text-right">Nilai Kontrak</th>
                  <th className="p-3 text-right rounded-r-md">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {salesPerformanceData.map((item) => (
                  <tr key={item.name} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="p-3 text-center text-slate-600 font-mono">{item['Pelanggan Baru']}</td>
                    <td className="p-3 text-right font-mono text-slate-900 font-semibold">{formatIDR(item['Nilai Kontrak'])}</td>
                    <td className="p-3 text-right font-mono">
                      <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                        {item['Conversion Rate (%)']}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
