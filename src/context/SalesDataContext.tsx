import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { MasterSalesRecord, ClientProfile, TestingServiceSummary, SalesJournalEntry, Quotation, QuotationFollowUp, MonthlyUploadMeta, DataEditLog } from '../types';
import { RAW_AUGUST_2026_RECORDS, INITIAL_JOURNAL_ENTRIES } from '../data/rawAugustData';
import { INITIAL_QUOTATIONS } from '../data/initialQuotations';
import { deriveClientProfiles, deriveTestingServices } from '../utils/clientROEngine';
import { computeStrategicMetrics, StrategicMetrics } from '../utils/strategicAnalytics';
import { 
  getMasterSalesFromDb, 
  saveMasterSalesBatchToDb, 
  dbSaveMasterSaleRecord, 
  dbDeleteMasterSaleRecord,
  getSalesJournalsFromDb,
  dbSaveJournalEntry,
  dbDeleteJournalEntry 
} from '../lib/firebase';

interface SalesDataContextType {
  records: MasterSalesRecord[];
  journals: SalesJournalEntry[];
  quotations: Quotation[];
  selectedPeriod: string;
  setSelectedPeriod: (p: string) => void;
  portfolioOnly: boolean;
  setPortfolioOnly: (val: boolean) => void;
  clients: ClientProfile[];
  services: TestingServiceSummary[];
  strategicMetrics: StrategicMetrics;
  
  // Dual Targets: Monthly & Yearly
  monthlyTarget: number;
  yearlyTarget: number;
  setMonthlyTarget: (target: number) => void;
  setYearlyTarget: (target: number) => void;
  
  isLoading: boolean;
  
  // Master record mutations
  addRecords: (newRecords: MasterSalesRecord[], mode: 'append' | 'replace') => Promise<void>;
  updateRecord: (updated: MasterSalesRecord) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  toggleRecordCorrection: (id: string, note?: string) => Promise<void>;
  
  // Monthly Replacement (Hapus & Ganti hanya untuk bulan yang bersangkutan)
  replaceMonthRecords: (monthKey: string, newRecords: MasterSalesRecord[], fileName?: string, user?: string) => Promise<void>;
  deleteMonthRecords: (monthKey: string, user?: string) => Promise<void>;

  // Monthly File Tracking & Log Book
  monthlyFileMap: Record<string, MonthlyUploadMeta>;
  setMonthlyFileMeta: (meta: MonthlyUploadMeta) => void;
  dataEditLogs: DataEditLog[];
  addDataEditLog: (log: Omit<DataEditLog, 'id' | 'timestamp'>) => void;
  clearDataEditLogs: () => void;

  // Master Data Security & Deduplication
  isMasterDataLocked: boolean;
  toggleMasterDataLock: () => void;
  resolveDuplicates: (mode: 'exact' | 'invoice_suffix') => { removedCount: number; fixedCount: number };
  
  // Journal mutations
  addJournalEntry: (entry: Omit<SalesJournalEntry, 'id' | 'createdAt'>) => Promise<void>;
  updateJournalEntry: (entry: SalesJournalEntry) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;

