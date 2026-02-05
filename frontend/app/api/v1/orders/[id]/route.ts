import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUser } from '@/app/api/v1/utils/auth';

export const dynamic = 'force-dynamic';

// GET /api/v1/orders/[id] - Get a single order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyUser(request);
    if (!auth || auth.role !== 'CUSTOMER') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Customer access required.' } },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      include: { customer: true },
    });
    const customer = user?.isActive ? user.customer : null;
    if (!customer) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Customer access required.' } },
        { status: 401 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        assignedBarber: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
                avatarUrl: true,
              },
            },
          },
        },
        customer: true,
        review: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: { message: 'Order not found' } },
        { status: 404 }
      );
    }

    // Verify order belongs to customer
    if (order.customerId !== customer.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. This order does not belong to you.' } },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        city: order.city,
        location: order.location,
        address: order.address,
        totalAmount: Number(order.totalAmount),
        paymentStatus: order.paymentStatus,
        status: order.status,
        jobStatus: order.jobStatus,
        assignedBarber: order.assignedBarber ? {
          id: order.assignedBarber.id,
          user: {
            name: order.assignedBarber.user.name,
            avatarUrl: order.assignedBarber.user.avatarUrl ?? null,
          },
        } : null,
        items: order.items.map(item => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          ageGroup: item.ageGroup,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
        review: order.review ? {
          id: order.review.id,
          rating: order.review.rating,
          comment: order.review.comment,
          createdAt: order.review.createdAt,
        } : null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch order' } },
      { status: 500 }
    );
  }
}
