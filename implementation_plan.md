# IBS Ticketing System – Implementation Plan

Full-stack ticketing website untuk **InvitasiBasketSmada (IBS) SMAN 2 Kota Pasuruan**.  
Stack: **Next.js 14 (App Router)** + **Supabase PostgreSQL** + **PakASir QRIS** di atas **Azure App Service**.

---

## User Review Required

> [!IMPORTANT]
> **PakASir Integration**: Dokumentasi resmi PakASir belum publik. Implementasi webhook akan dibuat dengan struktur umum payment gateway (signature header + JSON body). Harap konfirmasi endpoint & format callback dari akun PakASir Anda.

> [!WARNING]
> **No Login System**: Tiket hanya bisa diakses via `ticket_code`. Jika user kehilangan kode → **tidak dapat di-recover**. Pastikan warning yang jelas tampil di UI.

> [!IMPORTANT]
> **Admin Protection**: Halaman admin dijaga dengan `ADMIN_SECRET_KEY` di URL (e.g. `/admin?key=xxx`). Ini bukan OAuth/login. Cukup untuk event internal. Jika butuh lebih aman, bisa ditingkatkan kemudian.

---

## Proposed Changes

### 1. Project Initialization & Config

#### [NEW] Project root (`c:\Users\FeraGaming\Downloads\ticket ibs\`)
- Init Next.js 14 dengan App Router: `npx create-next-app@latest`
- Dependencies: `@supabase/supabase-js`, `qrcode`, `nanoid`, `jose` (JWT untuk signed QR), `react-qr-scanner`, `date-fns`, `react-hot-toast`, `lucide-react`
- Dev dependencies: `@types/qrcode`

