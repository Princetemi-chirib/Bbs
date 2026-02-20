import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUser } from '@/app/api/v1/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyUser(request);
    if (!auth || auth.role !== 'BARBER') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Barber access required.' } },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      include: { barber: true },
    });
    const barber = user?.isActive ? user.barber : null;
    if (!barber) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Barber access required.' } },
        { status: 401 }
      );
    }

    const commissionRate = Number(barber.commissionRate ?? 0.35);
    const now = new Date();

    // Week: last 7 days
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    // Month: current calendar month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const barberId = barber.id;

    // Completed orders (all time, week, month)
    const [allCompleted, weekCompleted, monthCompleted] = await Promise.all([
      prisma.order.findMany({
        where: {
          assignedBarberId: barberId,
          jobStatus: 'COMPLETED',
        },
        select: { totalAmount: true },
      }),
      prisma.order.findMany({
        where: {
          assignedBarberId: barberId,
          jobStatus: 'COMPLETED',
          createdAt: { gte: weekStart },
        },
        select: { totalAmount: true },
      }),
      prisma.order.findMany({
        where: {
          assignedBarberId: barberId,
          jobStatus: 'COMPLETED',
          createdAt: { gte: monthStart },
        },
        select: { totalAmount: true },
      }),
    ]);

    const totalEarnings = allCompleted.reduce(
      (sum, o) => sum + Number(o.totalAmount) * commissionRate,
      0
    );
    const weeklyEarnings = weekCompleted.reduce(
      (sum, o) => sum + Number(o.totalAmount) * commissionRate,
      0
    );
    const monthlyEarnings = monthCompleted.reduce(
      (sum, o) => sum + Number(o.totalAmount) * commissionRate,
      0
    );

    // Incompleted = assigned to barber but not COMPLETED
    const incompletedCount = await prisma.order.count({
      where: {
        assignedBarberId: barberId,
        jobStatus: { not: 'COMPLETED' },
      },
    });

    const jobsCompleted = allCompleted.length;
    const starRating = Number(barber.ratingAvg);
    const totalReviews = barber.totalReviews;

    return NextResponse.json({
      success: true,
      data: {
        totalEarnings: Number(totalEarnings.toFixed(2)),
        weeklyEarnings: Number(weeklyEarnings.toFixed(2)),
        monthlyEarnings: Number(monthlyEarnings.toFixed(2)),
        starRating,
        totalReviews,
        jobsCompleted,
        jobsIncompleted: incompletedCount,
      },
    });
  } catch (error: any) {
    console.error('Get barber dashboard stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch dashboard stats',
        },
      },
      { status: 500 }
    );
  }
}
