import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '@/app/api/v1/utils/auth';

export const dynamic = 'force-dynamic';

// GET /api/v1/admin/customers/analytics - Get customer analytics and insights
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdminOrRep(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin or Rep access required.' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateRangeStart = searchParams.get('dateRangeStart') || '';
    const dateRangeEnd = searchParams.get('dateRangeEnd') || '';

    const startDate = dateRangeStart ? new Date(dateRangeStart) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = dateRangeEnd ? new Date(dateRangeEnd) : new Date();
    endDate.setHours(23, 59, 59, 999);

    // Customer growth trend (monthly)
    const monthlyGrowth = await prisma.customer.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
    });

    // Revenue by customer segment
    const allCustomers = await prisma.customer.findMany({
      include: {
        bookings: {
          where: {
            paymentStatus: 'PAID',
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            totalPrice: true,
            createdAt: true,
          },
        },
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    // Calculate segment revenue
    const segmentRevenue = {
      new: 0,
      loyal: 0,
      vip: 0,
      atRisk: 0,
      dormant: 0,
      problematic: 0,
    };

    const now = new Date();
    for (const customer of allCustomers) {
      const daysSinceLastVisit = customer.bookings.length > 0
        ? Math.floor((now.getTime() - new Date(customer.bookings[0].createdAt || customer.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : Infinity;
      const totalSpent = customer.bookings.reduce((sum, b) => sum + Number(b.totalPrice), 0);
      const totalVisits = customer.bookings.length;

      if (daysSinceLastVisit <= 30) {
        segmentRevenue.new += totalSpent;
      } else if (totalVisits >= 5 && daysSinceLastVisit <= 90) {
        segmentRevenue.loyal += totalSpent;
      } else if (totalSpent >= 50000 || customer.membershipType === 'VIP' || customer.membershipType === 'PREMIUM') {
        segmentRevenue.vip += totalSpent;
      } else if (daysSinceLastVisit > 90 && daysSinceLastVisit <= 180) {
        segmentRevenue.atRisk += totalSpent;
      } else if (daysSinceLastVisit > 180) {
        segmentRevenue.dormant += totalSpent;
      }
    }

    // Top 10% customers contribution
    const customerSpending = allCustomers.map(c => ({
      id: c.id,
      totalSpent: c.bookings.reduce((sum, b) => sum + Number(b.totalPrice), 0),
    })).sort((a, b) => b.totalSpent - a.totalSpent);

    const top10PercentCount = Math.ceil(customerSpending.length * 0.1);
    const top10Percent = customerSpending.slice(0, top10PercentCount);
    const top10PercentRevenue = top10Percent.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalRevenue = customerSpending.reduce((sum, c) => sum + c.totalSpent, 0);
    const top10PercentContribution = totalRevenue > 0 ? (top10PercentRevenue / totalRevenue) * 100 : 0;

    // Customer churn reasons
    const churnedCustomers = await prisma.customer.findMany({
      where: {
        user: {
          isActive: false,
        },
        bookings: {
          none: {
            bookingDate: {
              gte: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
            },
          },
        },
      },
      include: {
        bookings: {
          select: {
            status: true,
            cancellationReason: true,
          },
        },
      },
    });

    const churnReasons = {
      highCancellation: churnedCustomers.filter(c => {
        const cancelled = c.bookings.filter(b => b.status === 'CANCELLED').length;
        return cancelled / (c.bookings.length || 1) > 0.3;
      }).length,
      noShows: churnedCustomers.filter(c => {
        const noShows = c.bookings.filter(b => b.status === 'NO_SHOW').length;
        return noShows / (c.bookings.length || 1) > 0.2;
      }).length,
      priceSensitivity: churnedCustomers.filter(c => {
        // Simplified - would need more data
        return false;
      }).length,
      serviceIssues: churnedCustomers.filter(c => {
        return c.bookings.some(b => b.cancellationReason?.toLowerCase().includes('service') || false);
      }).length,
      other: 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        growthTrend: monthlyGrowth.map(g => ({
          month: new Date(g.createdAt).toISOString().substring(0, 7),
          count: g._count.id,
        })),
        revenueBySegment: segmentRevenue,
        top10PercentContribution: Number(top10PercentContribution.toFixed(2)),
        top10PercentCount,
        totalCustomers: customerSpending.length,
        churnReasons,
      },
    });
  } catch (error: any) {
    console.error('Customer analytics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch analytics',
        },
      },
      { status: 500 }
    );
  }
}
