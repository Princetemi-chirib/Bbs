import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/server/emailService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, message } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'All fields are required',
          },
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid email address',
          },
        },
        { status: 400 }
      );
    }

    // Admin email - can be configured via environment variable
    const adminEmail = process.env.ADMIN_EMAIL || 'support@bbslimited.online';
    const appName = process.env.APP_NAME || 'BBS Limited';

    // Create email content
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission - ${appName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: #39413f; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                ${appName}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #39413f; margin: 0 0 20px 0; font-size: 24px;">
                New Contact Form Submission
              </h2>
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                You have received a new message from the contact form on your website.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #39413f; font-weight: 600; color: #39413f; width: 150px;">
                    Name
                  </td>
                  <td style="padding: 12px; border-bottom: 2px solid #39413f;">
                    ${firstName} ${lastName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px; background-color: #f8f9fa; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #39413f;">
                    Email
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
                    <a href="mailto:${email}" style="color: #39413f; text-decoration: none;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px; background-color: #f8f9fa; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #39413f; vertical-align: top;">
                    Message
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
                    <div style="color: #333333; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
${message}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px; background-color: #f8f9fa; font-weight: 600; color: #39413f;">
                    Submitted
                  </td>
                  <td style="padding: 12px;">
                    ${new Date().toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZoneName: 'short',
                    })}
                  </td>
                </tr>
              </table>

              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">
                  <strong>Reply to this inquiry:</strong> Click on the email address above or reply directly to this email.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #999999; font-size: 14px; margin: 0 0 10px 0;">
                © ${new Date().getFullYear()} ${appName}. All rights reserved.
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                This is an automated email from the contact form on your website.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
New Contact Form Submission - ${appName}

You have received a new message from the contact form on your website.

Name: ${firstName} ${lastName}
Email: ${email}
Submitted: ${new Date().toLocaleString()}

Message:
${message}

---
Reply to this inquiry: ${email}

© ${new Date().getFullYear()} ${appName}. All rights reserved.
This is an automated email from the contact form on your website.
    `.trim();

    // Send email to admin
    const result = await emailService.sendEmail({
      to: adminEmail,
      subject: `New Contact Form Submission from ${firstName} ${lastName}`,
      html,
      text,
      replyTo: email, // Set reply-to as the sender's email so admin can reply directly
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Your message has been sent successfully! We will get back to you soon.',
        data: {
          messageId: result.messageId,
        },
      });
    } else {
      console.error('Email sending failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Failed to send message. Please try again later or contact us directly.',
          },
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error processing contact form:', error);
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
