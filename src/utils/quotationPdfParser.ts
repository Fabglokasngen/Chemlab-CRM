import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for Vite / modern browser bundler
if (typeof window !== 'undefined' && 'Worker' in window) {
  // Use unpkg or cdnjs fallback worker or standard inline worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export interface ExtractedQuotationData {
  quotationNumber: string;
  company: string;
  contactPerson: string;
  phone: string;
  email: string;
  idElsa: string;
  layananPengujian: string;
  sampleCount: number;
  pricePerSample: number;
  dppTotal: number; // Nilai sebelum PPN
  vatRate: number; // default 11%
  vatAmount: number;
  totalWithVat: number;
  date: string;
  rawText: string;
  fileName: string;
  fileDataUrl: string;
}

/**
 * Clean Indonesian currency strings into pure numbers
 */
export function cleanCurrency(valStr: string): number {
  if (!valStr) return 0;
  const clean = valStr.replace(/Rp|\s|\./g, '').replace(/,/g, '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Extract plain text from PDF File using pdfjs-dist
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const content = await page.getTextContent();
      const pageStrings = content.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .filter(Boolean);
      fullText += pageStrings.join(' ') + '\n';
    }

    return fullText;
  } catch (err) {
    console.warn('pdfjs extraction failed, attempting fallback raw reader:', err);
    // Fallback: try reading ascii stream from ArrayBuffer
    const decoder = new TextDecoder('utf-8');
    const raw = decoder.decode(arrayBuffer);
    const textMatches = raw.match(/\(([^()]+)\)Tj/g) || raw.match(/\[([^\]]+)\]TJ/g);
    if (textMatches && textMatches.length > 0) {
      return textMatches.map(m => m.replace(/[\(\)\[\]]Tj|TJ/g, '')).join(' ');
    }
    return '';
  }
}

/**
 * Convert file to base64 Data URL for persistent in-memory attachment preview
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Parse structured quotation details from extracted PDF text
 * Specifically extracts DPP (Nilai sebelum PPN) according to Indonesian tax standards
 */
