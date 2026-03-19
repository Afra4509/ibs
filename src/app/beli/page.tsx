'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { User, Phone, CreditCard, Wallet, ArrowLeft, AlertTriangle, ChevronRight, Ticket, Minus, Plus, ShieldCheck } from 'lucide-react';

type PaymentMethod = 'qris' | 'cash';

export default function BeliPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '' });
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const eventName = process.env.NEXT_PUBLIC_EVENT_NAME || 'InvitasiBasketSmada (IBS) 2026';
  const ticketPrice = parseInt(process.env.NEXT_PUBLIC_TICKET_PRICE || '50000');

  const totalPriceFormatted = new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(ticketPrice * quantity);

  const unitPriceFormatted = new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(ticketPrice);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      errs.name = 'Nama lengkap minimal 2 karakter';
    const phone = form.phone.replace(/\D/g, '');
    if (!phone || phone.length < 10 || phone.length > 15)
      errs.phone = 'Nomor HP tidak valid (10-15 digit)';
    if (!paymentMethod)
      errs.payment = 'Pilih metode pembayaran terlebih dahulu';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/create-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.replace(/\D/g, ''),
          payment_method: paymentMethod,
          quantity,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Gagal membuat tiket');
        return;
      }

      toast.success('Tiket berhasil dibuat!');
      sessionStorage.setItem(`ticket_${data.ticket_code}`, JSON.stringify(data));
      router.push(`/tiket/${data.ticket_code}`);
    } catch {
      toast.error('Koneksi gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#060913' }}>
      {/* Top Navigation */}
      <nav style={{
        background: 'rgba(6, 9, 19, 0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '14px 20px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div className="container container-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', fontWeight: 500,
            transition: 'color 0.2s',
          }}>
            <ArrowLeft size={16} /> Kembali
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '0.55rem', color: 'white',
            }}>IBS</div>
            <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>Beli Tiket</span>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(180deg, #0D1224 0%, #0A0F1E 100%)',
        padding: '40px 0 48px',
        position: 'relative',
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
          width: 500, height: 300,
          background: 'radial-gradient(ellipse, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="container container-sm" style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            padding: '6px 16px', borderRadius: 9999, marginBottom: 20,
            fontSize: '0.75rem', fontWeight: 700, color: '#A5B4FC',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            <Ticket size={12} /> {eventName}
          </div>
          <h1 style={{ color: 'white', fontSize: '2rem', marginBottom: 8, fontWeight: 800 }}>
            Pesan Tiket Anda
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem' }}>
            Isi formulir di bawah untuk mendapatkan tiket masuk event
          </p>
        </div>
      </div>

      {/* Form Area */}
      <div className="container container-sm" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
          animation: 'fadeInUp 0.5s ease',
        }}>
          {/* Price Summary Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.08))',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '20px 28px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                Total Pembayaran
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                {quantity} tiket × {unitPriceFormatted}
              </div>
            </div>
            <div style={{
              fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 900,
              color: '#A5B4FC',
              whiteSpace: 'nowrap', flexShrink: 0,
              textShadow: '0 0 20px rgba(165, 180, 252, 0.4)',
            }}>
              {totalPriceFormatted}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '32px 28px' }}>
            {/* Name */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginBottom: 10,
              }}>
                <User size={14} style={{ color: '#818CF8' }} /> Nama Lengkap
              </label>
              <input
                type="text"
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="Masukkan nama lengkap"
                value={form.name}
                onChange={(e) => {
                  setForm((f) => ({ ...f, name: e.target.value }));
                  if (errors.name) setErrors((e) => ({ ...e, name: '' }));
                }}
                disabled={loading}
                autoComplete="name"
                maxLength={100}
                style={{ borderRadius: 14, padding: '16px 20px' }}
              />
              {errors.name && <div className="form-error" style={{ marginTop: 6 }}><AlertTriangle size={12} />{errors.name}</div>}
            </div>

            {/* Phone */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginBottom: 10,
              }}>
                <Phone size={14} style={{ color: '#818CF8' }} /> Nomor HP (WhatsApp)
              </label>
              <input
                type="tel"
                className={`form-input ${errors.phone ? 'error' : ''}`}
                placeholder="+6281xxxxxxxxx"
                value={form.phone}
                onChange={(e) => {
                  setForm((f) => ({ ...f, phone: e.target.value }));
                  if (errors.phone) setErrors((er) => ({ ...er, phone: '' }));
                }}
                disabled={loading}
                autoComplete="tel"
                maxLength={15}
                style={{ borderRadius: 14, padding: '16px 20px' }}
              />
              {errors.phone && <div className="form-error" style={{ marginTop: 6 }}><AlertTriangle size={12} />{errors.phone}</div>}
            </div>

            {/* Quantity Selector */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginBottom: 10 }}>
                Jumlah Tiket
              </label>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14, padding: '12px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1 || loading} style={{
                    width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'white', cursor: 'pointer', transition: 'all 0.2s',
                    opacity: quantity <= 1 ? 0.3 : 1,
                  }}>
                    <Minus size={16} />
                  </button>
                  <span style={{
                    fontWeight: 900, color: 'white', fontSize: '1.5rem',
                    width: 48, textAlign: 'center', fontVariantNumeric: 'tabular-nums',
                  }}>
                    {quantity}
                  </span>
                  <button type="button" onClick={() => setQuantity(Math.min(999, quantity + 1))} disabled={quantity >= 999 || loading} style={{
                    width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: '#A5B4FC', cursor: 'pointer', transition: 'all 0.2s',
                    opacity: quantity >= 999 ? 0.3 : 1,
                  }}>
                    <Plus size={16} />
                  </button>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                  Tanpa Batas
                </div>
              </div>
            </div>

            {/* Warning - below quantity */}
            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: 14, padding: '16px 20px',
              display: 'flex', alignItems: 'flex-start', gap: 14,
              marginBottom: 28,
            }}>
              <AlertTriangle size={18} style={{ color: '#FBBF24', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 700, color: '#FBBF24', fontSize: '0.88rem', marginBottom: 4 }}>
                  Penting! Simpan kode tiket
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                  Setelah pembelian, <strong style={{ color: 'rgba(255,255,255,0.7)' }}>screenshot atau catat kode tiket Anda</strong>.
                  Kode tidak dapat dipulihkan karena tidak ada sistem login.
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px -28px 28px' }} />

            {/* Payment Method */}
            <div style={{ marginBottom: 32 }}>
              <label style={{
                display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginBottom: 14,
              }}>
                Metode Pembayaran
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  {
                    value: 'qris' as PaymentMethod,
                    label: 'QRIS',
                    sublabel: 'Bayar sekarang, otomatis terkonfirmasi',
                    Icon: CreditCard,
                    color: '#6366F1',
                    gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(79, 70, 229, 0.12))',
                  },
                  {
                    value: 'cash' as PaymentMethod,
                    label: 'Cash',
                    sublabel: 'Bayar di lokasi saat hari event',
                    Icon: Wallet,
                    color: '#8B5CF6',
                    gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(124, 58, 237, 0.12))',
                  },
                ].map(({ value, label, sublabel, Icon, color, gradient }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(value);
                      if (errors.payment) setErrors((e) => ({ ...e, payment: '' }));
                    }}
                    style={{
                      padding: '24px 20px',
                      borderRadius: 18,
                      border: `2px solid ${paymentMethod === value ? color : 'rgba(255, 255, 255, 0.08)'}`,
                      background: paymentMethod === value ? gradient : 'rgba(15, 23, 42, 0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textAlign: 'left',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    disabled={loading}
                  >
                    {/* Selection indicator */}
                    {paymentMethod === value && (
                      <div style={{
                        position: 'absolute', top: 12, right: 12,
                        width: 22, height: 22, borderRadius: '50%',
                        background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
                      </div>
                    )}
                    <div style={{
                      width: 44, height: 44, borderRadius: 14,
                      background: paymentMethod === value ? `${color}25` : 'rgba(255, 255, 255, 0.06)',
                      border: `1px solid ${paymentMethod === value ? `${color}40` : 'rgba(255,255,255,0.1)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 14, transition: 'all 0.3s',
                    }}>
                      <Icon size={20} style={{ color: paymentMethod === value ? color : 'rgba(255,255,255,0.5)' }} />
                    </div>
                    <div style={{ fontWeight: 700, color: 'white', marginBottom: 6, fontSize: '1rem' }}>
                      {label}
                    </div>
                    <div style={{
                      fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)',
                      lineHeight: 1.5,
                    }}>
                      {sublabel}
                    </div>
                  </button>
                ))}
              </div>
              {errors.payment && (
                <div className="form-error" style={{ marginTop: 10 }}>
                  <AlertTriangle size={12} /> {errors.payment}
                </div>
              )}
            </div>

            {/* Cash note */}
            {paymentMethod === 'cash' && (
              <div style={{
                background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: 14, padding: '16px 20px',
                fontSize: '0.85rem', color: '#C4B5FD', marginBottom: 24,
                lineHeight: 1.6, display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <Wallet size={16} style={{ flexShrink: 0, marginTop: 3 }} />
                <span>Tiket cash perlu dikonfirmasi oleh admin setelah Anda bayar di lokasi.
                Status tiket akan berubah otomatis saat admin mengkonfirmasi.</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={loading}
              style={{
                borderRadius: 16, padding: '18px 32px',
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                boxShadow: '0 8px 30px rgba(99, 102, 241, 0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
                fontSize: '1.05rem',
              }}
            >
              {loading ? (
                <><span className="spinner" /> Membuat tiket...</>
              ) : (
                <> Lanjutkan Pembelian <ChevronRight size={18} /></>
              )}
            </button>

            {/* Trust indicator */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 20, fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)',
            }}>
              <ShieldCheck size={14} style={{ color: '#34D399' }} />
              Transaksi Aman & Terverifikasi
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
