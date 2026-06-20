import React, { useState, useEffect } from 'react';
import { 
  Building2, LayoutDashboard, Briefcase, 
  Search, Plus, UserPlus, RefreshCcw, 
  NotebookTabs, ArrowLeftRight, Settings, 
  Menu, X, Sparkles, HelpCircle, AlertCircle
} from 'lucide-react';

// Subcomponents
import Dashboard from './components/Dashboard';
import OngoingServices from './components/OngoingServices';
import ServiceTracker from './components/ServiceTracker';
import NewClient from './components/NewClient';
import ServiceCatalog from './components/ServiceCatalog';
import Incentives from './components/Incentives';
import SalesEmployees from './components/SalesEmployees';

// Mock seeders
import { 
  INITIAL_SERVICES, 
  INITIAL_CLIENTS, 
  INITIAL_PROJECTS, 
  INITIAL_INCENTIVES,
  INITIAL_SALES_EMPLOYEES
} from './data/mockData';
import {
  getServicesFromDb,
  getClientsFromDb,
  getProjectsFromDb,
  getIncentivesFromDb,
  getSalesEmployeesFromDb,
  dbAddService,
  dbUpdateService,
  dbDeleteService,
  dbAddClient,
  dbUpdateClient,
  dbDeleteClient,
  dbAddProject,
  dbUpdateProject,
  dbDeleteProject,
  dbAddIncentive,
  dbUpdateIncentive,
  dbDeleteIncentive,
  dbAddSalesEmployee,
  dbUpdateSalesEmployee,
  dbDeleteSalesEmployee,
  dbResetToStandard
} from './lib/firebase';

