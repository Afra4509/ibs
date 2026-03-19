import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateTicketCode, generateQrDataUrl, getTicketExpiry } from '@/lib/ticket';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, payment_method, quantity = 1 } = body;

    // Validate required fields
    if (!name || !phone || !payment_method) {
      return NextResponse.json(
        { error: 'Nama, nomor HP, dan metode pembayaran wajib diisi.' },
        { status: 400 }
      );
    }

    const qty = Math.min(Math.max(parseInt(quantity) || 1, 1), 999); // Max 999 tickets

    if (!['qris', 'cash'].includes(payment_method)) {
      return NextResponse.json(
        { error: 'Metode pembayaran tidak valid.' },
        { status: 400 }
      );
    }

    // Validate phone number (simple validation)
    const phoneClean = phone.replace(/\D/g, '');
    if (phoneClean.length < 10 || phoneClean.length > 15) {
      return NextResponse.json(
        { error: 'Nomor HP tidak valid.' },
        { status: 400 }
      );
    }

    // Generate a single unique ticket code
    let checkout_id = '';
    let attempts = 0;
    while (attempts < 5) {
      const candidate = generateTicketCode();
      const { data: existing } = await supabaseAdmin
        .from('tickets')
        .select('ticket_code')
        .eq('ticket_code', candidate)
        .single();

      if (!existing) {
        checkout_id = candidate;
        break;
      }
      attempts++;
    }

    if (!checkout_id) {
      return NextResponse.json(
        { error: 'Gagal membuat kode tiket. Silakan coba lagi.' },
        { status: 500 }
      );
    }

    const expires_at = getTicketExpiry().toISOString();

    // Create a single ticket with the specified quantity
    const ticketToInsert = {
      name: name.trim(),
      phone: phoneClean,
      ticket_code: checkout_id,
      payment_method,
      status: 'pending',
      expires_at,
      pakasir_transaction_id: checkout_id, // Grouping ID
      quantity: qty, // Group Ticketing feature
    };

    const { error: ticketError } = await supabaseAdmin
      .from('tickets')
      .insert(ticketToInsert);

    if (ticketError) {
      console.error('Error creating ticket:', ticketError);
      return NextResponse.json(
        { error: 'Gagal membuat tiket. Silakan coba lagi.' },
        { status: 500 }
      );
    }

    // Create single payment record linked to the ticket code
    const basePrice = parseInt(process.env.NEXT_PUBLIC_TICKET_PRICE || '50000');
    const totalAmount = basePrice * qty;

    await supabaseAdmin.from('payments').insert({
      ticket_code: checkout_id,
      method: payment_method,
      amount: totalAmount,
      status: 'pending',
    });

    // For QRIS: initiate PakASir payment
    let pakasir_payment_url: string | null = null;
    let pakasir_qr_url: string | null = null;

    if (payment_method === 'qris') {
      try {
        const pakasirResult = await createPakasirPayment(checkout_id, totalAmount, name, phoneClean);
        pakasir_payment_url = pakasirResult.payment_url;
        pakasir_qr_url = pakasirResult.qr_url;
      } catch (err) {
        console.error('PakASir payment creation failed:', err);
      }
    }

    // Generate QR code image for ticket display
    const qr_data_url = await generateQrDataUrl(checkout_id, new Date(expires_at));

    return NextResponse.json({
      success: true,
      ticket_code: checkout_id,
      all_codes: [checkout_id], // Kept for backwards compatibility if needed
      name: name.trim(),
      payment_method,
      status: 'pending',
      expires_at,
      qr_data_url,
      pakasir_payment_url,
      pakasir_qr_url,
      quantity: qty,
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}

/**
 * PakASir Payment Creation
 * Adjust fields based on your PakASir account documentation
 */
async function createPakasirPayment(
  ticketCode: string,
  amount: number,
  customerName: string,
  customerPhone: string
): Promise<{
  transaction_id: string | null;
  payment_url: string | null;
  qr_url: string | null;
}> {
  // Using direct checkout link for PakASir as requested
  const payment_url = `https://app.pakasir.com/pay/ibs26/${amount}?order_id=${ticketCode}&qris_only=1`;

  return {
    transaction_id: null,
    payment_url: payment_url,
    qr_url: null,
  };
}
