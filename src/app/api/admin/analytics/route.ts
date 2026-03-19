import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

function verifyAdminKey(): boolean {
  const cookieStore = cookies();
  const token = cookieStore.get('admin_token');
  return token?.value === 'true';
}

/**
 * GET /api/admin/analytics
 * Get ticket analytics summary
 */
export async function GET(request: NextRequest) {
  if (!verifyAdminKey()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('ticket_analytics')
    .select('*')
    .single();

  // Calculate revenue from payments table
  const { data: qrisPayments } = await supabaseAdmin
    .from('payments')
    .select('amount')
    .eq('method', 'qris')
    .in('status', ['paid', 'pending']); // Sometimes it's still pending but we might want to only count 'paid'. 
    // Actually, let's just sum all confirmed tickets from the tickets table to be 100% accurate to the frontend's 'Confirmed' status.
    // Or we can query payments with status = 'paid' or use tickets joined with payments.
    // simpler: sum from payments where status = 'paid' OR method = 'cash' (cash is paid at venue)

  const { data: cashPayments } = await supabaseAdmin
    .from('payments')
    .select('amount')
    .eq('method', 'cash');

  const { data: onlinePayments } = await supabaseAdmin
    .from('payments')
    .select('amount')
    .eq('method', 'qris')
    .eq('status', 'paid');
    
  // Since we also have the tickets table which is the source of truth for "Confirmed" status, let's just calculate based on tickets + TICKET_PRICE if payments table is unreliable.
  // Actually, we'll use the payments table to sum it up correctly. For 'qris' we only count 'paid'. For 'cash', we count payments where ticket status is confirmed/paid_cash.
  // For simplicity and to avoid complex joins in JS, let's just fetch all tickets to calculate the exact revenue based on ticket status.
  const { data: allTickets } = await supabaseAdmin
    .from('tickets')
    .select('status, payment_method, quantity');

  let revenue_qris = 0;
  let revenue_cash = 0;
  const basePrice = parseInt(process.env.NEXT_PUBLIC_TICKET_PRICE || '50000');

  if (allTickets) {
    allTickets.forEach(t => {
      if (['confirmed', 'paid_online', 'paid_cash', 'used'].includes(t.status)) {
        if (t.payment_method === 'qris') revenue_qris += (t.quantity || 1) * basePrice;
        else if (t.payment_method === 'cash') revenue_cash += (t.quantity || 1) * basePrice;
      }
    });
  }

  if (error) {
    const analytics = {
      total_active: allTickets?.filter((t) => t.status !== 'expired').length || 0,
      total_pending: allTickets?.filter((t) => t.status === 'pending').length || 0,
      total_confirmed: allTickets?.filter((t) =>
        ['confirmed', 'paid_online', 'paid_cash'].includes(t.status)
      ).length || 0,
      total_used: allTickets?.filter((t) => t.status === 'used').length || 0,
      total_expired: allTickets?.filter((t) => t.status === 'expired').length || 0,
      total_qris: allTickets?.filter((t) => t.payment_method === 'qris').length || 0,
      total_cash: allTickets?.filter((t) => t.payment_method === 'cash').length || 0,
      revenue_qris,
      revenue_cash,
    };

    return NextResponse.json(analytics);
  }

  // If view succeeded, combine it with calculated revenue
  return NextResponse.json({
    ...data,
    revenue_qris,
    revenue_cash,
  });

  return NextResponse.json(data);
}