// Types
import { Service, Client, Project, Incentive, SalesEmployee, ActivityNote, ProjectStatus, PaymentStatus } from './types';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ongoing' | 'tracker' | 'clients' | 'catalog' | 'incentives' | 'sales'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // States
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [employees, setEmployees] = useState<SalesEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize States from Firebase Firestore
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const srv = await getServicesFromDb();
        const cli = await getClientsFromDb();
        const proj = await getProjectsFromDb();
        const inc = await getIncentivesFromDb();
        const emp = await getSalesEmployeesFromDb();

        setServices(srv);
        setClients(cli);
        setProjects(proj);
        setIncentives(inc);
        setEmployees(emp);
      } catch (err) {
        console.error('Failed to load data from Firebase Firestore:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // --- SERVICE CATALOG COLLABORATIVE CRUDS ---
  const handleAddService = async (newService: Omit<Service, 'id'>) => {
    const srv: Service = {
      ...newService,
      id: `s-${Date.now()}`
    };
    const updated = [...services, srv];
    setServices(updated);
    try {
      await dbAddService(srv);
    } catch (e) {
      console.error('Error adding service to Firestore:', e);
    }
  };

  const handleUpdateService = async (id: string, updatedFields: Partial<Service>) => {
    const updatedList = services.map(s => s.id === id ? { ...s, ...updatedFields } : s);
    setServices(updatedList);
    try {
      await dbUpdateService(id, updatedFields);
    } catch (e) {
      console.error('Error updating service in Firestore:', e);
    }
  };

  const handleDeleteService = async (id: string) => {
    const updatedList = services.filter(s => s.id !== id);
    setServices(updatedList);
    try {
      await dbDeleteService(id);
    } catch (e) {
      console.error('Error deleting service from Firestore:', e);
    }
  };

  // --- CLIENT / FUNNEL COLLABORATIVE CRUDS ---
  const handleAddClient = async (newClient: Omit<Client, 'id' | 'createdAt' | 'activityNotes'>) => {
    const cli: Client = {
      ...newClient,
      id: `c-${Date.now()}`,
      createdAt: new Date().toISOString(),
      activityNotes: [
        {
          id: `act-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          note: `Lead baru dibuat dengan funnel status: ${newClient.status}.`,
          author: newClient.assignedSales
        }
      ]
    };
    const updated = [...clients, cli];
    setClients(updated);
    try {
      await dbAddClient(cli);
    } catch (e) {
      console.error('Error adding client to Firestore:', e);
    }
  };

  const handleUpdateClient = async (id: string, updatedFields: Partial<Client>) => {
    let targetClient: Client | undefined;
    const updatedList = clients.map(c => {
      if (c.id === id) {
        const nextClient = { ...c, ...updatedFields };
        // Check if client transitioned to WON, and update history log
        if (updatedFields.status && updatedFields.status !== c.status) {
          nextClient.activityNotes = [
            ...nextClient.activityNotes,
            {
              id: `act-${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              note: `Status berganti dari ${c.status} menjadi ${updatedFields.status}.`,
              author: 'Sistem CRM'
            }
          ];
        }
        targetClient = nextClient;
        return nextClient;
      }
      return c;
    });
    setClients(updatedList);
    try {
      if (targetClient) {
        await dbAddClient(targetClient);
      }
    } catch (e) {
      console.error('Error updating client in Firestore:', e);
    }
  };

  const handleDeleteClient = async (id: string) => {
    const updatedList = clients.filter(c => c.id !== id);
    setClients(updatedList);
    try {
      await dbDeleteClient(id);
    } catch (e) {
      console.error('Error deleting client from Firestore:', e);
    }
  };

  const handleAddActivityNote = async (clientId: string, noteData: Omit<ActivityNote, 'id' | 'date'>) => {
    let targetClient: Client | undefined;
    const updatedList = clients.map(c => {
      if (c.id === clientId) {
        const nextClient = {
          ...c,
          activityNotes: [
            ...c.activityNotes,
            {
              id: `note-${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              ...noteData
            }
          ]
        };
        targetClient = nextClient;
        return nextClient;
      }
      return c;
    });
    setClients(updatedList);
    try {
      if (targetClient) {
        await dbAddClient(targetClient);
      }
    } catch (e) {
      console.error('Error adding activity note in Firestore:', e);
    }
  };

  // --- ONGOING PROJECTS COLLABORATIVE CRUDS ---
  const handleAddProject = async (newProject: Omit<Project, 'id' | 'quotationNumber'>) => {
    const projIdNum = projects.length + 1;
    const proj: Project = {
      ...newProject,
      id: `LAB-2026-00${projIdNum}`,
      quotationNumber: `QT-2026-0${100 + projIdNum}`
    };
    const updated = [...projects, proj];
    setProjects(updated);
    try {
      await dbAddProject(proj);
    } catch (e) {
      console.error('Error adding project to Firestore:', e);
    }

    // Dynamic checks: If client is WON, update client won status automatically
    const client = clients.find(c => c.id === newProject.clientId);
    if (client && client.status !== 'Won') {
      await handleUpdateClient(client.id, { status: 'Won' });
    }
  };

  const handleUpdateProject = async (id: string, updatedFields: Partial<Project>) => {
    let targetProject: Project | undefined;
    let targetClientToUpdate: { id: string, data: Partial<Client> } | null = null;
    let newIncentiveToAdd: Incentive | null = null;

    const updatedList = projects.map(p => {
      if (p.id === id) {
        const nextProject = { ...p, ...updatedFields };
        targetProject = nextProject;
        
        // Trigger automated incentive calculator inside React state if criteria are met!
        const client = clients.find(c => c.id === p.clientId);
        if (client && client.isFirstTransaction) {
          const isFinished = nextProject.status === 'Completed' || nextProject.status === 'Report Released';
          const isPaid = nextProject.paymentStatus === 'Paid';
          
          if (isFinished && isPaid) {
            // Check if incentive already generated
            const exists = incentives.some(inc => inc.projectId === id);
            if (!exists) {
              const incAmount = nextProject.totalPrice * 0.025;
              const newInc: Incentive = {
                id: `inc-${Date.now()}`,
                projectId: id,
                clientName: p.clientName,
                serviceName: p.serviceName,
                salesName: nextProject.assignedSales,
                serviceValue: nextProject.totalPrice,
                incentiveValue: incAmount,
                paymentStatus: 'Paid',
                isPaid: false,
                createdAt: new Date().toISOString()
              };
              newIncentiveToAdd = newInc;
              targetClientToUpdate = { id: client.id, data: { isFirstTransaction: false } };
            }
          }
        }
        return nextProject;
      }
      return p;
    });

    setProjects(updatedList);
    try {
      if (targetProject) {
        await dbAddProject(targetProject);
      }
      if (newIncentiveToAdd) {
        const updatedIncentives = [...incentives, newIncentiveToAdd];
        setIncentives(updatedIncentives);
        await dbAddIncentive(newIncentiveToAdd);
      }
      if (targetClientToUpdate) {
        await handleUpdateClient(targetClientToUpdate.id, targetClientToUpdate.data);
      }
    } catch (e) {
      console.error('Error updating project in Firestore:', e);
    }
  };

  const handleDeleteProject = async (id: string) => {
    const updatedList = projects.filter(p => p.id !== id);
    setProjects(updatedList);
    try {
      await dbDeleteProject(id);
    } catch (e) {
      console.error('Error deleting project from Firestore:', e);
    }
  };

  const handleUpdateProjectStatus = async (id: string, nextStatus: ProjectStatus, nextProgress: number) => {
    await handleUpdateProject(id, { status: nextStatus, progressPercent: nextProgress });
  };

  // --- INCENTIVE CASH DISBURSE CONFIRMATION ---
  const handleDisburseIncentive = async (id: string) => {
    let targetIncentive: Incentive | undefined;
    const updatedList = incentives.map(inc => {
      if (inc.id === id) {
        const nextInc = { ...inc, isPaid: !inc.isPaid };
        targetIncentive = nextInc;
        return nextInc;
      }
      return inc;
    });
    setIncentives(updatedList);
    try {
      if (targetIncentive) {
        await dbAddIncentive(targetIncentive);
      }
    } catch (e) {
      console.error('Error updating incentive in Firestore:', e);
    }
  };

  // --- SALES EMPLOYEES COLLABORATIVE CRUDS ---
  const handleAddEmployee = async (newEmp: Omit<SalesEmployee, 'id' | 'createdAt' | 'achievedThisMonth'>) => {
    const emp: SalesEmployee = {
      ...newEmp,
      id: `sales-${Date.now()}`,
      achievedThisMonth: 0,
      createdAt: new Date().toISOString()
    };
    const updated = [...employees, emp];
    setEmployees(updated);
    try {
      await dbAddSalesEmployee(emp);
    } catch (e) {
      console.error('Error adding sales employee to Firestore:', e);
    }
  };

  const handleUpdateEmployee = async (id: string, updatedFields: Partial<SalesEmployee>) => {
    const updatedList = employees.map(e => e.id === id ? { ...e, ...updatedFields } : e);
    setEmployees(updatedList);
    try {
      await dbUpdateSalesEmployee(id, updatedFields);
    } catch (e) {
      console.error('Error updating sales employee in Firestore:', e);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    const updatedList = employees.filter(e => e.id !== id);
    setEmployees(updatedList);
    try {
      await dbDeleteSalesEmployee(id);
    } catch (e) {
      console.error('Error deleting sales employee from Firestore:', e);
    }
  };

  // --- RECONCILE RESET STATE BUTTON ---
  const handleRevertToInitialSeeder = async () => {
    if (confirm('Revert all laboratory changes back to standard initial seeder datasets?')) {
      setIsLoading(true);
      try {
        await dbResetToStandard();
        setServices(INITIAL_SERVICES);
        setClients(INITIAL_CLIENTS);
        setProjects(INITIAL_PROJECTS);
        setIncentives(INITIAL_INCENTIVES);
        setEmployees(INITIAL_SALES_EMPLOYEES);
        alert('Data reset to standard chem seeder successful!');
        setActiveTab('dashboard');
      } catch (err) {
        console.error('Reset database failed:', err);
        alert('Reset database gagal, mohon coba kembali.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-750 selection:bg-teal-500/10 selection:text-teal-900">
      
      {/* SIDEBAR NAVIGATION - DESKTOP */}
      <aside 
        className={`bg-slate-900 border-r border-slate-800 text-slate-300 w-64 shrink-0 transition-transform duration-300 fixed md:relative h-screen z-40 flex flex-col justify-between ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 overflow-hidden border-none'
        }`}
      >
        <div className="p-5 space-y-6">
          {/* Dashboard Head */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-600 rounded-xl text-white shadow-xs">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-wide">ChemLab CRM</h2>
                <span className="text-[10px] text-slate-500 block font-semibold tracking-wider font-mono uppercase">LAB COMPLIANCE</span>
              </div>
            </div>
            {/* Close side bar on mobile */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md md:hidden cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Links list */}
          <nav className="space-y-1.5 pt-2">
            
            <button
              id="nav-dashboard"
              onClick={() => { setActiveTab('dashboard'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`w-full text-left px-3.5 py-3 rounded-lg text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-teal-600 text-white shadow-xs' : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              Dashboard KPI
            </button>

            <button
              id="nav-ongoing"
              onClick={() => { setActiveTab('ongoing'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`w-full text-left px-3.5 py-3 rounded-lg text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'ongoing' ? 'bg-teal-600 text-white shadow-xs' : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
            >
              <Briefcase className="h-4 w-4 shrink-0" />
              Ongoing Services
            </button>

            <button
              id="nav-tracker"
              onClick={() => { setActiveTab('tracker'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`w-full text-left px-3.5 py-3 rounded-lg text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'tracker' ? 'bg-teal-600 text-white shadow-xs' : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
            >
              <ArrowLeftRight className="h-4 w-4 shrink-0" />
              Service Tracker
            </button>

            <button
              id="nav-clients"
              onClick={() => { setActiveTab('clients'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`w-full text-left px-3.5 py-3 rounded-lg text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'clients' ? 'bg-teal-600 text-white shadow-xs' : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
            >
              <UserPlus className="h-4 w-4 shrink-0" />
              New Client / Leads
            </button>

            <button
              id="nav-catalog"
              onClick={() => { setActiveTab('catalog'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`w-full text-left px-3.5 py-3 rounded-lg text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'catalog' ? 'bg-teal-600 text-white shadow-xs' : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
            >
              <NotebookTabs className="h-4 w-4 shrink-0" />
              Service Catalog
            </button>

            <button
              id="nav-incentives"
              onClick={() => { setActiveTab('incentives'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`w-full text-left px-3.5 py-3 rounded-lg text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'incentives' ? 'bg-teal-600 text-white shadow-xs' : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
            >
              <Sparkles className="h-4 w-4 shrink-0 animate-pulse" />
              Incentives
            </button>

            <button
              id="nav-sales"
              onClick={() => { setActiveTab('sales'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`w-full text-left px-3.5 py-3 rounded-lg text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'sales' ? 'bg-teal-600 text-white shadow-xs' : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
            >
              <UserPlus className="h-4 w-4 shrink-0" />
              Sales Karyawan
            </button>

          </nav>
        </div>

        {/* Revert dataset & details footer */}
        <div className="p-4 bg-slate-950 text-[10px] space-y-2 border-t border-slate-800">
          <div className="text-slate-500 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            RECONCILE OPEN ACCESS ENABLED
          </div>
          <button 
            type="button"
            onClick={handleRevertToInitialSeeder}
            className="w-full text-center py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-md border border-slate-700 font-mono text-[9px] cursor-pointer"
          >
            Revert to Seeder Data
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER & CANVAS */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>ChemLab Sales CRM</span>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-normal px-2 py-0.5 rounded-md font-mono hidden sm:inline-block">v1.17</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Simulation note ticker */}
            <div className="text-[11px] text-slate-500 font-medium font-sans flex items-center gap-1 bg-slate-50/80 px-2.5 py-1 rounded-lg border border-slate-100">
              <span className="inline-block relative">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>All Staff Edit Access</span>
            </div>
            
            <div className="h-8 w-8 rounded-full bg-teal-650 text-white font-bold flex items-center justify-center font-mono text-xs cursor-default" title="Your sandbox email: fabgloken20@gmail.com">
              FL
            </div>
          </div>
        </header>

        {/* CENTRAL ROUTED PANEL */}
        <main className="p-4 md:p-8 flex-1 max-w-7xl w-full mx-auto pb-16">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-slate-500 font-sans">Menghubungkan & Memuat Data dari Firebase...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard 
                  clients={clients} 
                  projects={projects} 
                  services={services} 
                />
              )}

              {activeTab === 'ongoing' && (
                <OngoingServices 
                  projects={projects}
                  clients={clients}
                  services={services}
                  onAddProject={handleAddProject}
                  onUpdateProject={handleUpdateProject}
                  onDeleteProject={handleDeleteProject}
                />
              )}

              {activeTab === 'tracker' && (
                <ServiceTracker 
                  projects={projects}
                  clients={clients}
                  services={services}
                  onUpdateProjectStatus={handleUpdateProjectStatus}
                  onAddProject={handleAddProject}
                />
              )}

              {activeTab === 'clients' && (
                <NewClient 
                  clients={clients}
                  onAddClient={handleAddClient}
                  onUpdateClient={handleUpdateClient}
                  onDeleteClient={handleDeleteClient}
                  onAddActivityNote={handleAddActivityNote}
                />
              )}

              {activeTab === 'catalog' && (
                <ServiceCatalog 
                  services={services}
                  onAddService={handleAddService}
                  onUpdateService={handleUpdateService}
                  onDeleteService={handleDeleteService}
                />
              )}

              {activeTab === 'incentives' && (
                <Incentives 
                  projects={projects}
                  clients={clients}
                  incentives={incentives}
                  onDisburseIncentive={handleDisburseIncentive}
                />
              )}

              {activeTab === 'sales' && (
                <SalesEmployees
                  employees={employees}
                  onAddEmployee={handleAddEmployee}
                  onUpdateEmployee={handleUpdateEmployee}
                  onDeleteEmployee={handleDeleteEmployee}
                />
              )}
            </>
          )}
        </main>
      </div>

    </div>
  );
}
