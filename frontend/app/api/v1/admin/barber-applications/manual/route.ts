import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/app/api/v1/utils/auth';
import { logRecruitmentAction } from '@/lib/server/recruitmentAudit';

export const dynamic = 'force-dynamic';

/**
 * Admin-only: create a recruitment application manually (e.g. offline applicant).
 * Does not send applicant email; application appears in list for review.
 */
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
    const {
      firstName,
      lastName,
      otherName,
      dateOfBirth,
      email,
      maritalStatus,
      phone,
      state,
      city,
      address,
      ninNumber,
      gender,
      experienceYears,
      barberLicence,
      specialties,
      portfolioUrl,
      whyJoinNetwork,
      applicationLetterUrl,
      cvUrl,
      barberLicenceUrl,
    } = body;

    if (!firstName || !lastName || !email || !phone || !address) {
      return NextResponse.json(
        { success: false, error: { message: 'First name, last name, email, phone, and address are required' } },
        { status: 400 }
      );
    }

    const fullName = `${firstName} ${lastName}${otherName ? ' ' + otherName : ''}`.trim();
    const licenceNumber = barberLicence ?? body.barberLicenceNumber ?? null;

    const application = await prisma.barberApplication.create({
      data: {
        email: email.toLowerCase().trim(),
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        otherName: otherName ? String(otherName).trim() : null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        name: fullName,
        phone: String(phone).trim(),
        state: state ? String(state).trim() : null,
        city: city ? String(city).trim() : null,
        address: String(address).trim(),
        maritalStatus: maritalStatus ? String(maritalStatus).trim() : null,
        ninNumber: ninNumber ? String(ninNumber).trim() : null,
        gender: gender ? String(gender).trim() : null,
        experienceYears:
          experienceYears != null && experienceYears !== ''
            ? parseInt(String(experienceYears), 10)
            : null,
        barberLicenceNumber: licenceNumber,
        barberLicenceUrl: barberLicenceUrl || null,
        specialties: Array.isArray(specialties) && specialties.length > 0 ? specialties : [],
        portfolioUrl: portfolioUrl || null,
        whyJoinNetwork: whyJoinNetwork || null,
        applicationLetterUrl: applicationLetterUrl || null,
        cvUrl: cvUrl || null,
        status: 'PENDING',
        userId: null,
      },
    });

    await logRecruitmentAction({
      applicationId: application.id,
      action: 'CREATED_MANUAL',
      performedById: admin.id,
      metadata: { source: 'admin_dashboard' },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: application.id,
        name: application.name,
        email: application.email,
        status: application.status,
        message: 'Recruitment record created. You can review and approve or decline it from the list.',
      },
    });
  } catch (error: any) {
    console.error('Manual create recruitment error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to create recruitment' } },
      { status: 500 }
    );
  }
}
