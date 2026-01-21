import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

async function getCustomerFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    
    if (decoded.role !== 'CUSTOMER') {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { customer: true },
    });

    if (!user || !user.customer || !user.isActive) {
      return null;
    }

    return user.customer;
  } catch {
    return null;
  }
}

// GET /api/v1/orders/[id] - Get a single order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await getCustomerFromRequest(request);
    
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
          user: order.assignedBarber.user,
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
