import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

function verifyAdminKey(): boolean {
  const cookieStore = cookies();
  const token = cookieStore.get('admin_token');
  return token?.value === 'true';
}

/**
 * POST /api/admin/confirm-cash
 * Manually confirm cash payment → update status to confirmed
 */
export async function POST(request: NextRequest) {
  if (!verifyAdminKey()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { ticket_code } = await request.json();

  if (!ticket_code) {
    return NextResponse.json({ error: 'Kode tiket wajib diisi.' }, { status: 400 });
  }

  const { data: ticket, error: findError } = await supabaseAdmin
    .from('tickets')
    .select('ticket_code, status, payment_method')
    .eq('ticket_code', ticket_code)
    .single();

  if (findError || !ticket) {
    return NextResponse.json({ error: 'Tiket tidak ditemukan.' }, { status: 404 });
  }

  if (ticket.payment_method !== 'cash') {
    return NextResponse.json(
      { error: 'Konfirmasi manual hanya untuk tiket cash.' },
      { status: 400 }
    );
  }

  if (['confirmed', 'used'].includes(ticket.status)) {
    return NextResponse.json(
      { error: `Tiket sudah ${ticket.status}.` },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabaseAdmin
    .from('tickets')
    .update({ status: 'confirmed' })
    .eq('ticket_code', ticket_code);

  if (updateError) {
    return NextResponse.json({ error: 'Gagal mengkonfirmasi tiket.' }, { status: 500 });
  }

  // Update payment record
  await supabaseAdmin
    .from('payments')
    .update({ status: 'paid' })
    .eq('ticket_code', ticket_code);

  return NextResponse.json({
    success: true,
    message: `Tiket ${ticket_code} berhasil dikonfirmasi.`,
  });
}
