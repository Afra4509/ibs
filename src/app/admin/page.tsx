import { Suspense } from 'react';
import AdminPageClient from './client';

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#060D1F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', animation: 'spin 0.6s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--gray-400)' }}>Memuat...</p>
        </div>
      </div>
    }>
      <AdminPageClient />
    </Suspense>
  );
}
