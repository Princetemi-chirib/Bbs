import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/server/emailService';
import { emailTemplates } from '@/lib/server/emailTemplates';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/test/paystack-email?to=your@email.com
 *
 * Sends a sample order confirmation email with a Paystack payment link
 * (using a placeholder URL) so you can verify the email template and delivery.
 *
 * Allowed when:
 * - NODE_ENV is development, OR
 * - Query param secret matches TEST_EMAIL_SECRET env var
 */
export async function GET(request: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const secret = request.nextUrl.searchParams.get('secret');
    const allowed = isDev || (process.env.TEST_EMAIL_SECRET && secret === process.env.TEST_EMAIL_SECRET);

    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Not allowed. Use in development or provide valid TEST_EMAIL_SECRET.' },
        { status: 403 }
      );
    }

    const to = request.nextUrl.searchParams.get('to') || (process.env.ADMIN_EMAIL ?? 'test@example.com');

    const orderReference = 'ORD-TEST-' + Date.now();
    const total = 15000;
    const paymentLink = 'https://checkout.paystack.com/test-placeholder'; // Placeholder for testing

    const html = emailTemplates.orderConfirmation({
      customerName: 'Test Customer',
      customerEmail: to,
      orderReference,
      items: [
        { title: 'Classic Haircut', quantity: 1, price: 5000, displayAge: 'Fixed' },
        { title: 'Beard Trim', quantity: 1, price: 3000, displayAge: 'Fixed' },
      ],
      total,
      city: 'Lagos',
      location: 'Ikeja',
      address: '123 Test Street',
      phone: '08012345678',
      paymentReference: orderReference,
      paymentMethod: 'paystack',
      paymentLink,
    });

    const text = emailTemplates.orderConfirmationText({
      customerName: 'Test Customer',
      customerEmail: to,
      orderReference,
      items: [
        { title: 'Classic Haircut', quantity: 1, price: 5000, displayAge: 'Fixed' },
        { title: 'Beard Trim', quantity: 1, price: 3000, displayAge: 'Fixed' },
      ],
      total,
      city: 'Lagos',
      location: 'Ikeja',
      address: '123 Test Street',
      phone: '08012345678',
      paymentReference: orderReference,
      paymentMethod: 'paystack',
      paymentLink,
    });

    const result = await emailService.sendEmail({
      to,
      subject: `[TEST] Order Confirmation - ${orderReference} (Paystack link)`,
      html,
      text,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test Paystack order email sent to ${to}`,
      messageId: result.messageId,
      previewUrl: result.previewUrl,
    });
  } catch (error: any) {
    console.error('Test paystack email error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to send test email' },
      { status: 500 }
    );
  }
}
