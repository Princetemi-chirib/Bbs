import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUser } from '@/app/api/v1/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyUser(request);
    if (!auth || auth.role !== 'BARBER') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Barber access required.' } },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      include: { barber: true },
    });
    const barber = user?.isActive ? user.barber : null;
    if (!barber) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Barber access required.' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const jobStatus = searchParams.get('jobStatus');

    // Build where clause
    const where: any = {
      assignedBarberId: barber.id,
    };

    if (status) {
      where.status = status;
    }

    if (jobStatus) {
      where.jobStatus = jobStatus;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: orders.map((order: typeof orders[0]) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        city: order.city,
        location: order.location,
        address: order.address,
        additionalNotes: order.additionalNotes,
        totalAmount: Number(order.totalAmount),
        status: order.status,
        jobStatus: order.jobStatus,
        paymentStatus: order.paymentStatus,
        declineReason: order.declineReason,
        items: order.items.map((item: typeof order.items[0]) => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          ageGroup: item.ageGroup,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          product: item.product,
        })),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error('Get barber orders error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch orders',
        },
      },
      { status: 500 }
    );
  }
}
