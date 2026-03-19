import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createHmac } from 'crypto';

/**
 * POST /api/payment-webhook
 * Handle payment callback from PakASir
 * Auto-confirm QRIS payment → update ticket status to 'confirmed'
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    // =============================================
    // SECURITY: PakASir has no webhook signature.
    // To prevent spoofing, we MUST verify the payload 
    // by asking their server for the real transaction status.
    // =============================================
    const payload = JSON.parse(body);
    console.log('PakASir webhook received:', payload);

    const apiKey = process.env.PAKASIR_API_KEY;
    const projectSlug = payload.project || process.env.NEXT_PUBLIC_PAKASIR_SLUG || 'ibs26';
    const amount = payload.amount;
    const incomingOrder = payload.reference || payload.order_id || payload.merchant_ref || payload.ticket_code;

    // Call Transaction Detail API to verify authenticity
    if (incomingOrder && apiKey && amount) {
      try {
        const verifyRes = await fetch(
          `https://app.pakasir.com/api/transactiondetail?project=${projectSlug}&amount=${amount}&order_id=${incomingOrder}&api_key=${apiKey}`
        );
        
        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          // Override the payload status with the TRUSTED status from PakASir
          if (verifyData?.transaction?.status) {
            payload.status = verifyData.transaction.status;
            console.log(`[Webhook] Verified real status from PakASir: ${payload.status}`);
          }
        } else {
          console.warn(`[Webhook] Transaction verification failed with HTTP ${verifyRes.status}`);
          if (verifyRes.status === 404 || verifyRes.status === 400) {
            return NextResponse.json({ error: 'Transaction not found or invalid on provider' }, { status: 400 });
          }
        }
      } catch (err) {
        console.error('[Webhook] Error verifying transaction with provider:', err);
      }
    }

    // =============================================
    // EXTRACT TICKET REFERENCE
    // PakASir mengirim reference/order_id yang kita set saat create payment
    // =============================================
    const ticketCode =
      payload.reference ||
      payload.order_id ||
      payload.merchant_ref ||
      payload.ticket_code ||
      null;

    const transactionId =
      payload.transaction_id ||
      payload.id ||
      payload.trx_id ||
      null;

    const paymentStatus =
      payload.status ||
      payload.payment_status ||
      null;

    // Determine if payment is successful
    const isSuccess =
      paymentStatus === 'paid' ||
      paymentStatus === 'success' ||
      paymentStatus === 'completed' ||
      paymentStatus === 'settlement' ||
      paymentStatus === 'PAID' ||
      paymentStatus === 'SUCCESS' ||
      paymentStatus === 'COMPLETED' ||
      payload.is_paid === true;

    if (!ticketCode) {
      console.error('Webhook missing ticket reference:', payload);
      return NextResponse.json({ error: 'Missing ticket reference' }, { status: 400 });
    }

    if (!isSuccess) {
      console.log(`Payment not successful for ${ticketCode}: status=${paymentStatus}`);
      // Still return 200 to acknowledge receipt
      return NextResponse.json({ received: true, action: 'none' });
    }

    // =============================================
    // FIND & UPDATE TICKET
    // =============================================
    // =============================================
    // FIND & UPDATE TICKETS
    // =============================================
    // Order ID is the checkout_id which is stored in pakasir_transaction_id for all grouped tickets,
    // or it's the ticket_code itself for single/lead ticket.
    const { data: tickets, error: findError } = await supabaseAdmin
      .from('tickets')
      .select('ticket_code, status, payment_method')
      .or(`ticket_code.eq.${ticketCode},pakasir_transaction_id.eq.${ticketCode}`);

    if (findError || !tickets || tickets.length === 0) {
      console.error('Ticket not found for webhook:', { ticketCode, transactionId });
      // Return 200 to prevent PakASir from retrying unnecessarily
      return NextResponse.json({ received: true, action: 'ticket_not_found' });
    }

    const pendingTickets = tickets.filter(t => !['confirmed', 'used', 'paid_online'].includes(t.status));

    if (pendingTickets.length === 0) {
      console.log(`Tickets for ${ticketCode} already confirmed, skipping.`);
      return NextResponse.json({ received: true, action: 'already_confirmed' });
    }

    const ticketCodesToUpdate = pendingTickets.map(t => t.ticket_code);

    // Update tickets status to confirmed
    const { error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({
        status: 'confirmed',
        // Preserve existing pakasir_transaction_id (which is the grouping ID),
        // or update if we parsed actual trans ID from PakASir differently, but let's keep grouping.
      })
      .in('ticket_code', ticketCodesToUpdate);

    if (updateError) {
      console.error('Failed to update ticket status:', updateError);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    // Save webhook audit log in payments table (where ticket_code = checkout_id)
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'paid',
        transaction_id: transactionId,
        raw_webhook: payload,
      })
      .eq('ticket_code', ticketCode);

    console.log(`✅ ${ticketCodesToUpdate.length} Tickets for ${ticketCode} confirmed via QRIS webhook`);

    return NextResponse.json({
      received: true,
      action: 'confirmed',
      ticket_codes: ticketCodesToUpdate,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Constant-time string comparison (prevents timing attacks)
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
