import React from 'react';
import { 
  AreaChart, Area, LineChart, Line, ComposedChart,
  BarChart, Bar, 
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  Users, RefreshCw, Milestone, 
  Coins, Wallet, TrendingUp, TrendingDown,
  Building2, Award, ClipboardCheck, FileText, Download, Clock, Activity, FlaskConical
} from 'lucide-react';
import { Client, Project, Service } from '../types';
import { generateDashboardPDFReport } from '../utils/pdfGenerator';

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
    clientGrowthPercent = 100;
  }

  // Repeat Rate = (Repeat Customers / Total Active Customers) * 100%
  const repeatCustomers = clients.filter(c => !c.isFirstTransaction && c.status === 'Won').length;
  const repeatRate = totalActive > 0 ? Math.round((repeatCustomers / totalActive) * 100) : 0;

  // Conversion Rate = (Won Opportunities / Total Opportunities) * 100%
  const totalLeads = clients.length;
  const wonLeads = clients.filter(c => c.status === 'Won').length;
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  // Unrealized Revenue = Total valuation of open negotiations + unbilled active lab progress
  const openLeadsPotential = clients
    .filter(c => c.status !== 'Won' && c.status !== 'Lost')
    .reduce((sum, c) => sum + (c.potentialRevenue || 0), 0);
  
  const pendingProjectsRevenue = projects
    .filter(p => p.status !== 'Completed' && p.status !== 'Report Released')
    .reduce((sum, p) => sum + p.totalPrice, 0);

  const totalUnrealizedRevenue = openLeadsPotential + pendingProjectsRevenue;

  // Revenue
  const currentMonthRevenue = projects
    .filter(p => (p.status === 'Completed' || p.status === 'Report Released'))
    .reduce((sum, p) => sum + p.totalPrice, 0);

  const totalRevenueYear = currentMonthRevenue + 45000000;

  // --- CRM & PIPELINE METRICS ---
  const totalContacts = clients.filter(c => c.picName).length;
  const totalCompanies = clients.length;
  const openDeals = clients.filter(c => c.status !== 'Won' && c.status !== 'Lost').length;
  const pipelineValue = clients
    .filter(c => c.status !== 'Won' && c.status !== 'Lost')
    .reduce((sum, c) => sum + (c.potentialRevenue || 0), 0);
  const wonDealsCount = clients.filter(c => c.status === 'Won').length;
  const wonValueYtd = projects
    .filter(p => p.status === 'Completed' || p.status === 'Report Released')
    .reduce((sum, p) => sum + p.totalPrice, 0) + 45000000;

  // Format currency helper (IDR)
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // --- CHART DATA PREPARATION ---

  // 1. Customer Growth Trend (Monthly chart)
  const customerGrowthData = [
    { month: 'Jan', Total: 2, New: 1 },
    { month: 'Feb', Total: 3, New: 1 },
    { month: 'Mar', Total: 3, New: 0 },
    { month: 'Apr', Total: 5, New: 2 },
    { month: 'May', Total: 8, New: 3 },
    { month: 'Jun', Total: totalClients, New: newClientsThisMonth },
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
  const categoryCounts: { [key: string]: number } = {};
  projects.forEach(p => {
    categoryCounts[p.serviceCategory] = (categoryCounts[p.serviceCategory] || 0) + 1;
  });
  
  if (Object.keys(categoryCounts).length === 0) {
    categoryCounts['Inorganic Chemistry'] = 2;
    categoryCounts['Food & Nutrition'] = 1;
    categoryCounts['Environment'] = 1;
  }

  const COLORS = ['#0f766e', '#0284c7', '#4f46e5', '#f59e0b', '#ec4899', '#8b5cf6'];
  const categoryData = Object.keys(categoryCounts).map(cat => ({
    name: cat,
    value: categoryCounts[cat]
  }));

  // 4. Top Customers
  const clientRevenues: { [key: string]: number } = {};
  projects.forEach(p => {
    clientRevenues[p.clientName] = (clientRevenues[p.clientName] || 0) + p.totalPrice;
  });
  
  clients.filter(c => c.status === 'Won').forEach(c => {
    if (!clientRevenues[c.companyName]) {
      clientRevenues[c.companyName] = c.potentialRevenue * 0.5 || 5000000;
    }
  });

  const topCustomersData = Object.keys(clientRevenues)
    .map(name => ({ name, Revenue: clientRevenues[name] }))
    .sort((a, b) => b.Revenue - a.Revenue)
    .slice(0, 5);

  // 5. TESTING SERVICES DEMAND & TURNAROUND PERFORMANCE (Replaced Sales Employee Performance)
  const serviceDemandMap: { 
    [key: string]: { 
      code: string;
      name: string; 
      category: string; 
      activeSamples: number; 
      tatDays: number; 
      totalRevenue: number;
      completedCount: number;
    } 
  } = {};

  // Populate from available services
  services.forEach(s => {
    serviceDemandMap[s.id] = {
      code: s.serviceCode,
      name: s.name,
      category: s.category,
      activeSamples: 0,
      tatDays: s.tatDays,
      totalRevenue: 0,
      completedCount: 0
    };
  });

  // Aggregate stats from active projects
  projects.forEach(p => {
    if (!serviceDemandMap[p.serviceId]) {
      serviceDemandMap[p.serviceId] = {
        code: 'SERV-GEN',
        name: p.serviceName,
        category: p.serviceCategory,
        activeSamples: 0,
        tatDays: 7,
        totalRevenue: 0,
        completedCount: 0
      };
    }
    serviceDemandMap[p.serviceId].activeSamples += p.sampleQuantity;
    serviceDemandMap[p.serviceId].totalRevenue += p.totalPrice;
    if (p.status === 'Completed' || p.status === 'Report Released') {
      serviceDemandMap[p.serviceId].completedCount += 1;
    }
  });

  const testingServicesPerformanceData = Object.values(serviceDemandMap)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

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
    Count: statusCounts[status as keyof typeof statusCounts]
  }));

  // PDF Export Handler for Dashboard KPI
  const handleDownloadPDF = () => {
    generateDashboardPDFReport({
      totalContacts,
      totalCompanies,
      openDeals,
      pipelineValue,
      wonValueYtd,
      wonDealsCount,
      totalActive,
      clientGrowthPercent,
      newClientsThisMonth,
      repeatRate,
      conversionRate,
      totalUnrealizedRevenue,
      currentMonthRevenue,
      totalRevenueYear,
      topCustomersData,
      categoryData,
      testingServicesData: testingServicesPerformanceData
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Lab Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time laboratory testing analytics, pipeline metrics, and turnaround performance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          <button
            id="btn-download-dashboard-pdf"
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <FileText className="h-4 w-4 text-teal-200" />
            <span>Download PDF KPI</span>
          </button>
          <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 text-slate-600 px-3 py-2 rounded-xl border border-slate-100">
            <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
            LAB WORKSPACE SECURE
          </div>
        </div>
      </div>

      {/* CRM & SALES PIPELINE METRICS PANEL */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
            CRM &amp; Pipeline Overview
          </h2>
          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">YTD Business</span>
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
              <p className="text-[10px] text-slate-400 mt-1">Active lab client PIC contacts</p>
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
              <p className="text-[10px] text-slate-400 mt-1">Registered enterprise accounts</p>
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
              <p className="text-[10px] text-slate-400 mt-1">Active prospects &amp; proposals</p>
            </div>
          </div>

          {/* Pipeline Value */}
          <div id="crm-pipeline-value" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-250">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pipeline Valuation</span>
              <div className="p-2 bg-rose-50/60 text-rose-600 rounded-xl">
                <Wallet className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-1">
              <h3 className="text-lg font-bold text-slate-900 truncate tracking-tight">{formatIDR(pipelineValue)}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Active negotiation estimates</p>
            </div>
          </div>

          {/* Won YTD */}
          <div id="crm-won-ytd" className="bg-white p-5 rounded-2xl border border-teal-500/20 shadow-xs hover:shadow-md transition-all duration-250 bg-gradient-to-br from-white to-teal-50/10">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">Won Deals (YTD)</span>
              <div className="p-2 bg-teal-600 text-white rounded-xl shadow-xs">
                <Coins className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-1">
              <h3 className="text-lg font-bold text-teal-900 truncate tracking-tight">{formatIDR(wonValueYtd)}</h3>
              <p className="text-[10px] text-teal-600 font-medium mt-1">Closed Deals: {wonDealsCount}</p>
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
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Client Growth</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-slate-900">{totalActive} <span className="text-xs font-medium text-slate-400">Active</span></h3>
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
              vs last month (+{newClientsThisMonth} new)
            </p>
          </div>
        </div>

        {/* KPI 2: Repeat Rate */}
        <div id="kpi-repeat-rate" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Repeat Client Rate</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <RefreshCw className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-slate-900">{repeatRate}%</h3>
            <p className="text-xs text-slate-500 mt-2">
              <span className="font-semibold text-slate-700">{repeatCustomers} of {totalActive}</span> clients placed repeat orders
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
              <span className="font-semibold text-slate-700">{wonLeads} won</span> out of {totalLeads} total lead entries
            </p>
          </div>
        </div>

        {/* KPI 4: Unrealized Revenue */}
        <div id="kpi-unrealized-revenue" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow col-span-1">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unrealized Pipeline</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-bold text-slate-900 truncate">{formatIDR(totalUnrealizedRevenue)}</h3>
            <p className="text-xs text-slate-500 mt-2">
              Pending proposals &amp; ongoing testing billing
            </p>
          </div>
        </div>

        {/* KPI 5: Revenue */}
        <div id="kpi-revenue" className="bg-white p-5 rounded-2xl border border-teal-500/20 shadow-xs hover:shadow-md transition-shadow bg-gradient-to-br from-white to-teal-50/10">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider">Monthly Revenue</span>
            <div className="p-2 bg-teal-600 text-white rounded-xl shadow-xs">
              <Coins className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-bold text-teal-900 truncate">{formatIDR(currentMonthRevenue)}</h3>
            <p className="text-xs text-slate-500 mt-2">
              Annual Est.: <span className="font-semibold text-slate-700">{formatIDR(totalRevenueYear)}</span>
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
              <h3 className="font-bold text-slate-900">Revenue &amp; Target Monthly Trend</h3>
              <p className="text-xs text-slate-400">Comparing realized completed lab billing against monthly target projections</p>
            </div>
            <div className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-semibold">
              Realized: {formatIDR(currentMonthRevenue)}
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `${val / 1000000}M`} />
                <Tooltip 
                  formatter={(value: any) => [formatIDR(value), "Amount"]}
                  contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
                <Legend iconSize={10} verticalAlign="top" height={36} />
                <Area type="monotone" dataKey="Revenue" stroke="#0f766e" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Realized Billing" />
                <Line type="monotone" dataKey="Target" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Revenue Target" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Category Selection Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Service Category Distribution</h3>
            <p className="text-xs text-slate-400 mb-6 font-sans">Testing categories share by sample order volume</p>
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
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Total Projects</p>
            </div>
          </div>
          <div className="space-y-1.5 mt-4">
            {categoryData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span className="text-slate-600 font-medium truncate max-w-[140px]">{item.name}</span>
                </div>
                <span className="text-slate-900 font-semibold font-mono">{item.value} orders</span>
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
          <p className="text-xs text-slate-400 mb-6">Monthly growth of registered enterprise accounts &amp; new client conversions</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerGrowthData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }} />
                <Legend iconSize={10} verticalAlign="top" height={36} />
                <Bar dataKey="Total" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Total Clients" />
                <Bar dataKey="New" fill="#06b6d4" radius={[4, 4, 0, 0]} name="New Acquisitions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service status summary */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-6">
          <h3 className="font-bold text-slate-900 mb-1">Laboratory Testing Pipeline Stages</h3>
          <p className="text-xs text-slate-400 mb-6 font-sans">Active sample workload distribution across analysis lifecycle stages</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceStatusData} layout="vertical" margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }} />
                <Bar dataKey="Count" fill="#0f766e" radius={[0, 4, 4, 0]} name="Sample Workload" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TOP CLIENTS AND TESTING SERVICES PERFORMANCE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top 5 Customers List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900">Top 5 Enterprise Clients</h3>
              <p className="text-xs text-slate-400">Highest transaction value contributions in laboratory portfolio</p>
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
                    <p className="text-xs text-slate-400">Tier {i + 1} Account</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm font-bold text-teal-800">{formatIDR(cust.Revenue)}</span>
                  <p className="text-[10px] text-emerald-600 font-semibold font-sans">Key Client</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TESTING SERVICES DEMAND & TURNAROUND PERFORMANCE (Replaced Sales Employees Table) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900">Testing Services Demand &amp; Turnaround</h3>
              <p className="text-xs text-slate-400">Sample volume, standard SLA turnaround time, and revenue per service</p>
            </div>
            <FlaskConical className="text-teal-600 h-5 w-5" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3 rounded-l-md">Parameter / Service</th>
                  <th className="p-3 text-center">Active Samples</th>
                  <th className="p-3 text-center">SLA (Days)</th>
                  <th className="p-3 text-right rounded-r-md">Total Billing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {testingServicesPerformanceData.map((item) => (
                  <tr key={item.name} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-800">
                      <div className="line-clamp-1 text-xs">{item.name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{item.code} • {item.category}</span>
                    </td>
                    <td className="p-3 text-center text-slate-600 font-mono font-semibold">
                      {item.activeSamples}
                    </td>
                    <td className="p-3 text-center font-mono">
                      <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                        {item.tatDays} days
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-900 font-bold">
                      {formatIDR(item.totalRevenue)}
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

