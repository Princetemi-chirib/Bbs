import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/server/emailService';
import { emailTemplates } from '@/lib/server/emailTemplates';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { template, data, testEmail, subject } = body;

    if (!template || !testEmail) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Template name and test email are required' },
        },
        { status: 400 }
      );
    }

    let html: string;
    let emailSubject: string;
    let text: string | undefined;

    // Generate email based on template
    switch (template) {
      case 'orderConfirmation':
        html = emailTemplates.orderConfirmation(data);
        text = emailTemplates.orderConfirmationText(data);
        emailSubject = subject || `Order Confirmation - ${data.orderReference}`;
        break;

      case 'barberAssignment':
        html = emailTemplates.barberAssignment(data);
        text = emailTemplates.barberAssignmentText(data);
        emailSubject = subject || `New Order Assigned - ${data.orderNumber}`;
        break;

      case 'barberAccepted':
        html = emailTemplates.barberAccepted(data);
        emailSubject = subject || `Barber Accepted Your Order - ${data.orderNumber}`;
        break;

      case 'barberOnTheWay':
        html = emailTemplates.barberOnTheWay(data);
        emailSubject = subject || `Your Barber is On The Way! - ${data.orderNumber}`;
        break;

      case 'barberArrived':
        html = emailTemplates.barberArrived(data);
        emailSubject = subject || `Your Barber Has Arrived! - ${data.orderNumber}`;
        break;

      case 'serviceComplete':
        html = emailTemplates.serviceComplete(data);
        emailSubject = subject || `Service Completed! - ${data.orderNumber}`;
        break;

      case 'barberDeclined':
        html = emailTemplates.barberDeclined(data);
        emailSubject = subject || `Order Declined by Barber - ${data.orderNumber}`;
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: { message: `Unknown template: ${template}` },
          },
          { status: 400 }
        );
    }

    // Send email
    const result = await emailService.sendEmail({
      to: testEmail,
      subject: emailSubject,
      html,
      text,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        data: {
          template,
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