export async function parseQuotationPdf(file: File): Promise<ExtractedQuotationData> {
  const [rawText, fileDataUrl] = await Promise.all([
    extractTextFromPdf(file),
    fileToDataUrl(file)
  ]);

  const text = rawText || '';
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Nomor Penawaran
  // Match patterns like QUO/202608/014, SPH/2026/08/001, 24-QUO-009, etc.
  const quoRegex = /\b(?:QUO|SPH|PNH|NO)[\/\-_\.\s]*[A-Z0-9\/\-_\.]+/i;
  const quoMatch = text.match(quoRegex);
  const quotationNumber = quoMatch 
    ? quoMatch[0].trim().replace(/\s+/g, '') 
    : `QUO/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`;

  // 2. ID ELSA
  // Match patterns like 24-001099 or 302089 or ID: 24-001099
  const elsaRegex = /\b(?:ID(?:\s*ELSA)?[:\s]*)?(\d{2}-\d{5,7}|\b3\d{5}\b)/i;
  const elsaMatch = text.match(elsaRegex);
  const idElsa = elsaMatch ? (elsaMatch[1] || elsaMatch[0]).replace(/ID(?:\s*ELSA)?[:\s]*/i, '').trim() : '';

  // 3. Nama Perusahaan / Klien
  // Check for "Kepada Yth:", "Klien:", "PT ...", "CV ..."
  let company = '';
  const ptCvMatch = text.match(/\b(PT\.?|CV\.?|UD\.?|Universitas|Institut|Laboratorium)\s+[A-Za-z0-9\s,\.\-&]{3,40}/i);
  if (ptCvMatch) {
    company = ptCvMatch[0].trim().replace(/,\s*$/, '');
  } else {
    // Try finding after Kepada Yth / Attn
    const attnMatch = text.match(/(?:Kepada(?:\s*Yth)?|Attn|Klien|Pelanggan)[:\s]+([^\n,]{3,40})/i);
    if (attnMatch && attnMatch[1]) {
      company = attnMatch[1].trim();
    }
  }
  if (!company) {
    // Fallback from filename if contains company name
    const cleanName = file.name.replace(/\.pdf$/i, '').replace(/_/g, ' ');
    company = cleanName.length > 5 ? cleanName : 'PT Pelanggan Indonesia';
  }

  // 4. Contact Person (PIC), Phone, Email
  const phoneMatch = text.match(/(?:Telp|Phone|WA|HP|No\.?\s*Hp)[:\s]*([\d\-\+\s]{9,16})/i) || text.match(/\b08\d{8,12}\b/);
  const phone = phoneMatch ? phoneMatch[1] || phoneMatch[0] : '';

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : '';

  const picMatch = text.match(/(?:Up\.?|Attn\.?|PIC|Bpk\/Ibu)[:\s]+([A-Za-z\s\.]{3,30})/i);
  const contactPerson = picMatch ? picMatch[1].trim() : 'PIC Pengadaan';

  // 5. Layanan Pengujian
  let layananPengujian = '';
  const serviceKeywords = [
    'Isotop Rasio IRMS',
    'HPLC',
    'GCMS',
    'PSA (Particle Size Analyzer)',
    'ICP-MS',
    'XRF',
    'FTIR',
    'NMR',
    'TGA',
    'Chemisorption',
    'Validasi Metode',
    'Pengujian Walet'
  ];
  for (const kw of serviceKeywords) {
    if (text.toLowerCase().includes(kw.toLowerCase())) {
      layananPengujian = `Jasa Pengujian ${kw}`;
      break;
    }
  }
  if (!layananPengujian) {
    // Find text containing "Pengujian" or "Analisis"
    const serviceMatch = text.match(/(?:Pengujian|Analisis|Uji|Analisa)\s+[A-Za-z0-9\s\(\)\/\-]{5,50}/i);
    if (serviceMatch) {
      layananPengujian = `Jasa ${serviceMatch[0].trim()}`;
    } else {
      layananPengujian = 'Jasa Pengujian Laboratorium Terakreditasi';
    }
  }

  // 6. Qty / Jumlah Sampel
  let sampleCount = 1;
  const qtyMatch = text.match(/(?:Qty|Jumlah|Sampel|Quantity)[:\s]*(\d+)/i) || text.match(/(\d+)\s*(?:sampel|sample|titik|biji)/i);
  if (qtyMatch && qtyMatch[1]) {
    const parsedQty = parseInt(qtyMatch[1], 10);
    if (!isNaN(parsedQty) && parsedQty > 0 && parsedQty < 5000) {
      sampleCount = parsedQty;
    }
  }

  // 7. Nominal: Nilai Sebelum PPN (DPP) vs Total Dengan PPN
  // Indonesian standard VAT is 11% (or 12% planned).
  // Look for "DPP", "Sebelum PPN", "Sub Total", "Grand Total", "Total"
  let dppTotal = 0;
  let totalWithVat = 0;
  const vatRate = 11; // 11% standard

  // Check explicit DPP / Sebelum PPN
  const dppMatch = text.match(/(?:DPP|Nilai\s*Sebelum\s*PPN|Sub\s*Total|Harga\s*Netto)[:\s]*(?:Rp\.?|IDR)?\s*([0-9\.,]{4,20})/i);
  // Check Total / Grand Total / Termasuk PPN
  const totalMatch = text.match(/(?:Grand\s*Total|Total\s*Setelah\s*PPN|Total\s*Akhir|Total\s*Termasuk\s*PPN|Total\s*Harga)[:\s]*(?:Rp\.?|IDR)?\s*([0-9\.,]{4,20})/i);

  if (dppMatch && dppMatch[1]) {
    dppTotal = cleanCurrency(dppMatch[1]);
  }

  if (totalMatch && totalMatch[1]) {
    totalWithVat = cleanCurrency(totalMatch[1]);
  }

  // If DPP was found and Total wasn't: compute Total = DPP * 1.11
  if (dppTotal > 0 && totalWithVat === 0) {
    totalWithVat = Math.round(dppTotal * (1 + vatRate / 100));
  } 
  // If only Total was found: compute DPP = Total / 1.11 (sesuaikan nominal berdasarkan nilai sebelum PPN!)
  else if (totalWithVat > 0 && dppTotal === 0) {
    dppTotal = Math.round(totalWithVat / (1 + vatRate / 100));
  } 
  // If neither was clearly labelled, search for largest currency figure in document
  else if (dppTotal === 0 && totalWithVat === 0) {
    const allPrices = Array.from(text.matchAll(/(?:Rp\.?|IDR)\s*([0-9\.,]{4,20})/gi))
      .map(m => cleanCurrency(m[1]))
      .filter(p => p >= 100000);
    
    if (allPrices.length > 0) {
      const maxPrice = Math.max(...allPrices);
      // Assume the highest price is Total; calculate DPP before VAT
      totalWithVat = maxPrice;
      dppTotal = Math.round(maxPrice / (1 + vatRate / 100));
    } else {
      // Default placeholder
      dppTotal = 3000000;
      totalWithVat = Math.round(dppTotal * (1 + vatRate / 100));
    }
  }

  const vatAmount = totalWithVat - dppTotal;
  const pricePerSample = sampleCount > 0 ? Math.round(dppTotal / sampleCount) : dppTotal;

  // 8. Date
  const dateMatch = text.match(/(\d{1,2}\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4})/i)
    || text.match(/(\d{4}-\d{2}-\d{2})/)
    || text.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
  
  const today = new Date().toISOString().slice(0, 10);
  const date = dateMatch ? dateMatch[1] : today;

  return {
    quotationNumber,
    company,
    contactPerson,
    phone,
    email,
    idElsa,
    layananPengujian,
    sampleCount,
    pricePerSample,
    dppTotal,
    vatRate,
    vatAmount,
    totalWithVat,
    date,
    rawText: text.slice(0, 1000),
    fileName: file.name,
    fileDataUrl
  };
}
