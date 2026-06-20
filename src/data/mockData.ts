import { Service, Client, Project, Incentive, SalesEmployee } from '../types';

export const INITIAL_SERVICES: Service[] = [
  {
    id: 's1',
    serviceCode: 'CHEM-001',
    name: 'Uji Kadar Logam Berat (Pb, Cd, Hg, As)',
    category: 'Kimia Anorganik',
    description: 'Analisis kuantitatif kandungan logam berat beracun menggunakan instrumentasi spektrometri canggih untuk kepatuhan regulasi lingkungan atau pangan.',
    method: 'ICP-OES (EPA Method 6010D)',
    tatDays: 7,
    price: 1500000,
  },
  {
    id: 's2',
    serviceCode: 'CHEM-002',
    name: 'Uji Proksimat Lengkap (Air, Abu, Lemak, Protein, Karbohidrat)',
    category: 'Pangan & Nutrisi',
    description: 'Analisis nilai gizi lengkap produk pangan untuk pembuatan tabel Nutrition Facts sesuai standar BPOM.',
    method: 'AOAC Official Methods 2019',
    tatDays: 5,
    price: 2500000,
  },
  {
    id: 's3',
    serviceCode: 'ENV-001',
    name: 'Analisis Kualitas Air Limbah Industri Komprehensif',
    category: 'Lingkungan',
    description: 'Pengujian parameter mandatory air limbah (BOD, COD, TSS, pH, Amonia, Minyak Lemak) sesuai baku mutu Pemerintah.',
    method: 'SNI 6989 Series / Standard Methods',
    tatDays: 10,
    price: 3500000,
  },
  {
    id: 's4',
    serviceCode: 'CHEM-004',
    name: 'Identifikasi Senyawa Organik Volatil (VOC)',
    category: 'Kimia Organik',
    description: 'Analisis kualitatif dan kuantitatif residu pelarut organik atau cemaran senyawa volatil dalam sampel polimer atau udara.',
    method: 'GC-MS Headspace',
    tatDays: 8,
    price: 4200000,
  },
  {
    id: 's5',
    serviceCode: 'CHEM-005',
    name: 'Penentuan Kadar Pestisida Multi-Residu',
    category: 'Agrokontrol',
    description: 'Skrining kontaminasi residu pestisida golongan organofosfat, organoklorin, dan karbamat pada produk hortikultura.',
    method: 'LC-MS/MS Triple Quadrupole',
    tatDays: 6,
    price: 5800000,
  },
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c1',
    companyName: 'PT Indo Pangan Sentosa',
    industry: 'Makanan & Minuman',
    address: 'Kawasan Industri Jababeka Tahap II Blok B-12, Cikarang, Jawa Barat',
    email: 'info@indopangan.co.id',
    phone: '021-89830022',
    website: 'www.indopangan.co.id',
    picName: 'Hendra Setiawan',
    picPosition: 'QA/QC Manager',
    picEmail: 'hendra.s@indopangan.co.id',
    picPhone: '0812-3456-7890',
    leadSource: 'Referral',
    potentialRevenue: 25000000,
    assignedSales: 'Budi Santoso',
    status: 'Won',
    isFirstTransaction: false, // repeat clients
    createdAt: '2026-01-15T09:00:00Z',
    activityNotes: [
      { id: 'n1', date: '2026-01-15', note: 'Kontak pertama melalui email, tertarik uji proksimat produk mi instan baru.', author: 'Budi Santoso' },
      { id: 'n2', date: '2026-01-18', note: 'Sampel dikirim dan quotation disetujui. Pembayaran DP selesai.', author: 'Budi Santoso' }
    ]
  },
  {
    id: 'c2',
    companyName: 'PT Bio Farma Lestari',
    industry: 'Farmasi & Kosmetik',
    address: 'Jl. Surya Kencana No. 45, Bogor, Jawa Barat',
    email: 'regulatory@biofarmalestari.com',
    phone: '0251-8312900',
    website: 'www.biofarmalestari.com',
    picName: 'Dewi Lestari',
    picPosition: 'Regulatory Affairs Specialist',
    picEmail: 'dewi.lestari@biofarmalestari.com',
    picPhone: '0811-987-654',
    leadSource: 'Event',
    potentialRevenue: 15000000,
    assignedSales: 'Siti Rahma',
    status: 'Won',
    isFirstTransaction: true, // Brand New Client
    createdAt: '2026-05-10T10:30:00Z',
    activityNotes: [
      { id: 'n3', date: '2026-05-10', note: 'Bertemu di pameran. Butuh uji kadar cemaran timbal (Pb) di produk kosmetik bedak bayi terbaru.', author: 'Siti Rahma' },
      { id: 'n4', date: '2026-05-12', note: 'Mengirimkan penawaran khusus diskon perdana 10% untuk uji logam berat.', author: 'Siti Rahma' }
    ]
  },
  {
    id: 'c3',
    companyName: 'PT Energy Makmur Sejahtera',
    industry: 'Pertambangan & Energi',
    address: 'Sudirman Central Business District (SCBD) Lot 9, Jakarta Selatan',
    email: 'contact@energymakmur.com',
    phone: '021-5152330',
    website: 'www.energymakmur.com',
    picName: 'Agus Prayogo',
    picPosition: 'HSE Coordinator',
    picEmail: 'a.prayogo@energymakmur.com',
    picPhone: '0813-2233-4455',
    leadSource: 'Website',
    potentialRevenue: 35000000,
    assignedSales: 'Andi Wijaya',
    status: 'Negotiation',
    isFirstTransaction: true,
    createdAt: '2026-06-01T14:15:00Z',
    activityNotes: [
      { id: 'n5', date: '2026-06-01', note: 'Mengisi form di website untuk pengujian air limbah pertambangan batubara.', author: 'Andi Wijaya' },
      { id: 'n6', date: '2026-06-05', note: 'Mengirimkan draf quotation harga paket pengujian bulanan (bulky volume). Sedang direview direksi.', author: 'Andi Wijaya' }
    ]
  },
  {
    id: 'c4',
    companyName: 'CV Tani Maju Selaras',
    industry: 'Pertanian & Perkebunan',
    address: 'Jl. Raya Temanggung-Magelang KM 7, Temanggung, Jawa Tengah',
    email: 'tanimajuselaras@gmail.com',
    phone: '0293-491102',
    website: 'www.tanimajuselaras.com',
    picName: 'Joko Widodo',
    picPosition: 'Kepala Kebun Produksi',
    picEmail: 'joko.tanimaju@gmail.com',
    picPhone: '0857-4321-0987',
    leadSource: 'LinkedIn',
    potentialRevenue: 8500000,
    assignedSales: 'Siti Rahma',
    status: 'Proposal Sent',
    isFirstTransaction: true,
    createdAt: '2026-06-11T08:45:00Z',
    activityNotes: [
      { id: 'n7', date: '2026-06-11', note: 'Tertarik menguji residu pestisida di sampel sayur kubis ekspor ke Singapura.', author: 'Siti Rahma' }
    ]
  },
  {
    id: 'c5',
    companyName: 'PT Global Tekstil Mandiri',
    industry: 'Tekstil & Garment',
    address: 'Kawasan Industri Rancaekek KM 21.5, Bandung, Jawa Barat',
    email: 'lab@globaltekstil.co.id',
    phone: '022-7798800',
    website: 'www.globaltekstil.co.id',
    picName: 'Rina Herawati',
    picPosition: 'QC Chemist Specialist',
    picEmail: 'rina.h@globaltekstil.co.id',
    picPhone: '0812-4455-6677',
    leadSource: 'Pencarian Google (SEO)',
    potentialRevenue: 6000000,
    assignedSales: 'Budi Santoso',
    status: 'Won',
    isFirstTransaction: true, // Brand New Client
    createdAt: '2026-05-18T11:00:00Z',
    activityNotes: [
      { id: 'n8', date: '2026-05-18', note: 'Butuh uji pH dan logam berat khusus pada pewarna kimia tekstil ekspor.', author: 'Budi Santoso' }
    ]
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'LAB-2026-001',
    clientId: 'c1',
    clientName: 'PT Indo Pangan Sentosa',
    serviceId: 's2',
    serviceName: 'Uji Proksimat Lengkap (Air, Abu, Lemak, Protein, Karbohidrat)',
    serviceCategory: 'Pangan & Nutrisi',
    sampleQuantity: 3,
    startDate: '2026-06-10',
    dueDate: '2026-06-15',
    assignedSales: 'Budi Santoso',
    status: 'Report Released',
    progressPercent: 100,
    totalPrice: 7500000, // 3 * 2.5jt
    paymentStatus: 'Paid',
    quotationNumber: 'QT-2026-0129',
    idElsa: '381902'
  },
  {
    id: 'LAB-2026-002',
    clientId: 'c2',
    clientName: 'PT Bio Farma Lestari',
    serviceId: 's1',
    serviceName: 'Uji Kadar Logam Berat (Pb, Cd, Hg, As)',
    serviceCategory: 'Kimia Anorganik',
    sampleQuantity: 10,
    startDate: '2026-06-12',
    dueDate: '2026-06-19',
    assignedSales: 'Siti Rahma',
    status: 'In Progress',
    progressPercent: 65,
    totalPrice: 15000000, // 10 * 1.5jt
    paymentStatus: 'Paid', // Pre-paid, which satisfies paid condition for first transaction!
    quotationNumber: 'QT-2026-0144',
    idElsa: '810574'
  },
  {
    id: 'LAB-2026-003',
    clientId: 'c5',
    clientName: 'PT Global Tekstil Mandiri',
    serviceId: 's1',
    serviceName: 'Uji Kadar Logam Berat (Pb, Cd, Hg, As)',
    serviceCategory: 'Kimia Anorganik',
    sampleQuantity: 4,
    startDate: '2026-06-14',
    dueDate: '2026-06-21',
    assignedSales: 'Budi Santoso',
    status: 'Completed', // Met the testing completeness condition!
    progressPercent: 100,
    totalPrice: 6000000, // 4 * 1.5jt
    paymentStatus: 'Paid', // Met payment condition!
    quotationNumber: 'QT-2026-0158',
    idElsa: '629851'
  },
  {
    id: 'LAB-2026-004',
    clientId: 'c2',
    clientName: 'PT Bio Farma Lestari',
    serviceId: 's4',
    serviceName: 'Identifikasi Senyawa Organik Volatil (VOC)',
    serviceCategory: 'Kimia Organik',
    sampleQuantity: 2,
    startDate: '2026-06-15',
    dueDate: '2026-06-23',
    assignedSales: 'Siti Rahma',
    status: 'Sample Received',
    progressPercent: 30,
    totalPrice: 8400000, // 2 * 4.2jt
    paymentStatus: 'Unpaid',
    quotationNumber: 'QT-2026-0160',
    idElsa: '442109'
  },
  {
    id: 'LAB-2026-005',
    clientId: 'c1',
    clientName: 'PT Indo Pangan Sentosa',
    serviceId: 's3',
    serviceName: 'Uji Mikrobiologi & Sterilitas Wadah Makanan',
    serviceCategory: 'Mikrobiologi',
    sampleQuantity: 5,
    startDate: '2026-06-10',
    dueDate: '2026-06-16', // Overdue since current date is 2026-06-18
    assignedSales: 'Budi Santoso',
    status: 'In Progress',
    progressPercent: 40,
    totalPrice: 4750000,
    paymentStatus: 'Unpaid',
    quotationNumber: 'QT-2026-0165',
    idElsa: '298101'
  }
];

