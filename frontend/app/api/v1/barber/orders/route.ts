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

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyBarber(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Barber access required.' } },
        { status: 401 }
      );
    }

    const { barber } = auth;
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
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        city: order.city,
        location: order.location,
        address: order.address,
        additionalNotes: order.additionalNotes,
        totalAmount: Number(order.totalAmount),
        status: order.status,
        jobStatus: order.jobStatus,
        paymentStatus: order.paymentStatus,
        declineReason: order.declineReason,
        items: order.items.map((item) => ({
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
