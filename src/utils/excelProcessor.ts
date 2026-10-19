import * as XLSX from 'xlsx';
import { MasterSalesRecord, ClientTier } from '../types';
import { parseIndonesianCurrency, categorizeService, parseIndonesianDateToIso } from '../data/rawAugustData';

export interface ImportValidationResult {
  records: MasterSalesRecord[];
  errors: string[];
  totalRowsProcessed: number;
  totalMyAuthorityRows: number;
  totalDpp: number;
  myAuthorityDpp: number;
}

export function parseExcelFile(file: File, clientHistoryMap: Map<string, { firstDate: string; count: number }>): Promise<ImportValidationResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to array of arrays or json
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        if (!rawJson || rawJson.length < 2) {
          return resolve({
            records: [],
            errors: ['File Excel kosong atau format header tidak terdeteksi.'],
            totalRowsProcessed: 0,
            totalMyAuthorityRows: 0,
            totalDpp: 0,
            myAuthorityDpp: 0
          });
        }

        // Find header row (the row containing 'company' or 'layanan pengujian')
        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(10, rawJson.length); i++) {
          const rowStr = rawJson[i].map((c: any) => String(c).toLowerCase()).join(' ');
          if (rowStr.includes('company') || rowStr.includes('layanan pengujian') || rowStr.includes('dpp')) {
            headerRowIdx = i;
            break;
          }
        }

        if (headerRowIdx === -1) {
          headerRowIdx = 0; // fallback
        }

        const headers: string[] = rawJson[headerRowIdx].map((c: any) => String(c).trim().toLowerCase());
        
        // Find column indices
        const findCol = (keywords: string[]): number => {
          return headers.findIndex(h => keywords.some(k => h.includes(k)));
        };

        const jamIdx = findCol(['jam masuk', 'jam']);
        const tglIdx = findCol(['tanggal sampel', 'tanggal diterima', 'tanggal']);
        const compIdx = findCol(['company', 'perusahaan', 'klien']);
        const noIdIdx = findCol(['nomor id', 'id elsa', 'no id']);
        const picIdx = findCol(['contact person', 'pic', 'kontak']);
        const phoneIdx = findCol(['mobile phone', 'telepon', 'phone', 'hp']);
        const emailIdx = findCol(['personal email', 'email']);
        const npwpIdx = findCol(['npwp']);
        const invIdx = findCol(['invoice', 'no invoice', 'no transaksi']);
        const layIdx = findCol(['layanan pengujian', 'layanan', 'service', 'pengujian']);
        const jmlIdx = findCol(['jumlah sampel', 'jumlah', 'qty']);
        const hrgIdx = findCol(['harga per sampel', 'harga']);
        const dppIdx = findCol(['dpp', 'total harga', 'harga sebelum ppn']);
        const ppnIdx = findCol(['ppn']);
        const totIdx = findCol(['total +ppn', 'total', 'grand total']);
        const payIdx = findCol(['payment', 'pembayaran', 'status pembayaran']);
        const ketIdx = findCol(['keterangan', 'notes', 'catatan']);

        const records: MasterSalesRecord[] = [];
        const errors: string[] = [];

        let totalDpp = 0;
        let myAuthorityDpp = 0;
        let totalMyAuthorityRows = 0;

        for (let r = headerRowIdx + 1; r < rawJson.length; r++) {
          const row = rawJson[r];
          if (!row || row.every((cell: any) => !cell || String(cell).trim() === '')) {
            continue; // Skip empty rows
          }

          const rawCompany = compIdx >= 0 ? String(row[compIdx] || '').trim() : '';
          const rawLayanan = layIdx >= 0 ? String(row[layIdx] || '').trim() : '';
          
          // Skip summary row like "Total"
          if (rawCompany.toLowerCase() === 'total' || rawLayanan.toLowerCase() === 'total' || rawCompany.includes('total dpp')) {
            continue;
          }

          if (!rawCompany && !rawLayanan) {
            continue; // likely blank filler row
          }

          const jamMasuk = jamIdx >= 0 ? String(row[jamIdx] || '').trim() : '08:00';
          const tanggalSampel = tglIdx >= 0 ? String(row[tglIdx] || '').trim() : '3 Agustus 2026';
          const dateParsed = parseIndonesianDateToIso(tanggalSampel);
          const nomorId = noIdIdx >= 0 ? String(row[noIdIdx] || '').trim() : '';
          const contactPersonName = picIdx >= 0 ? String(row[picIdx] || '').trim() : '';
          const mobilePhone = phoneIdx >= 0 ? String(row[phoneIdx] || '').trim() : '';
          const personalEmail = emailIdx >= 0 ? String(row[emailIdx] || '').trim() : '';
          const npwp = npwpIdx >= 0 ? String(row[npwpIdx] || '').trim() : '';
          const invoice = invIdx >= 0 && row[invIdx] ? String(row[invIdx]).trim() : `ILI/202608/${String(r).padStart(4, '0')}`;
          
          const rawJml = jmlIdx >= 0 ? row[jmlIdx] : 1;
          const jumlahSampel = parseInt(String(rawJml), 10) || 1;
          
          const rawHrg = hrgIdx >= 0 ? row[hrgIdx] : 0;
          let hargaPerSampel = parseIndonesianCurrency(rawHrg);

          const rawDpp = dppIdx >= 0 ? row[dppIdx] : 0;
          let dppTotal = parseIndonesianCurrency(rawDpp);

          if (dppTotal === 0 && hargaPerSampel > 0) {
            dppTotal = hargaPerSampel * jumlahSampel;
          } else if (hargaPerSampel === 0 && dppTotal > 0) {
            hargaPerSampel = Math.round(dppTotal / jumlahSampel);
          }

          const rawPpn = ppnIdx >= 0 ? row[ppnIdx] : 0;
          let ppn11 = parseIndonesianCurrency(rawPpn);
          if (ppn11 === 0 && dppTotal > 0) {
            ppn11 = Math.round(dppTotal * 0.11);
          }

          const rawTot = totIdx >= 0 ? row[totIdx] : 0;
          let totalPlusPpn = parseIndonesianCurrency(rawTot);
          if (totalPlusPpn === 0) {
            totalPlusPpn = dppTotal + ppn11;
          }

          const payment = payIdx >= 0 ? String(row[payIdx] || '').trim() : '';
          const paymentStatus = payment.toLowerCase().includes('belum') || payment === '' ? 'Belum Lunas' : 'Lunas';
          const keterangan = ketIdx >= 0 ? String(row[ketIdx] || '').trim() : '';

          // Categorize and authority check
          const { category, isMyAuthority } = categorizeService(rawLayanan);
          const isUrgent = keterangan.toLowerCase().includes('urgent');

          // Client tier determination
          let clientTier: ClientTier = 'Klien Baru';
          const existingClient = clientHistoryMap.get(rawCompany.toLowerCase());
          if (existingClient) {
            clientTier = existingClient.count > 5 ? 'Klien Lama >1 Thn' : 'Repeat Order <1 Thn';
          }

          // Incentive calculation:
          // New: 2.5% of DPP
          // Repeat <1yr: 2.5% of DPP
          // Old >1yr: 2.0% of DPP
          const incentiveRate = clientTier === 'Klien Lama >1 Thn' ? 2.0 : 2.5;
          const incentiveAmount = Math.round(dppTotal * (incentiveRate / 100));

          const record: MasterSalesRecord = {
            id: invoice ? invoice.replace(/\//g, '-') : `REC-${Date.now()}-${r}`,
            jamMasuk,
            tanggalSampel,
            dateParsed,
            company: rawCompany,
            nomorId,
            contactPersonName,
            mobilePhone,
            personalEmail,
            npwp,
            invoice,
            layananPengujian: rawLayanan,
            kategoriLayanan: category,
            isMyAuthority,
            jumlahSampel,
            hargaPerSampel,
            dppTotal,
            ppn11,
            totalPlusPpn,
            payment,
            paymentStatus,
            keterangan,
            clientTier,
            incentiveRate,
            incentiveAmount,
            isUrgent,
            urgentNote: isUrgent ? keterangan : undefined,
            period: '2026-08',
          };

          records.push(record);
          totalDpp += dppTotal;

          if (isMyAuthority) {
            totalMyAuthorityRows++;
            myAuthorityDpp += dppTotal;
          }
        }

        resolve({
          records,
          errors,
          totalRowsProcessed: records.length,
          totalMyAuthorityRows,
          totalDpp,
          myAuthorityDpp
        });
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// Download official Excel template matching the authentic Indonesian format
export function downloadIndonesianExcelTemplate(): void {
  const headers = [
    'Jam Masuk',
    'Tanggal Sampel Diterima',
    'Company',
    'Nomor ID.',
    'Contact Person Name',
    'Mobile Phone',
    'Personal Email',
    'NPWP',
    'Invoice',
    'Layanan Pengujian',
    'Jumlah Sampel',
    'Harga Per Sampel (belum PPN)',
    'DPP / TOTAL HARGA',
    'ppn 11%',
    'total +ppn',
    'Payment',
    'Keterangan'
  ];

  const sampleRows = [
    [
      '07:30',
      '3 September 2026',
      'PT GEOSERVICES',
      '301936',
      'Klara',
      '081992585548',
      'petchem@geoservices.co.id',
      'ada',
      'ILI/202609/0001',
      'Analisa Isotop Rasio menggunakan IRMS (Isotop O dan H)',
      1,
      5000000,
      5000000,
      550000,
      5550000,
      '20/09/2026',
      'Isotop O dan H eksplorasi geothermal'
    ],
    [
      '08:00',
      '4 September 2026',
      'PT Sanghiang Perkasa',
      '301925',
      'Rahma Nurmay Sholekhah',
      '08123456789',
      'rahma.sholekhah@kalbenutritionals.com',
      'ada',
      'ILI/202609/0002',
      'JASA ANALISIS - Particle Size Analyzer (PSA)',
      2,
      600000,
      1200000,
      132000,
      1332000,
      '25/09/2026',
      'Kalbe Nutritionals'
    ],
    [
      '08:00',
      '5 September 2026',
      'PT Valenza Engineering',
      '304610',
      'Riefqy Usman',
      '081364242543',
      'riefqy@valenza-engineering.com',
      'belum',
      'ILI/202609/0003',
      'Analisa Isotop Rasio menggunakan IRMS',
      4,
      5000000,
      20000000,
      2200000,
      22200000,
      '05/09/2026',
      'Batch 1 Brine Fluids'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  // Adjust column widths
  ws['!cols'] = [
    { wch: 10 }, // Jam
    { wch: 18 }, // Tanggal
    { wch: 28 }, // Company
    { wch: 12 }, // Nomor ID
    { wch: 22 }, // Contact
    { wch: 16 }, // Phone
    { wch: 28 }, // Email
    { wch: 10 }, // NPWP
    { wch: 18 }, // Invoice
    { wch: 38 }, // Layanan
    { wch: 12 }, // Jml
    { wch: 18 }, // Harga
    { wch: 18 }, // DPP
    { wch: 14 }, // PPN
    { wch: 18 }, // Total
    { wch: 14 }, // Payment
    { wch: 28 }  // Keterangan
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sales Data Lab');
  XLSX.writeFile(wb, 'Template_Sales_Laboratorium_Nullius.xlsx');
}

// Export master data records to .xlsx
export function exportMasterDataToExcel(records: MasterSalesRecord[], fileName = 'MasterData_Sales_Lab.xlsx'): void {
  const exportData = records.map((r, idx) => ({
    'No': idx + 1,
    'Jam Masuk': r.jamMasuk,
    'Tanggal Sampel': r.tanggalSampel,
    'Company': r.company,
    'Nomor ID (ELSA)': r.nomorId,
    'Contact Person': r.contactPersonName,
    'Telepon': r.mobilePhone,
    'Email': r.personalEmail,
    'NPWP': r.npwp,
    'Invoice': r.invoice,
    'Layanan Pengujian': r.layananPengujian,
    'Kategori': r.kategoriLayanan,
    'Portofolio Saya': r.isMyAuthority ? 'YA (Analitikal)' : 'TIDAK (Walet)',
    'Jumlah Sampel': r.jumlahSampel,
    'Harga Per Sampel (DPP)': r.hargaPerSampel,
    'DPP / Total Harga': r.dppTotal,
    'PPN 11%': r.ppn11,
    'Total + PPN': r.totalPlusPpn,
    'Payment': r.payment,
    'Status Pembayaran': r.paymentStatus,
    'Tier Klien': r.clientTier,
    'Rate Insentif (%)': `${r.incentiveRate}%`,
    'Nilai Insentif (IDR)': r.incentiveAmount,
    'Keterangan': r.keterangan
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Master Data Sales');
  XLSX.writeFile(wb, fileName);
}
