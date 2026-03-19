'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  RefreshCw, Download, Search, Filter, CheckCircle,
  Users, Ticket, BarChart2, QrCode, XCircle, Trash2, Settings, Save, AlertOctagon
} from 'lucide-react';

type TicketStatus = 'pending' | 'paid_online' | 'paid_cash' | 'confirmed' | 'used' | 'expired';

interface AdminTicket {
  id: string;
  name: string;
  phone: string;
  ticket_code: string;
  payment_method: 'qris' | 'cash';
  status: TicketStatus;
  is_used: boolean;
  created_at: string;
  expires_at: string | null;
  quantity: number;
}

interface Analytics {
  total_active: number;
  total_pending: number;
  total_confirmed: number;
  total_used: number;
  total_expired: number;
  total_qris: number;
  total_cash: number;
  revenue_qris: number;
  revenue_cash: number;
}

const STATUS_BADGE: Record<TicketStatus, string> = {
  pending:    'badge badge-pending',
  paid_online:'badge badge-confirmed',
  paid_cash:  'badge badge-cash',
  confirmed:  'badge badge-confirmed',
  used:       'badge badge-used',
  expired:    'badge badge-expired',
};

const STATUS_LABEL: Record<TicketStatus, string> = {
  pending:    'Pending',
  paid_online:'Dibayar QRIS',
  paid_cash:  'Dibayar Cash',
  confirmed:  'Konfirmasi',
  used:       'Digunakan',
  expired:    'Kadaluarsa',
};

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof Users; label: string; value: number | string; color: string;
}) {
  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: `${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        boxShadow: `0 0 15px ${color}30`,
      }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--white)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

export default function AdminPageClient() {
  const router = useRouter();

  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [activeTab, setActiveTab] = useState<'tickets' | 'analytics' | 'settings'>('tickets');
  
  // Settings Tab States
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isNuking, setIsNuking] = useState(false);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const ticketRes = await fetch('/api/admin/tickets?limit=200');
      
      if (ticketRes.status === 401) {
        setAuthenticated(false);
        return;
      }
      
      if (ticketRes.ok) {
        setAuthenticated(true);
        const d = await ticketRes.json();
        setTickets(d.tickets || []);
      }
      
      const analyticsRes = await fetch('/api/admin/analytics');
      if (analyticsRes.ok) {
        setAnalytics(await analyticsRes.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        loadData();
      } else {
        toast.error(data.error || 'Password salah');
      }
    } catch {
      toast.error('Koneksi gagal');
    } finally {
      setLoginLoading(false);
    }
  }

  async function confirmCash(ticket_code: string) {
    const res = await fetch('/api/admin/confirm-cash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_code }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(data.message);
      setTickets((t) => t.map((ticket) =>
        ticket.ticket_code === ticket_code ? { ...ticket, status: 'confirmed' as TicketStatus } : ticket
      ));
    } else {
      toast.error(data.error);
    }
  }

  async function deleteTicket(ticket_code: string, name: string) {
    if (!window.confirm(`Yakin ingin menghapus tiket milik ${name} (${ticket_code})? Aksi ini tidak dapat dibatalkan.`)) {
      return;
    }
    
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_code }),
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message);
        setTickets((t) => t.filter((ticket) => ticket.ticket_code !== ticket_code));
      } else {
        toast.error(data.error || 'Gagal menghapus tiket');
      }
    } catch (e) {
      toast.error('Koneksi gagal');
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 4) return toast.error('Password minimal 4 karakter');
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setNewPassword('');
      } else toast.error(data.error);
    } catch {
      toast.error('Gagal update pengaturan');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleNukeDatabase() {
    if (!window.confirm('PERINGATAN KERAS! Anda yakin ingin MENGHAPUS SEMUA riwayat tiket dan pembayaran? Aksi ini TIDAK DAPAT DIBATALKAN.')) return;
    if (!window.prompt('Ketik "HAPUS SEMUA" untuk konfirmasi menghapus semua data:')?.includes('HAPUS SEMUA')) {
      return toast.error('Konfirmasi dibatalkan.');
    }
    
    setIsNuking(true);
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        loadData(); // Load analytics and empty tickets
      } else toast.error(data.error);
    } catch {
      toast.error('Gagal menghapus semua data');
    } finally {
      setIsNuking(false);
    }
  }

  function handleExport() {
    window.open('/api/admin/export', '_blank');
  }

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterMethod && t.payment_method !== filterMethod) return false;
    if (search) {
      const s = search.toLowerCase();
      return t.name.toLowerCase().includes(s) || t.ticket_code.toLowerCase().includes(s) || t.phone.includes(s);
    }
    return true;
  });

  // Login form
  if (!authenticated) {
    return (
      <main style={{ minHeight: '100vh', background: '#060D1F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: '1.5rem', fontWeight: 800, color: 'white',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
            }}>🏀</div>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--white)' }}>Admin IBS 2026</h1>
            <p style={{ color: 'var(--gray-400)', marginTop: 8 }}>Masukkan kunci admin untuk akses</p>
          </div>
          <div className="glass-card" style={{ padding: '32px' }}>
            <form onSubmit={handleLogin}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Password Admin</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Masukkan password..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loginLoading}>
                {loginLoading ? <><span className="spinner" /> Memverifikasi...</> : 'Masuk Dashboard'}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#060D1F' }}>
      {/* Admin Navbar */}
      <div style={{
        background: '#0B142A', color: 'white',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '14px 20px', position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🏀</span> Admin IBS 2026
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link
              href="/admin/scan"
              className="btn btn-secondary btn-sm"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <QrCode size={14} /> Scanner
            </Link>
            <button
              onClick={handleExport}
              className="btn btn-secondary btn-sm"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <Download size={14} /> Export
            </button>
            <button
              onClick={() => loadData()}
              className="btn btn-secondary btn-sm"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
              disabled={loading}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 20px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28 }}>
          {([
            { key: 'tickets' as const, label: 'Daftar Tiket', icon: Ticket },
            { key: 'analytics' as const, label: 'Statistik & Pendapatan', icon: BarChart2 },
            { key: 'settings' as const, label: 'Pengaturan', icon: Settings },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`btn ${activeTab === key ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <StatCard icon={Ticket} label="Total Aktif" value={analytics.total_active} color="#3B82F6" />
            <StatCard icon={CheckCircle} label="Terkonfirmasi" value={analytics.total_confirmed} color="#10B981" />
            <StatCard icon={Users} label="Pending" value={analytics.total_pending} color="#F59E0B" />
            <StatCard icon={CheckCircle} label="Sudah Digunakan" value={analytics.total_used} color="#8B5CF6" />
            <StatCard icon={XCircle} label="Kadaluarsa" value={analytics.total_expired} color="#64748B" />
            <StatCard icon={Ticket} label="QRIS" value={analytics.total_qris} color="#3B82F6" />
            <StatCard icon={Ticket} label="Cash" value={analytics.total_cash} color="#8B5CF6" />
          </div>

          {/* Revenue Analytics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
            <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.2) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <div style={{ fontSize: '0.85rem', color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 8 }}>Total Pendapatan QRIS</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>{formatIDR(analytics.revenue_qris)}</div>
            </div>
            <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.2) 100%)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <div style={{ fontSize: '0.85rem', color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 8 }}>Total Pendapatan Tunai</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>{formatIDR(analytics.revenue_cash)}</div>
            </div>
          </div>
        </>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeInUp 0.3s ease' }}>
            <div className="glass-card" style={{ padding: '24px 32px' }}>
              <h2 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Settings className="text-accent" /> Keamanan Admin
              </h2>
              <form onSubmit={handleUpdatePassword} style={{ maxWidth: 400 }}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Password Admin Baru</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Masukkan password baru..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginTop: 8, lineHeight: 1.5 }}>
                    Password ini akan memperbarui tabel database. Admin lain mungkin akan terkeluar secara otomatis.
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={isSaving || newPassword.length < 4}>
                  {isSaving ? 'Menyimpan...' : <><Save size={16} /> Ubah Password Admin</>}
                </button>
              </form>
            </div>

            <div className="glass-card" style={{ padding: '32px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(153, 27, 27, 0.1) 100%)' }}>
              <h2 style={{ color: '#F87171', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <AlertOctagon /> Zona Bahaya (Danger Zone)
              </h2>
              <p style={{ color: 'var(--gray-300)', marginBottom: 20, maxWidth: 650, lineHeight: 1.6 }}>
                Tindakan di bawah ini akan menghapus <strong>SELURUH</strong> riwayat penjualan tiket, data pembeli, dan pembayaran (QRIS maupun Cash). Gunakan hanya saat Anda sedang mengatur ulang acara atau menghapus data pengujian simulasi. <strong style={{ color: '#FCA5A5' }}>Tindakan ini tidak dapat dikembalikan!</strong>
              </p>
              <button 
                onClick={handleNukeDatabase} 
                className="btn btn-primary" 
                style={{ background: '#ef4444', borderColor: '#b91c1c', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' }}
                disabled={isNuking}
              >
                {isNuking ? 'Sedang Menghapus Semuanya...' : <><Trash2 size={16} /> Hapus Seluruh Riwayat Pemesanan</>}
              </button>
            </div>
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div>
            <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 200px' }}>
                  <Search size={15} style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--gray-400)', pointerEvents: 'none',
                  }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Cari nama, kode, atau HP..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ paddingLeft: 36 }}
                  />
                </div>
                <select className="form-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ flex: '0 1 160px' }}>
                  <option value="">Semua Status</option>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <select className="form-input" value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)} style={{ flex: '0 1 130px' }}>
                  <option value="">Semua Metode</option>
                  <option value="qris">QRIS</option>
                  <option value="cash">Cash</option>
                </select>
                <div style={{ color: 'var(--gray-500)', fontSize: '0.85rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Filter size={14} /> {filteredTickets.length} tiket
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--gray-400)' }}>
                <div className="spinner spinner-dark" style={{ width: 32, height: 32, margin: '0 auto 16px', borderTopColor: 'var(--accent)' }} />
                Memuat data...
              </div>
            ) : (
              <div className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Kode Tiket</th>
                        <th>Nama</th>
                        <th>HP</th>
                        <th>Qty</th>
                        <th>Metode</th>
                        <th>Status</th>
                        <th>Tanggal</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-400)' }}>
                            Tidak ada tiket ditemukan
                          </td>
                        </tr>
                      ) : (
                        filteredTickets.map((t, i) => (
                          <tr key={t.id}>
                            <td style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>{i + 1}</td>
                            <td>
                              <code style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-light)', letterSpacing: '1px' }}>
                                {t.ticket_code}
                              </code>
                            </td>
                            <td style={{ fontWeight: 500, color: 'var(--white)' }}>{t.name}</td>
                            <td style={{ color: 'var(--gray-400)' }}>{t.phone}</td>
                            <td style={{ fontWeight: 700, color: 'var(--accent-light)' }}>{t.quantity || 1}</td>
                            <td>
                              <span className={t.payment_method === 'qris' ? 'badge badge-qris' : 'badge badge-cash'}>
                                {t.payment_method.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <span className={STATUS_BADGE[t.status] || 'badge badge-pending'}>
                                {STATUS_LABEL[t.status] || t.status}
                              </span>
                            </td>
                            <td style={{ color: 'var(--gray-500)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                              {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 6 }}>
                                {t.status === 'pending' && t.payment_method === 'cash' && (
                                  <button onClick={() => confirmCash(t.ticket_code)} className="btn btn-success btn-sm" title="Konfirmasi Pembayaran">
                                    <CheckCircle size={16} />
                                  </button>
                                )}
                                <Link href={`/tiket/${t.ticket_code}`} target="_blank" className="btn btn-ghost btn-sm" title="Lihat Tiket">
                                  <Ticket size={16} />
                                </Link>
                                <button onClick={() => deleteTicket(t.ticket_code, t.name)} className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} title="Hapus Tiket">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
