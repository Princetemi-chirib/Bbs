import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

async function verifyBarber(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.id },
      include: { barber: true },
    });
    
    if (!user || user.role !== 'BARBER' || !user.isActive || !user.barber) {
      return null;
    }
    
    return { user, barber: user.barber };
  } catch {
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyBarber(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Barber access required.' } },
        { status: 401 }
      );
    }

    const { barber } = auth;
    const orderId = params.id;
    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'COMPLETED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
          } 
        },
        { status: 400 }
      );
    }

    // Verify order is assigned to this barber
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        assignedBarberId: barber.id,
      },
    });

    if (!order) {
      return NextResponse.json(
        { 
          success: false, 
          error: { message: 'Order not found or not assigned to you' } 
        },
        { status: 404 }
      );
    }

    // Validate status transitions
    const currentStatus = order.jobStatus;
    const allowedTransitions: Record<string, string[]> = {
      'ACCEPTED': ['ON_THE_WAY'],
      'ON_THE_WAY': ['ARRIVED'],
      'ARRIVED': ['COMPLETED'],
      'COMPLETED': [], // Cannot transition from completed
    };

    if (currentStatus && !allowedTransitions[currentStatus]?.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: `Cannot transition from ${currentStatus} to ${status}` 
          } 
        },
        { status: 400 }
      );
    }

    // Update order status
    const updateData: any = {
      jobStatus: status,
    };

    // If completing, also update order status and mark payment as completed if not already
    if (status === 'COMPLETED') {
      updateData.status = 'COMPLETED';
      if (order.paymentStatus === 'PENDING') {
        updateData.paymentStatus = 'COMPLETED';
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: true,
      },
    });

    // TODO: Send email notification to customer based on status change
    // - ON_THE_WAY: "Your barber is on the way"
    // - ARRIVED: "Your barber has arrived"
    // - COMPLETED: "Service completed" + rating link

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          jobStatus: updatedOrder.jobStatus,
          status: updatedOrder.status,
        },
        message: `Order status updated to ${status}`,
      },
    });
  } catch (error: any) {
    console.error('Update order status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to update order status',
        },
      },
      { status: 500 }
    );
  }
}
