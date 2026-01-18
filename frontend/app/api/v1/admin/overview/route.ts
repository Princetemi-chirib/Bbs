import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

// Helper function to verify admin token
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

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin access required.' } },
        { status: 401 }
      );
    }

    // Get statistics
    const [totalBarbers, totalOrders, barbersWithActiveStatus, totalRevenue, recentOrders] = await Promise.all([
      // Total barbers
      prisma.barber.count(),
      
      // Total orders
      prisma.order.count(),
      
      // Active barbers
      prisma.barber.count({
        where: { status: 'ACTIVE' },
      }),
      
      // Total revenue (sum of completed orders)
      prisma.order.aggregate({
        where: {
          paymentStatus: 'PAID',
        },
        _sum: {
          totalAmount: true,
        },
      }),
      
      // Recent orders (last 10)
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            take: 3,
          },
        },
      }),
    ]);

    // Calculate average ratings for barbers
    const barbersWithRatings = await prisma.barber.findMany({
      where: {
        ratingAvg: {
          gt: 0,
        },
      },
      select: {
        ratingAvg: true,
      },
    });

    const averageRating = barbersWithRatings.length > 0
      ? barbersWithRatings.reduce((sum: number, b: typeof barbersWithRatings[0]) => sum + Number(b.ratingAvg), 0) / barbersWithRatings.length
      : 0;

    // Orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    // Orders by job status
    const ordersByJobStatus = await prisma.order.groupBy({
      by: ['jobStatus'],
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalBarbers,
          activeBarbers: barbersWithActiveStatus,
          totalOrders,
          totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
          averageRating: Number(averageRating.toFixed(2)),
        },
        ordersByStatus: ordersByStatus.map((item) => ({
          status: item.status,
          count: item._count.id,
        })),
        ordersByJobStatus: ordersByJobStatus
          .filter((item) => item.jobStatus !== null)
          .map((item) => ({
            status: item.jobStatus,
            count: item._count.id,
          })),
        recentOrders: recentOrders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          totalAmount: Number(order.totalAmount),
          status: order.status,
          jobStatus: order.jobStatus,
          paymentStatus: order.paymentStatus,
          assignedBarberId: order.assignedBarberId || null,
          createdAt: order.createdAt,
        })),
      },
    });
  } catch (error: any) {
    console.error('Admin overview error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch overview data',
        },
      },
      { status: 500 }
    );
  }
}
