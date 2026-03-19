'use client';

import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import Link from 'next/link';
import { ArrowLeft, Scan, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminScanPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Scanner only on client side
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 }, 
        aspectRatio: 1.0,
        supportedScanTypes: [0] // Camera scan only to prevent weird file bugs if needed
      },
      false
    );

    scanner.render(onScanSuccess, onScanFailure);

    let isScanning = false;

    async function onScanSuccess(decodedText: string) {
      if (isScanning) return; // Prevent double scans
      isScanning = true;
      setScanResult(decodedText);
      await handleUseTicket(decodedText);
      
      // Allow next scan after 3 seconds
      setTimeout(() => {
        isScanning = false;
        setScanResult(null);
        setSuccessMsg(null);
        setErrorMsg(null);
      }, 3000);
    }

    function onScanFailure() {
      // Ignore background scan failures
    }

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  async function handleUseTicket(code: string) {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const clean = code.trim();

    // Basic length val (JWTs are long, raw codes are 12 chars)
    if (clean.length < 10) {
      setErrorMsg(`Format kode tidak valid`);
      toast.error('Format QR tidak valid');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/use-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: clean }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal memproses tiket');
        toast.error('Gagal memverifikasi tiket');
      } else {
        setSuccessMsg(data.message);
        toast.success('Tiket Valid!');
      }
    } catch {
      setErrorMsg('Koneksi bermasalah');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#04060B' }}>
      {/* Navbar */}
      <nav className="navbar" style={{ position: 'relative' }}>
        <div className="navbar-inner">
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gray-300)', fontWeight: 600 }}>
            <ArrowLeft size={18} /> Kembali ke Dasbor
          </Link>
          <div style={{ color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Scan size={18} className="text-accent" /> IBS Scanner
          </div>
        </div>
      </nav>

      <div className="container container-sm" style={{ padding: '40px 20px' }}>
        <div className="text-center" style={{ marginBottom: 32 }}>
          <h1 style={{ color: 'white', fontSize: '1.8rem', marginBottom: 8 }}>Scan Tiket Masuk</h1>
          <p style={{ color: 'var(--gray-400)' }}>Arahkan kamera ke QR Code tiket penonton</p>
        </div>

        {/* Scanner Container */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: 24 }}>
          {/* HTML5 QR Code injects its own elements here */}
          <div id="reader" style={{ width: '100%', borderRadius: 'var(--radius)', overflow: 'hidden' }}></div>
          
          {/* Custom styling overrides for the injected elements */}
          <style dangerouslySetInnerHTML={{__html: `
            #reader { border: none !important; }
            #reader video { border-radius: 12px !important; object-fit: cover; }
            #reader__dashboard_section_csr span { color: var(--gray-400) !important; font-family: 'Inter', sans-serif; }
            #reader__dashboard_section_swaplink { color: var(--accent) !important; text-decoration: none !important; font-weight: 600; }
            #reader__camera_permission_button { background: var(--accent) !important; color: white !important; border: none !important; padding: 10px 20px !important; border-radius: 8px !important; cursor: pointer; font-weight: 600; margin-top: 10px; }
          `}} />
        </div>

        {/* Scan Results Area */}
        {scanResult && (
          <div className="glass-card" style={{ padding: '24px', animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Hasil Scan
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--white)', fontFamily: 'monospace', letterSpacing: '2px', marginBottom: 16 }}>
              {scanResult}
            </div>

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)' }}>
                <span className="spinner spinner-dark" /> Memverifikasi tiket ke server...
              </div>
            )}

            {successMsg && !loading && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '16px', borderRadius: 'var(--radius)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <CheckCircle size={24} style={{ color: '#34D399', flexShrink: 0 }} />
                <div style={{ color: '#6EE7B7', fontWeight: 600, lineHeight: 1.5 }}>
                  {successMsg}
                </div>
              </div>
            )}

            {errorMsg && !loading && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '16px', borderRadius: 'var(--radius)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <XCircle size={24} style={{ color: '#F87171', flexShrink: 0 }} />
                <div>
                  <div style={{ color: '#FCA5A5', fontWeight: 700, marginBottom: 4 }}>Tiket Ditolak!</div>
                  <div style={{ color: '#FECACA', fontSize: '0.9rem' }}>{errorMsg}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
