import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '../../utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/admin/analytics/realtime
 * §16 Real-time: live visitors, active orders today, current revenue, active barbers, current bookings.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdminOrRep(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      liveSessions,
      ordersToday,
      revenueToday,
      activeBarbers,
      bookingsToday,
      pendingOrders,
    ] = await Promise.all([
      prisma.session.count({
        where: { expiresAt: { gt: now }, updatedAt: { gte: fiveMinutesAgo } },
      }),
      prisma.order.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.order.aggregate({
        where: {
          paymentStatus: 'PAID',
          createdAt: { gte: todayStart },
        },
        _sum: { totalAmount: true },
      }),
      prisma.barber.count({
        where: { isOnline: true, status: 'ACTIVE' },
      }),
      prisma.booking.count({
        where: {
          bookingDate: {
            gte: todayStart,
            lte: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1),
          },
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
      }),
      prisma.order.count({
        where: { status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        liveVisitors: liveSessions,
        ordersToday,
        revenueToday: Number(revenueToday._sum.totalAmount ?? 0),
        activeBarbers,
        bookingsToday,
        pendingOrders,
        lastUpdated: now.toISOString(),
      },
    });
  } catch (e) {
    console.error('Realtime analytics error:', e);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch realtime data' } },
      { status: 500 }
    );
  }
}
