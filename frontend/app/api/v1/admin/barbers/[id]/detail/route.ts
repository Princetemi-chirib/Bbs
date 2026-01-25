import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '@/app/api/v1/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminOrRep = await verifyAdminOrRep(request);
    if (!adminOrRep) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const barberId = params.id;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter for orders
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

    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
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
        services: {
          where: { isActive: true },
        },
        availability: {
          orderBy: { dayOfWeek: 'asc' },
        },
        assignedOrders: {
          where: dateFilter,
          include: {
            items: true,
            review: true,
            customer: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          where: dateFilter,
          include: {
            order: {
              include: {
                customer: {
                  include: {
                    user: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!barber) {
      return NextResponse.json(
        { success: false, error: { message: 'Barber not found' } },
        { status: 404 }
      );
    }

    // Calculate performance metrics
    const orders = barber.assignedOrders;
    const paidOrders = orders.filter(o => o.paymentStatus === 'PAID');
    const completedOrders = orders.filter(o => o.status === 'COMPLETED');
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED' || o.jobStatus === 'DECLINED');

    // Revenue
    const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const barberEarnings = totalRevenue * Number(barber.commissionRate);

    // Average service time (if we track this)
    // For now, we'll use a placeholder

    // Rebooking rate (customers who have multiple orders with this barber)
    const customerIds = new Set(orders.map(o => o.customerId).filter(Boolean));
    const rebookingCustomers = Array.from(customerIds).filter(customerId => {
      return orders.filter(o => o.customerId === customerId).length > 1;
    }).length;
    const rebookingRate = customerIds.size > 0 ? (rebookingCustomers / customerIds.size) * 100 : 0;

    // Complaints (negative reviews with low ratings)
    const complaints = barber.reviews.filter(r => r.rating <= 2 && r.comment);

    // Attendance metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const ordersToday = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= today && orderDate < tomorrow;
    });

    // Last active date
    const lastOrder = orders.length > 0 
      ? orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      : null;
    const lastActiveDate = lastOrder ? lastOrder.createdAt : barber.user.createdAt;

    return NextResponse.json({
      success: true,
      data: {
        barber: {
          id: barber.id,
          barberId: barber.barberId,
          status: barber.status,
          isOnline: barber.isOnline,
          bio: barber.bio,
          experienceYears: barber.experienceYears,
          specialties: barber.specialties,
          languagesSpoken: barber.languagesSpoken,
          ratingAvg: Number(barber.ratingAvg),
          totalReviews: barber.totalReviews,
          totalBookings: barber.totalBookings,
          commissionRate: Number(barber.commissionRate),
          state: barber.state,
          city: barber.city,
          address: barber.address,
          createdAt: barber.createdAt,
          user: barber.user,
        },
        services: barber.services,
        availability: barber.availability,
        performance: {
          totalOrders: orders.length,
          completedOrders: completedOrders.length,
          cancelledOrders: cancelledOrders.length,
          totalRevenue: Number(totalRevenue.toFixed(2)),
          barberEarnings: Number(barberEarnings.toFixed(2)),
          avgOrdersPerDay: orders.length > 0 ? orders.length / Math.max(1, Math.ceil((Date.now() - new Date(barber.createdAt).getTime()) / (1000 * 60 * 60 * 24))) : 0,
          rebookingRate: Number(rebookingRate.toFixed(2)),
          complaintsCount: complaints.length,
          lastActiveDate: lastActiveDate,
        },
        reviews: barber.reviews.slice(0, 10), // Recent reviews
        recentOrders: orders.slice(0, 10), // Recent orders
      },
    });
  } catch (error: any) {
    console.error('Get barber detail error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch barber details',
        },
      },
      { status: 500 }
    );
  }
}
