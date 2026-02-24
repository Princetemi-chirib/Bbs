import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isViewOnly, verifyAdminOrRep } from '@/app/api/v1/utils/auth';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/v1/admin/orders/[id]/mark-paid
 * Mark an order as paid (e.g. after receiving cash). Allows the flow to continue (assign barber, etc.).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminOrRep(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized.' } },
        { status: 401 }
      );
    }
    if (isViewOnly(auth)) {
      return NextResponse.json(
        { success: false, error: { message: 'View-only accounts cannot mark orders as paid.' } },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'Order ID is required.' } },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: { message: 'Order not found.' } },
        { status: 404 }
      );
    }

    if (order.paymentStatus === 'PAID') {
      return NextResponse.json(
        { success: false, error: { message: 'Order is already marked as paid.' } },
        { status: 400 }
      );
    }

    await prisma.order.update({
      where: { id },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Order marked as paid. You can now assign a barber.',
    });
  } catch (error: any) {
    console.error('Mark order paid error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to mark order as paid',
        },
      },
      { status: 500 }
    );
  }
}
