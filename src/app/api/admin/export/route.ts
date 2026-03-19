import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

function verifyAdminKey(): boolean {
  const cookieStore = cookies();
  const token = cookieStore.get('admin_token');
  return token?.value === 'true';
}

/**
 * GET /api/admin/export
 * Export all tickets as CSV
 */
export async function GET(request: NextRequest) {
  if (!verifyAdminKey()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: tickets, error } = await supabaseAdmin
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil data.' }, { status: 500 });
  }

  // Build CSV
  const headers = ['No', 'Ticket Code', 'Nama', 'HP', 'Metode', 'Status', 'Digunakan', 'Berlaku Hingga', 'Dibuat'];
  const rows = (tickets || []).map((t, i) => [
    i + 1,
    t.ticket_code,
    `"${t.name.replace(/"/g, '""')}"`,
    t.phone,
    t.payment_method.toUpperCase(),
    t.status,
    t.is_used ? 'Ya' : 'Tidak',
    t.expires_at ? new Date(t.expires_at).toLocaleString('id-ID') : '-',
    new Date(t.created_at).toLocaleString('id-ID'),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const filename = `ibs-tickets-${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
