import { MasterSalesRecord, ClientProfile, TestingServiceSummary } from '../types';

export function deriveClientProfiles(records: MasterSalesRecord[]): ClientProfile[] {
  const map = new Map<string, {
    company: string;
    nomorId: string;
    contactPerson: string;
    phone: string;
    email: string;
    npwp: string;
    dates: string[];
    totalDpp: number;
    portfolioDpp: number;
    services: Set<string>;
    records: MasterSalesRecord[];
  }>();

  records.forEach((r) => {
    const key = (r.company || 'Unknown Client').trim().toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        company: r.company || 'Unknown Client',
        nomorId: r.nomorId || '',
        contactPerson: r.contactPersonName || '',
        phone: r.mobilePhone || '',
        email: r.personalEmail || '',
        npwp: r.npwp || '',
        dates: [],
        totalDpp: 0,
        portfolioDpp: 0,
        services: new Set<string>(),
        records: []
      });
    }

    const entry = map.get(key)!;
    if (r.nomorId && !entry.nomorId) entry.nomorId = r.nomorId;
    if (r.contactPersonName && !entry.contactPerson) entry.contactPerson = r.contactPersonName;
    if (r.mobilePhone && !entry.phone) entry.phone = r.mobilePhone;
    if (r.personalEmail && !entry.email) entry.email = r.personalEmail;
    if (r.npwp && !entry.npwp) entry.npwp = r.npwp;

    if (r.dateParsed) entry.dates.push(r.dateParsed);
    entry.totalDpp += r.dppTotal || 0;
    if (r.isMyAuthority) {
      entry.portfolioDpp += r.dppTotal || 0;
    }
    if (r.layananPengujian) entry.services.add(r.layananPengujian);
    entry.records.push(r);
  });

  const profiles: ClientProfile[] = [];

  map.forEach((entry, key) => {
    entry.dates.sort();
    const firstDate = entry.dates[0] || '2026-08-01';
    const lastDate = entry.dates[entry.dates.length - 1] || '2026-08-31';

    // Tier calculation
    let tier = entry.records[0]?.clientTier || 'Klien Baru';
    if (entry.records.length > 2) {
      tier = 'Repeat Order <1 Thn';
    }

    // Determine activity status based on last date in August
    // If last date was before Aug 15: At Risk; if after: Active
    const day = parseInt(lastDate.split('-')[2] || '31', 10);
    let status: 'Active' | 'At Risk' | 'Dormant' = 'Active';
    if (day < 10) {
      status = 'Dormant';
    } else if (day < 20) {
      status = 'At Risk';
    }

    // Industry estimation based on client name
    let industry = 'Industri Umum';
    const lower = entry.company.toLowerCase();
    if (lower.includes('walet') || lower.includes('nest') || lower.includes('indonest')) {
      industry = 'Ekspor Sarang Burung Walet';
    } else if (lower.includes('farma') || lower.includes('combiphar') || lower.includes('medika') || lower.includes('nirmala')) {
      industry = 'Farmasi & Healthcare';
    } else if (lower.includes('universitas') || lower.includes('institut') || lower.includes('ugm') || lower.includes('ipb') || lower.includes('binus') || lower.includes('unri')) {
      industry = 'Akademik & Riset Kampus';
    } else if (lower.includes('geo') || lower.includes('engineering') || lower.includes('pipe') || lower.includes('wiralab') || lower.includes('tuv')) {
      industry = 'Engineering, Geothermal & Inspeksi';
    } else if (lower.includes('nutrisi') || lower.includes('boga') || lower.includes('pangan') || lower.includes('kalbe') || lower.includes('terra')) {
      industry = 'Makanan, Nutrisi & Agrikultur';
    }

    // Collect all distinct ELSA IDs submitted by this client
    const idSet = new Set<string>();
    entry.records.forEach(r => {
      if (r.nomorId && r.nomorId.trim()) {
        idSet.add(r.nomorId.trim());
      }
    });
    const allNomorIds = Array.from(idSet);
    const primaryNomorId = allNomorIds[allNomorIds.length - 1] || entry.nomorId || '-';

    // Construct detailed historical ledger of all ELSA orders
    const elsaHistory = entry.records.map(r => ({
      id: r.id,
      nomorId: r.nomorId || primaryNomorId,
      invoice: r.invoice,
      date: r.tanggalSampel || r.dateParsed,
      service: r.layananPengujian,
      sampleCount: r.jumlahSampel,
      dpp: r.dppTotal,
      paymentStatus: r.paymentStatus,
      isMyAuthority: r.isMyAuthority,
      keterangan: r.keterangan || r.urgentNote,
      needsCorrection: r.needsCorrection
    })).sort((a, b) => b.date.localeCompare(a.date));

    profiles.push({
      id: `client-${primaryNomorId || key.replace(/\s+/g, '-').slice(0, 20)}`,
      companyName: entry.company,
      nomorId: primaryNomorId,
      allNomorIds,
      elsaHistory,
      contactPerson: entry.contactPerson,
      phone: entry.phone,
      email: entry.email,
      npwp: entry.npwp,
      industry,
      clientTier: tier,
      firstTransactionDate: firstDate,
      lastTransactionDate: lastDate,
      totalOrdersCount: entry.records.length,
      totalDppSpend: entry.totalDpp,
      portfolioDppSpend: entry.portfolioDpp,
      orderedServices: Array.from(entry.services),
      status,
    });
  });

  // Sort by highest portfolio spend first
  return profiles.sort((a, b) => b.portfolioDppSpend - a.portfolioDppSpend);
}

