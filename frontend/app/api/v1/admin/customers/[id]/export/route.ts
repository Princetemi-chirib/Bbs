import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '@/app/api/v1/utils/auth';

export const dynamic = 'force-dynamic';

// GET /api/v1/admin/customers/[id]/export - Export customer data (GDPR compliance)
export async function GET(
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

    const customerId = params.id;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        bookings: {
          select: {
            id: true,
            bookingNumber: true,
            bookingDate: true,
            totalPrice: true,
            status: true,
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            status: true,
            createdAt: true,
          },
        },
        notes: {
          select: {
            id: true,
            note: true,
            createdAt: true,
          },
        },
        tags: {
          select: {
            tag: true,
            createdAt: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: { message: 'Customer not found' } },
        { status: 404 }
      );
    }

    // Create audit log
    try {
      await prisma.customerAuditLog.create({
        data: {
          customerId,
          action: 'DATA_EXPORT',
          performedBy: user.id,
          metadata: { exportedBy: user.email },
        },
      });
    } catch (e) {
      // Audit log might not exist yet
    }

    // Return JSON data (can be converted to CSV/PDF on frontend)
    return NextResponse.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          customerId: customer.customerId,
          name: customer.user.name,
          email: customer.user.email,
          phone: customer.user.phone,
          dateOfBirth: customer.dateOfBirth,
          gender: customer.gender,
          address: customer.address,
          membershipType: customer.membershipType,
          loyaltyPoints: customer.loyaltyPoints,
          createdAt: customer.createdAt,
        },
        bookings: customer.bookings,
        reviews: customer.reviews,
        payments: customer.payments,
        notes: customer.notes,
        tags: customer.tags,
        exportedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Export customer error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to export customer data',
        },
      },
      { status: 500 }
    );
  }
}