export const INITIAL_INCENTIVES: Incentive[] = [
  {
    id: 'inc-1',
    projectId: 'LAB-2026-003', // LAB-2026-003 is PT Global Tekstil Mandiri. It's completed and paid, First Transaction is true.
    clientName: 'PT Global Tekstil Mandiri',
    serviceName: 'Uji Kadar Logam Berat (Pb, Cd, Hg, As)',
    salesName: 'Budi Santoso',
    serviceValue: 6000000,
    incentiveValue: 150000, // 2.5% of 6,000,000
    paymentStatus: 'Paid',
    isPaid: true,
    createdAt: '2026-06-15T17:00:00Z'
  }
];

export const INITIAL_SALES_EMPLOYEES: SalesEmployee[] = [
  {
    id: 'sales-1',
    name: 'Budi Santoso',
    email: 'budi.santoso@chemlab.co.id',
    phone: '0812-7788-9900',
    role: 'Senior Sales Executive',
    targetMonthly: 50000000,
    achievedThisMonth: 13500000, // LAB-2026-001 (7.5jt) + LAB-2026-003 (6jt - completed)
    status: 'Active',
    createdAt: '2026-01-01T08:00:00Z'
  },
  {
    id: 'sales-2',
    name: 'Siti Rahma',
    email: 'siti.rahma@chemlab.co.id',
    phone: '0813-1122-3344',
    role: 'Sales Representative',
    targetMonthly: 30000000,
    achievedThisMonth: 15000000, // LAB-2026-002 (In Progress - 15jt)
    status: 'Active',
    createdAt: '2026-02-15T08:00:00Z'
  },
  {
    id: 'sales-3',
    name: 'Andi Wijaya',
    email: 'andi.wijaya@chemlab.co.id',
    phone: '0857-5566-7788',
    role: 'Account Executive',
    targetMonthly: 40000000,
    achievedThisMonth: 0,
    status: 'Active',
    createdAt: '2026-03-10T08:00:00Z'
  }
];

