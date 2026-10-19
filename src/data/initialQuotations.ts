import { Quotation } from '../types';

export const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'quo-2026-001',
    quotationNumber: 'QUO/202608/001',
    date: '2026-08-03',
    idElsa: '24-001099',
    company: 'Bio Corpora Indonesia',
    contactPerson: 'Bpk. Hendra S.',
    phone: '081298451120',
    email: 'hendra@biocorpora.co.id',
    layananPengujian: 'Jasa Pengujian Isotop Rasio IRMS 13C & 15N',
    kategoriLayanan: 'Isotop Rasio IRMS',
    sampleCount: 10,
    pricePerSample: 1500000,
    dppTotal: 15000000,
    ppn11: 1650000,
    totalAmount: 16650000,
    status: 'Won',
    validUntil: '2026-09-03',
    followUps: [
      {
        id: 'fu-1',
        date: '2026-08-04',
        actionType: 'Telepon / WhatsApp',
        picName: 'Bpk. Hendra S.',
        notes: 'Konfirmasi ketersediaan instrumen IRMS dan validasi rentang waktu pengerjaan 10 hari.',
        nextActionDate: '2026-08-06',
        nextActionPlan: 'Follow up persetujuan PO dan jadwal kirim sampel batch 1.'
      },
      {
        id: 'fu-2',
        date: '2026-08-06',
        actionType: 'Meeting Teknis',
        picName: 'Bpk. Hendra S.',
        notes: 'Klien menyetujui penawaran harga. PO nomor PO-BCI-088 terbit dan sampel dikirim.',
        nextActionDate: '2026-08-07',
        nextActionPlan: 'Masuk ke pengerjaan lab & penerbitan invoice.'
      }
    ],
    notes: 'Penawaran disetujui, masuk ke invoice ILI/202608/0101.',
    createdAt: '2026-08-03T09:00:00Z',
    updatedAt: '2026-08-06T14:30:00Z'
  },
  {
    id: 'quo-2026-002',
    quotationNumber: 'QUO/202608/002',
    date: '2026-08-07',
    idElsa: '24-001004',
    company: 'PT Geoservices Ltd',
    contactPerson: 'Ibu Ratna Dewi',
    phone: '08118834920',
    email: 'ratna.dewi@geoservices.com',
    layananPengujian: 'Jasa Pengujian Karakterisasi Permukaan Chemisorption & TGA',
    kategoriLayanan: 'Termal & Sorpsi (TGA / Chemisorption)',
    sampleCount: 4,
    pricePerSample: 2200000,
    dppTotal: 8800000,
    ppn11: 968000,
    totalAmount: 9768000,
    status: 'Won',
    validUntil: '2026-09-07',
    followUps: [
      {
        id: 'fu-3',
        date: '2026-08-09',
        actionType: 'Email Follow-up',
        picName: 'Ibu Ratna Dewi',
        notes: 'Kirimkan proposal teknis preparasi katalis sebelum pemanasan di instrumen TGA.',
        nextActionDate: '2026-08-11',
        nextActionPlan: 'Telepon konfirmasi approval user laboratorium tambang.'
      }
    ],
    notes: 'Penawaran disetujui tanpa diskon tambahan.',
    createdAt: '2026-08-07T10:15:00Z',
    updatedAt: '2026-08-11T11:00:00Z'
  },
  {
    id: 'quo-2026-003',
    quotationNumber: 'QUO/202608/003',
    date: '2026-08-14',
    idElsa: '23-000851',
    company: 'PT Pratapa Nirmala (Fahrenheit)',
    contactPerson: 'Bpk. Agus Santoso',
    phone: '081310992384',
    email: 'agus.s@fahrenheit.co.id',
    layananPengujian: 'Jasa Validasi Metode HPLC-DAD Kemurnian Bahan Baku Obat',
    kategoriLayanan: 'Kromatografi (HPLC / GCMS)',
    sampleCount: 6,
    pricePerSample: 2800000,
    dppTotal: 16800000,
    ppn11: 1848000,
    totalAmount: 18648000,
    status: 'Negosiasi',
    validUntil: '2026-09-14',
    needsCorrection: true,
    correctionNote: 'Memerlukan kolom HPLC khusus USP L1 C18 5um dan validasi reprodusibilitas 6 replikasi',
    followUps: [
      {
        id: 'fu-4',
        date: '2026-08-18',
        actionType: 'Negosiasi Harga',
        picName: 'Bpk. Agus Santoso',
        notes: 'Klien meminta negosiasi paket apabila order rutin bulanan mencapai >15 sampel.',
        nextActionDate: '2026-08-25',
        nextActionPlan: 'Ajukan skema bundling kuartalan dengan persetujuan manajer sales.'
      }
    ],
    notes: 'Klien prospek tinggi, potensi repeat order farmasi reguler.',
    createdAt: '2026-08-14T11:00:00Z',
    updatedAt: '2026-08-18T16:20:00Z'
  },
  {
    id: 'quo-2026-004',
    quotationNumber: 'QUO/202608/004',
    date: '2026-08-19',
    idElsa: '24-001188',
    company: 'PT Valenza Engineering',
    contactPerson: 'Bpk. Donny Kurniawan',
    phone: '085712993821',
    email: 'donny@valenza.co.id',
    layananPengujian: 'Jasa Analisis Distribusi Ukuran Partikel (PSA) & Zeta Potential',
    kategoriLayanan: 'Spektrometri & Partikel (PSA / ICP-MS / XRF)',
    sampleCount: 5,
    pricePerSample: 1200000,
    dppTotal: 6000000,
    ppn11: 660000,
    totalAmount: 6660000,
    status: 'Follow Up',
    validUntil: '2026-09-19',
    followUps: [
      {
        id: 'fu-5',
        date: '2026-08-22',
        actionType: 'Telepon / WhatsApp',
        picName: 'Bpk. Donny Kurniawan',
        notes: 'Follow up apakah sampel serbuk polimer siap dikirim ke laboratorium.',
        nextActionDate: '2026-08-29',
        nextActionPlan: 'Kirim reminder jadwal antrean instrumen PSA minggu depan.'
      }
    ],
    notes: 'Menunggu konfirmasi preparasi sampel dari departemen R&D klien.',
    createdAt: '2026-08-19T08:30:00Z',
    updatedAt: '2026-08-22T09:45:00Z'
  },
  {
    id: 'quo-2026-005',
    quotationNumber: 'QUO/202608/005',
    date: '2026-08-21',
    idElsa: '24-001211',
    company: 'Laboratorium Sentral Universitas Diponegoro',
    contactPerson: 'Dr. Tri Wibowo',
    phone: '081234567812',
    email: 'tri.wibowo@undip.ac.id',
    layananPengujian: 'Jasa Spektroskopi Resonansi Magnetik Inti (1H-NMR & 13C-NMR 500 MHz)',
    kategoriLayanan: 'Spektroskopi (FTIR / NMR)',
    sampleCount: 8,
    pricePerSample: 1100000,
    dppTotal: 8800000,
    ppn11: 968000,
    totalAmount: 9768000,
    status: 'Won',
    validUntil: '2026-09-21',
    followUps: [
      {
        id: 'fu-6',
        date: '2026-08-23',
        actionType: 'Meeting Teknis',
        picName: 'Dr. Tri Wibowo',
        notes: 'Pembahasan parameter solven deuterated DMSO-d6 dan CDCl3 untuk senyawa sintesis.',
        nextActionDate: '2026-08-26',
        nextActionPlan: 'Penerbitan surat pengantar sampel dan nomor invoice.'
      }
    ],
    notes: 'Penawaran dimenangkan, didanai hibah riset kementerian.',
    createdAt: '2026-08-21T13:00:00Z',
    updatedAt: '2026-08-23T15:10:00Z'
  },
  {
    id: 'quo-2026-006',
    quotationNumber: 'QUO/202608/006',
    date: '2026-08-24',
    idElsa: '24-000942',
    company: 'PT Clemira Sukses Bersama',
    contactPerson: 'Ibu Maya Lestari',
    phone: '081988273641',
    email: 'maya@clemira.co.id',
    layananPengujian: 'Jasa Analisis Logam Berat Trace Level ICP-MS (Pb, Cd, As, Hg)',
    kategoriLayanan: 'Spektrometri & Partikel (PSA / ICP-MS / XRF)',
    sampleCount: 12,
    pricePerSample: 850000,
    dppTotal: 10200000,
    ppn11: 1122000,
    totalAmount: 11322000,
    status: 'Terkirim',
    validUntil: '2026-09-24',
    needsCorrection: true,
    correctionNote: 'Perlu digesti gelombang mikro (microwave digestion) dengan asam nitrat ultra murni (Suprapur)',
    followUps: [
      {
        id: 'fu-7',
        date: '2026-08-26',
        actionType: 'Email Follow-up',
        picName: 'Ibu Maya Lestari',
        notes: 'Quotation resmi dikirim via email beserta sertifikat kalibrasi ICP-MS.',
        nextActionDate: '2026-08-30',
        nextActionPlan: 'Hubungi via WhatsApp untuk memastikan surat penawaran diterima manajemen.'
      }
    ],
    notes: 'Quotation baru terkirim, menunggu review komite pengadaan.',
    createdAt: '2026-08-24T14:20:00Z',
    updatedAt: '2026-08-26T10:00:00Z'
  },
  {
    id: 'quo-2026-007',
    quotationNumber: 'QUO/202608/007',
    date: '2026-08-10',
    idElsa: '23-000412',
    company: 'PT Nutri Chemika Mandiri',
    contactPerson: 'Bpk. Fajar Ramadhan',
    phone: '081299887711',
    email: 'fajar@nutrichemika.com',
    layananPengujian: 'Jasa Karakterisasi Luas Permukaan BET Chemisorption',
    kategoriLayanan: 'Termal & Sorpsi (TGA / Chemisorption)',
    sampleCount: 3,
    pricePerSample: 2500000,
    dppTotal: 7500000,
    ppn11: 825000,
    totalAmount: 8325000,
    status: 'Lost',
    validUntil: '2026-09-10',
    followUps: [
      {
        id: 'fu-8',
        date: '2026-08-15',
        actionType: 'Telepon / WhatsApp',
        picName: 'Bpk. Fajar Ramadhan',
        notes: 'Klien menginfokan memilih vendor uji lain karena jadwal running instrumen kompetitor lebih cepat 2 hari.',
        nextActionDate: '2026-08-16',
        nextActionPlan: 'Catat objection kompetitor di jurnal dan tawarkan diskon uji berikutnya.'
      }
    ],
    notes: 'Kalah pada faktor TAT waktu pengerjaan instrumen.',
    createdAt: '2026-08-10T11:00:00Z',
    updatedAt: '2026-08-15T16:00:00Z'
  }
];
