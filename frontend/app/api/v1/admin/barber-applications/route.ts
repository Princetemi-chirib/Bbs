import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
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

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin access required.' } },
        { status: 401 }
      );
    }

    // Query applications - handle missing city column gracefully until migration runs
    let applications;
    try {
      applications = await prisma.barberApplication.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (dbError: any) {
      // If city column doesn't exist yet, use explicit select without city
      if (dbError.message?.includes('city') || dbError.code === 'P2003') {
        applications = await prisma.barberApplication.findMany({
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
            state: true,
            status: true,
            experienceYears: true,
            createdAt: true,
            updatedAt: true,
            portfolioUrl: true,
            whyJoinNetwork: true,
            applicationLetterUrl: true,
            cvUrl: true,
            barberLicenceUrl: true,
            dateOfBirth: true,
            maritalStatus: true,
            ninNumber: true,
            gender: true,
            otherName: true,
            name: true,
            userId: true,
            specialties: true,
            certifications: true,
            resumeUrl: true,
            adminNotes: true,
            declineReason: true,
            reviewedBy: true,
            reviewedAt: true,
          },
        });
      } else {
        throw dbError;
      }
    }

    return NextResponse.json({
      success: true,
      data: applications,
    });
  } catch (error: any) {
    console.error('Get applications error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch applications',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      otherName, 
      dateOfBirth, 
      email, 
      maritalStatus, 
      phone, 
      state,
      address, 
      ninNumber, 
      gender, 
      experienceYears,
      barberLicence,
      specialties,
      portfolioUrl,
      whyJoinNetwork, 
      applicationLetterUrl,
      cvUrl
    } = body;

    if (!firstName || !lastName || !email || !phone || !address || !ninNumber || !gender || !whyJoinNetwork || !applicationLetterUrl || !cvUrl) {
      return NextResponse.json(
        { success: false, error: { message: 'First name, last name, email, phone, address, NIN number, gender, why join network, application letter, and CV are required' } },
        { status: 400 }
      );
    }

    // Check if application already exists for this email
    // Use select to avoid errors if city column doesn't exist yet (before migration)
    const existing = await prisma.barberApplication.findFirst({
      where: { email: email.toLowerCase(), status: 'PENDING' },
      select: { id: true, email: true, status: true }, // Only select fields we need
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { message: 'You already have a pending application' } },
        { status: 400 }
      );
    }

    // Create application
    const fullName = `${firstName} ${lastName}${otherName ? ' ' + otherName : ''}`;
    
    // Prepare data object
    const applicationData: any = {
      email: email.toLowerCase(),
      firstName,
      lastName,
      otherName: otherName || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      name: fullName, // Keep for backward compatibility
      phone,
      state: state || null,
      address,
      maritalStatus: maritalStatus || null,
      ninNumber: ninNumber || null,
      gender: gender || null,
      experienceYears: experienceYears ? parseInt(experienceYears.toString()) : null,
      barberLicence: barberLicence || null,
      specialties: Array.isArray(specialties) && specialties.length > 0 ? specialties : [],
      portfolioUrl: portfolioUrl || null,
      whyJoinNetwork: whyJoinNetwork || null,
      applicationLetterUrl: applicationLetterUrl || null,
      cvUrl: cvUrl || null,
      status: 'PENDING',
    };
    
    const application = await prisma.barberApplication.create({
      data: applicationData,
    });

    // Send email to admin
    const adminEmail = 'admin@bbslimited.online';
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Barber Application</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #39413f; color: #ffffff; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
          .detail-row { margin: 10px 0; }
          .detail-label { font-weight: bold; color: #39413f; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Barber Application Received</h2>
          </div>
          <div class="content">
            <p>A new barber application has been submitted:</p>
                  <div class="detail-row"><span class="detail-label">Name:</span> ${fullName}</div>
                  <div class="detail-row"><span class="detail-label">Email:</span> ${email}</div>
                  <div class="detail-row"><span class="detail-label">Phone:</span> ${phone}</div>
                  <div class="detail-row"><span class="detail-label">Date of Birth:</span> ${dateOfBirth ? new Date(dateOfBirth).toLocaleDateString() : 'N/A'}</div>
                  <div class="detail-row"><span class="detail-label">Gender:</span> ${gender || 'N/A'}</div>
                  <div class="detail-row"><span class="detail-label">Marital Status:</span> ${maritalStatus || 'N/A'}</div>
                  <div class="detail-row"><span class="detail-label">NIN Number:</span> ${ninNumber || 'N/A'}</div>
                  ${state ? `<div class="detail-row"><span class="detail-label">State of Residence:</span> ${state}</div>` : ''}
                  <div class="detail-row"><span class="detail-label">Location/Address:</span> ${address}</div>
                  ${experienceYears ? `<div class="detail-row"><span class="detail-label">Years of Experience:</span> ${experienceYears}</div>` : ''}
                  ${barberLicence ? `<div class="detail-row"><span class="detail-label">Barber Licence:</span> ${barberLicence}</div>` : ''}
                  ${specialties && specialties.length > 0 ? `<div class="detail-row"><span class="detail-label">Skills:</span> ${specialties.join(', ')}</div>` : ''}
                  ${portfolioUrl ? `<div class="detail-row"><span class="detail-label">Social Media/Portfolio:</span> <a href="${portfolioUrl}" target="_blank">${portfolioUrl}</a></div>` : ''}
                  ${whyJoinNetwork ? `<div class="detail-row"><span class="detail-label">Why Join Network:</span> ${whyJoinNetwork}</div>` : ''}
                  ${applicationLetterUrl ? `<div class="detail-row"><span class="detail-label">Application Letter:</span> <a href="${process.env.NEXT_PUBLIC_BASE_URL}${applicationLetterUrl}">Download</a></div>` : ''}
                  ${cvUrl ? `<div class="detail-row"><span class="detail-label">CV/Resume:</span> <a href="${process.env.NEXT_PUBLIC_BASE_URL}${cvUrl}">Download</a></div>` : ''}
            <p style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/barbers" style="background: #39413f; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                View in Admin Dashboard
              </a>
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BBS Limited. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    (async () => {
      try {
        await emailService.sendEmail({
          to: adminEmail,
          subject: `New Barber Application: ${fullName}`,
          html: emailHtml,
          text: `New barber application from ${fullName} (${email}). ${whyJoinNetwork ? `Why Join: ${whyJoinNetwork.substring(0, 100)}${whyJoinNetwork.length > 100 ? '...' : ''}. ` : ''}Location: ${address}. View: ${process.env.NEXT_PUBLIC_BASE_URL}/admin/barbers`,
        });
        console.log(`Admin notification email sent for application ${application.id}`);
      } catch (emailError) {
        console.error('Failed to send admin notification email:', emailError);
      }
    })();

    return NextResponse.json({
      success: true,
      data: application,
      message: 'Application submitted successfully',
    });
  } catch (error: any) {
    console.error('Create application error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to submit application',
        },
      },
      { status: 500 }
    );
  }
}
