import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { verifyQrToken } from '@/lib/ticket';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get('admin_token');

  if (!token || token.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized: Harap login sebagai admin.' }, { status: 401 });
  }

  try {
    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ error: 'Kode tiket diperlukan.' }, { status: 400 });
    }

    let cleanCode = code.trim();

    // If it looks like a JWT token, try to decode it
    if (cleanCode.startsWith('eyJ')) {
      try {
        cleanCode = await verifyQrToken(cleanCode);
      } catch (err) {
        return NextResponse.json({ error: 'QR Code tidak valid atau sudah kadaluarsa.' }, { status: 400 });
      }
    }

    cleanCode = cleanCode.toUpperCase();

    // Validate structure after decoding
    if (!/^IBS-[A-Z0-9]{8}$/.test(cleanCode)) {
      return NextResponse.json({ error: `Format kode tiket tidak dikenali: ${cleanCode}` }, { status: 400 });
    }

    // Fetch ticket
    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .select('status, is_used, payment_method, name, quantity')
      .eq('ticket_code', cleanCode)
      .single();

    if (error || !ticket) {
      return NextResponse.json({ error: `Tiket tidak ditemukan (${cleanCode}).` }, { status: 404 });
    }

    // Check status
    if (ticket.status === 'used' || ticket.is_used) {
      return NextResponse.json({ error: `Tiket ${cleanCode} sudah digunakan sebelumnya!` }, { status: 400 });
    }

    if (ticket.status === 'expired') {
      return NextResponse.json({ error: `Tiket ${cleanCode} sudah kadaluarsa.` }, { status: 400 });
    }

    if (ticket.status === 'pending') {
      return NextResponse.json({ error: `Tiket ${cleanCode} belum lunas (Menunggu Pembayaran).` }, { status: 400 });
    }

    // Update status to used
    const { error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({
        status: 'used',
        is_used: true,
      })
      .eq('ticket_code', cleanCode);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ 
      success: true, 
      message: `✅ VALID! Berlaku untuk ${ticket.quantity || 1} ORANG atas nama ${ticket.name}.` 
    });
  } catch (err: any) {
    console.error('Use ticket error:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan internal peladen.' }, { status: 500 });
  }
}
