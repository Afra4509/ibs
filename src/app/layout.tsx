import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: {
    default: 'IBS 2026 — InvitasiBasketSmada SMAN 2 Pasuruan',
    template: '%s | IBS 2026',
  },
  description:
    'Beli tiket resmi InvitasiBasketSmada (IBS) 2026 SMAN 2 Kota Pasuruan. Turnamen basket paling bergengsi se-Jawa Timur. Pembayaran QRIS & cash tersedia.',
  keywords: ['IBS', 'InvitasiBasketSmada', 'basket', 'SMAN 2 Pasuruan', 'tiket', 'turnamen'],
  openGraph: {
    title: 'IBS 2026 — InvitasiBasketSmada',
    description: 'Beli tiket resmi IBS 2026 SMAN 2 Kota Pasuruan',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'Inter, sans-serif',
              borderRadius: '12px',
              fontWeight: '500',
            },
            success: {
              style: {
                background: '#D1FAE5',
                color: '#065F46',
                border: '1px solid #A7F3D0',
              },
            },
            error: {
              style: {
                background: '#FEE2E2',
                color: '#991B1B',
                border: '1px solid #FECACA',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
