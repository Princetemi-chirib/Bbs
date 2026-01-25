import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/app/api/v1/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin access required.' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    // Build date filter
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.lte = new Date(endDate);
      }
    }

    // Build status filter
    const statusFilter: any = {};
    if (status && status !== 'ALL') {
      statusFilter.status = status;
    }

    // Get all barbers with related data
    const barbers = await prisma.barber.findMany({
      where: {
        ...statusFilter,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        assignedOrders: {
          where: {
            ...dateFilter,
          },
          include: {
            items: true,
          },
        },
        reviews: {
          where: {
            ...dateFilter,
          },
        },
        availability: true,
      },
    });

    // Calculate today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Calculate metrics
    const totalBarbers = barbers.length;
    const activeBarbers = barbers.filter(b => b.status === 'ACTIVE').length;
    const inactiveBarbers = barbers.filter(b => b.status === 'INACTIVE').length;
    const suspendedBarbers = barbers.filter(b => b.status === 'SUSPENDED').length;

    // Barbers working today (have orders today or are online)
    const barbersWorkingToday = barbers.filter(barber => {
      const hasOrderToday = barber.assignedOrders.some(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= today && orderDate < tomorrow;
      });
      return hasOrderToday || barber.isOnline;
    }).length;

    // Calculate average rating
    const totalRating = barbers.reduce((sum, b) => sum + Number(b.ratingAvg), 0);
    const averageRating = totalBarbers > 0 ? totalRating / totalBarbers : 0;

    // Calculate total revenue from orders
    const allOrders = barbers.flatMap(b => b.assignedOrders);
    const totalRevenue = allOrders
      .filter(order => order.paymentStatus === 'PAID')
      .reduce((sum, order) => {
        return sum + Number(order.totalAmount);
      }, 0);

    // Average orders per barber
    const totalOrders = allOrders.length;
    const avgOrdersPerBarber = totalBarbers > 0 ? totalOrders / totalBarbers : 0;

    // Calculate no-show and late rates
    const noShowOrders = allOrders.filter(order => order.jobStatus === 'DECLINED' || order.status === 'CANCELLED').length;
    const noShowRate = totalOrders > 0 ? (noShowOrders / totalOrders) * 100 : 0;

    // Get barbers with detailed metrics
    const barbersWithMetrics = barbers.map(barber => {
      const barberOrders = barber.assignedOrders;
      const paidOrders = barberOrders.filter(o => o.paymentStatus === 'PAID');
      
      // Calculate revenue for this barber
      const barberRevenue = paidOrders.reduce((sum, order) => {
        return sum + Number(order.totalAmount);
      }, 0);

      // Revenue per day (if we have date range, calculate average)
      const daysInRange = startDate && endDate 
        ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))
        : Math.max(1, Math.ceil((Date.now() - new Date(barber.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
      const revenuePerDay = barberRevenue / daysInRange;

      // No-show/cancellation rate for this barber
      const barberNoShows = barberOrders.filter(o => o.jobStatus === 'DECLINED' || o.status === 'CANCELLED').length;
      const barberNoShowRate = barberOrders.length > 0 ? (barberNoShows / barberOrders.length) * 100 : 0;

      // Last active date (last order date or last login)
      const lastOrder = barberOrders.length > 0 
        ? barberOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        : null;
      const lastActiveDate = lastOrder ? lastOrder.createdAt : barber.user.createdAt;

      return {
        id: barber.id,
        barberId: barber.barberId,
        name: barber.user.name,
        email: barber.user.email,
        phone: barber.user.phone,
        avatarUrl: barber.user.avatarUrl,
        status: barber.status,
        isOnline: barber.isOnline,
        state: barber.state,
        city: barber.city,
        address: barber.address,
        specialties: barber.specialties,
        ratingAvg: Number(barber.ratingAvg),
        totalReviews: barber.totalReviews,
        totalBookings: barber.totalBookings,
        totalOrders: barberOrders.length,
        revenue: barberRevenue,
        revenuePerDay: revenuePerDay,
        noShowRate: barberNoShowRate,
        lastActiveDate: lastActiveDate,
        createdAt: barber.createdAt,
        experienceYears: barber.experienceYears,
        commissionRate: Number(barber.commissionRate),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalBarbers,
          activeBarbers,
          inactiveBarbers,
          suspendedBarbers,
          barbersWorkingToday,
          averageRating: Number(averageRating.toFixed(2)),
          totalRevenue: Number(totalRevenue.toFixed(2)),
          avgOrdersPerBarber: Number(avgOrdersPerBarber.toFixed(2)),
          noShowRate: Number(noShowRate.toFixed(2)),
        },
        barbers: barbersWithMetrics,
      },
    });
  } catch (error: any) {
    console.error('Get barber metrics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch barber metrics',
        },
      },
      { status: 500 }
    );
  }
}
