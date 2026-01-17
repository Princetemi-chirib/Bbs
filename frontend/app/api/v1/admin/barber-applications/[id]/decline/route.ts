import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { emailService } from '@/lib/server/emailService';

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    
    if (!user || user.role !== 'ADMIN' || !user.isActive) {
      return null;
    }
    
    return user;
  } catch {
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin access required.' } },
        { status: 401 }
      );
    }

    const applicationId = params.id;
    const body = await request.json();
    const { declineReason } = body;

    if (!declineReason || !declineReason.trim()) {
      return NextResponse.json(
        { success: false, error: { message: 'Decline reason is required' } },
        { status: 400 }
      );
    }

    // Get application
    const application = await prisma.barberApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: { message: 'Application not found' } },
        { status: 404 }
      );
    }

    if (application.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: { message: `Application is already ${application.status}` } },
        { status: 400 }
      );
    }

    // Update application status
    await prisma.barberApplication.update({
      where: { id: applicationId },
      data: {
        status: 'REJECTED',
        declineReason: declineReason.trim(),
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    });

    // Send rejection email to applicant
    const rejectionEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Application Update - BBS Limited</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #39413f; color: #ffffff; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2>Application Update</h2>
          </div>
          <div style="background: #f9f9f9; padding: 20px; border: 1px solid #ddd;">
            <p>Dear ${application.name},</p>
            <p>Thank you for your interest in joining BBS Limited as a barber.</p>
            <p>After careful review of your application, we regret to inform you that we are unable to proceed with your application at this time.</p>
            <div style="background: #ffffff; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #dc3232;">
              <p style="margin: 0; font-weight: bold; color: #39413f;">Reason:</p>
              <p style="margin: 5px 0 0 0; color: #333;">${declineReason}</p>
            </div>
            <p>We appreciate the time and effort you put into your application. If you have any questions or would like to discuss this further, please feel free to contact us.</p>
            <p>We wish you the best in your future endeavors.</p>
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>BBS Limited Team</strong>
            </p>
          </div>
          <div style="background: #f8f8f8; padding: 20px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #eee;">
            <p>&copy; ${new Date().getFullYear()} BBS Limited. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await emailService.sendEmail({
        to: application.email,
        subject: 'Update on Your Barber Application - BBS Limited',
        html: rejectionEmailHtml,
        text: `Dear ${application.name}, Thank you for your interest. After review, we are unable to proceed with your application. Reason: ${declineReason}. Best regards, BBS Limited Team`,
      });
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
      // Continue even if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Application declined and email notification sent',
    });
  } catch (error: any) {
    console.error('Decline application error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to decline application',
        },
      },
      { status: 500 }
    );
  }
}
