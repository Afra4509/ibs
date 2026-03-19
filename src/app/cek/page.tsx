'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Ticket, AlertTriangle, ArrowLeft, CheckCircle, Clock, XCircle } from 'lucide-react';

type TicketStatus = 'pending' | 'paid_online' | 'paid_cash' | 'confirmed' | 'used' | 'expired';

interface TicketResult {
  found: boolean;
  ticket_code: string;
  name: string;
  payment_method: 'qris' | 'cash';
  status: TicketStatus;
  is_used: boolean;
  expires_at: string | null;
  created_at: string;
  quantity: number;
  qr_data_url?: string;
}

const statusLabel: Record<TicketStatus, { label: string; css: string }> = {
  pending:    { label: 'Menunggu Pembayaran', css: 'badge badge-pending' },
  paid_online:{ label: 'Dibayar Online', css: 'badge badge-confirmed' },
  paid_cash:  { label: 'Dibayar Cash', css: 'badge badge-qris' },
  confirmed:  { label: 'Terkonfirmasi ✓', css: 'badge badge-confirmed' },
  used:       { label: 'Sudah Digunakan', css: 'badge badge-used' },
  expired:    { label: 'Kadaluarsa', css: 'badge badge-expired' },
};

export default function CekPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TicketResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) { setError('Masukkan kode tiket.'); return; }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/check-ticket?code=${encodeURIComponent(clean)}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Tiket tidak ditemukan.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Koneksi gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#060D1F' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0B142A 0%, #060D1F 100%)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '20px 0 48px' }}>
        <div className="container container-sm">
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: 24,
          }}>
            <ArrowLeft size={16} /> Kembali
          </Link>
          <h1 style={{ color: 'white', fontSize: '1.8rem', marginBottom: 8 }}>Cek Tiket</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>
            Masukkan kode tiket untuk melihat status pembelian
          </p>
        </div>
      </div>

      <div className="container container-sm" style={{ marginTop: -24, paddingBottom: 48 }}>
        {/* Search card */}
        <div className="glass-card" style={{ padding: '28px', animation: 'fadeInUp 0.4s ease' }}>
          <form onSubmit={handleCheck}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Ticket size={14} /> Kode Tiket
                </span>
              </label>
              <input
                type="text"
                className={`form-input ${error ? 'error' : ''}`}
                placeholder="IBS-XXXXXXXX"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                maxLength={12}
                style={{ letterSpacing: '2px', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem' }}
                disabled={loading}
              />
              {error && (
                <div className="form-error">
                  <AlertTriangle size={12} /> {error}
                </div>
              )}
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner" /> Mencari...</>
              ) : (
                <><Search size={18} /> Cek Tiket</>
              )}
            </button>
          </form>
        </div>

        {/* Result Card */}
        {result && (
          <div className="glass-card" style={{ marginTop: 20, animation: 'fadeInUp 0.4s ease' }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: 4 }}>
                  Kode Tiket
                </div>
                <div style={{
                  fontFamily: 'monospace', fontWeight: 800, fontSize: '1.2rem',
                  letterSpacing: '3px', color: 'var(--accent-light)', textShadow: '0 0 10px rgba(96, 165, 250, 0.4)'
                }}>
                  {result.ticket_code}
                </div>
              </div>
              <span className={statusLabel[result.status].css}>
                {statusLabel[result.status].label}
              </span>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 20,
              }}>
                {[
                  { label: 'Nama', value: result.name },
                  { label: 'Metode', value: result.payment_method === 'qris' ? 'QRIS' : 'Cash' },
                  { label: 'Jumlah Orang', value: `${result.quantity || 1} Orang` },
                  {
                    label: 'Berlaku Hingga',
                    value: result.expires_at
                      ? new Date(result.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '-',
                  },
                  {
                    label: 'Dibuat',
                    value: new Date(result.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                  },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                      {label}
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--white)' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Status-specific message */}
              {result.status === 'confirmed' && (
                <div style={{
                  marginTop: 20, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--radius)', padding: '14px 16px',
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <CheckCircle size={16} style={{ color: '#34D399', flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: '0.88rem', color: '#6EE7B7' }}>
                    <strong>Tiket aktif!</strong> Ini adalah QR tiket Anda yang bisa langsung di-scan di gerbang.
                    <Link href={`/tiket/${result.ticket_code}`} style={{ display: 'block', marginTop: 8, color: '#34D399', fontWeight: 600 }}>
                      → Lihat tampilan tiket penuh
                    </Link>
                  </div>
                </div>
              )}

              {/* QR Code Display */}
              {result.qr_data_url && (
                <div style={{ marginTop: 24, textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-block', padding: 12, background: 'white',
                    borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', border: '1px solid var(--gray-200)',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={result.qr_data_url} alt={`QR Code ${result.ticket_code}`} width={200} height={200} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Kode QR Gerbang Masuk
                  </div>
                </div>
              )}

              {result.status === 'pending' && result.payment_method === 'cash' && (
                <div style={{
                  marginTop: 20, background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: 'var(--radius)', padding: '14px 16px',
                  fontSize: '0.88rem', color: '#C4B5FD',
                }}>
                  <Clock size={14} style={{ display: 'inline', marginRight: 6 }} />
                  Menunggu pembayaran cash di lokasi. Tunjukkan kode ini ke panitia.
                </div>
              )}

              {result.status === 'used' && (
                <div style={{
                  marginTop: 20, background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--radius)', padding: '14px 16px',
                  display: 'flex', gap: 10, alignItems: 'center',
                  fontSize: '0.88rem', color: 'var(--gray-400)',
                }}>
                  <XCircle size={16} style={{ flexShrink: 0 }} />
                  Tiket ini sudah digunakan untuk masuk event.
                </div>
              )}

              <div style={{ marginTop: 20 }}>
                <Link href={`/tiket/${result.ticket_code}`} className="btn btn-secondary btn-full">
                  <Ticket size={16} /> Lihat Tiket Lengkap
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
