import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  Presentation, 
  FileText, 
  FileSpreadsheet, 
  Calendar,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SalesDataProvider, useSalesData } from './context/SalesDataContext';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { MasterData } from './components/MasterData';
import { MonthlyIntake } from './components/MonthlyIntake';
import { ClientList } from './components/ClientList';
import { TestingCatalog } from './components/TestingCatalog';
import { MeetingReports } from './components/MeetingReports';
import { SalesJournal } from './components/SalesJournal';
import { Incentives } from './components/Incentives';
import { Quotations } from './components/Quotations';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { generatePowerPointDeck, generatePdfReport } from './utils/exportPresentation';
import { exportMasterDataToExcel } from './utils/excelProcessor';

function AppContent() {
  const { userProfile, firebaseUser } = useAuth();
  const { selectedPeriod, setSelectedPeriod, strategicMetrics, clients, services, records } = useSalesData();

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Journal pre-selection state from other views
  const [journalClient, setJournalClient] = useState<string | undefined>(undefined);
  const [journalPic, setJournalPic] = useState<string | undefined>(undefined);

  // Auth modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleOpenJournalForClient = (clientName: string, picName: string) => {
    setJournalClient(clientName);
    setJournalPic(picName);
    setCurrentTab('journal');
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      {/* Desktop Sidebar Navigation */}
      <div className="hidden lg:flex">
        <Navigation 
          currentTab={currentTab} 
          onSelectTab={(tab) => {
            setCurrentTab(tab);
          }} 
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
          <div className="relative flex flex-col w-72 max-w-xs bg-slate-950 z-10">
            <div className="absolute top-4 right-4">
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Navigation 
              currentTab={currentTab} 
              onSelectTab={(tab) => {
                setCurrentTab(tab);
                setIsMobileMenuOpen(false);
              }} 
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar Contract */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-4 md:px-6 flex items-center justify-between shrink-0 z-10 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Context */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="hidden sm:inline">Nullius</span>
              <span className="hidden sm:inline">/</span>
              <span className="text-slate-900 capitalize font-bold">
                {currentTab.replace('-', ' ')}
              </span>
            </div>
          </div>

          {/* Right Zone: Period Context, Quick Slide Action & User Status */}
          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{selectedPeriod}</span>
            </div>

            {/* Quick 1-Click Bi-Monthly Meeting Slide Export */}
            <button
              onClick={() => generatePowerPointDeck(strategicMetrics, clients, services, selectedPeriod)}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
              title="Download slide PowerPoint (.pptx) rapat dua mingguan langsung"
            >
              <Presentation className="w-3.5 h-3.5 text-sky-600" />
              <span>Slide Rapat (.PPTX)</span>
            </button>

            {/* User Profile Pill */}
            {firebaseUser ? (
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 px-2.5 py-1 text-xs text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                  {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'S'}
                </div>
                <span className="hidden sm:inline font-semibold">
                  {userProfile?.displayName || 'Sales Executive'}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs"
              >
                Masuk Akun
              </button>
            )}
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-100">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <Dashboard onNavigate={(tab) => setCurrentTab(tab)} />
            )}

            {currentTab === 'master' && (
              <MasterData />
            )}

            {currentTab === 'penawaran' && (
              <Quotations />
            )}

            {currentTab === 'intake' && (
              <MonthlyIntake onSuccessNavigate={(tab) => setCurrentTab(tab)} />
            )}

            {currentTab === 'clients' && (
              <ClientList onOpenJournalForClient={handleOpenJournalForClient} />
            )}

            {currentTab === 'catalog' && (
              <TestingCatalog />
            )}

            {currentTab === 'meeting-reports' && (
              <MeetingReports />
            )}

            {currentTab === 'journal' && (
              <SalesJournal 
                initialClient={journalClient} 
                initialPic={journalPic} 
              />
            )}

            {currentTab === 'incentives' && (
              <Incentives />
            )}
          </div>
        </main>
      </div>

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
      )}

      {/* User Profile Modal */}
      {isProfileModalOpen && (
        <UserProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
        />
      )}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <SalesDataProvider>
        <AppContent />
      </SalesDataProvider>
    </AuthProvider>
  );
}

export default App;
