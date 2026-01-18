import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { emailService } from '@/lib/server/emailService';

export const dynamic = 'force-dynamic';

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

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: application.email.toLowerCase() },
    });

    // Create user account if doesn't exist with password reset token
    if (!user) {
      // Generate secure password reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      // Construct full name from firstName and lastName
      const fullName = `${application.firstName} ${application.lastName}${application.otherName ? ' ' + application.otherName : ''}`;

      user = await prisma.user.create({
        data: {
          email: application.email.toLowerCase(),
          name: fullName,
          phone: application.phone,
          password: null, // No password set - must reset
          role: 'BARBER',
          isActive: true,
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
        },
      });

      // Send welcome email with password reset link
      try {
        // Ensure base URL has proper format
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const cleanBaseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
        // URL encode the token to ensure it works properly in email links
        const encodedToken = encodeURIComponent(resetToken);
        const resetUrl = `${cleanBaseUrl}/reset-password?token=${encodedToken}`;
        
        const welcomeEmailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Welcome to BBS Limited</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #39413f; color: #ffffff; padding: 20px; border-radius: 8px 8px 0 0;">
                <h2>Welcome to BBS Limited!</h2>
              </div>
              <div style="background: #f9f9f9; padding: 20px; border: 1px solid #ddd;">
                <p>Congratulations, ${fullName}!</p>
                <p>Your application has been approved. You now have access to your barber dashboard!</p>
                <p><strong>Next Steps:</strong></p>
                <p>To get started, you need to set up your password. Click the button below to create your password and access your dashboard.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" style="background: #39413f; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    Set Up Your Password
                  </a>
                </div>
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                  <strong>Note:</strong> This link will expire in 24 hours. If you need a new link, please contact support.
                </p>
                <p style="color: #666; font-size: 14px;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <a href="${resetUrl}" style="color: #39413f; word-break: break-all;">${resetUrl}</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `;

        await emailService.sendEmail({
          to: application.email,
          subject: 'Welcome to BBS Limited - Set Up Your Password',
          html: welcomeEmailHtml,
          text: `Congratulations ${fullName}! Your application has been approved. Set up your password: ${resetUrl}. This link expires in 24 hours.`,
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Continue even if email fails
      }
    }

    // Create barber profile
    const barberId = `BAR-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    // Extract state from address if not explicitly provided (address format: "City, State" or just "Address")
    const addressParts = application.address.split(',').map((s: string) => s.trim());
    const extractedState = addressParts.length > 1 ? addressParts[addressParts.length - 1] : (application.state || addressParts[0]);
    const extractedCity = addressParts.length > 1 ? addressParts[0] : addressParts[0];
    
    const barber = await prisma.barber.create({
      data: {
        userId: user.id,
        barberId,
        state: application.state || extractedState,
        city: extractedCity,
        address: application.address,
        location: extractedCity, // Keep for backward compatibility
        bio: null,
        experienceYears: application.experienceYears,
        specialties: application.specialties || [],
        status: 'ACTIVE',
      },
    });

    // Update application status
    await prisma.barberApplication.update({
      where: { id: applicationId },
      data: {
        status: 'APPROVED',
        userId: user.id,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        barber: {
          id: barber.id,
          barberId: barber.barberId,
          state: barber.state,
          city: barber.city,
          address: barber.address,
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        message: 'Application approved and barber account created successfully',
      },
    });
  } catch (error: any) {
    console.error('Approve application error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to approve application',
        },
      },
      { status: 500 }
    );
  }
}
