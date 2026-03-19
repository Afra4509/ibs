import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyQrToken } from '@/lib/ticket';

/**
 * POST /api/scan-ticket
 * Admin endpoint: validate ticket QR or code → mark as used
 * Requires admin key in header or body
 */
export async function POST(request: NextRequest) {
  // Parse body once
  let body: { token?: string; ticket_code?: string; admin_key?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false, message: 'Request body tidak valid.' }, { status: 400 });
  }

  // Verify admin key from header or body
  const adminKey = process.env.ADMIN_SECRET_KEY;
  const key = request.headers.get('x-admin-key') || body.admin_key;

  if (!adminKey || key !== adminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { token, ticket_code: rawCode } = body;

  let resolvedCode: string | null = null;

  // Try to decode QR token first
  if (token) {
    try {
      resolvedCode = await verifyQrToken(token);
    } catch {
      return NextResponse.json(
        { valid: false, message: 'QR code tidak valid atau sudah kadaluarsa.' },
        { status: 400 }
      );
    }
  } else if (rawCode) {
    // Plain ticket code validation
    const cleanCode = rawCode.trim().toUpperCase();
    if (!/^IBS-[A-Z0-9]{8}$/.test(cleanCode)) {
      return NextResponse.json(
        { valid: false, message: 'Format kode tiket tidak valid.' },
        { status: 400 }
      );
    }
    resolvedCode = cleanCode;
  } else {
    return NextResponse.json(
      { valid: false, message: 'QR token atau kode tiket wajib diisi.' },
      { status: 400 }
    );
  }

  // Fetch ticket
  const { data: ticket, error } = await supabaseAdmin
    .from('tickets')
    .select('*')
    .eq('ticket_code', resolvedCode)
    .single();

  if (error || !ticket) {
    return NextResponse.json(
      { valid: false, message: 'Tiket tidak ditemukan.' },
      { status: 404 }
    );
  }

  // Check expiry
  if (ticket.expires_at && new Date(ticket.expires_at) < new Date()) {
    await supabaseAdmin
      .from('tickets')
      .update({ status: 'expired' })
      .eq('ticket_code', resolvedCode);
    return NextResponse.json({
      valid: false,
      message: 'Tiket sudah kadaluarsa.',
      name: ticket.name,
    });
  }

  // Check if already used
  if (ticket.is_used || ticket.status === 'used') {
    return NextResponse.json({
      valid: false,
      message: '⚠️ Tiket ini sudah digunakan sebelumnya!',
      name: ticket.name,
      status: ticket.status,
    });
  }

  // Check if confirmed (paid)
  if (!['confirmed', 'paid_online', 'paid_cash'].includes(ticket.status)) {
    return NextResponse.json({
      valid: false,
      message: `Tiket belum dikonfirmasi. Status saat ini: ${ticket.status}`,
      name: ticket.name,
      status: ticket.status,
    });
  }

  // Mark as used
  const { error: updateError } = await supabaseAdmin
    .from('tickets')
    .update({ is_used: true, status: 'used' })
    .eq('ticket_code', resolvedCode);

  if (updateError) {
    return NextResponse.json(
      { valid: false, message: 'Gagal memvalidasi tiket. Coba lagi.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    valid: true,
    message: `✅ Tiket valid! Selamat datang, ${ticket.name}!`,
    name: ticket.name,
    ticket_code: ticket.ticket_code,
    payment_method: ticket.payment_method,
  });
}
