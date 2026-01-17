import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/server/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to } = body;

    if (!to) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Email address is required',
          },
        },
        { status: 400 }
      );
    }

    const result = await emailService.sendEmail({
      to,
      subject: 'Test Email from BBS',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from the Barber Booking System.</p>
        <p>If you received this email, your email service is configured correctly!</p>
      `,
      text: 'This is a test email from the Barber Booking System.',
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
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
    console.error('Error sending test email:', error);
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
