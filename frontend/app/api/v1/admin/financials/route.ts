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

// Helper to get date range
function getDateRange(period: string = 'all') {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return { start: today, end: now };
    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      return { start: weekStart, end: now };
    case 'month':
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: monthStart, end: now };
    case 'year':
      const yearStart = new Date(today.getFullYear(), 0, 1);
      return { start: yearStart, end: now };
    case 'all':
    default:
      return { start: null, end: null };
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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Determine date range
    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    } else if (period !== 'all') {
      const range = getDateRange(period);
      if (range.start && range.end) {
        dateFilter = {
          createdAt: {
            gte: range.start,
            lte: range.end,
          },
        };
      }
    }

    // Get all financial data in parallel
    const [
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      yearRevenue,
      totalOrders,
      paidOrders,
      pendingOrders,
      refundedOrders,
      failedOrders,
      ordersByPaymentMethod,
      ordersByStatus,
      barberEarnings,
      companyCommission,
      totalRefunds,
      refundsList,
      recentTransactions,
      revenueTrend,
      monthlyRevenue,
    ] = await Promise.all([
      // Total Revenue (all time, paid only)
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { totalAmount: true },
      }),

      // Today's Revenue
      prisma.order.aggregate({
        where: {
          paymentStatus: 'PAID',
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(),
          },
        },
        _sum: { totalAmount: true },
      }),

      // This Week's Revenue
      (async () => {
        const range = getDateRange('week');
        return prisma.order.aggregate({
          where: {
            paymentStatus: 'PAID',
            createdAt: {
              gte: range.start!,
              lte: range.end!,
            },
          },
          _sum: { totalAmount: true },
        });
      })(),

      // This Month's Revenue
      (async () => {
        const range = getDateRange('month');
        return prisma.order.aggregate({
          where: {
            paymentStatus: 'PAID',
            createdAt: {
              gte: range.start!,
              lte: range.end!,
            },
          },
          _sum: { totalAmount: true },
        });
      })(),

      // This Year's Revenue
      (async () => {
        const range = getDateRange('year');
        return prisma.order.aggregate({
          where: {
            paymentStatus: 'PAID',
            createdAt: {
              gte: range.start!,
              lte: range.end!,
            },
          },
          _sum: { totalAmount: true },
        });
      })(),

      // Total Orders
      prisma.order.count({
        where: dateFilter,
      }),

      // Paid Orders
      prisma.order.count({
        where: { ...dateFilter, paymentStatus: 'PAID' },
      }),

      // Pending Orders
      prisma.order.count({
        where: { ...dateFilter, paymentStatus: 'PENDING' },
      }),

      // Refunded Orders
      prisma.order.count({
        where: { ...dateFilter, paymentStatus: 'REFUNDED' },
      }),

      // Failed Orders
      prisma.order.count({
        where: { ...dateFilter, paymentStatus: 'FAILED' },
      }),

      // Orders by Payment Method
      prisma.order.groupBy({
        by: ['paymentMethod'],
        where: {
          ...dateFilter,
          paymentMethod: { not: null },
          paymentStatus: 'PAID',
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),

      // Orders by Status
      prisma.order.groupBy({
        by: ['status'],
        where: dateFilter,
        _sum: { totalAmount: true },
        _count: { id: true },
      }),

      // Barber Earnings (from assigned orders with commission calculation)
      prisma.order.groupBy({
        by: ['assignedBarberId'],
        where: {
          ...dateFilter,
          assignedBarberId: { not: null },
          paymentStatus: 'PAID',
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),

      // Total Company Commission (placeholder - would need commission rate from barber)
      Promise.resolve({ total: 0 }),

      // Total Refunds
      prisma.order.aggregate({
        where: {
          ...dateFilter,
          paymentStatus: 'REFUNDED',
        },
        _sum: { totalAmount: true },
      }),

      // Refunds List (last 10)
      prisma.order.findMany({
        where: {
          paymentStatus: 'REFUNDED',
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          totalAmount: true,
          updatedAt: true,
        },
      }),

      // Recent Transactions (last 50)
      prisma.order.findMany({
        where: dateFilter,
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedBarber: {
            select: {
              barberId: true,
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          items: {
            take: 3,
          },
        },
      }),

      // Revenue Trend (last 30 days, daily)
      (async () => {
        const days = 30;
        const trend: any[] = [];
        const now = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const startOfDay = new Date(date.setHours(0, 0, 0, 0));
          const endOfDay = new Date(date.setHours(23, 59, 59, 999));
          
          const dayRevenue = await prisma.order.aggregate({
            where: {
              paymentStatus: 'PAID',
              createdAt: {
                gte: startOfDay,
                lte: endOfDay,
              },
            },
            _sum: { totalAmount: true },
            _count: { id: true },
          });
          
          trend.push({
            date: startOfDay.toISOString().split('T')[0],
            revenue: Number(dayRevenue._sum.totalAmount || 0),
            orders: dayRevenue._count.id,
          });
        }
        
        return trend;
      })(),

      // Monthly Revenue (last 12 months)
      (async () => {
        const months: any[] = [];
        const now = new Date();
        
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
          
          const monthRevenue = await prisma.order.aggregate({
            where: {
              paymentStatus: 'PAID',
              createdAt: {
                gte: monthStart,
                lte: monthEnd,
              },
            },
            _sum: { totalAmount: true },
            _count: { id: true },
          });
          
          months.push({
            month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            revenue: Number(monthRevenue._sum.totalAmount || 0),
            orders: monthRevenue._count.id,
          });
        }
        
        return months;
      })(),
    ]);

    // Calculate barber earnings with commission rates
    const barberEarningsDetails = await Promise.all(
      barberEarnings.map(async (item) => {
        if (!item.assignedBarberId) return null;
        
        const barber = await prisma.barber.findUnique({
          where: { id: item.assignedBarberId },
          select: {
            id: true,
            commissionRate: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        });

        if (!barber) return null;

        const totalRevenue = Number(item._sum.totalAmount || 0);
        const commissionRate = Number(barber.commissionRate || 0.70);
        const barberEarning = totalRevenue * commissionRate;
        const companyCommission = totalRevenue * (1 - commissionRate);

        return {
          barberId: barber.id,
          barberName: barber.user.name,
          barberEmail: barber.user.email,
          totalRevenue,
          commissionRate,
          barberEarning,
          companyCommission,
          ordersCount: item._count.id,
        };
      })
    );

    const validBarberEarnings = barberEarningsDetails.filter(Boolean) as any[];
    const totalBarberPayouts = validBarberEarnings.reduce((sum, b) => sum + b.barberEarning, 0);
    const totalCompanyCommission = validBarberEarnings.reduce((sum, b) => sum + b.companyCommission, 0);

    // Calculate averages
    const avgOrderValue = paidOrders > 0 
      ? Number(totalRevenue._sum.totalAmount || 0) / paidOrders 
      : 0;

    // Filtered revenue for selected period
    const filteredRevenue = await prisma.order.aggregate({
      where: {
        ...dateFilter,
        paymentStatus: 'PAID',
      },
      _sum: { totalAmount: true },
    });

    // Calculate growth percentages
    const weekRange = getDateRange('week');
    const prevWeekStart = new Date(weekRange.start!);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekRange.start!);
    
    const prevWeekRevenue = await prisma.order.aggregate({
      where: {
        paymentStatus: 'PAID',
        createdAt: {
          gte: prevWeekStart,
          lt: prevWeekEnd,
        },
      },
      _sum: { totalAmount: true },
    });

    const weekGrowth = Number(prevWeekRevenue._sum.totalAmount || 0) > 0
      ? ((Number(weekRevenue._sum.totalAmount || 0) - Number(prevWeekRevenue._sum.totalAmount || 0)) / Number(prevWeekRevenue._sum.totalAmount || 0)) * 100
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        // KPI Cards
        kpis: {
          totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
          todayRevenue: Number(todayRevenue._sum.totalAmount || 0),
          weekRevenue: Number(weekRevenue._sum.totalAmount || 0),
          monthRevenue: Number(monthRevenue._sum.totalAmount || 0),
          yearRevenue: Number(yearRevenue._sum.totalAmount || 0),
          weekGrowth: Number(weekGrowth.toFixed(2)),
          filteredRevenue: Number(filteredRevenue._sum.totalAmount || 0),
          avgOrderValue: Number(avgOrderValue.toFixed(2)),
        },

        // Order Stats
        orders: {
          total: totalOrders,
          paid: paidOrders,
          pending: pendingOrders,
          refunded: refundedOrders,
          failed: failedOrders,
        },

        // Payment Methods Breakdown
        paymentMethods: ordersByPaymentMethod.map((item) => ({
          method: item.paymentMethod || 'Unknown',
          amount: Number(item._sum.totalAmount || 0),
          count: item._count.id,
        })),

        // Order Status Breakdown
        orderStatus: ordersByStatus.map((item) => ({
          status: item.status,
          amount: Number(item._sum.totalAmount || 0),
          count: item._count.id,
        })),

        // Barber Earnings
        barberEarnings: validBarberEarnings.sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10),
        totalBarberPayouts,
        totalCompanyCommission,

        // Refunds
        refunds: {
          total: Number(totalRefunds._sum.totalAmount || 0),
          count: refundedOrders,
          recent: refundsList.map((item) => ({
            id: item.id,
            orderNumber: item.orderNumber,
            customerName: item.customerName,
            amount: Number(item.totalAmount),
            date: item.updatedAt,
          })),
        },

        // Recent Transactions
        recentTransactions: recentTransactions.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          amount: Number(order.totalAmount),
          paymentMethod: order.paymentMethod || 'Unknown',
          paymentStatus: order.paymentStatus,
          orderStatus: order.status,
          barberName: order.assignedBarber?.user.name || null,
          createdAt: order.createdAt,
        })),

        // Charts Data
        charts: {
          revenueTrend: revenueTrend,
          monthlyRevenue: monthlyRevenue,
        },
      },
    });
  } catch (error: any) {
    console.error('Financials API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch financial data',
        },
      },
      { status: 500 }
    );
  }
}
