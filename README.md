# IBS Ticketing System 🏀

Website tiket resmi **InvitasiBasketSmada (IBS) SMAN 2 Kota Pasuruan**.

## Tech Stack
- **Frontend + API**: Next.js 14 (App Router)
- **Database**: Supabase PostgreSQL  
- **Payment**: PakASir QRIS
- **Hosting**: Azure App Service (Node.js)

---

## 1. Setup Database (Supabase)

1. Buka project di [supabase.com](https://supabase.com)
2. Pergi ke **SQL Editor**
3. Copy-paste isi file `supabase/schema.sql` dan jalankan

---

## 2. Setup Environment Variables

Buat file `.env.local` di root project (atau copy dari `.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

ADMIN_SECRET_KEY=ganti_ini_dengan_kata_sandi_kuat
QR_SIGN_SECRET=minimum_32_karakter_random_string_disini

PAKASIR_API_KEY=xxx
PAKASIR_WEBHOOK_SECRET=xxx
PAKASIR_API_URL=https://api.pakasir.com

NEXT_PUBLIC_BASE_URL=https://nama-app.azurewebsites.net

NEXT_PUBLIC_EVENT_DATE=2026-05-01
NEXT_PUBLIC_EVENT_NAME=InvitasiBasketSmada (IBS) 2026
NEXT_PUBLIC_EVENT_VENUE=GOR SMAN 2 Kota Pasuruan
NEXT_PUBLIC_TICKET_PRICE=50000
```

---

## 3. Install & Run Lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## 4. Build untuk Production

```bash
npm run build
```

---

## 5. Deploy ke Azure App Service

1. Build app: `npm run build`
2. Upload folder `.next/standalone/` + file `web.config` ke Azure
3. Set semua environment variables di **Azure → Configuration → App settings**
4. Set startup command: `node server.js`
5. Set `NODE_ENV=production`

### Setup Webhook PakASir
- URL Webhook: `https://nama-app.azurewebsites.net/api/payment-webhook`
- Method: `POST`

---

## 6. Halaman & Routes

| URL | Keterangan |
|-----|-----------|
| `/` | Landing page |
| `/beli` | Form beli tiket |
| `/tiket/[code]` | Tampilan tiket + QR |
| `/cek` | Cek status tiket |
| `/admin?key=SECRET` | Admin dashboard |
| `/admin/scan?key=SECRET` | Admin QR scanner |

### API Routes
| Endpoint | Method | Keterangan |
|----------|--------|-----------|
| `/api/create-ticket` | POST | Buat tiket |
| `/api/payment-webhook` | POST | Webhook PakASir |
| `/api/check-ticket?code=` | GET | Cek tiket |
| `/api/scan-ticket` | POST | Validasi + tandai digunakan |
| `/api/admin/tickets` | GET | List tiket (admin) |
| `/api/admin/confirm-cash` | POST | Konfirmasi cash (admin) |
| `/api/admin/analytics` | GET | Statistik (admin) |
| `/api/admin/export` | GET | Export CSV (admin) |

---

## 7. Status Tiket

```
pending → [QRIS] → confirmed → used
       → [Cash] → (admin confirm) → confirmed → used
                                               → expired (H+1 event)
```

---

## 8. Keamanan

- QR code menggunakan **signed JWT** (HMAC-SHA256), bukan plain ticket_code
- Admin page dilindungi dengan `ADMIN_SECRET_KEY` di URL
- Rate limit 10 req/menit untuk `/api/check-ticket`
- Webhook diverifikasi dengan signature dari PakASir
- 1 tiket hanya bisa digunakan **1 kali**

---

## Butuh Bantuan?

Kontak panitia IBS SMAN 2 Kota Pasuruan.
