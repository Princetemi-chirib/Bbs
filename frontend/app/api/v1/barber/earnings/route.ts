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
    const period = searchParams.get('period') || 'all'; // today, week, month, all

    // Calculate date ranges
    const now = new Date();
    let startDate: Date | undefined;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        startDate = undefined;
    }

    // Build where clause for completed orders
    const where: any = {
      assignedBarberId: barber.id,
      jobStatus: 'COMPLETED',
    };

    if (startDate) {
      where.createdAt = {
        gte: startDate,
      };
    }

    // Get completed orders
    const completedOrders = await prisma.order.findMany({
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

    // Calculate earnings (assuming 70% commission rate, but you can adjust)
    const commissionRate = Number(barber.commissionRate || 0.7);
    
    let totalEarnings = 0;
    const earningsByService: Record<string, { count: number; earnings: number }> = {};

    completedOrders.forEach((order: typeof completedOrders[0]) => {
      const orderTotal = Number(order.totalAmount);
      const orderEarnings = orderTotal * commissionRate;
      totalEarnings += orderEarnings;

      // Group by service/product
      order.items.forEach((item: typeof order.items[0]) => {
        const serviceTitle = item.product.title;
        if (!earningsByService[serviceTitle]) {
          earningsByService[serviceTitle] = { count: 0, earnings: 0 };
        }
        earningsByService[serviceTitle].count += item.quantity;
        earningsByService[serviceTitle].earnings += Number(item.totalPrice) * commissionRate;
      });
    });

    // Get all time stats
    const allTimeStats = period === 'all' ? { totalEarnings, orderCount: completedOrders.length } : null;

    // Get pending orders (for pending earnings calculation)
    const pendingOrders = await prisma.order.findMany({
      where: {
        assignedBarberId: barber.id,
        jobStatus: { in: ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED'] },
      },
      select: {
        totalAmount: true,
      },
    });

    const pendingEarnings = pendingOrders.reduce(
      (sum: number, order: typeof pendingOrders[0]) => sum + Number(order.totalAmount) * commissionRate,
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        period,
        totalEarnings: Number(totalEarnings.toFixed(2)),
        orderCount: completedOrders.length,
        pendingEarnings: Number(pendingEarnings.toFixed(2)),
        pendingOrderCount: pendingOrders.length,
        earningsByService: Object.entries(earningsByService).map(([service, data]: [string, { count: number; earnings: number }]) => ({
          service,
          orderCount: data.count,
          earnings: Number(data.earnings.toFixed(2)),
        })),
        orders: completedOrders.map((order: typeof completedOrders[0]) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          totalAmount: Number(order.totalAmount),
          earnings: Number((Number(order.totalAmount) * commissionRate).toFixed(2)),
          createdAt: order.createdAt,
        })),
        commissionRate,
        allTimeStats,
      },
    });
  } catch (error: any) {
    console.error('Get barber earnings error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch earnings',
        },
      },
      { status: 500 }
    );
  }
}
