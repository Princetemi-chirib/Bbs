import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '../utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdminOrRep(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin or Rep access required.' } },
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
      
      // Total revenue (sum of completed orders) - only for admin
      user.role === 'ADMIN' 
        ? prisma.order.aggregate({
            where: {
              paymentStatus: 'PAID',
            },
            _sum: {
              totalAmount: true,
            },
          })
        : Promise.resolve({ _sum: { totalAmount: null } }),
      
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
          totalRevenue: user.role === 'ADMIN' ? Number(totalRevenue._sum.totalAmount || 0) : null,
          averageRating: Number(averageRating.toFixed(2)),
        },
        ordersByStatus: ordersByStatus.map((item: typeof ordersByStatus[0]) => ({
          status: item.status,
          count: item._count.id,
        })),
        ordersByJobStatus: ordersByJobStatus
          .filter((item: typeof ordersByJobStatus[0]) => item.jobStatus !== null)
          .map((item: typeof ordersByJobStatus[0]) => ({
            status: item.jobStatus,
            count: item._count.id,
          })),
        recentOrders: recentOrders.map((order: typeof recentOrders[0]) => ({
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
