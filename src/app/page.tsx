'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Ticket, ChevronRight, Star, Zap, Users, Trophy, Shield } from 'lucide-react';

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const calc = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!mounted) return null;

  const units = [
    { label: 'Hari', value: timeLeft.days },
    { label: 'Jam', value: timeLeft.hours },
    { label: 'Menit', value: timeLeft.minutes },
    { label: 'Detik', value: timeLeft.seconds },
  ];

  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
      {units.map((u, i) => (
        <div key={u.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 16,
            padding: '16px 20px',
            minWidth: 80,
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
              background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)',
            }} />
            <div style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              position: 'relative',
              textShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
            }}>
              {String(u.value).padStart(2, '0')}
            </div>
            <div style={{
              fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 6,
              fontWeight: 700, position: 'relative',
            }}>
              {u.label}
            </div>
          </div>
          {i < 3 && (
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.2)', lineHeight: 1 }}>:</span>
          )}
        </div>
      ))}
    </div>
  );
}

/* Floating particle dots */
function FloatingParticles() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {[...Array(20)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: Math.random() * 4 + 2,
          height: Math.random() * 4 + 2,
          borderRadius: '50%',
          background: `rgba(${Math.random() > 0.5 ? '99, 102, 241' : '59, 130, 246'}, ${Math.random() * 0.3 + 0.1})`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `float ${Math.random() * 6 + 4}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 5}s`,
        }} />
      ))}
    </div>
  );
}

