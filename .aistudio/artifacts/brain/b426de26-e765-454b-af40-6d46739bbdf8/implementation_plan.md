# Rencana Implementasi: Peningkatan Master Data, Manajemen Multi-ID ELSA, Audit Log Excel, & Smart PDF Quotation Intake

Pembaruan komprehensif pada workstation **Nullius** untuk mendukung pengelolaan data penjualan multi-bulan, auditibilitas unggah berkas, pencegahan duplikasi, relasi 1-klien banyak ID ELSA, serta pembacaan dan pengelolaan dokumen Quotation resmi dalam bentuk PDF.

---

## 1. Master Data: Pengujian Walet, Multi-ID ELSA, Sortir Layanan, & Fitur Keamanan

### A. Pengujian Walet & Multi-ID ELSA
- **Retensi Pengujian Walet**: Seluruh transaksi pengujian walet dipastikan tetap termuat lengkap di dalam Master Data. Dropdown filter authority menyediakan opsi *Semua Transaksi Lab (Termasuk Walet)* sebagai tampilan lengkap atau *Portofolio Analitikal Saya*.
- **Relasi 1 Perusahaan Banyak ID**: Menampung fakta operasional bahwa satu perusahaan klien dapat memiliki banyak ID ELSA berbeda sesuai nomor registrasi sampel atau permohonan pengujian yang diajukan.

### B. Fitur Sortir Berdasarkan Layanan Pengujian
- Menambahkan opsi pengurutan (sort) alfabetis A-Z dan Z-A pada kolom *Layanan Pengujian*, serta filter cepat per rumpun layanan.

### C. Keamanan & Pencegahan Duplikasi Data
- **Deteksi Duplikasi Otomatis**: Validasi otomatis saat input manual maupun upload Excel berbasis kombinasi unik `Nomor Invoice` dan `ID ELSA`.
- **Peringatan Konflik**: Menampilkan modal konfirmasi jika sistem mendeteksi transaksi dengan nomor invoice atau sampel yang sama.
- **Audit Field**: Setiap record dilengkapi stempel waktu `createdAt`, `updatedAt`, serta jejak modifikasi.

---

## 2. Modul Upload Excel: Scoped Replacement, Pelacak Nama File, & Log Book

### A. Scoped Replacement per Bulan (Anti-Duplikasi)
- Saat pengguna mengunggah atau memodifikasi file Excel untuk bulan tertentu (contoh: Agustus 2026), sistem secara otomatis menghapus rekaman lama khusus untuk bulan tersebut sebelum memasukkan rekaman baru, sehingga tidak terjadi duplikasi data lintas upload.

### B. Pelacak Nama File per Bulan
- Menyimpan metadata riwayat berkas untuk setiap bulan: nama file (contoh: `August2026_2909.xlsx`), tanggal unggah, jumlah baris berhasil diimpor, dan total DPP yang tercatat.
- Pengguna dapat mengecek file apa yang aktif digunakan untuk masing-masing bulan.

### C. Log Book Pengeditan Data Sales
- Komponen **Audit Log Book** terintegrasi: mencatat setiap aksi modifikasi data (Upload baru, Edit baris, Hapus baris, Re-upload berkas) lengkap dengan stempel waktu, user, dan rincian perubahan.

---

## 3. Direktori Klien: Hub Klien Multi-ID & Riwayat Kronologis

### A. Struktur Data Klien Multi-ID ELSA
- Memperluas model data `ClientProfile` agar menyimpan kumpulan ID ELSA: `historicalIds: string[]` dan `idHistoryDetails: Array<{ idElsa: string; date: string; service: string; invoice: string; dpp: number }>`.

### B. Tampilan Riwayat Kumpulan ID ELSA
- Pada tabel baris direktori klien, kolom ID ELSA menampilkan ID aktif/terbaru beserta badge jumlah ID yang dimiliki (contoh: `24-001099 (+3 ID)`).
- Mengklik klien membuka **Drawer Riwayat ID ELSA**: menampilkan daftar lengkap semua ID yang pernah digunakan perusahaan tersebut secara kronologis beserta riwayat pengujiannya.

---

## 4. Modul Penawaran: Input Quotation PDF, Nilai Sebelum PPN (DPP), & Manajemen Data

### A. Smart Input Quotation PDF
- Menyediakan zona upload file PDF Quotation (seperti format PT Integrasi Lab Indonesia / BRIN yang dilampirkan).
- Melakukan ekstraksi otomatis informasi:
  - Nomor Penawaran (contoh: `QT.202609.0002.Rev01`, `QT.202609.0004`)
  - Tanggal Penawaran
  - Nama Klien & Perusahaan (contoh: `PT Perusahaan Mineral Nasional (Persero)`, `PT Pertamina Persero`)
  - PIC / Attn, Email, dan Telepon
  - Nilai DPP sebelum PPN (*Grand Subtotal IDR*, contoh: `Rp 33.825.000` dan `Rp 2.000.000`)
  - PPN 11% & Grand Total
  - Rincian layanan uji yang tertera
- Menyimpan file PDF terlampir sehingga pengguna dapat mengunduh atau melihat dokumen asli kapan saja.

### B. Fitur Ubah (Edit) & Hapus (Delete) Penawaran
- Menyediakan tombol edit untuk memperbarui status deal (Draft, Terkirim, Negosiasi, Won, Lost), mengubah nilai penawaran, nomor penawaran, maupun catatan tindak lanjut.
- Fitur hapus penawaran dengan konfirmasi keamanan.

---

## Langkah Verifikasi

1. **Verifikasi Master Data**: Pastikan transaksi walet tetap muncul dan dapat disortir berdasarkan nama layanan pengujian; periksa pencegahan duplikasi invoice.
2. **Verifikasi Upload Excel & Log Book**: Uji unggah file Excel untuk bulan tertentu, pastikan data lama bulan tersebut terhapus tanpa menduplikasi rekaman, nama file tercatat di metadata bulan, dan aktivitas tercatat di Log Book.
3. **Verifikasi Direktori Klien**: Buka riwayat klien dan pastikan kumpulan ID ELSA yang pernah digunakan tampil rapi sebagai riwayat kronologis.
4. **Verifikasi PDF Quotation**: Uji upload file PDF Quotation (menggunakan berkas sampel yang dilampirkan), periksa apakah nomor penawaran, klien, dan nominal sebelum PPN (DPP) terisi dengan tepat, serta uji operasi edit dan hapus.
5. **Kompilasi & Lint**: Jalankan `compile_applet` dan `lint_applet` untuk menjamin tidak ada regresi kode.
