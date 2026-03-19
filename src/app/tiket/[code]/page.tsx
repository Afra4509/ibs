'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Copy, Check, AlertTriangle,
  Ticket, Clock, CheckCircle, XCircle, Home, Download, CreditCard, Wallet, RefreshCw, ShieldCheck
} from 'lucide-react';

type TicketStatus = 'pending' | 'paid_online' | 'paid_cash' | 'confirmed' | 'used' | 'expired';

interface TicketData {
  ticket_code: string;
  name: string;
  payment_method: 'qris' | 'cash';
  status: TicketStatus;
  is_used: boolean;
  expires_at: string | null;
  qr_data_url?: string;
  pakasir_payment_url?: string | null;
  quantity: number;
}

const STATUS_INFO: Record<TicketStatus, { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle; desc: string }> = {
  pending:    { label: 'Menunggu Pembayaran',  color: '#FBBF24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)',  icon: Clock,       desc: 'Segera selesaikan pembayaran Anda.' },
  paid_online:{ label: 'Pembayaran Diproses',  color: '#60A5FA', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)',  icon: RefreshCw,   desc: 'Pembayaran diterima, sedang dikonfirmasi.' },
  paid_cash:  { label: 'Menunggu Konfirmasi',  color: '#A78BFA', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)', icon: Clock,       desc: 'Menunggu konfirmasi admin.' },
  confirmed:  { label: 'Terkonfirmasi ✓',      color: '#34D399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)',  icon: CheckCircle, desc: 'Tiket aktif! Tunjukkan QR saat masuk.' },
  used:       { label: 'Sudah Digunakan',      color: '#6B7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.25)', icon: Check,       desc: 'Tiket ini telah digunakan untuk masuk event.' },
  expired:    { label: 'Kadaluarsa',           color: '#EF4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',    icon: XCircle,     desc: 'Tiket ini sudah melewati tanggal berlaku.' },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Kode tiket disalin!');
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '9px 16px', borderRadius: 10,
      background: copied ? '#D1FAE5' : '#F1F5F9',
      border: `1px solid ${copied ? '#A7F3D0' : '#E2E8F0'}`,
      color: copied ? '#065F46' : '#475569',
      cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700,
      transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Tersalin!' : 'Salin Kode'}
    </button>
  );
}

