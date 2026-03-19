import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/simulate-webhook?order_id=IBS-XXXXXXXX
 * Fitur "Webhook Buatan" untuk mengetes konfirmasi QRIS secara lokal/manual
 * tanpa perlu menunggu sistem PakASir yang asli.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('order_id');

  if (!orderId) {
    return NextResponse.json(
      { error: 'Parameter order_id wajib diisi. Contoh: ?order_id=IBS-XXXXXXXX' },
      { status: 400 }
    );
  }

  // Siapkan payload tiruan persis seperti format PakASir
  const mockPayload = {
    amount: 50000,
    order_id: orderId,
    project: 'ibs26',
    status: 'completed',
    payment_method: 'qris',
    completed_at: new Date().toISOString(),
    is_sandbox: true
  };

  // Panggil endpoint webhook asli kita sendiri
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('host') || 'localhost:3000';
  const webhookUrl = `${protocol}://${host}/api/payment-webhook`;

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockPayload),
    });

    const data = await res.json();

    return NextResponse.json({
      success: true,
      message: 'Simulasi webhook berhasil dikirim!',
      webhook_response: data,
      webhook_url_hit: webhookUrl
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: 'Gagal mengirim simulasi webhook',
      details: err.message
    }, { status: 500 });
  }
}
