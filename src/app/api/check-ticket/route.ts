import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { generateQrDataUrl } from '@/lib/ticket';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/check-ticket?code=IBS-XXXXXXXX
 * Check ticket status by code - public endpoint with rate limiting
 */
export async function GET(request: NextRequest) {
  // Rate limit: 10 requests per minute per IP
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(ip, 'check-ticket', 10, 60 * 1000);

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: 'Terlalu banyak permintaan. Coba lagi sebentar.',
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code')?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json(
      { error: 'Kode tiket tidak boleh kosong.' },
      { status: 400 }
    );
  }

  // Basic format validation: IBS-XXXXXXXX
  if (!/^IBS-[A-Z0-9]{8}$/.test(code)) {
    return NextResponse.json(
      { error: 'Format kode tiket tidak valid. Format: IBS-XXXXXXXX' },
      { status: 400 }
    );
  }

  const { data: ticket, error } = await supabaseAdmin
    .from('tickets')
    .select('name, ticket_code, payment_method, status, is_used, expires_at, created_at, quantity')
    .eq('ticket_code', code)
    .single();

  if (error || !ticket) {
    return NextResponse.json(
      { error: 'Tiket tidak ditemukan. Periksa kembali kode Anda.' },
      { status: 404 }
    );
  }

  // Check if expired (auto-update)
  const now = new Date();
  if (ticket.expires_at && new Date(ticket.expires_at) < now && ticket.status !== 'used') {
    // Auto-expire
    await supabaseAdmin
      .from('tickets')
      .update({ status: 'expired' })
      .eq('ticket_code', code);
    ticket.status = 'expired';
  }

  let qr_data_url = null;
  const isConfirmed = ['confirmed', 'paid_online', 'paid_cash'].includes(ticket.status);
  
  if (isConfirmed && ticket.expires_at) {
    qr_data_url = await generateQrDataUrl(ticket.ticket_code, new Date(ticket.expires_at));
  }

  return NextResponse.json({
    found: true,
    ticket_code: ticket.ticket_code,
    name: ticket.name,
    payment_method: ticket.payment_method,
    status: ticket.status,
    is_used: ticket.is_used,
    expires_at: ticket.expires_at,
    created_at: ticket.created_at,
    quantity: ticket.quantity || 1,
    qr_data_url,
  });
}
