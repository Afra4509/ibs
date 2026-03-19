<div align="center">

<h1>🏀 IBS Ticketing System</h1>
<p><strong>InvitasiBasketSmada (IBS) 2026</strong></p>
<p>Sistem pembelian tiket online untuk turnamen basketball paling bergengsi di Kota Pasuruan.<br/>Dibangun dengan <strong>Next.js 14</strong>, <strong>Supabase</strong>, dan integrasi pembayaran <strong>PakASir QRIS</strong>.</p>

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## ✨ Fitur Utama

| Fitur | Keterangan |
|-------|-----------|
| 🎫 **Beli Tiket Online** | Form pemesanan tiket langsung dari browser, tanpa perlu akun |
| 💳 **QRIS Otomatis** | Bayar via QRIS, tiket langsung terkonfirmasi via webhook |
| 💵 **Cash di Lokasi** | Pilih cash, admin konfirmasi pembayaran saat pembeli datang |
| 📱 **QR Code Tiket** | Setiap tiket punya QR Code unik untuk scan di gerbang |
| 🔍 **Cek Tiket** | Cari tiket kapanpun dengan kode tiket atau nomor HP |
| 🛡️ **Admin Dashboard** | Kelola semua tiket, konfirmasi cash, export data CSV |
| 📊 **Analitik Real-time** | Pantau pendapatan QRIS vs Cash, tiket aktif, terpakai, dsb |
| 📷 **Scanner QR** | Halaman scanner untuk panitia scan tiket di gerbang |
| ⏱️ **Countdown Otomatis** | Timer hitung mundur event tampil di halaman utama |
| 📥 **Download Tiket** | Pengunjung bisa download tiket sebagai gambar PNG |
| 📋 **Copy Kode Tiket** | Salin kode tiket ke clipboard dengan sekali klik |

---

## 🗺️ Alur Penggunaan

### 👤 Penonton / Pembeli Tiket

```
┌──────────────────────────────────────────────────────────────────────┐
│  1. Buka Website → Lihat info event & countdown                      │
│  2. Klik "Beli Tiket" → Isi form nama + nomor HP                     │
│  3. Pilih jumlah tiket                                               │
│  4. Pilih metode pembayaran:                                         │
│     ├─ QRIS  → Scan QR, bayar → Tiket otomatis terkonfirmasi ✓       │
│     └─ Cash  → Tiket pending, bayar di lokasi saat event             │
│  5. Screenshot / Catat kode tiket (tidak bisa dipulihkan!)           │
│  6. Di hari event → Tunjukkan QR Code di gerbang → Scan & Masuk ✓   │
└──────────────────────────────────────────────────────────────────────┘
```

### 🔧 Admin / Panitia

```
┌──────────────────────────────────────────────────────────────────────┐
│  1. Buka /admin → Login dengan password admin                        │
│  2. Dashboard tersedia 3 tab:                                        │
│     ├─ 🎫 Daftar Tiket  → Lihat semua tiket, filter, cari           │
│     ├─ 📊 Statistik     → Lihat analitik & total pendapatan         │
│     └─ ⚙️  Pengaturan   → Ubah password, reset database             │
│  3. Konfirmasi tiket Cash → Klik ✓ saat pembeli bayar di lokasi     │
│  4. Buka /admin/scan → Scanner QR untuk validasi tiket di gerbang   │
│  5. Export CSV → Download semua data tiket                          │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Halaman Website

| URL | Deskripsi |
|-----|-----------|
| `/` | Landing page — info event, harga, countdown, cara beli |
| `/beli` | Form pemesanan tiket (nama, HP, qty, metode bayar) |
| `/tiket/[kode]` | Halaman tiket — QR Code, kode, status, download PNG |
| `/cek` | Cek status tiket dengan kode atau nomor HP |
| `/admin` | Dashboard admin (butuh login password) |
| `/admin/scan` | Scanner QR untuk validasi tiket di gerbang |

---

## 💳 Metode Pembayaran

### QRIS (Otomatis)
1. Pilih **QRIS** saat checkout
2. Halaman tiket akan menampilkan **QR QRIS PakASir** untuk dibayar
3. Setelah bayar, **webhook otomatis** memperbarui status tiket menjadi `paid_online`
4. Tiket langsung bisa digunakan ✅

### Cash (Manual)
1. Pilih **Cash** saat checkout
2. Tiket masuk status `pending`
3. **Datang ke lokasi** dan bayar ke panitia
4. Panitia buka `/admin` → cari tiket → klik ✅ konfirmasi
5. Status tiket berubah menjadi `confirmed` ✅

---

## 🔐 Panel Admin

### Login
```
URL: /admin
Password: [dikonfigurasi via environment variable ADMIN_PASSWORD]
```

### Tab: Daftar Tiket
- Tabel semua tiket dengan filter status & metode bayar
- Kolom: Kode, Nama, HP, Qty, Metode, Status, Tanggal, Aksi
- Tombol aksi: **Konfirmasi Cash** ✓ | **Lihat Tiket** 🎫 | **Hapus** 🗑️
- Fitur **Pencarian** by nama, kode tiket, atau nomor HP
- Tombol **Export CSV** untuk download semua data

### Tab: Statistik & Pendapatan
| Statistik | Keterangan |
|-----------|-----------|
| Total Aktif | Tiket yang sudah berbayar/confirmed |
| Terkonfirmasi | Tiket yang sudah diverifikasi admin |
| Pending | Menunggu pembayaran atau konfirmasi |
| Sudah Digunakan | Tiket yang sudah di-scan di gerbang |
| Kadaluarsa | Tiket yang melewati batas waktu |
| Total QRIS | Jumlah tiket via QRIS |
| Total Cash | Jumlah tiket via Cash |
| Pendapatan QRIS | Total uang masuk via QRIS |
| Pendapatan Tunai | Total uang masuk via Cash |

### Tab: Pengaturan
- **Ubah Password Admin** — update password login admin
- **Danger Zone** — hapus seluruh riwayat tiket (butuh konfirmasi ganda)

---

## 🚀 Cara Menjalankan (Development)

### Prasyarat
- Node.js 18+
- Akun [Supabase](https://supabase.com) (gratis)
- Akun [PakASir](https://pakasir.com) untuk QRIS (opsional)
- [ngrok](https://ngrok.com) untuk expose localhost ke internet (untuk webhook)

### 1. Clone & Install

```bash
git clone https://github.com/your-repo/ibs-ticketing.git
cd ibs-ticketing
npm install
```

### 2. Konfigurasi Environment

Salin `.env.example` menjadi `.env.local` dan isi semua variabel:

```bash
cp .env.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...

