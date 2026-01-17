import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/server/emailService';
import { emailTemplates } from '@/lib/server/emailTemplates';

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

    // Send email
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
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: result.error || 'Failed to send email',
          },
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error sending order confirmation email:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}