  // Quotation mutations & follow up
  addQuotation: (quo: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateQuotation: (quo: Quotation) => Promise<void>;
  deleteQuotation: (id: string) => Promise<void>;
  addQuotationFollowUp: (quotationId: string, fu: Omit<QuotationFollowUp, 'id'>) => Promise<void>;

  // Incentive Selection by ID ELSA
  selectedIncentiveIds: string[];
  setSelectedIncentiveIds: (ids: string[]) => void;
  toggleIncentiveRecord: (id: string) => void;
  toggleIncentiveByElsaId: (elsaId: string, select: boolean) => void;
  selectAllIncentives: () => void;
  deselectAllIncentives: () => void;
  
  // Benchmark reset
  resetToAugustBenchmark: () => Promise<void>;
}

const SalesDataContext = createContext<SalesDataContextType | undefined>(undefined);

const STORAGE_KEY_RECORDS = 'nullius_master_sales_v1';
const STORAGE_KEY_JOURNALS = 'nullius_sales_journals_v1';
const STORAGE_KEY_TARGET_MONTH = 'nullius_monthly_target_v1';
const STORAGE_KEY_TARGET_YEAR = 'nullius_yearly_target_v1';
const STORAGE_KEY_QUOTATIONS = 'nullius_quotations_v1';
const STORAGE_KEY_INCENTIVE_IDS = 'nullius_incentive_selected_ids_v1';
const STORAGE_KEY_MONTHLY_FILES = 'nullius_monthly_files_v1';
const STORAGE_KEY_EDIT_LOGS = 'nullius_data_edit_logs_v1';
const STORAGE_KEY_MASTER_LOCK = 'nullius_master_data_locked_v1';

const INITIAL_MONTHLY_FILES: Record<string, MonthlyUploadMeta> = {
  '2026-08': {
    month: 'Agustus 2026',
    fileName: 'REKAP_SALES_AGUSTUS_2026_BENCHMARK.xlsx',
    fileSize: 52377,
    uploadTimestamp: '2026-08-31 17:30 WIB',
    uploadedBy: 'Sales Executive (Benchmark)',
    rowCount: 219,
    totalDpp: 323800000,
    myAuthorityDpp: 147500000
  }
};

const INITIAL_DATA_EDIT_LOGS: DataEditLog[] = [
  {
    id: 'log-init-001',
    timestamp: '2026-08-31 17:30:00',
    user: 'Sales Executive (Benchmark)',
    action: 'Upload File',
    month: 'Agustus 2026',
    fileName: 'REKAP_SALES_AGUSTUS_2026_BENCHMARK.xlsx',
    recordsCount: 219,
    details: 'Pemuatan dataset resmi benchmark penjualan laboratorium bulan Agustus 2026 (219 transaksi).'
  }
];

export const SalesDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<MasterSalesRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to read local master sales cache', e);
    }
    return RAW_AUGUST_2026_RECORDS;
  });

  const [journals, setJournals] = useState<SalesJournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_JOURNALS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to read local journals cache', e);
    }
    return INITIAL_JOURNAL_ENTRIES;
  });

  const [selectedPeriod, setSelectedPeriod] = useState<string>('Agustus 2026');
  const [portfolioOnly, setPortfolioOnly] = useState<boolean>(true);
  
  const [monthlyTarget, setMonthlyTargetState] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TARGET_MONTH);
    return saved ? parseInt(saved, 10) : 120000000; // 120 Juta per bulan
  });

  const [yearlyTarget, setYearlyTargetState] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TARGET_YEAR);
    return saved ? parseInt(saved, 10) : 1440000000; // 1.44 Milyar per tahun
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_QUOTATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to read quotations cache', e);
    }
    return INITIAL_QUOTATIONS;
  });

  // Selected Incentive Record IDs (based on ID ELSA selection)
  const [selectedIncentiveIds, setSelectedIncentiveIdsState] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INCENTIVE_IDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to read incentive selection cache', e);
    }
    // Default: all records in my authority
    return RAW_AUGUST_2026_RECORDS.filter(r => r.isMyAuthority).map(r => r.id);
  });

  // Monthly File Tracking: Map of Month => File Info
  const [monthlyFileMap, setMonthlyFileMap] = useState<Record<string, MonthlyUploadMeta>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MONTHLY_FILES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to read monthly files cache', e);
    }
    return INITIAL_MONTHLY_FILES;
  });

  // Data Edit Log Book
  const [dataEditLogs, setDataEditLogs] = useState<DataEditLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EDIT_LOGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to read data edit logs cache', e);
    }
    return INITIAL_DATA_EDIT_LOGS;
  });

  // Master Data Protection Lock
  const [isMasterDataLocked, setIsMasterDataLocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_MASTER_LOCK) === 'true';
    } catch {
      return false;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync to Firestore on boot or hydrate from Firestore if exists
  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      setIsLoading(true);
      try {
        const dbSales = await getMasterSalesFromDb();
        if (isMounted && dbSales && dbSales.length > 0) {
          setRecords(dbSales as MasterSalesRecord[]);
          localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(dbSales));
        } else if (records.length > 0) {
          // Seed initial August records to Firestore
          saveMasterSalesBatchToDb(records);
        }

        const dbJournals = await getSalesJournalsFromDb();
        if (isMounted && dbJournals && dbJournals.length > 0) {
          setJournals(dbJournals as SalesJournalEntry[]);
          localStorage.setItem(STORAGE_KEY_JOURNALS, JSON.stringify(dbJournals));
        } else if (journals.length > 0) {
          journals.forEach(j => dbSaveJournalEntry(j));
        }
      } catch (err) {
        console.warn('Firestore hydration note:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    hydrate();
    return () => {
      isMounted = false;
    };
  }, []);

  const setMonthlyTarget = (target: number) => {
    setMonthlyTargetState(target);
    localStorage.setItem(STORAGE_KEY_TARGET_MONTH, String(target));
  };

  const setYearlyTarget = (target: number) => {
    setYearlyTargetState(target);
    localStorage.setItem(STORAGE_KEY_TARGET_YEAR, String(target));
  };

  const setSelectedIncentiveIds = (ids: string[]) => {
    setSelectedIncentiveIdsState(ids);
    localStorage.setItem(STORAGE_KEY_INCENTIVE_IDS, JSON.stringify(ids));
  };

  // Filtered records by authority if portfolioOnly is true
  const activeRecords = useMemo(() => {
    return records;
  }, [records]);

  // Derived state
  const clients = useMemo(() => {
    return deriveClientProfiles(activeRecords);
  }, [activeRecords]);

  const services = useMemo(() => {
    return deriveTestingServices(activeRecords);
  }, [activeRecords]);

  const strategicMetrics = useMemo(() => {
    return computeStrategicMetrics(activeRecords, clients, monthlyTarget, yearlyTarget, quotations);
  }, [activeRecords, clients, monthlyTarget, yearlyTarget, quotations]);

  // Master Record handlers
  const addRecords = async (newRecords: MasterSalesRecord[], mode: 'append' | 'replace') => {
    const updated = mode === 'replace' ? [...newRecords] : [...newRecords, ...records];
    setRecords(updated);
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updated));
    await saveMasterSalesBatchToDb(updated);
  };

  const updateRecord = async (updated: MasterSalesRecord) => {
    const next = records.map(r => r.id === updated.id ? updated : r);
    setRecords(next);
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(next));
    await dbSaveMasterSaleRecord(updated);
  };

  const deleteRecord = async (id: string) => {
    const next = records.filter(r => r.id !== id);
    setRecords(next);
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(next));
    await dbDeleteMasterSaleRecord(id);
  };

  const toggleRecordCorrection = async (id: string, note?: string) => {
    const target = records.find(r => r.id === id);
    if (!target) return;
    const updated: MasterSalesRecord = {
      ...target,
      needsCorrection: !target.needsCorrection,
      correctionNote: !target.needsCorrection ? (note || 'Perlu verifikasi kondisi uji / parameter khusus') : undefined,
      updatedAt: new Date().toISOString()
    };
    await updateRecord(updated);
  };

  // Journal handlers
  const addJournalEntry = async (entry: Omit<SalesJournalEntry, 'id' | 'createdAt'>) => {
    const newEntry: SalesJournalEntry = {
      ...entry,
      id: `jnl-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const next = [newEntry, ...journals];
    setJournals(next);
    localStorage.setItem(STORAGE_KEY_JOURNALS, JSON.stringify(next));
    await dbSaveJournalEntry(newEntry);
  };

  const updateJournalEntry = async (entry: SalesJournalEntry) => {
    const next = journals.map(j => j.id === entry.id ? entry : j);
    setJournals(next);
    localStorage.setItem(STORAGE_KEY_JOURNALS, JSON.stringify(next));
    await dbSaveJournalEntry(entry);
  };

  const deleteJournalEntry = async (id: string) => {
    const next = journals.filter(j => j.id !== id);
    setJournals(next);
    localStorage.setItem(STORAGE_KEY_JOURNALS, JSON.stringify(next));
    await dbDeleteJournalEntry(id);
  };

  // Log Book helper
  const addDataEditLog = (log: Omit<DataEditLog, 'id' | 'timestamp'>) => {
    const newLog: DataEditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    const nextLogs = [newLog, ...dataEditLogs];
    setDataEditLogs(nextLogs);
    localStorage.setItem(STORAGE_KEY_EDIT_LOGS, JSON.stringify(nextLogs));
  };

  const clearDataEditLogs = () => {
    setDataEditLogs([]);
    localStorage.removeItem(STORAGE_KEY_EDIT_LOGS);
  };

  const setMonthlyFileMeta = (meta: MonthlyUploadMeta) => {
    const nextMap = { ...monthlyFileMap, [meta.month]: meta };
    setMonthlyFileMap(nextMap);
    localStorage.setItem(STORAGE_KEY_MONTHLY_FILES, JSON.stringify(nextMap));
  };

  const toggleMasterDataLock = () => {
    const nextVal = !isMasterDataLocked;
    setIsMasterDataLocked(nextVal);
    localStorage.setItem(STORAGE_KEY_MASTER_LOCK, String(nextVal));
  };

  // Helper to determine if a record matches a month key e.g. "2026-08" or "Agustus 2026"
  const isRecordInMonth = (r: MasterSalesRecord, monthKey: string): boolean => {
    if (!monthKey) return false;
    const cleanKey = monthKey.trim().toLowerCase();
    
    // Check period directly
    if (r.period && r.period.toLowerCase() === cleanKey) return true;
    
    // Check dateParsed e.g. "2026-08"
    if (r.dateParsed && r.dateParsed.slice(0, 7) === cleanKey) return true;
    
    // Check Indonesian month names
    if (cleanKey.includes('agustus') || cleanKey === '2026-08') {
      return (r.period === '2026-08' || (r.dateParsed && r.dateParsed.startsWith('2026-08')) || (r.tanggalSampel && r.tanggalSampel.toLowerCase().includes('agustus')));
    }
    if (cleanKey.includes('juli') || cleanKey === '2026-07') {
      return (r.period === '2026-07' || (r.dateParsed && r.dateParsed.startsWith('2026-07')) || (r.tanggalSampel && r.tanggalSampel.toLowerCase().includes('juli')));
    }
    if (cleanKey.includes('september') || cleanKey === '2026-09') {
      return (r.period === '2026-09' || (r.dateParsed && r.dateParsed.startsWith('2026-09')) || (r.tanggalSampel && r.tanggalSampel.toLowerCase().includes('september')));
    }
    return false;
  };

  // Replace records ONLY for the affected month (Hapus & Ganti hanya untuk bulan yang bersangkutan)
  const replaceMonthRecords = async (
    monthKey: string, 
    newRecords: MasterSalesRecord[], 
    fileName = 'Data_Penjualan_Baru.xlsx',
    user = 'Operator / Sales'
  ) => {
    // 1. Filter out existing records matching this month (delete old data for this month)
    const existingForMonth = records.filter(r => isRecordInMonth(r, monthKey));
    const keptRecords = records.filter(r => !isRecordInMonth(r, monthKey));
    
    // 2. Merge: new records for this month + existing records from all other months
    const updated = [...newRecords, ...keptRecords];
    setRecords(updated);
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updated));
    await saveMasterSalesBatchToDb(updated);

    // 3. Update File Metadata for this month
    const totalDpp = newRecords.reduce((sum, r) => sum + (r.dppTotal || 0), 0);
    const myDpp = newRecords.filter(r => r.isMyAuthority).reduce((sum, r) => sum + (r.dppTotal || 0), 0);
    const meta: MonthlyUploadMeta = {
      month: monthKey,
      fileName,
      uploadTimestamp: new Date().toLocaleString('id-ID'),
      uploadedBy: user,
      rowCount: newRecords.length,
      totalDpp,
      myAuthorityDpp: myDpp
    };
    setMonthlyFileMeta(meta);

    // 4. Record entry in Audit Log Book
    addDataEditLog({
      user,
      action: 'Ganti Data Bulan',
      month: monthKey,
      fileName,
      recordsCount: newRecords.length,
      details: `Mengganti data penjualan bulan ${monthKey}. Menghapus ${existingForMonth.length} baris lama dan memuat ${newRecords.length} baris data baru dari file "${fileName}".`
    });
  };

  // Delete records for a specific month
  const deleteMonthRecords = async (monthKey: string, user = 'Operator / Sales') => {
    const existingForMonth = records.filter(r => isRecordInMonth(r, monthKey));
    const keptRecords = records.filter(r => !isRecordInMonth(r, monthKey));
    
    setRecords(keptRecords);
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(keptRecords));
    await saveMasterSalesBatchToDb(keptRecords);

    // Record entry in Audit Log Book
    addDataEditLog({
      user,
      action: 'Hapus Data Bulan',
      month: monthKey,
      recordsCount: existingForMonth.length,
      details: `Menghapus seluruh ${existingForMonth.length} data penjualan untuk bulan ${monthKey}.`
    });
  };

  // Master Data Deduplication Scanner & Fixer
  const resolveDuplicates = (mode: 'exact' | 'invoice_suffix'): { removedCount: number; fixedCount: number } => {
    let removedCount = 0;
    let fixedCount = 0;

    if (mode === 'exact') {
      // Deduplicate exact duplicate transactions
      const seen = new Set<string>();
      const deduped: MasterSalesRecord[] = [];

      records.forEach(r => {
        const signature = `${(r.company || '').trim().toLowerCase()}|${(r.invoice || '').trim().toLowerCase()}|${r.tanggalSampel}|${r.layananPengujian}|${r.dppTotal}`;
        if (!seen.has(signature)) {
          seen.add(signature);
          deduped.push(r);
        } else {
          removedCount++;
        }
      });

      if (removedCount > 0) {
        setRecords(deduped);
        localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(deduped));
        saveMasterSalesBatchToDb(deduped);

        addDataEditLog({
          user: 'Sistem Keamanan Master Data',
          action: 'Deduplikasi',
          month: selectedPeriod,
          recordsCount: removedCount,
          details: `Membersihkan ${removedCount} baris data duplikat persis dari Master Data.`
        });
      }
    } else if (mode === 'invoice_suffix') {
      // Fix duplicate invoice numbers by suffixing
      const invoiceCounts = new Map<string, number>();
      const fixed = records.map(r => {
        const inv = r.invoice.trim();
        const currentCount = invoiceCounts.get(inv) || 0;
        invoiceCounts.set(inv, currentCount + 1);

        if (currentCount > 0) {
          fixedCount++;
          return {
            ...r,
            invoice: `${inv}-REV${currentCount}`,
            keterangan: (r.keterangan ? `${r.keterangan} · ` : '') + 'Pemberian suffix invoice otomatis (duplikasi terdeteksi)'
          };
        }
        return r;
      });

      if (fixedCount > 0) {
        setRecords(fixed);
        localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(fixed));
        saveMasterSalesBatchToDb(fixed);

        addDataEditLog({
          user: 'Sistem Keamanan Master Data',
          action: 'Deduplikasi',
          month: selectedPeriod,
          recordsCount: fixedCount,
          details: `Menyelaraskan ${fixedCount} nomor invoice duplikat dengan penomoran unik.`
        });
      }
    }

    return { removedCount, fixedCount };
  };

  // Quotation handlers
  const addQuotation = async (quo: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newQuo: Quotation = {
      ...quo,
      id: `quo-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    const next = [newQuo, ...quotations];
    setQuotations(next);
    localStorage.setItem(STORAGE_KEY_QUOTATIONS, JSON.stringify(next));
  };

  const updateQuotation = async (quo: Quotation) => {
    const next = quotations.map(q => q.id === quo.id ? { ...quo, updatedAt: new Date().toISOString() } : q);
    setQuotations(next);
    localStorage.setItem(STORAGE_KEY_QUOTATIONS, JSON.stringify(next));
  };

  const deleteQuotation = async (id: string) => {
    const next = quotations.filter(q => q.id !== id);
    setQuotations(next);
    localStorage.setItem(STORAGE_KEY_QUOTATIONS, JSON.stringify(next));
  };

  const addQuotationFollowUp = async (quotationId: string, fu: Omit<QuotationFollowUp, 'id'>) => {
    const target = quotations.find(q => q.id === quotationId);
    if (!target) return;
    const newFu: QuotationFollowUp = {
      ...fu,
      id: `fu-${Date.now()}`
    };
    const updated: Quotation = {
      ...target,
      followUps: [newFu, ...(target.followUps || [])],
      updatedAt: new Date().toISOString()
    };
    await updateQuotation(updated);
  };

  // Incentive Selection by ID ELSA
  const toggleIncentiveRecord = (id: string) => {
    const isSelected = selectedIncentiveIds.includes(id);
    const updated = isSelected 
      ? selectedIncentiveIds.filter(item => item !== id)
      : [...selectedIncentiveIds, id];
    setSelectedIncentiveIds(updated);
  };

  const toggleIncentiveByElsaId = (elsaId: string, select: boolean) => {
    const matchingRecordIds = records
      .filter(r => r.nomorId === elsaId && r.isMyAuthority)
      .map(r => r.id);

    if (select) {
      const merged = Array.from(new Set([...selectedIncentiveIds, ...matchingRecordIds]));
      setSelectedIncentiveIds(merged);
    } else {
      const remaining = selectedIncentiveIds.filter(id => !matchingRecordIds.includes(id));
      setSelectedIncentiveIds(remaining);
    }
  };

  const selectAllIncentives = () => {
    const allAuthorityIds = records.filter(r => r.isMyAuthority).map(r => r.id);
    setSelectedIncentiveIds(allAuthorityIds);
  };

  const deselectAllIncentives = () => {
    setSelectedIncentiveIds([]);
  };

  const resetToAugustBenchmark = async () => {
    setRecords(RAW_AUGUST_2026_RECORDS);
    setJournals(INITIAL_JOURNAL_ENTRIES);
    setQuotations(INITIAL_QUOTATIONS);
    const initialIncentiveIds = RAW_AUGUST_2026_RECORDS.filter(r => r.isMyAuthority).map(r => r.id);
    setSelectedIncentiveIds(initialIncentiveIds);
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(RAW_AUGUST_2026_RECORDS));
    localStorage.setItem(STORAGE_KEY_JOURNALS, JSON.stringify(INITIAL_JOURNAL_ENTRIES));
    localStorage.setItem(STORAGE_KEY_QUOTATIONS, JSON.stringify(INITIAL_QUOTATIONS));
    await saveMasterSalesBatchToDb(RAW_AUGUST_2026_RECORDS);
  };

  return (
    <SalesDataContext.Provider
      value={{
        records,
        journals,
        quotations,
        selectedPeriod,
        setSelectedPeriod,
        portfolioOnly,
        setPortfolioOnly,
        clients,
        services,
        strategicMetrics,
        monthlyTarget,
        yearlyTarget,
        setMonthlyTarget,
        setYearlyTarget,
        isLoading,
        addRecords,
        updateRecord,
        deleteRecord,
        toggleRecordCorrection,
        replaceMonthRecords,
        deleteMonthRecords,
        monthlyFileMap,
        setMonthlyFileMeta,
        dataEditLogs,
        addDataEditLog,
        clearDataEditLogs,
        isMasterDataLocked,
        toggleMasterDataLock,
        resolveDuplicates,
        addJournalEntry,
        updateJournalEntry,
        deleteJournalEntry,
        addQuotation,
        updateQuotation,
        deleteQuotation,
        addQuotationFollowUp,
        selectedIncentiveIds,
        setSelectedIncentiveIds,
        toggleIncentiveRecord,
        toggleIncentiveByElsaId,
        selectAllIncentives,
        deselectAllIncentives,
        resetToAugustBenchmark,
      }}
    >
      {children}
    </SalesDataContext.Provider>
  );
};

export const useSalesData = (): SalesDataContextType => {
  const context = useContext(SalesDataContext);
  if (!context) {
    throw new Error('useSalesData must be used within a SalesDataProvider');
  }
  return context;
};