#### [NEW] `.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_SECRET_KEY=
QR_SIGN_SECRET=
PAKASIR_API_KEY=
PAKASIR_WEBHOOK_SECRET=
NEXT_PUBLIC_BASE_URL=
EVENT_DATE=2026-04-XX
```

#### [NEW] `web.config` (Azure IIS → Node proxy)
Standard Azure App Service web.config untuk Next.js standalone.

---

### 2. Database Schema (Supabase SQL)

#### [NEW] `supabase/schema.sql`
```sql
-- Tickets table
CREATE TABLE tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  ticket_code TEXT UNIQUE NOT NULL,  -- format: IBS-XXXXXXXX
  payment_method TEXT NOT NULL CHECK (payment_method IN ('qris', 'cash')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid_online','paid_cash','confirmed','used','expired')),
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ticket_code ON tickets(ticket_code);

-- Payments table
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_code TEXT NOT NULL REFERENCES tickets(ticket_code),
  method TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3. API Routes

#### [NEW] `src/app/api/create-ticket/route.ts`
- POST: Terima `{name, phone, payment_method}`
- Generate `ticket_code` = `IBS-` + 8 char random (nanoid, no ambiguous chars)
- Hitung `expires_at` = `EVENT_DATE + 1 day`
- Simpan ke Supabase
- Jika QRIS → generate signed QR token via `jose` (HMAC-SHA256, exp 24h), call PakASir API untuk create payment
- Return: `{ticket_code, qr_data_url, status, payment_url?}`

#### [NEW] `src/app/api/payment-webhook/route.ts`
- POST: Verifikasi signature dari PakASir (header `X-Pakasir-Signature`)
- Cari tiket berdasarkan `transaction_id` / `reference`
- Update status → `confirmed` (paid_online)
- Return 200

#### [NEW] `src/app/api/check-ticket/route.ts`
- GET `?code=IBS-XXXXXXXX`
- Rate limit: maks 10 req/menit per IP (implementasi via Redis/in-memory Map)
- Return: `{name, status, payment_method, expires_at, is_used}`

#### [NEW] `src/app/api/scan-ticket/route.ts`
- POST (admin only, requires `adminKey` header/body)
- Decode signed QR token atau terima plain `ticket_code`
- Validasi: status=confirmed, is_used=false, belum expired
- Update: `is_used=true, status=used`
- Return: `{valid, name, message}`

#### [NEW] `src/app/api/admin/tickets/route.ts`
- GET: list semua tiket (dengan filter, search, pagination)
- Requires admin auth header

#### [NEW] `src/app/api/admin/confirm-cash/route.ts`
- POST `{ticket_code}`: Konfirmasi cash → status `confirmed`

#### [NEW] `src/app/api/admin/export/route.ts`
- GET: Export CSV semua tiket

---

### 4. Frontend Pages

#### [NEW] `src/app/page.tsx` – Landing Page
- Hero section dengan nama event, tanggal, lokasi
- Countdown timer menuju event
- Info harga tiket
- CTA button → form pembelian
- Bagian info: band/atlet, jadwal, venue

#### [NEW] `src/app/beli/page.tsx` – Form Pembelian
- Input: Nama, Nomor HP
- Pilihan pembayaran: QRIS / Cash
- Submit → POST `/api/create-ticket`
- Redirect ke `/tiket/[ticket_code]`

#### [NEW] `src/app/tiket/[code]/page.tsx` – Halaman Tiket
- Tampilkan ticket_code besar + copy button
- QR code image (dari `qrcode` library, berbasis signed token)
- Status badge
- **Warning banner merah**: "Screenshot atau catat kode tiket Anda! Kode tidak dapat dipulihkan jika hilang"
- Info event
- Instruksi pembayaran cash (jika metode cash)
- Polling status tiket setiap 5 detik (jika pending QRIS)

#### [NEW] `src/app/cek/page.tsx` – Cek Tiket
- Input field ticket_code
- Button cari → GET `/api/check-ticket`
- Tampilkan: nama, status, metode pembayaran, expiry

#### [NEW] `src/app/admin/page.tsx` – Admin Dashboard
- Protected: cek `?key=ADMIN_SECRET_KEY` atau session storage
- Tabs: Daftar Tiket | Scan QR | Analytics
- Tabel tiket: nama, kode, metode, status, actions
- Filter: status, metode pembayaran
- Search: by name/kode
- Action: konfirmasi cash, lihat detail
- Export CSV button
- Counter: total sold, confirmed, used, pending

#### [NEW] `src/app/admin/scan/page.tsx` – Admin Scanner
- QR scanner (kamera) via `react-qr-scanner`
- Input manual ticket_code
- POST `/api/scan-ticket` → tampilkan hasil (valid ✓ / invalid ✗)

---

### 5. Shared Components

#### [NEW] `src/components/`
- `Navbar.tsx` – simple header dengan logo IBS
- `CountdownTimer.tsx` – countdown H:M:S menuju event
- `TicketCard.tsx` – kartu tiket lengkap dengan QR
- `StatusBadge.tsx` – badge berwarna per status
- `CopyButton.tsx` – copy to clipboard + toast feedback
- `LoadingSkeleton.tsx` – skeleton UI untuk loading states
- `WarningBanner.tsx` – banner screenshot warning
- `AdminAuth.tsx` – HOC proteksi halaman admin

---

### 6. Styling & Design System

#### [NEW] `src/app/globals.css`
- CSS variables: `--primary: #0A1F44`, `--secondary: #1E3A8A`, `--accent: #3B82F6`
- Font: Inter (Google Fonts)
- Mobile-first responsive breakpoints
- Smooth transitions & micro-animations
- Dark mode support (opsional)

---

### 7. Utilities & Middleware

#### [NEW] `src/lib/supabase.ts` – Supabase client (server + browser)
#### [NEW] `src/lib/ticket.ts` – ticket_code generator, QR signer/verifier
#### [NEW] `src/lib/rate-limit.ts` – simple in-memory rate limiter
#### [NEW] `src/middleware.ts` – block akses `/api/admin/*` tanpa admin key

---

### 8. Deployment Config

#### [NEW] `next.config.js`
```js
output: 'standalone'  // untuk Azure App Service
```
#### [NEW] `web.config` – Azure IIS → Node.js reverse proxy
#### [NEW] `.env.example` – template environment variables
#### [NEW] `README.md` – deployment guide lengkap

---

## Verification Plan

### Automated Build Check
```bash
cd "c:\Users\FeraGaming\Downloads\ticket ibs"
npm run build
```
Memverifikasi tidak ada TypeScript error dan build berhasil.

### Manual Verification (Browser)

1. **Flow Pembelian QRIS**
   - Buka `/beli` → isi nama & HP → pilih QRIS → submit
   - Harus redirect ke `/tiket/IBS-XXXXXXXX`
   - Harus tampil QR code, ticket_code, warning banner, copy button
   - Status awal: `pending`

2. **Flow Cek Tiket**
   - Buka `/cek` → input ticket_code → harus tampil info tiket

3. **Flow Admin Confirm Cash**
   - Buat tiket cash → buka `/admin?key=SECRET`
   - Klik "Konfirmasi" → status berubah ke `confirmed`

4. **Flow Scan & Validate**
   - Buka `/admin/scan?key=SECRET` → input ticket_code confirmed
   - Harus tampil ✓ valid, status berubah ke `used`
   - Scan lagi kode yang sama → harus tampil ✗ already used

5. **Rate Limiting**
   - Hit `/api/check-ticket` > 10x dalam 1 menit dari IP sama → harus return 429

6. **Export CSV**
   - Admin dashboard → klik Export → file `.csv` terdownload dengan data tiket
