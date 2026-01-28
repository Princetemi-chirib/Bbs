import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/app/api/v1/utils/auth';
import crypto from 'crypto';
import { emailService } from '@/lib/server/emailService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin access required.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: { message: 'Name and email are required' } },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { message: 'User with this email already exists' } },
        { status: 400 }
      );
    }

    // Check if there's already a pending application for this email
    const existingApplication = await prisma.barberApplication.findFirst({
      where: { 
        email: email.toLowerCase(),
        status: 'PENDING'
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { success: false, error: { message: 'There is already a pending application for this email' } },
        { status: 400 }
      );
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 7); // Token expires in 7 days

    // Create user account with STAFF role (will become BARBER after approval)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: null, // No password yet - they'll set it after completing application
        role: 'BARBER', // Set as BARBER but account will be inactive until approved
        isActive: false, // Inactive until they complete application and get approved
        passwordResetToken: invitationToken,
        passwordResetExpires: tokenExpiry,
      },
    });

    // Get frontend URL from environment or use default
    const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const invitationLink = `${frontendUrl}/barber-recruit?token=${invitationToken}&email=${encodeURIComponent(email.toLowerCase())}`;

    // Send invitation email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complete Your Barber Application</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #39413f; color: #ffffff; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .button { display: inline-block; background: #39413f; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Complete Your Barber Application</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>You have been invited to join our barber team! Please complete your application by clicking the link below:</p>
            <p style="text-align: center;">
              <a href="${invitationLink}" class="button">Complete Application</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${invitationLink}</p>
            <p><strong>Note:</strong> This link will expire in 7 days.</p>
            <p>If you did not expect this invitation, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} BBS Limited. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResult = await emailService.sendEmail({
      to: email.toLowerCase(),
      subject: 'Complete Your Barber Application - BBS Limited',
      html: emailHtml,
    });

    if (!emailResult.success) {
      console.error('Failed to send invitation email:', emailResult.error);
      // Don't fail the request if email fails - log it
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Invitation sent successfully',
        userId: user.id,
        emailSent: emailResult.success,
      },
    });
  } catch (error: any) {
    console.error('Invite staff error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to send invitation',
        },
      },
      { status: 500 }
    );
  }
}