export default function LandingPage() {
  const eventDateStr = process.env.NEXT_PUBLIC_EVENT_DATE || '2026-05-01';
  const eventName = process.env.NEXT_PUBLIC_EVENT_NAME || 'InvitasiBasketSmada (IBS) 2026';
  const eventVenue = process.env.NEXT_PUBLIC_EVENT_VENUE || 'GOR SMAN 2 Kota Pasuruan';
  const ticketPrice = process.env.NEXT_PUBLIC_TICKET_PRICE || '50000';
  const eventDate = new Date(eventDateStr + 'T00:00:00+07:00');

  const eventDateFormatted = eventDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const priceFormatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(parseInt(ticketPrice));

  return (
    <main>
      {/* ===================== NAVBAR ===================== */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-logo">
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '0.75rem', color: 'white',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
            }}>IBS</div>
            <span>IBS 2026</span>
          </div>
          <div className="navbar-links">
            <a href="#info" className="navbar-link">Info Event</a>
            <a href="#harga" className="navbar-link">Harga</a>
            <Link href="/cek" className="navbar-link">Cek Tiket</Link>
            <Link href="/beli" className="btn btn-primary btn-sm" style={{ borderRadius: 12 }}>
              Beli Tiket <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ===================== HERO ===================== */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '100px 0 120px',
        background: 'linear-gradient(180deg, #080B16 0%, #0D1224 30%, #111936 60%, #0C1029 100%)',
      }}>
        {/* Layered gradient mesh */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 50% at 20% 80%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 50% 40% at 80% 60%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)
          `,
        }} />

        {/* Grid pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <FloatingParticles />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
            {/* Animated Badge */}
            <div style={{ marginBottom: 28, animation: 'fadeInUp 0.6s ease' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#A5B4FC',
                padding: '8px 20px', borderRadius: '9999px',
                fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.15)',
              }}>
                <Star size={12} fill="currentColor" /> Tiket Resmi • 2026
              </span>
            </div>

            <h1 style={{
              color: 'white', marginBottom: 20, lineHeight: 1.1,
              animation: 'fadeInUp 0.6s ease 0.1s both',
            }}>
              <span style={{ fontSize: '0.6em', fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>
                Turnamen Basket Terbesar
              </span>
              InvitasiBasketSmada<br />
              <span style={{
                background: 'linear-gradient(135deg, #818CF8, #A78BFA, #60A5FA)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 30px rgba(129, 140, 248, 0.3))',
              }}>IBS 2026</span>
            </h1>

            <p style={{
              color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', marginBottom: 56,
              lineHeight: 1.8, maxWidth: 560, margin: '0 auto 56px',
              animation: 'fadeInUp 0.6s ease 0.2s both',
            }}>
              Saksikan pertandingan sengit antar sekolah terbaik se-Jawa Timur
              di turnamen basketball paling bergengsi di Kota Pasuruan.
            </p>

            {/* Countdown */}
            <div style={{ marginBottom: 56, animation: 'fadeInUp 0.6s ease 0.3s both' }}>
              <p style={{
                color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem',
                textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 20,
                fontWeight: 700,
              }}>
                ⏱ Event dimulai dalam
              </p>
              <CountdownTimer targetDate={eventDate} />
            </div>

            {/* CTA Buttons */}
            <div style={{
              display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap',
              animation: 'fadeInUp 0.6s ease 0.4s both',
            }}>
              <Link href="/beli" className="btn btn-primary btn-lg" style={{
                borderRadius: 16, padding: '18px 36px',
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                fontSize: '1.05rem',
              }}>
                <Ticket size={20} /> Beli Tiket Sekarang
              </Link>
              <Link href="/cek" className="btn btn-lg" style={{
                borderRadius: 16, padding: '18px 36px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'white', fontSize: '1.05rem',
                backdropFilter: 'blur(10px)',
              }}>
                Cek Tiket Saya
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
          background: 'linear-gradient(to top, #070B14, transparent)',
        }} />
      </section>

      {/* ===================== FEATURES STRIP ===================== */}
      <section style={{ background: '#070B14', padding: '48px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container">
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 0,
          }}>
            {[
              { icon: Trophy, label: 'Tim Terbaik', sub: 'Se-Jawa Timur' },
              { icon: Users, label: 'Ratusan Penonton', sub: 'Live Experience' },
              { icon: Shield, label: 'Tiket Aman', sub: 'QR Terverifikasi' },
              { icon: Zap, label: 'Beli Instan', sub: 'QRIS / Cash' },
            ].map(({ icon: Icon, label, sub }, i) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '20px 24px',
                borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <Icon size={22} style={{ color: '#818CF8', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>{label}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== EVENT INFO ===================== */}
      <section style={{ background: '#070B14', padding: '80px 0' }} id="info">
        <div className="container container-md">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ color: 'white', marginBottom: 12 }}>
              Informasi Event
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 400, margin: '0 auto' }}>
              Semua yang perlu kamu tahu tentang acara ini
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}>
            {[
              { icon: Calendar, label: 'Tanggal', value: eventDateFormatted, gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.15))', border: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA' },
              { icon: Clock, label: 'Waktu', value: 'Pukul 08.00 WIB s/d Selesai', gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.15))', border: 'rgba(16, 185, 129, 0.2)', color: '#34D399' },
              { icon: MapPin, label: 'Lokasi', value: eventVenue, gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.15))', border: 'rgba(239, 68, 68, 0.2)', color: '#F87171' },
              { icon: Ticket, label: 'Harga Tiket', value: priceFormatted, gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.15))', border: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24' },
            ].map(({ icon: Icon, label, value, gradient, border, color }) => (
              <div key={label} style={{
                background: gradient,
                border: `1px solid ${border}`,
                borderRadius: 16, padding: '28px 24px',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 30px rgba(0,0,0,0.3)`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: `${color}15`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  {label}
                </div>
                <div style={{ fontWeight: 700, color: 'white', fontSize: '1.05rem', lineHeight: 1.4 }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== TICKET PRICE ===================== */}
      <section style={{
        background: 'linear-gradient(180deg, #070B14 0%, #0C1029 50%, #070B14 100%)',
        padding: '80px 0',
        position: 'relative',
      }} id="harga">
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="container container-sm" style={{ position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ color: 'white', marginBottom: 12 }}>
              Harga Tiket
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>
              Segera amankan tiket Anda sebelum habis!
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.6), rgba(30, 41, 59, 0.4))',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 24, textAlign: 'center', padding: '56px 40px',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>
            {/* Shine effect */}
            <div style={{
              position: 'absolute', top: -100, right: -100, width: 300, height: 300,
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 60%)',
              pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)',
                padding: '6px 16px', borderRadius: 9999, marginBottom: 20,
                fontSize: '0.78rem', fontWeight: 700, color: '#A5B4FC',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                <Star size={12} fill="currentColor" /> Harga Normal
              </div>

              <div style={{
                fontSize: 'clamp(3rem, 8vw, 4.5rem)',
                fontWeight: 900, color: 'white',
                letterSpacing: '-0.03em',
                marginBottom: 32,
                textShadow: '0 0 40px rgba(99, 102, 241, 0.3)',
                lineHeight: 1,
              }}>
                {priceFormatted}
              </div>

              <div style={{
                display: 'flex', flexDirection: 'column', gap: 14,
                marginBottom: 40, alignItems: 'center',
              }}>
                {[
                  'Akses 1 hari penuh',
                  'Berlaku selama event',
                  'Dapat digunakan 1x masuk',
                  'Pembayaran QRIS atau Cash',
                ].map((item) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>{item}</span>
                  </div>
                ))}
              </div>

              <Link href="/beli" className="btn btn-primary btn-lg btn-full" style={{
                borderRadius: 16, padding: '18px 32px',
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                fontSize: '1.05rem',
              }}>
                <Zap size={20} /> Beli Tiket Sekarang
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section style={{ background: '#070B14', padding: '80px 0' }}>
        <div className="container container-md">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ color: 'white', marginBottom: 12 }}>
              Cara Beli Tiket
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>
              Mudah, cepat, dan aman — selesai dalam 2 menit
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { num: '1', title: 'Isi Data', desc: 'Masukkan nama dan nomor HP kamu', color: '#6366F1', gradient: 'rgba(99, 102, 241, 0.08)' },
              { num: '2', title: 'Pilih Pembayaran', desc: 'QRIS langsung atau Cash di lokasi', color: '#10B981', gradient: 'rgba(16, 185, 129, 0.08)' },
              { num: '3', title: 'Simpan Kode', desc: 'Screenshot kode tiket, tidak bisa dipulihkan', color: '#F59E0B', gradient: 'rgba(245, 158, 11, 0.08)' },
              { num: '4', title: 'Scan & Masuk', desc: 'Tunjukkan QR di gerbang masuk venue', color: '#8B5CF6', gradient: 'rgba(139, 92, 246, 0.08)' },
            ].map((step) => (
              <div key={step.num} style={{
                background: step.gradient,
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 20, padding: '32px 24px', textAlign: 'center',
                transition: 'transform 0.3s ease, border-color 0.3s ease',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = `${step.color}40`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: `${step.color}20`,
                  border: `1px solid ${step.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontSize: '1.3rem', fontWeight: 900, color: step.color,
                }}>
                  {step.num}
                </div>
                <div style={{ fontWeight: 700, color: 'white', marginBottom: 8, fontSize: '1.05rem' }}>
                  {step.title}
                </div>
                <div style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                  {step.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer style={{
        background: '#04060B',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        color: 'rgba(255,255,255,0.5)',
        padding: '48px 20px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          marginBottom: 16,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.65rem', color: 'white',
          }}>IBS</div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
            InvitasiBasketSmada 2026
          </span>
        </div>
        <div style={{ fontSize: '0.88rem', marginBottom: 4 }}>SMAN 2 Kota Pasuruan · {eventVenue}</div>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 32 }}>
          <Link href="/cek" style={{ color: 'rgba(255,255,255,0.5)', transition: 'color 0.2s', fontSize: '0.88rem' }}>
            Cek Tiket
          </Link>
          <Link href="/beli" style={{ color: 'rgba(255,255,255,0.5)', transition: 'color 0.2s', fontSize: '0.88rem' }}>
            Beli Tiket
          </Link>
          <Link href="/admin" style={{ color: 'rgba(255,255,255,0.3)', transition: 'color 0.2s', fontSize: '0.88rem' }}>
            Admin
          </Link>
        </div>
        <div style={{ marginTop: 32, fontSize: '0.78rem', color: 'rgba(255,255,255,0.25)' }}>
          © 2026 IBS Committee · SMAN 2 Pasuruan
        </div>
      </footer>
    </main>
  );
}
