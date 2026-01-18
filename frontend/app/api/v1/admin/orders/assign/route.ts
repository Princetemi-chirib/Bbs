import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

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
    const { orderId, barberId } = body;

    if (!orderId || !barberId) {
      return NextResponse.json(
        { success: false, error: { message: 'Order ID and Barber ID are required' } },
        { status: 400 }
      );
    }

    // Verify order exists and is not already assigned
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { assignedBarber: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: { message: 'Order not found' } },
        { status: 404 }
      );
    }

    // Verify barber exists and is active
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      include: { user: true },
    });

    if (!barber) {
      return NextResponse.json(
        { success: false, error: { message: 'Barber not found' } },
        { status: 404 }
      );
    }

    if (barber.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: { message: 'Barber is not active' } },
        { status: 400 }
      );
    }

    // Assign order to barber
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        assignedBarberId: barberId,
        jobStatus: 'PENDING_ACCEPTANCE',
        declineReason: null, // Clear any previous decline reason
      },
      include: {
        assignedBarber: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        items: true,
      },
    });

    // TODO: Send email notification to barber about assignment
    // You can use your existing email service here

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          assignedBarber: {
            id: updatedOrder.assignedBarber?.id,
            name: updatedOrder.assignedBarber?.user.name,
            email: updatedOrder.assignedBarber?.user.email,
          },
          jobStatus: updatedOrder.jobStatus,
        },
        message: 'Order assigned successfully',
      },
    });
  } catch (error: any) {
    console.error('Assign order error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to assign order',
        },
      },
      { status: 500 }
    );
  }
}