# Event Info
NEXT_PUBLIC_EVENT_NAME=InvitasiBasketSmada (IBS) 2026
NEXT_PUBLIC_EVENT_DATE=2026-05-01
NEXT_PUBLIC_EVENT_VENUE=GOR SMAN 2 Kota Pasuruan
NEXT_PUBLIC_TICKET_PRICE=50000

# Admin
ADMIN_PASSWORD=rahasia123

# PakASir QRIS (https://pakasir.com)
PAKASIR_API_KEY=your_api_key
PAKASIR_MERCHANT_ID=your_merchant_id
PAKASIR_WEBHOOK_SECRET=your_webhook_secret
```

### 3. Setup Database Supabase

Jalankan SQL migration yang ada di folder `supabase/`:

```bash
# Di Supabase Dashboard → SQL Editor, paste dan jalankan:
# supabase/schema.sql
```

### 4. Jalankan Dev Server

```bash
npm run dev
```

Website berjalan di `http://localhost:3000`

### 5. Expose dengan ngrok (untuk QRIS Webhook)

```bash
ngrok http 3000
```

> Salin URL ngrok (contoh: `https://xxxx.ngrok-free.app`) dan daftarkan sebagai webhook URL di dashboard PakASir.
> 
> Webhook endpoint: `https://xxxx.ngrok-free.app/api/payment-webhook`

---

## 🔌 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/create-ticket` | Buat tiket baru |
| `GET` | `/api/check-ticket` | Cek status tiket |
| `POST` | `/api/payment-webhook` | Terima notif pembayaran QRIS |
| `POST` | `/api/scan-ticket` | Validasi & gunakan tiket (scan QR) |
| `GET` | `/api/admin/tickets` | List semua tiket (butuh auth) |
| `DELETE` | `/api/admin/tickets` | Hapus tiket / semua tiket |
| `POST` | `/api/admin/confirm-cash` | Konfirmasi pembayaran cash |
| `GET` | `/api/admin/analytics` | Data statistik & pendapatan |
| `GET` | `/api/admin/export` | Export CSV |
| `POST` | `/api/admin/settings` | Update password admin |
| `POST` | `/api/auth/login` | Login admin |

---

## 📦 Status Tiket

```
pending → paid_online (via QRIS webhook otomatis)
pending → confirmed   (via konfirmasi admin untuk cash)
confirmed / paid_online → used (setelah scan di gerbang)
pending → expired     (jika melewati batas waktu)
```

| Status | Label | Keterangan |
|--------|-------|-----------|
| `pending` | Pending | Menunggu pembayaran / konfirmasi |
| `paid_online` | Dibayar QRIS | QRIS berhasil, belum di-scan |
| `paid_cash` | Dibayar Cash | Cash dikonfirmasi admin |
| `confirmed` | Konfirmasi | Tiket siap digunakan |
| `used` | Digunakan | Sudah di-scan di gerbang |
| `expired` | Kadaluarsa | Melewati batas waktu |

---

## 🛠️ Tech Stack

| Teknologi | Versi | Kegunaan |
|-----------|-------|---------|
| [Next.js](https://nextjs.org) | 14.2 | Frontend + API Routes |
| [TypeScript](https://typescriptlang.org) | 5 | Type safety |
| [Supabase](https://supabase.com) | — | PostgreSQL Database |
| [PakASir](https://pakasir.com) | — | QRIS Payment Gateway |
| [qrcode](https://npmjs.com/package/qrcode) | — | Generate QR Code |
| [html2canvas](https://html2canvas.hertzen.com) | — | Download tiket sebagai PNG |
| [react-hot-toast](https://react-hot-toast.com) | — | Notifikasi toast |
| [lucide-react](https://lucide.dev) | — | Icon library |

---

## ⚠️ Catatan Penting

> **Tidak ada sistem login untuk pembeli.**
> Kode tiket hanya ditampilkan **satu kali** setelah pembelian.  
> Minta pembeli untuk **screenshot atau catat kode tiket** segera.

> **Tiket Cash** perlu konfirmasi manual oleh admin.  
> Admin harus buka `/admin` dan klik ✓ konfirmasi setelah menerima uang.

> **QRIS webhook** hanya bekerja jika server bisa diakses dari internet.  
> Gunakan **ngrok** saat development atau deploy ke hosting publik (Azure, Vercel, dll).

---

## 🏗️ Deployment

Website ini sudah dikonfigurasi untuk **Azure App Service** via `web.config`.  
Untuk deploy ke Azure:

```bash
npm run build
# Deploy ke Azure App Service (Node.js 18 LTS)
```

Atau deploy ke **Vercel** (paling mudah):

```bash
npx vercel --prod
```

---

<div align="center">

**© 2026 IBS Committee · SMAN 2 Pasuruan**  
Dibuat dengan ❤️ untuk turnamen basketball terbaik se-Jawa Timur 🏀

</div>