function TicketCard({ ticket, statusInfo, eventName, polling }: {
  ticket: TicketData;
  statusInfo: typeof STATUS_INFO[TicketStatus];
  eventName: string;
  polling: boolean;
}) {
  const StatusIcon = statusInfo.icon;
  const isConfirmed = ['confirmed', 'paid_online', 'paid_cash'].includes(ticket.status);

  return (
    <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 20px 40px rgba(0,0,0,0.15)', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <div style={{ background: '#0F172A', padding: '28px 28px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(99,102,241,0.12)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, fontWeight: 700 }}>Tiket Masuk · {eventName}</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: 'white', marginBottom: 6, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{ticket.name}</div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.4)', color: '#A5B4FC', padding: '4px 12px', borderRadius: 9999, fontSize: '0.78rem', fontWeight: 700, marginBottom: 8 }}>
            🎟️ {ticket.quantity} Orang
          </span>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', opacity: 0.07 }}>
          <Ticket size={64} style={{ color: 'white' }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', margin: '0 -1px', overflow: 'hidden' }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#060913', flexShrink: 0 }} />
        <div style={{ flex: 1, borderTop: '2px dashed #E2E8F0' }} />
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#060913', flexShrink: 0 }} />
      </div>

      <div style={{ padding: '24px 28px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}`, padding: '9px 18px', borderRadius: 9999, fontSize: '0.85rem', fontWeight: 700 }}>
            <StatusIcon size={14} />
            {statusInfo.label}
            {polling && <span className="spinner" style={{ width: 12, height: 12 }} />}
          </div>
        </div>

        {statusInfo.desc && <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: 20, textAlign: 'center' }}>{statusInfo.desc}</p>}

        {isConfirmed && ticket.qr_data_url && (
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-block', padding: 14, background: 'white', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ticket.qr_data_url} alt="QR Code" width={200} height={200} />
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 10 }}>Scan QR ini di pintu masuk event</p>
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 700 }}>Kode Tiket</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, fontFamily: 'Courier New, monospace', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '4px', color: '#1E293B', background: '#F8FAFC', padding: '14px 18px', borderRadius: 12, border: '2px dashed #CBD5E1', textAlign: 'center' }}>
              {ticket.ticket_code}
            </div>
            <CopyButton text={ticket.ticket_code} />
          </div>
        </div>

        {ticket.payment_method === 'qris' && ticket.status === 'pending' && ticket.pakasir_payment_url && (
          <div data-html2canvas-ignore="true" style={{ marginBottom: 20, textAlign: 'center', background: 'rgba(99,102,241,0.04)', padding: 22, borderRadius: 16, border: '1px solid rgba(99,102,241,0.15)' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#4F46E5', marginBottom: 8 }}>Selesaikan Pembayaran QRIS Anda</div>
            <div style={{ fontSize: '0.83rem', color: '#64748B', marginBottom: 18, lineHeight: 1.6 }}>Sistem keamanan PakASir mengharuskan Anda membuka halaman mereka secara langsung untuk memunculkan QR Code.</div>
            <a href={ticket.pakasir_payment_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '16px 20px', borderRadius: 14, textAlign: 'center', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: 'white', fontWeight: 700, fontSize: '1rem', boxShadow: '0 8px 20px rgba(99,102,241,0.35)', textDecoration: 'none' }}>
              Tampilkan QRIS Sekarang ↗
            </a>
            <div style={{ marginTop: 10, fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Aman & Terverifikasi oleh PakASir</div>
          </div>
        )}

        {ticket.payment_method === 'cash' && ticket.status === 'pending' && (
          <div style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: '#7C3AED', marginBottom: 10, fontSize: '0.9rem' }}>Instruksi Pembayaran Cash</div>
            <ol style={{ paddingLeft: 20, color: '#6D28D9', fontSize: '0.88rem', lineHeight: 1.8, fontWeight: 500, margin: 0 }}>
              <li>Datang ke lokasi event</li>
              <li>Tunjukkan kode tiket ke panitia</li>
              <li>Bayar kepada panitia di gerbang</li>
              <li>Panitia akan memindai QR Code ini</li>
            </ol>
          </div>
        )}

        <div style={{ height: 1, background: '#E2E8F0', margin: '20px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginBottom: 3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Berlaku Sampai</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1E293B' }}>
              {ticket.expires_at ? new Date(ticket.expires_at).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginBottom: 3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Metode</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
              {ticket.payment_method === 'qris' ? <><CreditCard size={14} /> QRIS</> : <><Wallet size={14} /> Cash</>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TiketPage() {
  const params = useParams();
  const code = (params.code as string)?.toUpperCase();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  // ─── Pure Canvas 2D download — no dependency on html2canvas ─────────────────
  const downloadTicket = async () => {
    if (!ticket) return;
    setDownloading(true);
    try {
      const eventName = process.env.NEXT_PUBLIC_EVENT_NAME || 'IBS 2026';
      const W = 600, PAD = 40;

      // Pre-load QR image
      let qrImg: HTMLImageElement | null = null;
      const needsQr = ['confirmed', 'paid_online', 'paid_cash'].includes(ticket.status);
      if (needsQr && ticket.qr_data_url) {
        qrImg = new Image();
        qrImg.src = ticket.qr_data_url;
        await new Promise<void>((res) => {
          qrImg!.onload = () => res();
          qrImg!.onerror = () => { qrImg = null; res(); };
          setTimeout(res, 3000);
        });
      }

      const headerH = 200, perfH = 30;
      const qrBlockH = qrImg ? 270 : 0;
      const TOTAL_H = headerH + perfH + 80 + qrBlockH + 110 + 32 + 80 + PAD;

      const canvas = document.createElement('canvas');
      canvas.width = W * 2; canvas.height = TOTAL_H * 2;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(2, 2);

      const rr = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      };

      // background
      ctx.fillStyle = '#F1F5F9';
      ctx.fillRect(0, 0, W, TOTAL_H);

      // card
      ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 6;
      ctx.fillStyle = 'white'; rr(20, 20, W - 40, TOTAL_H - 40, 20); ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

      // header clip
      ctx.save(); rr(20, 20, W - 40, headerH, 20); ctx.clip();
      ctx.fillStyle = '#0F172A'; ctx.fillRect(20, 20, W - 40, headerH);
      ctx.fillStyle = 'rgba(99,102,241,0.15)';
      ctx.beginPath(); ctx.arc(W - 10, 10, 120, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // header text
      ctx.fillStyle = '#64748B'; ctx.font = 'bold 11px Arial';
      ctx.fillText(`TIKET MASUK · ${eventName.toUpperCase()}`, PAD + 20, 20 + 46);

      ctx.fillStyle = 'white'; ctx.font = 'bold 28px Arial';
      ctx.fillText(ticket.name, PAD + 20, 20 + 84);

      // qty pill
      ctx.font = 'bold 12px Arial';
      const qt = `   ${ticket.quantity} Orang`;
      const qw = ctx.measureText(qt).width + 20;
      ctx.fillStyle = '#312E81'; rr(PAD + 20, 20 + 98, qw, 24, 12); ctx.fill();
      ctx.fillStyle = '#A5B4FC'; ctx.fillText(qt, PAD + 20 + 4, 20 + 115);

      ctx.fillStyle = '#94A3B8'; ctx.font = '12px Arial';
      ctx.fillText(new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), PAD + 20, 20 + 160);

      // perf line
      const perfY = 20 + headerH + perfH / 2;
      ctx.setLineDash([6, 4]); ctx.strokeStyle = '#CBD5E1'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(PAD + 20, perfY); ctx.lineTo(W - PAD - 20, perfY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#F1F5F9';
      ctx.beginPath(); ctx.arc(20, perfY, 14, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(W - 20, perfY, 14, 0, Math.PI * 2); ctx.fill();

      // status badge
      const cardTop = 20 + headerH + perfH;
      const statusBgs: Record<string, string> = { pending: '#FEF3C7', paid_online: '#DBEAFE', paid_cash: '#F3E8FF', confirmed: '#D1FAE5', used: '#F3F4F6', expired: '#FEE2E2' };
      const statusClrs: Record<string, string> = { pending: '#92400E', paid_online: '#1E40AF', paid_cash: '#5B21B6', confirmed: '#065F46', used: '#374151', expired: '#991B1B' };
      const statusLbls: Record<string, string> = { pending: 'Menunggu Pembayaran', paid_online: 'Dibayar Online', paid_cash: 'Menunggu Konfirmasi', confirmed: 'Terkonfirmasi ✓', used: 'Sudah Digunakan', expired: 'Kadaluarsa' };
      const sLbl = statusLbls[ticket.status] || ticket.status;
      ctx.font = 'bold 13px Arial';
      const sW = ctx.measureText(sLbl).width + 36;
      const sBX = (W - sW) / 2;
      ctx.fillStyle = statusBgs[ticket.status] || '#FEF3C7';
      rr(sBX, cardTop + 20, sW, 28, 14); ctx.fill();
      ctx.fillStyle = statusClrs[ticket.status] || '#92400E';
      ctx.fillText(sLbl, sBX + 18, cardTop + 39);

      let curY = cardTop + 68;

      // QR
      if (qrImg) {
        const qrSz = 200, qrX = (W - qrSz) / 2;
        ctx.strokeStyle = '#E2E8F0'; ctx.lineWidth = 1; ctx.fillStyle = 'white';
        rr(qrX - 14, curY - 14, qrSz + 28, qrSz + 28, 12); ctx.fill(); ctx.stroke();
        ctx.drawImage(qrImg, qrX, curY, qrSz, qrSz);
        ctx.fillStyle = '#94A3B8'; ctx.font = '11px Arial'; ctx.textAlign = 'center';
        ctx.fillText('Scan QR ini di pintu masuk event', W / 2, curY + qrSz + 26);
        ctx.textAlign = 'left';
        curY += qrSz + 64;
      }

      // ticket code label
      ctx.fillStyle = '#94A3B8'; ctx.font = 'bold 10px Arial';
      ctx.fillText('KODE TIKET', PAD + 20, curY);
      curY += 14;

      // code box
      ctx.setLineDash([6, 4]); ctx.strokeStyle = '#CBD5E1'; ctx.lineWidth = 2;
      rr(PAD + 20, curY, W - PAD * 2 - 40, 50, 12); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = '#F8FAFC';
      rr(PAD + 20, curY, W - PAD * 2 - 40, 50, 12); ctx.fill();
      ctx.fillStyle = '#1E293B'; ctx.font = 'bold 22px "Courier New"';
      ctx.textAlign = 'center'; ctx.fillText(ticket.ticket_code, W / 2, curY + 33);
      ctx.textAlign = 'left';
      curY += 68;

      // divider
      ctx.strokeStyle = '#E2E8F0'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD + 20, curY); ctx.lineTo(W - PAD - 20, curY); ctx.stroke();
      curY += 22;

      // footer
      ctx.fillStyle = '#94A3B8'; ctx.font = 'bold 10px Arial';
      ctx.fillText('BERLAKU SAMPAI', PAD + 20, curY);
      ctx.textAlign = 'right'; ctx.fillText('METODE', W - PAD - 20, curY);
      ctx.textAlign = 'left'; curY += 18;

      ctx.fillStyle = '#1E293B'; ctx.font = 'bold 14px Arial';
      const exp = ticket.expires_at
        ? new Date(ticket.expires_at).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
        : '-';
      ctx.fillText(exp, PAD + 20, curY);
      ctx.textAlign = 'right';
      ctx.fillText(ticket.payment_method === 'qris' ? 'QRIS' : 'Cash', W - PAD - 20, curY);
      ctx.textAlign = 'left';

      // download
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url; a.download = `Tiket-IBS-${ticket.ticket_code}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast.success('Tiket berhasil diunduh!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunduh tiket.');
    } finally {
      setDownloading(false);
    }
  };

  const loadTicket = useCallback(async () => {
    try {
      const cached = sessionStorage.getItem(`ticket_${code}`);
      let qrDataUrl: string | undefined;
      let pakasirUrl: string | null = null;
      if (cached) {
        const parsed = JSON.parse(cached);
        qrDataUrl = parsed.qr_data_url;
        pakasirUrl = parsed.pakasir_payment_url;
      }
      const res = await fetch(`/api/check-ticket?code=${code}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Tiket tidak ditemukan'); return; }
      setTicket({ ...data, qr_data_url: qrDataUrl || data.qr_data_url, pakasir_payment_url: pakasirUrl });
    } catch {
      setError('Gagal memuat data tiket. Coba muat ulang halaman.');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    const stored = sessionStorage.getItem(`ticket_${code}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.qr_data_url) setTicket((t) => t ? { ...t, qr_data_url: parsed.qr_data_url } : parsed);
    }
    setLoading(true);
    loadTicket();
  }, [code, loadTicket]);

  useEffect(() => {
    if (!ticket) return;
    if (!['pending', 'paid_online'].includes(ticket.status)) return;
    if (ticket.payment_method !== 'qris') return;
    setPolling(true);
    const interval = setInterval(async () => {
      const res = await fetch(`/api/check-ticket?code=${code}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.status !== ticket.status) {
          setTicket((prev) => prev ? { ...prev, status: data.status } : null);
          if (data.status === 'confirmed') { toast.success('✅ Pembayaran terkonfirmasi!'); clearInterval(interval); setPolling(false); }
        }
      }
    }, 5000);
    return () => { clearInterval(interval); setPolling(false); };
  }, [ticket?.status, ticket?.payment_method, code]);

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#060913', padding: '60px 0' }}>
        <div className="container container-sm">
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 20, height: 400, border: '1px solid rgba(255,255,255,0.06)' }} />
        </div>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main style={{ minHeight: '100vh', background: '#060913', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <XCircle size={48} style={{ color: '#EF4444', margin: '0 auto 16px' }} />
          <h2 style={{ color: 'white', marginBottom: 8 }}>Tiket Tidak Ditemukan</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>{error}</p>
          <Link href="/cek" className="btn btn-primary">Cek Tiket Lain</Link>
        </div>
      </main>
    );
  }

  const statusInfo = STATUS_INFO[ticket.status] || STATUS_INFO.pending;
  const eventName = process.env.NEXT_PUBLIC_EVENT_NAME || 'IBS 2026';

  return (
    <main style={{ minHeight: '100vh', background: '#060913', paddingBottom: 64 }}>
      <div style={{ background: 'linear-gradient(180deg, #0D1224 0%, #060913 100%)', padding: '20px 0 40px' }}>
        <div className="container container-sm">
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', marginBottom: 24, fontWeight: 500 }}>
            <Home size={15} /> Beranda
          </Link>
          <h1 style={{ color: 'white', fontSize: '1.7rem', marginBottom: 4, fontWeight: 800 }}>Tiket Kamu</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>{eventName}</p>
        </div>
      </div>

      <div className="container container-sm" style={{ paddingTop: 24 }}>
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
          <AlertTriangle size={16} style={{ color: '#F87171', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, color: '#F87171', fontSize: '0.88rem', marginBottom: 3 }}>⚠️ Screenshot Tiket Ini Sekarang!</div>
            <div style={{ color: '#FCA5A5', fontSize: '0.81rem', lineHeight: 1.5 }}>
              Kode tiket <strong>tidak dapat dipulihkan</strong> jika hilang. Tidak ada sistem login — simpan kode ini dengan aman.
            </div>
          </div>
        </div>

        <div ref={ticketRef} style={{ animation: 'fadeInUp 0.5s ease 0.1s both' }}>
          <TicketCard ticket={ticket} statusInfo={statusInfo} eventName={eventName} polling={polling} />
        </div>

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={downloadTicket} disabled={downloading} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '16px 24px', borderRadius: 16, cursor: downloading ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg, #6366F1, #4F46E5)', border: 'none',
            color: 'white', fontWeight: 700, fontSize: '1rem',
            boxShadow: '0 8px 24px rgba(99,102,241,0.35)', opacity: downloading ? 0.7 : 1,
          }}>
            {downloading ? <><span className="spinner" /> Menyiapkan PNG...</> : <><Download size={18} /> Unduh Tiket (PNG)</>}
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/cek" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', fontWeight: 600, fontSize: '0.92rem' }}>
              <Ticket size={16} /> Cek Tiket
            </Link>
            <Link href="/" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', fontWeight: 600, fontSize: '0.92rem' }}>
              <Home size={16} /> Beranda
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
            <ShieldCheck size={13} style={{ color: '#34D399' }} /> Tiket terverifikasi sistem IBS 2026
          </div>
        </div>
      </div>
    </main>
  );
}