export function deriveTestingServices(records: MasterSalesRecord[]): TestingServiceSummary[] {
  const map = new Map<string, {
    serviceName: string;
    category: any;
    isMyAuthority: boolean;
    prices: number[];
    samples: number;
    dpp: number;
    clients: Set<string>;
  }>();

  records.forEach((r) => {
    const key = (r.layananPengujian || 'Unknown Service').trim();
    if (!map.has(key)) {
      map.set(key, {
        serviceName: key,
        category: r.kategoriLayanan,
        isMyAuthority: r.isMyAuthority,
        prices: [],
        samples: 0,
        dpp: 0,
        clients: new Set<string>(),
      });
    }

    const entry = map.get(key)!;
    if (r.hargaPerSampel > 0) entry.prices.push(r.hargaPerSampel);
    entry.samples += r.jumlahSampel || 1;
    entry.dpp += r.dppTotal || 0;
    if (r.company) entry.clients.add(r.company);
  });

  const summaries: TestingServiceSummary[] = [];

  map.forEach((entry, key) => {
    const avgPrice = entry.prices.length > 0
      ? Math.round(entry.prices.reduce((a, b) => a + b, 0) / entry.prices.length)
      : 0;

    summaries.push({
      id: `srv-${key.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 25).toLowerCase()}`,
      serviceName: entry.serviceName,
      category: entry.category,
      isMyAuthority: entry.isMyAuthority,
      basePrice: avgPrice,
      sampleCount: entry.samples,
      totalDppRevenue: entry.dpp,
      clientCount: entry.clients.size,
      topClients: Array.from(entry.clients).slice(0, 5),
    });
  });

  return summaries.sort((a, b) => b.totalDppRevenue - a.totalDppRevenue);
}

// Identify cross-sell whitespace for top clients in user's portfolio
export function generateCrossSellRecommendations(clients: ClientProfile[], services: TestingServiceSummary[]) {
  const myServices = services.filter(s => s.isMyAuthority);
  const recommendations: Array<{
    clientName: string;
    industry: string;
    currentServices: string[];
    recommendedService: string;
    potentialDpp: number;
    rationale: string;
  }> = [];

  clients.forEach(c => {
    if (c.portfolioDppSpend > 0 || c.orderedServices.length > 0) {
      const lowerUsed = c.orderedServices.map(s => s.toLowerCase()).join(' ');

      // If used IRMS but not ICP-MS
      if (lowerUsed.includes('irms') && !lowerUsed.includes('icp-ms')) {
        recommendations.push({
          clientName: c.companyName,
          industry: c.industry,
          currentServices: c.orderedServices.slice(0, 2),
          recommendedService: 'Jasa Analisis Multi Elemen Logam Menggunakan ICP-MS',
          potentialDpp: 3600000,
          rationale: 'Klien eksplorasi panas bumi / geologi membutuhkan validasi multi-elemen logam terlarut bersamaan dengan rasio isotop.'
        });
      }

      // If used PSA but not Zeta Potensial
      if (lowerUsed.includes('psa') && !lowerUsed.includes('zeta')) {
        recommendations.push({
          clientName: c.companyName,
          industry: c.industry,
          currentServices: c.orderedServices.slice(0, 2),
          recommendedService: 'Karakterisasi Lanjut Analisa Muatan Partikel (Zeta Potensial)',
          potentialDpp: 1400000,
          rationale: 'Analisis stabilitas dispersi dan emulsi biasanya mewajibkan Zeta Potensial mendampingi Particle Size Analyzer.'
        });
      }

      // If used GCMS or HPLC but not NMR
      if ((lowerUsed.includes('gcms') || lowerUsed.includes('hplc')) && !lowerUsed.includes('nmr') && (c.industry.includes('Farmasi') || c.industry.includes('Akademik'))) {
        recommendations.push({
          clientName: c.companyName,
          industry: c.industry,
          currentServices: c.orderedServices.slice(0, 2),
          recommendedService: 'Karakterisasi Lanjut Analisa NMR BRUKER ASCEND 700MHz',
          potentialDpp: 5000000,
          rationale: 'Elusidasi struktur senyawa aktif dan validasi kemurnian molekuler farmasi tingkat lanjut.'
        });
      }

      // If used FTIR but not TGA
      if (lowerUsed.includes('ftir') && !lowerUsed.includes('tga')) {
        recommendations.push({
          clientName: c.companyName,
          industry: c.industry,
          currentServices: c.orderedServices.slice(0, 2),
          recommendedService: 'Karakterisasi Analisis Thermogravimetri (TGA)',
          potentialDpp: 2000000,
          rationale: 'Karakterisasi dekomposisi termal komplementer dengan spektroskopi gugus fungsi inframerah.'
        });
      }
    }
  });

  return recommendations.slice(0, 8);
}
