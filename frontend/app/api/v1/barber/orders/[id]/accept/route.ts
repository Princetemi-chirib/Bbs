import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

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

    // Verify order is assigned to this barber and pending acceptance
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        assignedBarberId: barber.id,
        jobStatus: 'PENDING_ACCEPTANCE',
      },
    });

    if (!order) {
      return NextResponse.json(
        { 
          success: false, 
          error: { message: 'Order not found or not available for acceptance' } 
        },
        { status: 404 }
      );
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        jobStatus: 'ACCEPTED',
      },
      include: {
        items: true,
      },
    });

    // TODO: Send email notification to customer that barber accepted

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          jobStatus: updatedOrder.jobStatus,
        },
        message: 'Order accepted successfully',
      },
    });
  } catch (error: any) {
    console.error('Accept order error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to accept order',
        },
      },
      { status: 500 }
    );
  }
}
