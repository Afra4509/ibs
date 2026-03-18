Berikut konfirmasi final untuk implementasi IBS Ticketing System:

1. **PakASir Integration (UPDATED)**
   Pembayaran QRIS harus **otomatis terkonfirmasi oleh sistem (tanpa admin)**.

Implementasi:

* Gunakan endpoint `/api/payment-webhook`
* Saat webhook dari PakASir diterima dan valid:
  → update status tiket menjadi `confirmed` (paid_online)
* Wajib ada verifikasi signature (misalnya header `X-Pakasir-Signature`)

Jika dokumentasi belum lengkap:

* Tetap implementasikan struktur webhook generik (JSON body + signature verification)
* Gunakan `transaction_id` atau reference untuk mapping ke ticket_code

2. **No Login System (Confirmed)**
   Tetap tanpa login.
   User wajib menyimpan ticket_code (screenshot/catat).
   Tampilkan warning jelas:
   "Kode tiket tidak dapat dipulihkan jika hilang."

3. **Admin Protection**
   Gunakan `ADMIN_SECRET_KEY` via query parameter:
   `/admin?key=xxx`
   Tidak perlu sistem login tambahan.

4. **QR Code Implementation**
   Gunakan QR berbasis signed token (JWT / HMAC) agar tidak bisa dipalsukan.
   Tetap sediakan fallback validasi via `ticket_code`.

5. **Rate Limiting**
   Gunakan in-memory rate limiting saja (tidak perlu Redis).

6. **Scanner**
   Gunakan library stabil untuk mobile (disarankan `html5-qrcode`).

7. **Ticket Rules**

* 1 tiket hanya bisa digunakan 1x
* Saat scan berhasil → langsung update ke `used`
* Tidak bisa reuse screenshot setelah scan
* Tiket otomatis expired H+1 setelah event

8. **Development Priority**
   Phase 1:

* Create ticket
* QRIS payment flow + webhook auto-confirm
* Check ticket
* Admin confirm (hanya untuk cash)

Phase 2:

* QR generation (signed)
* Scan system (admin)

Phase 3 (optional improvement):

* Analytics
* Optimization

9. **System Goal**
   Fokus pada:

* Otomatisasi pembayaran QRIS
* Stabil saat traffic tinggi
* Simpel dan cepat digunakan saat hari event

Silakan lanjutkan implementasi berdasarkan spesifikasi ini.
