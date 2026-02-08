import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/server/emailService';
import { emailTemplates } from '@/lib/server/emailTemplates';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      orderReference,
      items,
      total,
      city,
      location,
      address,
      phone,
      paymentReference,
    } = body;

    // Validate required fields
    if (
      !customerName ||
      !customerEmail ||
      !orderReference ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !total ||
      !city ||
      !location ||
      !phone
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Missing required fields',
          },
        },
        { status: 400 }
      );
    }

    // Generate email content
    const html = emailTemplates.orderConfirmation({
      customerName,
      customerEmail,
      orderReference,
      items,
      total,
      city,
      location,
      address,
      phone,
      paymentReference,
    });

    const text = emailTemplates.orderConfirmationText({
      customerName,
      customerEmail,
      orderReference,
      items,
      total,
      city,
      location,
      address,
      phone,
      paymentReference,
    });

    // Send email (do not fail checkout if SMTP is disabled or misconfigured)
    const result = await emailService.sendEmail({
      to: customerEmail,
      subject: `Order Confirmation - ${orderReference}`,
      html,
      text,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Order confirmation email sent successfully',
        data: {
          messageId: result.messageId,
          previewUrl: result.previewUrl,
        },
      });
    }

    // SMTP failed (e.g. 554 Disabled by hPanel) – return 200 so checkout flow is not broken
    console.warn('Order confirmation email not sent:', result.error);
    return NextResponse.json({
      success: false,
      message: 'Order confirmation email could not be sent. Order is still confirmed.',
      error: { message: result.error || 'Email service unavailable' },
    });
  } catch (error: any) {
    console.error('Error sending order confirmation email:', error);
    // Return 200 so checkout success page still works; caller can check success: false
    return NextResponse.json({
      success: false,
      message: 'Order confirmation email could not be sent. Order is still confirmed.',
      error: { message: error.message || 'Internal server error' },
    });
  }
}
