import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '@/app/api/v1/utils/auth';

export const dynamic = 'force-dynamic';

// POST /api/v1/admin/customers/[id]/merge - Merge two customers
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
    const { mergeWithCustomerId, reason } = body;
    const primaryCustomerId = params.id;

    if (!mergeWithCustomerId) {
      return NextResponse.json(
        { success: false, error: { message: 'mergeWithCustomerId is required' } },
        { status: 400 }
      );
    }

    if (primaryCustomerId === mergeWithCustomerId) {
      return NextResponse.json(
        { success: false, error: { message: 'Cannot merge customer with itself' } },
        { status: 400 }
      );
    }

    const [primaryCustomer, mergeCustomer] = await Promise.all([
      prisma.customer.findUnique({
        where: { id: primaryCustomerId },
        include: { user: true },
      }),
      prisma.customer.findUnique({
        where: { id: mergeWithCustomerId },
        include: { user: true },
      }),
    ]);

    if (!primaryCustomer || !mergeCustomer) {
      return NextResponse.json(
        { success: false, error: { message: 'One or both customers not found' } },
        { status: 404 }
      );
    }

    // Transfer all related data to primary customer
    await prisma.$transaction([
      // Update bookings
      prisma.booking.updateMany({
        where: { customerId: mergeWithCustomerId },
        data: { customerId: primaryCustomerId },
      }),
      // Update reviews
      prisma.review.updateMany({
        where: { customerId: mergeWithCustomerId },
        data: { customerId: primaryCustomerId },
      }),
      // Update payments
      prisma.payment.updateMany({
        where: { customerId: mergeWithCustomerId },
        data: { customerId: primaryCustomerId },
      }),
      // Update tickets
      prisma.supportTicket.updateMany({
        where: { customerId: mergeWithCustomerId },
        data: { customerId: primaryCustomerId },
      }),
      // Update notes
      prisma.customerNote.updateMany({
        where: { customerId: mergeWithCustomerId },
        data: { customerId: primaryCustomerId },
      }),
      // Update tags
      prisma.customerTag.updateMany({
        where: { customerId: mergeWithCustomerId },
        data: { customerId: primaryCustomerId },
      }),
      // Update audit logs
      prisma.customerAuditLog.updateMany({
        where: { customerId: mergeWithCustomerId },
        data: { customerId: primaryCustomerId },
      }),
      // Update communications
      prisma.customerCommunication.updateMany({
        where: { customerId: mergeWithCustomerId },
        data: { customerId: primaryCustomerId },
      }),
      // Update preferences
      prisma.customerPreference.updateMany({
        where: { customerId: mergeWithCustomerId },
        data: { customerId: primaryCustomerId },
      }),
      // Merge loyalty points
      prisma.customer.update({
        where: { id: primaryCustomerId },
        data: {
          loyaltyPoints: primaryCustomer.loyaltyPoints + mergeCustomer.loyaltyPoints,
        },
      }),
      // Delete merged customer
      prisma.customer.delete({
        where: { id: mergeWithCustomerId },
      }),
      // Deactivate merged user account
      prisma.user.update({
        where: { id: mergeCustomer.userId },
        data: { isActive: false },
      }),
    ]);

    // Create audit log
    await prisma.customerAuditLog.create({
      data: {
        customerId: primaryCustomerId,
        action: 'MERGE',
        performedBy: user.id,
        reason: reason || `Merged with customer ${mergeCustomer.customerId}`,
        oldValue: { mergedCustomerId: mergeWithCustomerId },
        newValue: { primaryCustomerId },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Customers merged successfully',
    });
  } catch (error: any) {
    console.error('Merge customers error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to merge customers',
        },
      },
      { status: 500 }
    );
  }
}
