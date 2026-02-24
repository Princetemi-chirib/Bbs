import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const PAYSTACK_SECRET = () => process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET || '';

function verifyPaystackSignature(payload: string, signature: string): boolean {
  const secret = PAYSTACK_SECRET();
  if (!secret) return false;
  const hash = crypto.createHmac('sha512', secret).update(payload).digest('hex');
  return hash === signature;
}

/**
 * POST /api/v1/webhooks/paystack
 * Paystack sends charge.success etc. We update the order to PAID/CONFIRMED when payment succeeds.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature') || '';

    if (!verifyPaystackSignature(rawBody, signature)) {
      console.warn('Paystack webhook: invalid signature');
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const event = JSON.parse(rawBody) as { event: string; data?: { reference?: string; amount?: number } };
    if (event.event !== 'charge.success') {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const reference = event.data?.reference;
    if (!reference) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const order = await prisma.order.findUnique({
      where: { paymentReference: reference },
    });

    if (!order) {
      console.warn('Paystack webhook: no order found for reference', reference);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const expectedKobo = Math.round(Number(order.totalAmount) * 100);
    const paidKobo = Number(event.data?.amount ?? 0);
    if (paidKobo !== expectedKobo) {
      console.warn('Paystack webhook: amount mismatch for order', order.orderNumber, 'expected', expectedKobo, 'got', paidKobo);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
      },
    });

    console.log('Paystack webhook: order', order.orderNumber, 'marked as PAID');
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e) {
    console.error('Paystack webhook error:', e);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
