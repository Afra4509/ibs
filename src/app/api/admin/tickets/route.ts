import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

function verifyAdminKey(): boolean {
  const cookieStore = cookies();
  const token = cookieStore.get('admin_token');
  return token?.value === 'true';
}

/**
 * GET /api/admin/tickets
 * List all tickets with filter & search
 */
export async function GET(request: NextRequest) {
  if (!verifyAdminKey()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const method = searchParams.get('method');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('tickets')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (method) query = query.eq('payment_method', method);
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,ticket_code.ilike.%${search}%,phone.ilike.%${search}%`
    );
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil data tiket.' }, { status: 500 });
  }

  return NextResponse.json({
    tickets: data,
    total: count,
    page,
    limit,
  });
}

/**
 * DELETE /api/admin/tickets
 * Deletes a ticket by ticket_code
 */
export async function DELETE(request: NextRequest) {
  if (!verifyAdminKey()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { ticket_code, all } = await request.json();
    
    // Nuke feature (delete all history)
    if (all === true) {
      await supabaseAdmin.from('tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseAdmin.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      return NextResponse.json({ success: true, message: `Seluruh riwayat tiket dan pembayaran telah dihapus permanen.` });
    }

    if (!ticket_code) {
      return NextResponse.json({ error: 'Kode tiket tidak ditemukan.' }, { status: 400 });
    }

    // Delete the ticket directly
    const { error } = await supabaseAdmin
      .from('tickets')
      .delete()
      .eq('ticket_code', ticket_code);

    if (error) {
      throw error;
    }

    // Attempt to delete associated payments (fail silently if not exists)
    await supabaseAdmin
      .from('payments')
      .delete()
      .eq('ticket_code', ticket_code);

    return NextResponse.json({ success: true, message: `Tiket ${ticket_code} berhasil dihapus.` });
  } catch (error) {
    console.error('Delete ticket error:', error);
    return NextResponse.json({ error: 'Gagal menghapus tiket.' }, { status: 500 });
  }
}
