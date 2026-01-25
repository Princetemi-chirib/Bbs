import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '@/app/api/v1/utils/auth';

export const dynamic = 'force-dynamic';

// POST /api/v1/admin/customers/[id]/anonymize - Anonymize customer data (GDPR compliance)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAdminOrRep(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin or Rep access required.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reason } = body;
    const customerId = params.id;

    if (!reason) {
      return NextResponse.json(
        { success: false, error: { message: 'Reason is required for anonymization' } },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { user: true },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: { message: 'Customer not found' } },
        { status: 404 }
      );
    }

    // Anonymize user data
    const anonymizedName = `Anonymized User ${customer.customerId.substring(0, 8)}`;
    const anonymizedEmail = `anonymized_${customer.customerId.substring(0, 8)}@anonymized.local`;

    await prisma.user.update({
      where: { id: customer.userId },
      data: {
        name: anonymizedName,
        email: anonymizedEmail,
        phone: null,
        avatarUrl: null,
      },
    });

    // Anonymize customer data
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        address: null,
        dateOfBirth: null,
        gender: null,
        allergies: null,
        preferredBranch: null,
      },
    });

    // Create audit log
    try {
      await prisma.customerAuditLog.create({
        data: {
          customerId,
          action: 'ANONYMIZE',
          performedBy: user.id,
          reason,
          metadata: { anonymizedAt: new Date().toISOString() },
        },
      });
    } catch (e) {
      // Audit log might not exist yet
    }

    return NextResponse.json({
      success: true,
      message: 'Customer data anonymized successfully',
    });
  } catch (error: any) {
    console.error('Anonymize customer error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to anonymize customer data',
        },
      },
      { status: 500 }
    );
  }
}
