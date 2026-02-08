import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '../utils';

export const dynamic = 'force-dynamic';

// Helper to get date range
function getDateRange(period: string = 'all') {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'today':
      return { start: today, end: now };
    case 'week': {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return { start: weekStart, end: now };
    }
    case 'month': {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: monthStart, end: now };
    }
    case 'quarter': {
      const q = Math.floor(today.getMonth() / 3) + 1;
      const quarterStart = new Date(today.getFullYear(), (q - 1) * 3, 1);
      return { start: quarterStart, end: now };
    }
    case 'year': {
      const yearStart = new Date(today.getFullYear(), 0, 1);
      return { start: yearStart, end: now };
    }
    case 'all':
    default:
      return { start: null, end: null };
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdminOrRep(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin or Rep access required.' } },
        { status: 401 }
      );
    }
    void prisma.analyticsAuditLog.create({ data: { userId: user.id, action: 'VIEW_FINANCIALS', entity: 'financials' } }).catch(() => {});

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const barberId = searchParams.get('barber') || undefined;
    const location = searchParams.get('location') || undefined;
    const category = searchParams.get('category') || undefined;
    const service = searchParams.get('service') || undefined;

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

    // Extra filters (barber, location, category, service)
    const orderFilters: any[] = [];
    if (barberId) orderFilters.push({ assignedBarberId: barberId });
    if (location) orderFilters.push({ city: location });
    if (category) orderFilters.push({ items: { some: { product: { category } } } });
    if (service) orderFilters.push({ items: { some: { title: service } } });
    const extraOrderWhere = orderFilters.length === 0 ? {} : { AND: orderFilters };
    const orderWhere = orderFilters.length === 0
      ? { ...dateFilter }
      : { AND: [dateFilter, ...orderFilters] };

    // Get all financial data in parallel
    const [
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      yearRevenue,
      quarterRevenue,
      totalOrders,
      ordersThisWeek,
      ordersThisMonth,
      ordersThisYear,
      ordersThisQuarter,
      paidOrders,
      pendingOrders,
      refundedOrders,
      failedOrders,
      ordersByPaymentMethod,
      allOrdersByPaymentMethod,
      ordersByPaymentMethodAndStatus,
      ordersByStatus,
      barberEarnings,
      companyCommission,
      totalRefunds,
      refundsList,
      recentTransactions,
      revenueTrend,
      monthlyRevenue,
      totalCustomers,
      newCustomersThisPeriod,
      newCustomersDailyWeeklyMonthly,
      orderItemsForTopServices,
      revenueByLocation,
      bookingsForCategories,
      orderItemsForProductCategories,
      orderItemsForTopProducts,
      bookingsForPeakTimes,
    ] = await Promise.all([
      // Total Revenue (all time, paid only)
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID', ...extraOrderWhere },
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
          ...extraOrderWhere,
        },
        _sum: { totalAmount: true },
      }),

      // This Week's Revenue
      (async () => {
        const range = getDateRange('week');
        return prisma.order.aggregate({
          where: {
            paymentStatus: 'PAID',
            createdAt: { gte: range.start!, lte: range.end! },
            ...extraOrderWhere,
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
            createdAt: { gte: range.start!, lte: range.end! },
            ...extraOrderWhere,
          },
          _sum: { totalAmount: true },
        });
      })(),

      // This Quarter's Revenue
      (async () => {
        const range = getDateRange('quarter');
        return prisma.order.aggregate({
          where: {
            paymentStatus: 'PAID',
            createdAt: { gte: range.start!, lte: range.end! },
            ...extraOrderWhere,
          },
          _sum: { totalAmount: true },
        });
      })(),

      // Total Orders (filtered by period)
      prisma.order.count({
        where: orderWhere,
      }),

      // Orders this week / month / year (for growth)
      (async () => {
        const r = getDateRange('week');
        return prisma.order.count({ where: { createdAt: { gte: r.start!, lte: r.end! }, ...extraOrderWhere } });
      })(),
      (async () => {
        const r = getDateRange('month');
        return prisma.order.count({ where: { createdAt: { gte: r.start!, lte: r.end! }, ...extraOrderWhere } });
      })(),
      (async () => {
        const r = getDateRange('year');
        return prisma.order.count({ where: { createdAt: { gte: r.start!, lte: r.end! }, ...extraOrderWhere } });
      })(),
      (async () => {
        const r = getDateRange('quarter');
        return prisma.order.count({ where: { createdAt: { gte: r.start!, lte: r.end! }, ...extraOrderWhere } });
      })(),

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

      // Orders by Payment Method (paid only - for revenue)
      prisma.order.groupBy({
        by: ['paymentMethod'],
        where: {
          ...orderWhere,
          paymentMethod: { not: null },
          paymentStatus: 'PAID',
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),

      // All orders by Payment Method (for success rate calculation)
      prisma.order.groupBy({
        by: ['paymentMethod'],
        where: {
          ...orderWhere,
          paymentMethod: { not: null },
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),

      // Orders by Payment Method and Status (for success rate)
      prisma.order.groupBy({
        by: ['paymentMethod', 'paymentStatus'],
        where: {
          ...orderWhere,
          paymentMethod: { not: null },
        },
        _count: { id: true },
      }),

      // Orders by Status
      prisma.order.groupBy({
        by: ['status'],
        where: orderWhere,
        _sum: { totalAmount: true },
        _count: { id: true },
      }),

        // Barber Earnings (from assigned orders with commission calculation) - Admin only
      user.role === 'ADMIN'
        ? prisma.order.groupBy({
            by: ['assignedBarberId'],
            where: {
              ...orderWhere,
              assignedBarberId: { not: null },
              paymentStatus: 'PAID',
            },
            _sum: { totalAmount: true },
            _count: { id: true },
          })
        : Promise.resolve([]),

      // Total Company Commission - Admin only
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
        where: orderWhere,
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
            select: { title: true },
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
              createdAt: { gte: startOfDay, lte: endOfDay },
              ...extraOrderWhere,
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
              createdAt: { gte: monthStart, lte: monthEnd },
              ...extraOrderWhere,
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

      // Total Customers
      prisma.customer.count(),

      // New Customers This Period (when date filter applied)
      dateFilter.createdAt
        ? prisma.customer.count({
            where: { createdAt: dateFilter.createdAt },
          })
        : Promise.resolve(0),

      // New customers daily, weekly, monthly (fixed ranges)
      (async () => {
        const todayR = getDateRange('today');
        const weekR = getDateRange('week');
        const monthR = getDateRange('month');
        const [t, w, m] = await Promise.all([
          prisma.customer.count({ where: { createdAt: { gte: todayR.start!, lte: todayR.end! } } }),
          prisma.customer.count({ where: { createdAt: { gte: weekR.start!, lte: weekR.end! } } }),
          prisma.customer.count({ where: { createdAt: { gte: monthR.start!, lte: monthR.end! } } }),
        ]);
        return { newToday: t, newThisWeek: w, newThisMonth: m };
      })(),

      // Order items for top services + revenue per service (include totalPrice)
      prisma.orderItem.findMany({
        where: {
          order: {
            paymentStatus: 'PAID',
            ...dateFilter,
            ...extraOrderWhere,
          },
        },
        select: { title: true, quantity: true, orderId: true, totalPrice: true },
      }),

      // Revenue by location (city)
      prisma.order.groupBy({
        by: ['city'],
        where: {
          ...orderWhere,
          paymentStatus: 'PAID',
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),

      // Bookings with services for service category analytics
      prisma.booking.findMany({
        where: {
          ...(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}),
          paymentStatus: 'PAID',
        },
        select: {
          id: true,
          totalPrice: true,
          createdAt: true,
          service: {
            select: {
              category: true,
            },
          },
        },
      }),

      // Order items with products for product category analytics (include costPrice for §4.3 margins)
      prisma.orderItem.findMany({
        where: {
          order: {
            paymentStatus: 'PAID',
            ...dateFilter,
            ...extraOrderWhere,
          },
        },
        select: {
          id: true,
          totalPrice: true,
          quantity: true,
          orderId: true,
          product: {
            select: {
              category: true,
              costPrice: true,
            },
          },
        },
      }),

      // Order items for most/least sold products (by product)
      prisma.orderItem.findMany({
        where: {
          order: {
            paymentStatus: 'PAID',
            ...dateFilter,
            ...extraOrderWhere,
          },
        },
        select: {
          productId: true,
          title: true,
          quantity: true,
          orderId: true,
          totalPrice: true,
        },
      }),

      // Bookings for peak-time analytics (hourly, daily, monthly)
      prisma.booking.findMany({
        where: {
          ...(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}),
          paymentStatus: 'PAID',
        },
        select: { bookingDate: true, bookingTime: true },
      }),
    ]);

    // §1.2 Discounts; §1.4 Payment processing fees, retry rate; §1.5 Chargebacks; §4.4 Booking channels; §1.3 CoGS; §5.2 Barber metrics
    const [
      periodRevenueAgg,
      discountsAgg,
      paymentFeesByMethod,
      paymentRetryRows,
      chargebacksAgg,
      chargebacksList,
      bookingChannelsGroup,
      orderItemsWithCost,
      campaignsWithSpend,
      barberBookingsForMetrics,
      payoutsList,
    ] = await Promise.all([
      prisma.order.aggregate({ where: { paymentStatus: 'PAID', ...orderWhere }, _sum: { totalAmount: true } }),
      (prisma as any).order.aggregate({ where: { paymentStatus: 'PAID', ...orderWhere }, _sum: { discountAmount: true } }),
      (prisma as any).order.groupBy({
        by: ['paymentMethod'],
        where: { paymentStatus: 'PAID', ...orderWhere, paymentMethod: { not: null } },
        _sum: { paymentProcessingFee: true },
      }),
      (prisma as any).order.findMany({
        where: { ...orderWhere, paymentAttemptCount: { gt: 1 } },
        select: { paymentStatus: true },
      }),
      (prisma as any).order.aggregate({
        where: { ...orderWhere, chargebackAmount: { not: null } },
        _sum: { chargebackAmount: true },
      }),
      (prisma as any).order.findMany({
        where: { chargebackAt: { not: null } },
        take: 10,
        orderBy: { chargebackAt: 'desc' },
        select: { id: true, orderNumber: true, chargebackAmount: true, chargebackAt: true, customerName: true },
      }),
      (prisma as any).booking.groupBy({
        by: ['source'],
        where: { paymentStatus: 'PAID', ...(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}) },
        _count: { id: true },
        _sum: { totalPrice: true },
      }),
      (prisma as any).orderItem.findMany({
        where: { order: { paymentStatus: 'PAID', ...orderWhere } },
        select: { quantity: true, totalPrice: true, product: { select: { costPrice: true } } },
      }),
      (prisma as any).campaign.findMany({
        where: { spend: { not: null } },
        select: { id: true, spend: true, startAt: true, endAt: true },
      }),
      prisma.booking.findMany({
        where: {
          status: 'COMPLETED',
          paymentStatus: 'PAID',
          ...(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}),
        },
        select: {
          barberId: true,
          service: { select: { name: true } },
          totalPrice: true,
          durationMinutes: true,
          bookingTime: true,
        },
      }),
      (prisma as any).barberPayout.findMany({
        take: 30,
        orderBy: { createdAt: 'desc' },
        select: { id: true, barberId: true, amount: true, periodStart: true, periodEnd: true, status: true, paidAt: true },
      }),
    ]);

    const periodRevenueForHealth = Number(periodRevenueAgg._sum.totalAmount || 0) || Number(totalRevenue._sum?.totalAmount || 0);
    const totalDiscounts = Number(discountsAgg._sum.discountAmount || 0);
    const paymentProcessingFeesByMethod = (paymentFeesByMethod as { paymentMethod: string; _sum: { paymentProcessingFee: unknown } }[]).map((r) => ({
      method: r.paymentMethod || 'Unknown',
      totalFees: Number(r._sum?.paymentProcessingFee || 0),
    }));
    const totalPaymentRetries = paymentRetryRows.length;
    const paymentRetrySuccessCount = (paymentRetryRows as { paymentStatus: string }[]).filter((o) => o.paymentStatus === 'PAID').length;
    const paymentRetrySuccessRate = totalPaymentRetries > 0 ? Number(((paymentRetrySuccessCount / totalPaymentRetries) * 100).toFixed(2)) : null;
    const totalChargebacks = Number(chargebacksAgg._sum.chargebackAmount || 0);
    const bookingChannels = (bookingChannelsGroup as { source: string | null; _count: { id: number }; _sum: { totalPrice: unknown } }[]).map((r) => ({
      source: r.source || 'Unknown',
      count: r._count.id,
      revenue: Number(r._sum?.totalPrice || 0),
    })).sort((a, b) => b.count - a.count);

    let cogs = 0;
    for (const it of (orderItemsWithCost as { quantity: number; product: { costPrice: unknown } }[])) {
      const cp = it.product?.costPrice;
      cogs += it.quantity * Number(cp || 0);
    }
    const grossProfit = periodRevenueForHealth - cogs;
    const profitMarginPercent = periodRevenueForHealth > 0 ? Number(((grossProfit / periodRevenueForHealth) * 100).toFixed(2)) : 0;
    const operatingCostMonthly = Number(process.env.OPERATING_COST_MONTHLY || '0') || 0;
    const periodMonths = period === 'month' ? 1 : period === 'quarter' ? 3 : period === 'year' ? 12 : period === 'week' ? 1 / 4.33 : period === 'today' ? 1 / 30 : 0;
    const operatingCostProrated = periodMonths > 0 ? operatingCostMonthly * periodMonths : (dateFilter.createdAt ? (operatingCostMonthly * 1) : 0);
    const cashFlowInflow = periodRevenueForHealth;
    const cashFlowOutflow = Number(totalRefunds._sum.totalAmount || 0) + totalChargebacks + operatingCostProrated;
    const cashFlow = { inflow: Number(cashFlowInflow.toFixed(2)), outflow: Number(cashFlowOutflow.toFixed(2)), net: Number((cashFlowInflow - cashFlowOutflow).toFixed(2)) };
    const avgOrderVal = paidOrders > 0 ? periodRevenueForHealth / paidOrders : 0;
    const marginPerOrder = profitMarginPercent / 100 * avgOrderVal;
    const breakevenOrders = marginPerOrder > 0 && operatingCostProrated > 0 ? Math.ceil(operatingCostProrated / marginPerOrder) : null;
    const rangeStart = dateFilter.createdAt?.gte ? (dateFilter.createdAt.gte instanceof Date ? dateFilter.createdAt.gte : new Date(dateFilter.createdAt.gte as string)) : null;
    const rangeEnd = dateFilter.createdAt?.lte ? (dateFilter.createdAt.lte instanceof Date ? dateFilter.createdAt.lte : new Date(dateFilter.createdAt.lte as string)) : null;
    let totalCampaignSpend = 0;
    for (const c of (campaignsWithSpend as { spend: unknown; startAt: Date; endAt: Date | null }[])) {
      const start = c.startAt instanceof Date ? c.startAt : new Date(c.startAt);
      const end = (c.endAt ? new Date(c.endAt) : new Date(start.getTime() + 30 * 864e5));
      if (!rangeStart || !rangeEnd || (start <= rangeEnd && end >= rangeStart)) totalCampaignSpend += Number(c.spend || 0);
    }
    const newC = (newCustomersThisPeriod as number) || 0;
    const cpa = newC > 0 && totalCampaignSpend > 0 ? Number((totalCampaignSpend / newC).toFixed(2)) : null;
    const financialHealth = {
      profitMarginPercent: Number(profitMarginPercent.toFixed(2)),
      cogs: Number(cogs.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      operatingCostMonthly,
      operatingCostProrated: Number(operatingCostProrated.toFixed(2)),
      cashFlow,
      breakevenOrders,
      cpa,
      ltvToCpa: null as number | null, // set after clv is computed
    };

    const barberServiceEarningsMap = new Map<string, { serviceName: string; revenue: number }[]>();
    const barberHoursMap = new Map<string, number>();
    const barberPeakHourMap = new Map<string, { hour: number; count: number }[]>();
    for (const b of (barberBookingsForMetrics as { barberId: string; service: { name: string }; totalPrice: unknown; durationMinutes: number; bookingTime: Date }[])) {
      const bid = b.barberId;
      let arr = barberServiceEarningsMap.get(bid);
      if (!arr) { arr = []; barberServiceEarningsMap.set(bid, arr); }
      const name = b.service?.name || 'Unknown';
      const cur = arr.find((x) => x.serviceName === name);
      if (cur) cur.revenue += Number(b.totalPrice || 0); else arr.push({ serviceName: name, revenue: Number(b.totalPrice || 0) });
      barberHoursMap.set(bid, (barberHoursMap.get(bid) || 0) + (b.durationMinutes || 0) / 60);
      const h = (b.bookingTime instanceof Date ? b.bookingTime : new Date(b.bookingTime)).getHours();
      let ph = barberPeakHourMap.get(bid);
      if (!ph) { ph = []; barberPeakHourMap.set(bid, ph); }
      const eh = ph.find((x) => x.hour === h);
      if (eh) eh.count++; else ph.push({ hour: h, count: 1 });
    }
    const payoutsByBarberMap = new Map<string, { id: string; amount: number; periodStart: Date; periodEnd: Date; status: string; paidAt: Date | null }[]>();
    for (const p of (payoutsList as { id: string; barberId: string; amount: unknown; periodStart: Date; periodEnd: Date; status: string; paidAt: Date | null }[])) {
      const arr = payoutsByBarberMap.get(p.barberId) || [];
      arr.push({ id: p.id, amount: Number(p.amount), periodStart: p.periodStart, periodEnd: p.periodEnd, status: p.status, paidAt: p.paidAt });
      payoutsByBarberMap.set(p.barberId, arr);
    }

    // Seasonal patterns, demographics, service demand by location
    const [seasonalRevenueRows, customersForDemographics, bookingsForServiceDemand] = await Promise.all([
      prisma.$queryRaw<{ month: number; revenue: unknown; orders: unknown }[]>(Prisma.sql`SELECT EXTRACT(MONTH FROM created_at)::int AS month, COALESCE(SUM(total_amount),0)::float AS revenue, COUNT(*)::int AS orders FROM orders WHERE payment_status = 'PAID' GROUP BY EXTRACT(MONTH FROM created_at) ORDER BY 1`),
      prisma.customer.findMany({ select: { dateOfBirth: true, gender: true } }),
      prisma.booking.findMany({
        where: { paymentStatus: 'PAID', ...(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}) },
        include: { barber: { select: { city: true } }, service: { select: { name: true, category: true } } },
      }),
    ]);

    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const byMonthMap = new Map<number, { revenue: number; orders: number }>();
    for (const r of seasonalRevenueRows || []) {
      byMonthMap.set(r.month, { revenue: Number(r.revenue || 0), orders: Number(r.orders || 0) });
    }
    const seasonalRevenueByMonth = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const d = byMonthMap.get(m);
      return { month: m, label: MONTH_NAMES[i], revenue: d?.revenue ?? 0, orders: d?.orders ?? 0 };
    });

    const genderCounts: Record<string, number> = {};
    const ageBucketCounts: Record<string, number> = { '0–17': 0, '18–24': 0, '25–34': 0, '35–44': 0, '45+': 0 };
    const now = new Date();
    for (const c of customersForDemographics || []) {
      const g = (c.gender || 'Unknown').trim() || 'Unknown';
      genderCounts[g] = (genderCounts[g] ?? 0) + 1;
      if (c.dateOfBirth) {
        const age = (now.getTime() - new Date(c.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        if (age < 18) ageBucketCounts['0–17']++;
        else if (age < 25) ageBucketCounts['18–24']++;
        else if (age < 35) ageBucketCounts['25–34']++;
        else if (age < 45) ageBucketCounts['35–44']++;
        else ageBucketCounts['45+']++;
      }
    }
    const demographics = {
      gender: genderCounts,
      ageBuckets: Object.entries(ageBucketCounts).map(([bucket, count]) => ({ bucket, count })),
    };

    const cityServiceMap = new Map<string, Map<string, { category: string; bookings: number; revenue: number }>>();
    for (const b of (bookingsForServiceDemand || []) as { barber?: { city: string | null }; service?: { name: string; category: string }; totalPrice: unknown }[]) {
      const city = b.barber?.city?.trim() || 'Unknown';
      const name = b.service?.name || 'Unknown';
      const cat = b.service?.category || 'Unknown';
      const rev = Number(b.totalPrice || 0);
      let sm = cityServiceMap.get(city);
      if (!sm) { sm = new Map(); cityServiceMap.set(city, sm); }
      const cur = sm.get(name) ?? { category: cat, bookings: 0, revenue: 0 };
      cur.bookings += 1;
      cur.revenue += rev;
      sm.set(name, cur);
    }
    const serviceDemandByLocation = [...cityServiceMap.entries()]
      .map(([city, sm]) => ({
        city,
        services: [...sm.entries()].map(([name, v]) => ({ name, category: v.category, bookings: v.bookings, revenue: Number(v.revenue.toFixed(2)) })).sort((a, b) => b.bookings - a.bookings).slice(0, 10),
      }))
      .sort((a, b) => b.services.reduce((s, x) => s + x.bookings, 0) - a.services.reduce((s, x) => s + x.bookings, 0));

    // Partial payments, service completion time, peak times by location, cancellation by service, prior year same period
    const [
      partialPaymentsAgg,
      completedBookingsForServiceTime,
      bookingsForPeakByLocation,
      bookingsForCancellationByService,
      priorYearSamePeriodResult,
    ] = await Promise.all([
      prisma.order.aggregate({ where: { ...dateFilter, paymentStatus: 'PARTIALLY_PAID' }, _count: { id: true }, _sum: { totalAmount: true } }),
      prisma.booking.findMany({
        where: { status: 'COMPLETED', paymentStatus: 'PAID', completedAt: { not: null }, ...(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}) },
        select: { completedAt: true, bookingDate: true, bookingTime: true, durationMinutes: true },
      }),
      prisma.booking.findMany({
        where: { paymentStatus: 'PAID', ...(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}) },
        select: { bookingTime: true, barber: { select: { city: true } } },
      }),
      prisma.booking.findMany({
        where: dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {},
        include: { service: { select: { name: true } } },
      }),
      (async () => {
        if (startDate || endDate) return null;
        if (period === 'month') {
          const r = getDateRange('month');
          if (!r.start) return null;
          const y = r.start.getFullYear(), m = r.start.getMonth();
          const pyStart = new Date(y - 1, m, 1);
          const pyEnd = new Date(y - 1, m + 1, 0, 23, 59, 59, 999);
          const [rev, ord] = await Promise.all([
            prisma.order.aggregate({ where: { paymentStatus: 'PAID', createdAt: { gte: pyStart, lte: pyEnd }, ...extraOrderWhere }, _sum: { totalAmount: true } }),
            prisma.order.count({ where: { createdAt: { gte: pyStart, lte: pyEnd }, ...extraOrderWhere } }),
          ]);
          return { revenue: Number(rev._sum.totalAmount || 0), orders: ord };
        }
        if (period === 'quarter') {
          const r = getDateRange('quarter');
          if (!r.start) return null;
          const y = r.start.getFullYear(), m = r.start.getMonth();
          const pyStart = new Date(y - 1, m, 1);
          const pyEnd = new Date(y - 1, m + 3, 0, 23, 59, 59, 999);
          const [rev, ord] = await Promise.all([
            prisma.order.aggregate({ where: { paymentStatus: 'PAID', createdAt: { gte: pyStart, lte: pyEnd }, ...extraOrderWhere }, _sum: { totalAmount: true } }),
            prisma.order.count({ where: { createdAt: { gte: pyStart, lte: pyEnd }, ...extraOrderWhere } }),
          ]);
          return { revenue: Number(rev._sum.totalAmount || 0), orders: ord };
        }
        if (period === 'year') {
          const r = getDateRange('year');
          if (!r.start) return null;
          const pyStart = new Date(r.start.getFullYear() - 1, 0, 1);
          const pyEnd = new Date(r.start.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
          const [rev, ord] = await Promise.all([
            prisma.order.aggregate({ where: { paymentStatus: 'PAID', createdAt: { gte: pyStart, lte: pyEnd }, ...extraOrderWhere }, _sum: { totalAmount: true } }),
            prisma.order.count({ where: { createdAt: { gte: pyStart, lte: pyEnd }, ...extraOrderWhere } }),
          ]);
          return { revenue: Number(rev._sum.totalAmount || 0), orders: ord };
        }
        return null;
      })(),
    ]);

    const partialPayments = { count: partialPaymentsAgg._count.id, totalAmount: Number(partialPaymentsAgg._sum.totalAmount || 0) };

    let avgServiceCompletionMinutes: number | null = null;
    let avgScheduledDurationMinutes: number | null = null;
    if ((completedBookingsForServiceTime as any[]).length > 0) {
      const actualMinutes: number[] = [];
      let sumScheduled = 0;
      for (const b of completedBookingsForServiceTime as { completedAt: Date; bookingDate: Date; bookingTime: Date; durationMinutes: number }[]) {
        const bd = b.bookingDate instanceof Date ? b.bookingDate : new Date(b.bookingDate);
        const bt = b.bookingTime instanceof Date ? b.bookingTime : new Date(b.bookingTime);
        const start = new Date(bd.getFullYear(), bd.getMonth(), bd.getDate(), bt.getHours(), bt.getMinutes(), bt.getSeconds(), 0);
        const end = b.completedAt instanceof Date ? b.completedAt : new Date(b.completedAt);
        const mins = (end.getTime() - start.getTime()) / 60000;
        if (mins >= 0 && mins < 24 * 60) actualMinutes.push(mins);
        sumScheduled += b.durationMinutes || 0;
      }
      avgServiceCompletionMinutes = actualMinutes.length > 0 ? Number((actualMinutes.reduce((a, x) => a + x, 0) / actualMinutes.length).toFixed(1)) : null;
      avgScheduledDurationMinutes = (completedBookingsForServiceTime as any[]).length > 0 ? Number((sumScheduled / (completedBookingsForServiceTime as any[]).length).toFixed(1)) : null;
    }

    const cityHourMap = new Map<string, Map<number, number>>();
    for (const b of (bookingsForPeakByLocation || []) as { bookingTime: Date; barber?: { city: string | null } }[]) {
      const city = b.barber?.city?.trim() || 'Unknown';
      const hour = (b.bookingTime instanceof Date ? b.bookingTime : new Date(b.bookingTime)).getHours();
      let hm = cityHourMap.get(city);
      if (!hm) { hm = new Map(); cityHourMap.set(city, hm); }
      hm.set(hour, (hm.get(hour) ?? 0) + 1);
    }
    const hourLabels = (h: number) => h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
    const peakTimesByLocation = [...cityHourMap.entries()].map(([city, hm]) => ({
      city,
      hourly: Array.from({ length: 24 }, (_, h) => ({ hour: h, label: hourLabels(h), bookings: hm.get(h) ?? 0 })),
    })).sort((a, b) => b.hourly.reduce((s, x) => s + x.bookings, 0) - a.hourly.reduce((s, x) => s + x.bookings, 0));

    const svcMap = new Map<string, { total: number; cancelled: number }>();
    for (const b of (bookingsForCancellationByService || []) as { status: string; service?: { name: string } }[]) {
      const name = b.service?.name || 'Unknown';
      const cur = svcMap.get(name) ?? { total: 0, cancelled: 0 };
      cur.total++;
      if (b.status === 'CANCELLED') cur.cancelled++;
      svcMap.set(name, cur);
    }
    const cancellationByService = [...svcMap.entries()]
      .map(([serviceName, v]) => ({ serviceName, total: v.total, cancelled: v.cancelled, rate: v.total > 0 ? Number(((v.cancelled / v.total) * 100).toFixed(2)) : 0 }))
      .filter((x) => x.total >= 1)
      .sort((a, b) => b.cancelled - a.cancelled)
      .slice(0, 15);

    // Services completed per barber (§5.2) — completed paid bookings, same filters as orders
    const bookingWhere: any = { status: 'COMPLETED', paymentStatus: 'PAID' };
    if (dateFilter?.createdAt) bookingWhere.createdAt = dateFilter.createdAt;
    const bFilters: any[] = [];
    if (barberId) bFilters.push({ barberId });
    if (location) bFilters.push({ barber: { city: location } });
    if (category) bFilters.push({ service: { category } });
    if (service) bFilters.push({ service: { name: service } });
    if (bFilters.length) bookingWhere.AND = bFilters;
    const servicesCompletedByBarber = user.role === 'ADMIN'
      ? await prisma.booking.groupBy({
          by: ['barberId'],
          where: bookingWhere,
          _count: { id: true },
        })
      : [];
    const servicesCompletedMap = new Map<string, number>();
    for (const r of (servicesCompletedByBarber as { barberId: string; _count: { id: number } }[]) || []) {
      servicesCompletedMap.set(r.barberId, r._count.id);
    }

    // Calculate barber earnings with commission rates (Admin only)
    const barberEarningsDetails = user.role === 'ADMIN' 
      ? await Promise.all(
          (barberEarnings as any[]).map(async (item) => {
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
        const commissionRate = Number(barber.commissionRate ?? 0.35);
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
          servicesCompleted: servicesCompletedMap.get(barber.id) ?? 0,
        };
          })
        )
      : [];

    const validBarberEarnings = barberEarningsDetails.filter(Boolean) as any[];
    const totalBarberPayouts = user.role === 'ADMIN' 
      ? validBarberEarnings.reduce((sum, b) => sum + b.barberEarning, 0)
      : 0;
    const totalCompanyCommission = user.role === 'ADMIN'
      ? validBarberEarnings.reduce((sum, b) => sum + b.companyCommission, 0)
      : 0;

    // Calculate averages
    const avgOrderValue = paidOrders > 0 
      ? Number(totalRevenue._sum.totalAmount || 0) / paidOrders 
      : 0;

    // Filtered revenue for selected period
    const filteredRevenue = await prisma.order.aggregate({
      where: {
        ...orderWhere,
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
        createdAt: { gte: prevWeekStart, lt: prevWeekEnd },
        ...extraOrderWhere,
      },
      _sum: { totalAmount: true },
    });

    const weekGrowth = Number(prevWeekRevenue._sum.totalAmount || 0) > 0
      ? ((Number(weekRevenue._sum.totalAmount || 0) - Number(prevWeekRevenue._sum.totalAmount || 0)) / Number(prevWeekRevenue._sum.totalAmount || 0)) * 100
      : 0;

    // Prev month & prev year revenue (MoM, YoY)
    const monthRange = getDateRange('month');
    const prevMonthStart = new Date(monthRange.start!.getFullYear(), monthRange.start!.getMonth() - 1, 1);
    const prevMonthEnd = new Date(prevMonthStart.getFullYear(), prevMonthStart.getMonth() + 1, 0, 23, 59, 59, 999);
    const prevMonthRevenue = await prisma.order.aggregate({
      where: {
        paymentStatus: 'PAID',
        createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
        ...extraOrderWhere,
      },
      _sum: { totalAmount: true },
    });
    const yearRange = getDateRange('year');
    const prevYearStart = new Date(yearRange.start!.getFullYear() - 1, 0, 1);
    const prevYearEnd = new Date(prevYearStart.getFullYear(), 11, 31, 23, 59, 59, 999);
    const prevYearRevenue = await prisma.order.aggregate({
      where: {
        paymentStatus: 'PAID',
        createdAt: { gte: prevYearStart, lte: prevYearEnd },
        ...extraOrderWhere,
      },
      _sum: { totalAmount: true },
    });
    const monthRevenueVal = Number(monthRevenue._sum.totalAmount || 0);
    const yearRevenueVal = Number(yearRevenue._sum.totalAmount || 0);
    const prevMonthVal = Number(prevMonthRevenue._sum.totalAmount || 0);
    const prevYearVal = Number(prevYearRevenue._sum.totalAmount || 0);
    const momGrowth = prevMonthVal > 0 ? ((monthRevenueVal - prevMonthVal) / prevMonthVal) * 100 : 0;
    const yoyGrowth = prevYearVal > 0 ? ((yearRevenueVal - prevYearVal) / prevYearVal) * 100 : 0;

    // Order growth (prev week, prev month, prev year order counts)
    const prevWeekOrderCount = await prisma.order.count({
      where: {
        createdAt: { gte: prevWeekStart, lt: weekRange.start! },
        ...extraOrderWhere,
      },
    });
    const prevMonthOrderCount = await prisma.order.count({
      where: {
        createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
        ...extraOrderWhere,
      },
    });
    const prevYearOrderCount = await prisma.order.count({
      where: {
        createdAt: { gte: prevYearStart, lte: prevYearEnd },
        ...extraOrderWhere,
      },
    });
    const orderWeekGrowth = prevWeekOrderCount > 0 ? ((ordersThisWeek - prevWeekOrderCount) / prevWeekOrderCount) * 100 : 0;
    const orderMomGrowth = prevMonthOrderCount > 0 ? ((ordersThisMonth - prevMonthOrderCount) / prevMonthOrderCount) * 100 : 0;
    const orderYoyGrowth = prevYearOrderCount > 0 ? ((ordersThisYear - prevYearOrderCount) / prevYearOrderCount) * 100 : 0;

    // Quarter-over-quarter (QoQ)
    const quarterRange = getDateRange('quarter');
    const prevQuarterStart = new Date(quarterRange.start!.getFullYear(), quarterRange.start!.getMonth() - 3, 1);
    const prevQuarterEnd = new Date(prevQuarterStart.getFullYear(), prevQuarterStart.getMonth() + 3, 0, 23, 59, 59, 999);
    const [prevQuarterRevenue, prevQuarterOrderCount] = await Promise.all([
      prisma.order.aggregate({
        where: {
          paymentStatus: 'PAID',
          createdAt: { gte: prevQuarterStart, lte: prevQuarterEnd },
          ...extraOrderWhere,
        },
        _sum: { totalAmount: true },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: prevQuarterStart, lte: prevQuarterEnd },
          ...extraOrderWhere,
        },
      }),
    ]);
    const quarterRevenueVal = Number(quarterRevenue._sum.totalAmount || 0);
    const prevQuarterVal = Number(prevQuarterRevenue._sum.totalAmount || 0);
    const quarterGrowth = prevQuarterVal > 0 ? ((quarterRevenueVal - prevQuarterVal) / prevQuarterVal) * 100 : 0;
    const orderQuarterGrowth = prevQuarterOrderCount > 0 ? ((ordersThisQuarter - prevQuarterOrderCount) / prevQuarterOrderCount) * 100 : 0;

    // Day-over-day (today vs yesterday)
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);
    yesterdayEnd.setMilliseconds(-1);
    const [yesterdayRevenue, ordersToday, ordersYesterday] = await Promise.all([
      prisma.order.aggregate({
        where: {
          paymentStatus: 'PAID',
          createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
          ...extraOrderWhere,
        },
        _sum: { totalAmount: true },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: todayStart, lte: new Date() },
          ...extraOrderWhere,
        },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
          ...extraOrderWhere,
        },
      }),
    ]);
    const todayRevenueVal = Number(todayRevenue._sum.totalAmount || 0);
    const yesterdayRevenueVal = Number(yesterdayRevenue._sum.totalAmount || 0);
    const dodGrowth = yesterdayRevenueVal > 0 ? ((todayRevenueVal - yesterdayRevenueVal) / yesterdayRevenueVal) * 100 : 0;
    const orderDodGrowth = ordersYesterday > 0 ? ((ordersToday - ordersYesterday) / ordersYesterday) * 100 : 0;

    // Barber earnings growth vs prior period (§5.2)
    let prevBarberRevenueMap = new Map<string, number>();
    if (user.role === 'ADMIN' && period !== 'all') {
      let prevBarberWhere: { createdAt: { gte: Date; lte?: Date; lt?: Date } } | null = null;
      if (period === 'today') prevBarberWhere = { createdAt: { gte: yesterdayStart, lte: yesterdayEnd } };
      else if (period === 'week') prevBarberWhere = { createdAt: { gte: prevWeekStart, lt: weekRange.start! } };
      else if (period === 'month') prevBarberWhere = { createdAt: { gte: prevMonthStart, lte: prevMonthEnd } };
      else if (period === 'quarter') prevBarberWhere = { createdAt: { gte: prevQuarterStart, lte: prevQuarterEnd } };
      else if (period === 'year') prevBarberWhere = { createdAt: { gte: prevYearStart, lte: prevYearEnd } };
      if (prevBarberWhere) {
        const prevBarberRows = await prisma.order.groupBy({
          by: ['assignedBarberId'],
          where: { paymentStatus: 'PAID', assignedBarberId: { not: null }, ...prevBarberWhere, ...extraOrderWhere },
          _sum: { totalAmount: true },
        });
        for (const r of prevBarberRows as { assignedBarberId: string | null; _sum: { totalAmount: unknown } }[]) {
          if (r.assignedBarberId) prevBarberRevenueMap.set(r.assignedBarberId, Number(r._sum?.totalAmount || 0));
        }
      }
    }

    // Median AOV (paid orders, optionally filtered by period)
    const medianResult = dateFilter.createdAt
      ? await prisma.$queryRaw<[{ percentile_cont: number | null }]>(
          Prisma.sql`SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY total_amount) AS percentile_cont FROM orders WHERE payment_status = 'PAID' AND created_at >= ${dateFilter.createdAt.gte} AND created_at <= ${dateFilter.createdAt.lte}`
        )
      : await prisma.$queryRaw<[{ percentile_cont: number | null }]>(
          Prisma.sql`SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY total_amount) AS percentile_cont FROM orders WHERE payment_status = 'PAID'`
        );
    const medianOrderValue = Number(medianResult[0]?.percentile_cont ?? 0);

    // Average time to payment (PAID orders: avg seconds between createdAt and updatedAt)
    const avgTimeToPaymentResult = dateFilter.createdAt
      ? await prisma.$queryRaw<[{ avg_seconds: number | null }]>(
          Prisma.sql`SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) AS avg_seconds FROM orders WHERE payment_status = 'PAID' AND created_at >= ${dateFilter.createdAt.gte} AND created_at <= ${dateFilter.createdAt.lte}`
        )
      : await prisma.$queryRaw<[{ avg_seconds: number | null }]>(
          Prisma.sql`SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) AS avg_seconds FROM orders WHERE payment_status = 'PAID'`
        );
    const avgTimeToPaymentSeconds = Number(avgTimeToPaymentResult[0]?.avg_seconds ?? 0);

    // Average time to completion (COMPLETED orders: avg seconds between createdAt and updatedAt)
    const avgTimeToCompletionResult = dateFilter.createdAt
      ? await prisma.$queryRaw<[{ avg_seconds: number | null }]>(
          Prisma.sql`SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) AS avg_seconds FROM orders WHERE status = 'COMPLETED' AND created_at >= ${dateFilter.createdAt.gte} AND created_at <= ${dateFilter.createdAt.lte}`
        )
      : await prisma.$queryRaw<[{ avg_seconds: number | null }]>(
          Prisma.sql`SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) AS avg_seconds FROM orders WHERE status = 'COMPLETED'`
        );
    const avgTimeToCompletionSeconds = Number(avgTimeToCompletionResult[0]?.avg_seconds ?? 0);

    // Order completion / cancellation / refund rates
    const completedCount = (ordersByStatus as { status: string; _count: { id: number } }[]).find(
      (s) => s.status === 'COMPLETED'
    )?._count?.id ?? 0;
    const cancelledCount = (ordersByStatus as { status: string; _count: { id: number } }[]).find(
      (s) => s.status === 'CANCELLED'
    )?._count?.id ?? 0;
    const orderCompletionRate = totalOrders > 0 ? (completedCount / totalOrders) * 100 : 0;
    const orderCancellationRate = totalOrders > 0 ? (cancelledCount / totalOrders) * 100 : 0;
    const orderRefundRate = totalOrders > 0 ? (refundedOrders / totalOrders) * 100 : 0;

    // Refund rate (% of revenue refunded)
    const revenueForRefundRate = Number(filteredRevenue._sum.totalAmount || 0) || Number(totalRevenue._sum.totalAmount || 0);
    const refundRate = revenueForRefundRate > 0
      ? (Number(totalRefunds._sum.totalAmount || 0) / revenueForRefundRate) * 100
      : 0;

    // Aggregate top services by title (orders, quantity, revenue)
    type OrderItemRow = { title: string; quantity: number; orderId: string; totalPrice: { toNumber?: () => number } | number };
    const byTitle = new Map<string, { orders: Set<string>; quantity: number; revenue: number }>();
    for (const row of orderItemsForTopServices as OrderItemRow[]) {
      const cur = byTitle.get(row.title) ?? { orders: new Set<string>(), quantity: 0, revenue: 0 };
      cur.orders.add(row.orderId);
      cur.quantity += row.quantity;
      const raw = row.totalPrice;
      const price = typeof raw === 'number' ? raw : (raw != null && typeof (raw as any).toNumber === 'function' ? (raw as any).toNumber() : Number(raw || 0));
      cur.revenue += Number.isNaN(price) ? 0 : price;
      byTitle.set(row.title, cur);
    }
    const topServices = [...byTitle.entries()]
      .map(([title, v]) => ({
        title,
        orders: v.orders.size,
        quantity: v.quantity,
        revenue: Math.round(v.revenue * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const leastOrderedServices = [...byTitle.entries()]
      .map(([title, v]) => ({
        title,
        orders: v.orders.size,
        quantity: v.quantity,
        revenue: Math.round(v.revenue * 100) / 100,
      }))
      .sort((a, b) => a.revenue - b.revenue)
      .slice(0, 10);

    // Customers per city (distinct customers with paid orders per location)
    const ordersForCityCustomers = await prisma.order.findMany({
      where: { ...orderWhere, paymentStatus: 'PAID', customerId: { not: null } },
      select: { city: true, customerId: true },
    });
    const cityCustomerMap = new Map<string, Set<string>>();
    for (const o of ordersForCityCustomers as { city: string; customerId: string }[]) {
      let s = cityCustomerMap.get(o.city);
      if (!s) { s = new Set(); cityCustomerMap.set(o.city, s); }
      s.add(o.customerId);
    }
    const revenueByLocationList = (revenueByLocation as unknown as { city: string; _sum: { totalAmount: number | null }; _count: { id: number } }[]).map(
      (r) => ({
        city: r.city,
        revenue: Number(r._sum?.totalAmount ?? 0),
        orders: r._count.id,
        customers: cityCustomerMap.get(r.city)?.size ?? 0,
      })
    );

    // §10 Branch utilization & profitability: barbers per city, orders per barber, company commission per city
    const [barbersPerCityRows, barberIdToCityRows] = await Promise.all([
      prisma.barber.groupBy({
        by: ['city'],
        where: { city: { not: null } },
        _count: { id: true },
      }),
      prisma.barber.findMany({ select: { id: true, city: true } }),
    ]);
    const barbersPerCityMap = new Map<string, number>();
    for (const row of barbersPerCityRows) {
      const city = (row.city || '').trim() || 'Unknown';
      barbersPerCityMap.set(city, row._count.id);
    }
    const barberIdToCityMap = new Map<string, string>();
    for (const b of barberIdToCityRows) {
      const city = (b.city || '').trim() || 'Unknown';
      barberIdToCityMap.set(b.id, city);
    }
    const cityCommissionMap = new Map<string, number>();
    if (user.role === 'ADMIN') {
      for (const be of validBarberEarnings as { barberId: string; companyCommission: number }[]) {
        const city = barberIdToCityMap.get(be.barberId) || 'Unknown';
        cityCommissionMap.set(city, (cityCommissionMap.get(city) ?? 0) + be.companyCommission);
      }
    }
    const branchUtilization = revenueByLocationList.map((r) => {
      const barbersCount = barbersPerCityMap.get(r.city) ?? 0;
      const utilization = barbersCount > 0 ? Number((r.orders / barbersCount).toFixed(2)) : null;
      return { city: r.city, orders: r.orders, barbersCount, utilization, revenue: r.revenue, customers: r.customers };
    });
    const branchProfitability = revenueByLocationList.map((r) => ({
      city: r.city,
      revenue: r.revenue,
      companyCommission: user.role === 'ADMIN' ? (cityCommissionMap.get(r.city) ?? 0) : null,
      orders: r.orders,
      customers: r.customers,
    }));

    // Service category analytics (from bookings)
    const serviceCategoryMap = new Map<string, { revenue: number; orders: number }>();
    for (const booking of bookingsForCategories as any[]) {
      const category = booking.service?.category || 'Unknown';
      const existing = serviceCategoryMap.get(category) || { revenue: 0, orders: 0 };
      existing.revenue += Number(booking.totalPrice || 0);
      existing.orders += 1;
      serviceCategoryMap.set(category, existing);
    }
    const serviceCategories = Array.from(serviceCategoryMap.entries())
      .map(([category, data]) => ({
        category,
        revenue: Number(data.revenue.toFixed(2)),
        orders: data.orders,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Product category analytics (from order items); §4.3 add cogs and margin
    const productCategoryMap = new Map<string, { revenue: number; cogs: number; orders: Set<string>; quantity: number }>();
    for (const item of orderItemsForProductCategories as any[]) {
      const category = item.product?.category || 'Unknown';
      const existing = productCategoryMap.get(category) || { revenue: 0, cogs: 0, orders: new Set<string>(), quantity: 0 };
      const qty = item.quantity || 1;
      existing.revenue += Number(item.totalPrice || 0);
      existing.cogs += qty * Number((item.product as any)?.costPrice ?? 0);
      existing.orders.add(item.orderId);
      existing.quantity += qty;
      productCategoryMap.set(category, existing);
    }
    const productCategories = Array.from(productCategoryMap.entries())
      .map(([category, data]) => {
        const revenue = Number(data.revenue.toFixed(2));
        const cogs = Number(data.cogs.toFixed(2));
        const marginPercent = revenue > 0 ? Number((((revenue - cogs) / revenue) * 100).toFixed(1)) : null;
        return {
          category,
          revenue,
          cogs,
          marginPercent,
          orders: data.orders.size,
          quantity: data.quantity,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    // Most / least sold products (by productId)
    type ProductItemRow = { productId: string; title: string; quantity: number; orderId: string; totalPrice: { toNumber?: () => number } | number };
    const byProduct = new Map<string, { title: string; orders: Set<string>; quantity: number; revenue: number }>();
    for (const row of (orderItemsForTopProducts as ProductItemRow[])) {
      const cur = byProduct.get(row.productId) ?? { title: row.title, orders: new Set<string>(), quantity: 0, revenue: 0 };
      cur.title = row.title;
      cur.orders.add(row.orderId);
      cur.quantity += row.quantity;
      const raw = row.totalPrice;
      const price = typeof raw === 'number' ? raw : (raw != null && typeof (raw as any).toNumber === 'function' ? (raw as any).toNumber() : Number(raw || 0));
      cur.revenue += Number.isNaN(price) ? 0 : price;
      byProduct.set(row.productId, cur);
    }
    const mostSoldProducts = Array.from(byProduct.entries())
      .map(([productId, v]) => ({
        productId,
        title: v.title,
        orders: v.orders.size,
        quantity: v.quantity,
        revenue: Math.round(v.revenue * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    const leastSoldProducts = Array.from(byProduct.entries())
      .map(([productId, v]) => ({
        productId,
        title: v.title,
        orders: v.orders.size,
        quantity: v.quantity,
        revenue: Math.round(v.revenue * 100) / 100,
      }))
      .sort((a, b) => a.revenue - b.revenue)
      .slice(0, 10);

    // Peak booking times (hourly, daily, monthly)
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hourlyMap = new Map<number, number>();
    const dailyMap = new Map<number, number>();
    const monthlyMap = new Map<number, number>();
    for (let h = 0; h < 24; h++) hourlyMap.set(h, 0);
    for (let d = 0; d < 7; d++) dailyMap.set(d, 0);
    for (let m = 1; m <= 12; m++) monthlyMap.set(m, 0);
    for (const b of (bookingsForPeakTimes as { bookingDate: Date; bookingTime: Date }[])) {
      const dt = b.bookingTime;
      const hour = dt instanceof Date ? dt.getHours() : 0;
      hourlyMap.set(hour, (hourlyMap.get(hour) ?? 0) + 1);
      const d = b.bookingDate;
      const dow = d instanceof Date ? d.getDay() : 0;
      dailyMap.set(dow, (dailyMap.get(dow) ?? 0) + 1);
      const month = d instanceof Date ? d.getMonth() + 1 : 1;
      monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + 1);
    }
    // Quarterly (seasons): Q1=Jan–Mar, Q2=Apr–Jun, Q3=Jul–Sep, Q4=Oct–Dec (§4.4)
    const quarterlyMap = [0, 1, 2, 3].map((q) => {
      const m1 = q * 3 + 1, m2 = q * 3 + 2, m3 = q * 3 + 3;
      return { quarter: q + 1, label: `Q${q + 1} (${MONTH_NAMES[m1 - 1]}–${MONTH_NAMES[m3 - 1]})`, bookings: (monthlyMap.get(m1) ?? 0) + (monthlyMap.get(m2) ?? 0) + (monthlyMap.get(m3) ?? 0) };
    });
    const peakBookingTimes = {
      hourly: Array.from({ length: 24 }, (_, h) => ({
        hour: h,
        label: h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`,
        bookings: hourlyMap.get(h) ?? 0,
      })),
      daily: Array.from({ length: 7 }, (_, d) => ({
        day: d,
        label: DAY_NAMES[d],
        bookings: dailyMap.get(d) ?? 0,
      })),
      monthly: Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        return { month: m, label: MONTH_NAMES[i], bookings: monthlyMap.get(m) ?? 0 };
      }),
      quarterly: quarterlyMap,
    };

    // Booking heatmap: hour (0–23) x day of week (0–6)
    const heatmapMatrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const b of (bookingsForPeakTimes as { bookingDate: Date; bookingTime: Date }[])) {
      const d = b.bookingDate;
      const t = b.bookingTime;
      const dow = d instanceof Date ? d.getDay() : 0;
      const hour = t instanceof Date ? t.getHours() : 0;
      heatmapMatrix[dow][hour] = (heatmapMatrix[dow]?.[hour] ?? 0) + 1;
    }
    const bookingHeatmap = {
      dayLabels: DAY_NAMES,
      hourLabels: Array.from({ length: 24 }, (_, h) =>
        h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`
      ),
      values: heatmapMatrix,
    };

    // Revenue projections/forecasts: 3‑month average for next 1 and 3 months
    const last3 = (monthlyRevenue as { revenue: number }[]).slice(-3).map((m) => m.revenue || 0);
    const avg3 = last3.length > 0 ? last3.reduce((a, b) => a + b, 0) / last3.length : 0;
    const revenueForecast = {
      nextMonth: Number((avg3).toFixed(2)),
      nextThreeMonths: Number((avg3 * 3).toFixed(2)),
      method: '3-month average',
    };

    // §11.2 Anomaly detection: flag days where revenue > mean + 2*std or < mean - 2*std (last 30 days)
    const trendRevenues = (revenueTrend as { date: string; revenue: number }[]).map((d) => d.revenue).filter((v) => typeof v === 'number');
    const meanRev = trendRevenues.length > 0 ? trendRevenues.reduce((a, b) => a + b, 0) / trendRevenues.length : 0;
    const variance = trendRevenues.length > 0 ? trendRevenues.reduce((a, v) => a + (v - meanRev) ** 2, 0) / trendRevenues.length : 0;
    const stdRev = Math.sqrt(variance);
    const anomalyThresholdHigh = meanRev + 2 * stdRev;
    const anomalyThresholdLow = Math.max(0, meanRev - 2 * stdRev);
    const anomalyDays = (revenueTrend as { date: string; revenue: number }[])
      .filter((d) => d.revenue > anomalyThresholdHigh || d.revenue < anomalyThresholdLow)
      .map((d) => ({ date: d.date, revenue: d.revenue, type: d.revenue > anomalyThresholdHigh ? 'high' : 'low' }));
    const anomalyDetection = {
      mean: Number(meanRev.toFixed(2)),
      stdDev: Number(stdRev.toFixed(2)),
      thresholdHigh: Number(anomalyThresholdHigh.toFixed(2)),
      thresholdLow: Number(anomalyThresholdLow.toFixed(2)),
      anomalyDays: anomalyDays.slice(-10),
    };

    // Service vs product revenue breakdown
    let serviceRevenue = 0;
    for (const b of bookingsForCategories as any[]) {
      serviceRevenue += Number(b.totalPrice || 0);
    }
    let productRevenue = 0;
    for (const item of orderItemsForProductCategories as any[]) {
      productRevenue += Number(item.totalPrice || 0);
    }
    const serviceVsProductTotal = serviceRevenue + productRevenue;
    const serviceVsProductRevenue = {
      serviceRevenue: Number(serviceRevenue.toFixed(2)),
      productRevenue: Number(productRevenue.toFixed(2)),
      total: Number(serviceVsProductTotal.toFixed(2)),
      servicePercent: serviceVsProductTotal > 0 ? Number(((serviceRevenue / serviceVsProductTotal) * 100).toFixed(1)) : 0,
      productPercent: serviceVsProductTotal > 0 ? Number(((productRevenue / serviceVsProductTotal) * 100).toFixed(1)) : 0,
    };

    // Revenue per visit (total revenue / paid bookings in period; "visit" = booking)
    const paidBookingsCount = (bookingsForCategories as any[]).length;
    const revenuePerVisit = paidBookingsCount > 0
      ? Number((Number(filteredRevenue._sum.totalAmount || 0) / paidBookingsCount).toFixed(2))
      : 0;

    // Weekend vs weekday (revenue and orders; 0=Sun, 6=Sat)
    type WeekendRow = { period: string; revenue: string; orders: bigint };
    const weekendWeekdayRows = dateFilter.createdAt
      ? await prisma.$queryRaw<WeekendRow[]>(Prisma.sql`
        SELECT
          CASE WHEN EXTRACT(DOW FROM created_at) IN (0, 6) THEN 'weekend' ELSE 'weekday' END AS period,
          COALESCE(SUM(total_amount), 0)::text AS revenue,
          COUNT(*) AS orders
        FROM orders
        WHERE payment_status = 'PAID' AND created_at >= ${dateFilter.createdAt.gte} AND created_at <= ${dateFilter.createdAt.lte}
        GROUP BY 1
      `)
      : await prisma.$queryRaw<WeekendRow[]>(Prisma.sql`
        SELECT
          CASE WHEN EXTRACT(DOW FROM created_at) IN (0, 6) THEN 'weekend' ELSE 'weekday' END AS period,
          COALESCE(SUM(total_amount), 0)::text AS revenue,
          COUNT(*) AS orders
        FROM orders
        WHERE payment_status = 'PAID'
        GROUP BY 1
      `);
    const weekendRow = weekendWeekdayRows.find((r) => r.period === 'weekend');
    const weekdayRow = weekendWeekdayRows.find((r) => r.period === 'weekday');
    const weekendWeekday = {
      weekend: { revenue: Number(weekendRow?.revenue ?? 0), orders: Number(weekendRow?.orders ?? 0) },
      weekday: { revenue: Number(weekdayRow?.revenue ?? 0), orders: Number(weekdayRow?.orders ?? 0) },
    };

    // Holiday impact (§11) and Location-specific trends over time (§10)
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const [revenueByDayRows, revenueByCityMonthRows, productRevenueByMonthRows] = await Promise.all([
      prisma.$queryRaw<{ d: Date | string; revenue: unknown }[]>(Prisma.sql`SELECT DATE(created_at) as d, COALESCE(SUM(total_amount),0)::float as revenue FROM orders WHERE payment_status = 'PAID' AND created_at >= ${twelveMonthsAgo} GROUP BY DATE(created_at)`),
      prisma.$queryRaw<{ city: string; y: number; m: number; revenue: unknown }[]>(Prisma.sql`SELECT city, EXTRACT(YEAR FROM created_at)::int as y, EXTRACT(MONTH FROM created_at)::int as m, COALESCE(SUM(total_amount),0)::float as revenue FROM orders WHERE payment_status = 'PAID' AND created_at >= ${twelveMonthsAgo} AND city IS NOT NULL AND TRIM(city) != '' GROUP BY city, EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at) ORDER BY city, y, m`),
      prisma.$queryRaw<{ y: number; m: number; revenue: unknown }[]>(Prisma.sql`SELECT EXTRACT(YEAR FROM o.created_at)::int as y, EXTRACT(MONTH FROM o.created_at)::int as m, COALESCE(SUM(oi.total_price),0)::float as revenue FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.payment_status = 'PAID' AND o.created_at >= ${twelveMonthsAgo} GROUP BY EXTRACT(YEAR FROM o.created_at), EXTRACT(MONTH FROM o.created_at) ORDER BY y, m`),
    ]);
    const dayMap = new Map<string, number>();
    for (const r of revenueByDayRows || []) {
      const k = typeof r.d === 'string' ? r.d.slice(0, 10) : (r.d instanceof Date ? r.d.toISOString().split('T')[0] : String(r.d).slice(0, 10));
      dayMap.set(k, Number(r.revenue || 0));
    }
    const NIGERIAN_HOLIDAYS: { date: string; name: string }[] = [
      '2024-01-01', '2024-03-29', '2024-04-01', '2024-05-01', '2024-06-12', '2024-06-17', '2024-10-01', '2024-12-25',
      '2025-01-01', '2025-04-18', '2025-04-21', '2025-05-01', '2025-06-12', '2025-06-07', '2025-10-01', '2025-12-25',
    ].map((d) => ({
      date: d,
      name: { '01-01': "New Year's Day", '03-29': 'Good Friday', '04-01': 'Easter Monday', '04-18': 'Good Friday', '04-21': 'Easter Monday', '05-01': "Workers' Day", '06-07': 'Eid ul-Adha', '06-12': 'Democracy Day', '06-17': 'Eid ul-Adha', '10-01': 'Independence Day', '12-25': 'Christmas' }[d.slice(5)] || 'Public Holiday',
    }));
    const holidayDays: { date: string; name: string; revenue: number; avgDailyInMonth: number; impactPercent: number }[] = [];
    let totalHolidayRevenue = 0;
    for (const h of NIGERIAN_HOLIDAYS) {
      const hDate = new Date(h.date + 'T12:00:00Z');
      if (hDate < twelveMonthsAgo) continue;
      const rev = dayMap.get(h.date) ?? 0;
      totalHolidayRevenue += rev;
      const [y, m] = h.date.split('-').map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();
      let monthSum = 0;
      for (let day = 1; day <= daysInMonth; day++) {
        const k = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        monthSum += dayMap.get(k) ?? 0;
      }
      const avgDailyInMonth = daysInMonth > 0 ? monthSum / daysInMonth : 0;
      const impactPercent = avgDailyInMonth > 0 ? Number((((rev - avgDailyInMonth) / avgDailyInMonth) * 100).toFixed(2)) : (rev > 0 ? 100 : 0);
      holidayDays.push({ date: h.date, name: h.name, revenue: Number(rev.toFixed(2)), avgDailyInMonth: Number(avgDailyInMonth.toFixed(2)), impactPercent });
    }
    const holidayImpact = { holidayDays, totalHolidayRevenue: Number(totalHolidayRevenue.toFixed(2)) };

    const cityMonthMap = new Map<string, { year: number; month: number; label: string; revenue: number }[]>();
    const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    for (const r of revenueByCityMonthRows || []) {
      const arr = cityMonthMap.get(r.city) ?? [];
      arr.push({ year: r.y, month: r.m, label: `${MONTH_LABELS[r.m - 1]} ${r.y}`, revenue: Number(r.revenue || 0) });
      cityMonthMap.set(r.city, arr);
    }
    const revenueByLocationOverTime = [...cityMonthMap.entries()]
      .map(([city, monthly]) => ({ city, monthly: monthly.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month) }))
      .sort((a, b) => b.monthly.reduce((s, x) => s + x.revenue, 0) - a.monthly.reduce((s, x) => s + x.revenue, 0));

    // Product seasonality (§4.3) — product revenue by month, last 12 months
    const productRevByMonthMap = new Map<string, number>();
    for (const r of productRevenueByMonthRows || []) {
      productRevByMonthMap.set(`${r.y}-${r.m}`, Number(r.revenue || 0));
    }
    const productRevenueByMonth: { month: number; label: string; revenue: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear(), m = d.getMonth() + 1;
      productRevenueByMonth.push({
        month: m,
        label: `${MONTH_LABELS[m - 1]} ${y}`,
        revenue: productRevByMonthMap.get(`${y}-${m}`) ?? 0,
      });
    }

    // Customer metrics: growth, retention, churn, active/inactive, ARPU
    const prevMonthCustomerCount = await prisma.customer.count({
      where: {
        createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
      },
    });
    const customerGrowthRate = prevMonthCustomerCount > 0
      ? ((newCustomersThisPeriod as number - prevMonthCustomerCount) / prevMonthCustomerCount) * 100
      : 0;

    // Active vs inactive customers (active = has paid order in last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const activeCustomers = await prisma.customer.count({
      where: {
        bookings: {
          some: {
            createdAt: { gte: ninetyDaysAgo },
            paymentStatus: 'PAID',
          },
        },
      },
    });
    const inactiveCustomers = (totalCustomers as number) - activeCustomers;

    // ARPU (Average Revenue Per User) - total revenue / total customers
    const arpu = (totalCustomers as number) > 0
      ? Number(totalRevenue._sum.totalAmount || 0) / (totalCustomers as number)
      : 0;

    // Customer retention rate (customers with orders in both current and previous month)
    const prevMonthStartForRetention = new Date(monthRange.start!);
    prevMonthStartForRetention.setMonth(prevMonthStartForRetention.getMonth() - 1);
    const prevMonthEndForRetention = new Date(monthRange.start!);
    prevMonthEndForRetention.setMilliseconds(-1);
    const customersWithOrdersThisMonth = await prisma.customer.count({
      where: {
        bookings: {
          some: {
            paymentStatus: 'PAID',
            createdAt: {
              gte: monthRange.start!,
              lte: monthRange.end!,
            },
          },
        },
      },
    });
    const customersWithOrdersPrevMonth = await prisma.customer.count({
      where: {
        bookings: {
          some: {
            paymentStatus: 'PAID',
            createdAt: {
              gte: prevMonthStartForRetention,
              lte: prevMonthEndForRetention,
            },
          },
        },
      },
    });
    const customersWithOrdersBothMonths = await prisma.customer.count({
      where: {
        bookings: {
          some: {
            paymentStatus: 'PAID',
            createdAt: {
              gte: prevMonthStartForRetention,
              lte: prevMonthEndForRetention,
            },
          },
        },
        AND: {
          bookings: {
            some: {
              paymentStatus: 'PAID',
              createdAt: {
                gte: monthRange.start!,
                lte: monthRange.end!,
              },
            },
          },
        },
      },
    });
    const retentionRate = customersWithOrdersPrevMonth > 0
      ? (customersWithOrdersBothMonths / customersWithOrdersPrevMonth) * 100
      : 0;

    // Customer churn rate (customers who had orders in prev month but not this month)
    const churnRate = customersWithOrdersPrevMonth > 0
      ? ((customersWithOrdersPrevMonth - customersWithOrdersBothMonths) / customersWithOrdersPrevMonth) * 100
      : 0;

    // CLV (Customer Lifetime Value): avg lifetime revenue per customer with ≥1 paid order
    const lifetimeCustomersWithOrders = await prisma.order.groupBy({
      by: ['customerId'],
      where: { paymentStatus: 'PAID', customerId: { not: null } },
      _sum: { totalAmount: true },
    });
    const lifetimeCustomerCount = lifetimeCustomersWithOrders.length;
    const clv = lifetimeCustomerCount > 0
      ? Number(totalRevenue._sum.totalAmount || 0) / lifetimeCustomerCount
      : 0;
    financialHealth.ltvToCpa = (cpa != null && cpa > 0 && clv > 0) ? Number((clv / cpa).toFixed(2)) : null;

    // Revenue by customer segment (new, returning, VIP) — only when period filter exists
    let revenueBySegment: { new: { revenue: number; count: number }; returning: { revenue: number; count: number }; vip: { revenue: number; count: number } } | null = null;
    if (dateFilter.createdAt) {
      const [ordersForSegments, firstOrderRows] = await Promise.all([
        prisma.order.findMany({
          where: { ...orderWhere, paymentStatus: 'PAID', customerId: { not: null } },
          select: { customerId: true, totalAmount: true, createdAt: true },
        }),
        prisma.order.groupBy({
          by: ['customerId'],
          where: { customerId: { not: null } },
          _min: { createdAt: true },
        }),
      ]);
      const firstOrderMap = new Map<string, Date>();
      for (const r of firstOrderRows) {
        if (r.customerId && r._min.createdAt) firstOrderMap.set(r.customerId, r._min.createdAt);
      }
      const rangeStart = dateFilter.createdAt.gte instanceof Date ? dateFilter.createdAt.gte : new Date(dateFilter.createdAt.gte);
      const rangeEnd = dateFilter.createdAt.lte instanceof Date ? dateFilter.createdAt.lte : new Date(dateFilter.createdAt.lte);
      let revenueNew = 0, revenueReturning = 0, countNew = 0, countReturning = 0;
      const customerRevenue = new Map<string, number>();
      const customerSegment = new Map<string, 'new' | 'returning'>();
      for (const o of ordersForSegments as { customerId: string | null; totalAmount: unknown; createdAt: Date }[]) {
        const cid = o.customerId!;
        const amt = Number(o.totalAmount ?? 0);
        customerRevenue.set(cid, (customerRevenue.get(cid) ?? 0) + amt);
        const first = firstOrderMap.get(cid);
        const isNew = first && first >= rangeStart && first <= rangeEnd;
        if (!customerSegment.has(cid)) {
          customerSegment.set(cid, isNew ? 'new' : 'returning');
          if (isNew) countNew++; else countReturning++;
        }
        if (isNew) revenueNew += amt; else revenueReturning += amt;
      }
      const byRevenue = [...customerRevenue.entries()].sort((a, b) => b[1] - a[1]);
      const vipCount = Math.max(1, Math.ceil(byRevenue.length * 0.1));
      const vipCustomers = new Set(byRevenue.slice(0, vipCount).map(([id]) => id));
      let revenueVip = 0;
      for (const [cid, rev] of customerRevenue) {
        if (vipCustomers.has(cid)) revenueVip += rev;
      }
      revenueBySegment = {
        new: { revenue: Math.round(revenueNew * 100) / 100, count: countNew },
        returning: { revenue: Math.round(revenueReturning * 100) / 100, count: countReturning },
        vip: { revenue: Math.round(revenueVip * 100) / 100, count: vipCount },
      };
    }

    // CLV by segment (when revenueBySegment exists): revenue / count per segment
    let clvBySegment: { new: number; returning: number; vip: number } | null = null;
    if (revenueBySegment) {
      clvBySegment = {
        new: (revenueBySegment.new?.count ?? 0) > 0 ? Number((revenueBySegment.new.revenue / revenueBySegment.new.count).toFixed(2)) : 0,
        returning: (revenueBySegment.returning?.count ?? 0) > 0 ? Number((revenueBySegment.returning.revenue / revenueBySegment.returning.count).toFixed(2)) : 0,
        vip: (revenueBySegment.vip?.count ?? 0) > 0 ? Number((revenueBySegment.vip.revenue / revenueBySegment.vip.count).toFixed(2)) : 0,
      };
    }

    // Cancellation rate per barber (same filters as barber earnings)
    const [ordersByBarberAll, ordersByBarberCancelled] = await Promise.all([
      prisma.order.groupBy({
        by: ['assignedBarberId'],
        where: { ...orderWhere, assignedBarberId: { not: null } },
        _count: { id: true },
      }),
      prisma.order.groupBy({
        by: ['assignedBarberId'],
        where: { ...orderWhere, assignedBarberId: { not: null }, status: 'CANCELLED' },
        _count: { id: true },
      }),
    ]);
    const barberTotalMap = new Map<string, number>();
    const barberCancelledMap = new Map<string, number>();
    for (const r of ordersByBarberAll as { assignedBarberId: string; _count: { id: number } }[]) {
      if (r.assignedBarberId) barberTotalMap.set(r.assignedBarberId, r._count.id);
    }
    for (const r of ordersByBarberCancelled as { assignedBarberId: string; _count: { id: number } }[]) {
      if (r.assignedBarberId) barberCancelledMap.set(r.assignedBarberId, r._count.id);
    }

    // Customer retention per barber: % of barber's customers with 2+ orders (same barber)
    const ordersForBarberRetention = await prisma.order.findMany({
      where: { ...orderWhere, assignedBarberId: { not: null }, customerId: { not: null }, paymentStatus: 'PAID' },
      select: { assignedBarberId: true, customerId: true },
    });
    const barberCustomerCounts = new Map<string, Map<string, number>>();
    for (const o of ordersForBarberRetention as { assignedBarberId: string; customerId: string }[]) {
      let cm = barberCustomerCounts.get(o.assignedBarberId!);
      if (!cm) { cm = new Map(); barberCustomerCounts.set(o.assignedBarberId!, cm); }
      cm.set(o.customerId, (cm.get(o.customerId) ?? 0) + 1);
    }
    const barberRetentionMap = new Map<string, number>();
    for (const [barberId, cm] of barberCustomerCounts) {
      const total = cm.size;
      const retained = [...cm.values()].filter((c) => c >= 2).length;
      barberRetentionMap.set(barberId, total > 0 ? Number(((retained / total) * 100).toFixed(2)) : 0);
    }

    // Average order value per customer, median revenue per customer (filtered)
    const distinctCustomersWithOrders = await prisma.order.groupBy({
      by: ['customerId'],
      where: { ...orderWhere, paymentStatus: 'PAID', customerId: { not: null } },
      _sum: { totalAmount: true },
    });
    const distinctCount = distinctCustomersWithOrders.length;
    const avgOrderValuePerCustomer = distinctCount > 0
      ? Number(filteredRevenue._sum.totalAmount || 0) / distinctCount
      : 0;
    const purchaseFrequency = distinctCount > 0 ? paidOrders / distinctCount : 0;
    const revenuesPerCustomer = (distinctCustomersWithOrders as { customerId: string; _sum: { totalAmount: unknown } }[])
      .map((r) => Number(r._sum?.totalAmount ?? 0))
      .filter((v) => v > 0);
    const sortedRevenues = [...revenuesPerCustomer].sort((a, b) => a - b);
    const mid = Math.floor(sortedRevenues.length / 2);
    const medianRevenuePerCustomer = sortedRevenues.length === 0
      ? 0
      : sortedRevenues.length % 2 === 1
        ? sortedRevenues[mid]
        : (sortedRevenues[mid - 1] + sortedRevenues[mid]) / 2;

    // Revenue from top 10% of customers (by revenue) — §1.2 Revenue per customer (top 10%)
    const sortedByRevenueDesc = [...revenuesPerCustomer].sort((a, b) => b - a);
    const top10Count = Math.max(1, Math.ceil(sortedByRevenueDesc.length * 0.1));
    const revenueTop10Percent = sortedByRevenueDesc.slice(0, top10Count).reduce((a, b) => a + b, 0);
    const filteredRev = Number(filteredRevenue._sum.totalAmount || 0);
    const revenueTop10PercentOfTotal = filteredRev > 0 ? (revenueTop10Percent / filteredRev) * 100 : 0;

    // Time between purchases (avg days between consecutive orders, customers with ≥2 orders)
    const ordersForGaps = await prisma.order.findMany({
      where: { ...orderWhere, paymentStatus: 'PAID', customerId: { not: null } },
      select: { customerId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const byCustomer = new Map<string, Date[]>();
    for (const o of ordersForGaps as { customerId: string; createdAt: Date }[]) {
      const arr = byCustomer.get(o.customerId) ?? [];
      arr.push(o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt));
      byCustomer.set(o.customerId, arr);
    }
    const allGapsDays: number[] = [];
    for (const dates of byCustomer.values()) {
      if (dates.length < 2) continue;
      dates.sort((a, b) => a.getTime() - b.getTime());
      for (let i = 1; i < dates.length; i++) {
        const days = (dates[i].getTime() - dates[i - 1].getTime()) / 864e5;
        allGapsDays.push(days);
      }
    }
    const avgTimeBetweenPurchasesDays = allGapsDays.length > 0
      ? allGapsDays.reduce((a, b) => a + b, 0) / allGapsDays.length
      : 0;

    // Customer acquisition trends: last 12 months, new customers per month
    const acquisitionTrends: { month: number; year: number; count: number; label: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const count = await prisma.customer.count({
        where: { createdAt: { gte: start, lte: end } },
      });
      acquisitionTrends.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        count,
        label: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getFullYear()}`,
      });
    }

    // §13 Predictive: customer growth forecast, demand forecast (3‑month average)
    const last3Customers = acquisitionTrends.slice(-3).map((c) => c.count);
    const last3Orders = (monthlyRevenue as { orders: number }[]).slice(-3).map((m) => m.orders ?? 0);
    const predictive = {
      customerGrowthForecast: last3Customers.length > 0 ? Math.round(last3Customers.reduce((a, b) => a + b, 0) / last3Customers.length) : 0,
      demandForecast: last3Orders.length > 0 ? Math.round(last3Orders.reduce((a, b) => a + b, 0) / last3Orders.length) : 0,
      method: '3-month average',
    };

    // Service popularity trends: this period vs previous period (when date filter exists)
    let topServicesWithTrends = topServices;
    if (dateFilter.createdAt) {
      const rangeStart = dateFilter.createdAt.gte instanceof Date ? dateFilter.createdAt.gte : new Date(dateFilter.createdAt.gte);
      const rangeEnd = dateFilter.createdAt.lte instanceof Date ? dateFilter.createdAt.lte : new Date(dateFilter.createdAt.lte);
      const rangeMs = rangeEnd.getTime() - rangeStart.getTime();
      const prevStart = new Date(rangeStart.getTime() - rangeMs);
      const prevEnd = new Date(rangeStart.getTime() - 1);
      const prevOrderItems = await prisma.orderItem.findMany({
        where: {
          order: {
            paymentStatus: 'PAID',
            createdAt: { gte: prevStart, lte: prevEnd },
            ...extraOrderWhere,
          },
        },
        select: { title: true, quantity: true, orderId: true, totalPrice: true },
      });
      const prevByTitle = new Map<string, { orders: Set<string>; revenue: number }>();
      for (const row of prevOrderItems as { title: string; orderId: string; totalPrice: unknown }[]) {
        const cur = prevByTitle.get(row.title) ?? { orders: new Set<string>(), revenue: 0 };
        cur.orders.add(row.orderId);
        const raw = row.totalPrice;
        const price = typeof raw === 'number' ? raw : (raw != null && typeof (raw as any).toNumber === 'function' ? (raw as any).toNumber() : Number(raw || 0));
        cur.revenue += Number.isNaN(price) ? 0 : price;
        prevByTitle.set(row.title, cur);
      }
      topServicesWithTrends = topServices.map((s: { title: string; orders: number; quantity: number; revenue: number }) => {
        const prev = prevByTitle.get(s.title) ?? { orders: new Set<string>(), revenue: 0 };
        const prevOrders = prev.orders.size;
        const ordersGrowth = prevOrders > 0 ? (((s.orders - prevOrders) / prevOrders) * 100) : (s.orders > 0 ? 100 : 0);
        const revenueGrowth = prev.revenue > 0 ? (((s.revenue - prev.revenue) / prev.revenue) * 100) : (s.revenue > 0 ? 100 : 0);
        return {
          ...s,
          ordersPrev: prevOrders,
          revenuePrev: Math.round(prev.revenue * 100) / 100,
          ordersGrowth: Number(ordersGrowth.toFixed(2)),
          revenueGrowth: Number(revenueGrowth.toFixed(2)),
        };
      });
    }

    // Preferred payment methods: distribution of "most used" method per customer (paid orders in period)
    const ordersForPreferred = await prisma.order.findMany({
      where: { ...orderWhere, paymentStatus: 'PAID', customerId: { not: null }, paymentMethod: { not: null } },
      select: { customerId: true, paymentMethod: true },
    });
    const customerMethodCount = new Map<string, Map<string, number>>();
    for (const o of ordersForPreferred as { customerId: string; paymentMethod: string }[]) {
      let m = customerMethodCount.get(o.customerId!);
      if (!m) { m = new Map(); customerMethodCount.set(o.customerId, m); }
      m.set(o.paymentMethod!, (m.get(o.paymentMethod!) ?? 0) + 1);
    }
    const preferredCount = new Map<string, number>();
    for (const m of customerMethodCount.values()) {
      let best = '';
      let max = 0;
      for (const [method, count] of m) {
        if (count > max) { max = count; best = method; }
      }
      if (best) preferredCount.set(best, (preferredCount.get(best) ?? 0) + 1);
    }
    const totalWithPreference = [...preferredCount.values()].reduce((a, b) => a + b, 0);
    const preferredPaymentMethods = [...preferredCount.entries()]
      .map(([method, customerCount]) => ({
        method,
        customerCount,
        percentage: totalWithPreference > 0 ? Number(((customerCount / totalWithPreference) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.customerCount - a.customerCount);

    // Overall no-show rate, lead time, same-day bookings, cancellation by time before (bookings in period)
    let bookingNoShowRate: number | null = null;
    let bookingNoShowCount = 0;
    let bookingTotal = 0;
    let avgBookingLeadTimeDays: number | null = null;
    let sameDayBookingsCount: number | null = null;
    let cancellationByTimeBefore: { sameDay: number; oneToSevenDays: number; sevenPlusDays: number; total: number } | null = null;
    if (dateFilter.createdAt) {
      const [total, noShow, bookingsForLeadTime] = await Promise.all([
        prisma.booking.count({ where: { createdAt: dateFilter.createdAt } }),
        prisma.booking.count({ where: { createdAt: dateFilter.createdAt, status: 'NO_SHOW' } }),
        prisma.booking.findMany({
          where: { createdAt: dateFilter.createdAt },
          select: { createdAt: true, bookingDate: true, bookingTime: true, status: true, cancelledAt: true },
        }),
      ]);
      bookingTotal = total;
      bookingNoShowCount = noShow;
      bookingNoShowRate = total > 0 ? Number(((noShow / total) * 100).toFixed(2)) : 0;

      const leads: number[] = [];
      let sameDay = 0;
      const cancelBuckets = { sameDay: 0, oneToSevenDays: 0, sevenPlusDays: 0 };
      for (const b of bookingsForLeadTime as { createdAt: Date; bookingDate: Date; bookingTime: Date; status: string; cancelledAt: Date | null }[]) {
        const created = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        const bd = b.bookingDate instanceof Date ? b.bookingDate : new Date(b.bookingDate);
        const bt = b.bookingTime instanceof Date ? b.bookingTime : new Date(b.bookingTime);
        const scheduled = new Date(bd);
        scheduled.setHours(bt.getHours(), bt.getMinutes(), bt.getSeconds(), 0);
        const leadMs = scheduled.getTime() - created.getTime();
        const leadDays = leadMs / (1000 * 60 * 60 * 24);
        if (leadDays >= 0) leads.push(leadDays);
        const createdDate = new Date(created.getFullYear(), created.getMonth(), created.getDate()).getTime();
        const bookDate = new Date(bd.getFullYear(), bd.getMonth(), bd.getDate()).getTime();
        if (createdDate === bookDate) sameDay++;

        if (b.status === 'CANCELLED' && b.cancelledAt) {
          const cancelled = b.cancelledAt instanceof Date ? b.cancelledAt : new Date(b.cancelledAt);
          const daysBefore = (scheduled.getTime() - cancelled.getTime()) / (1000 * 60 * 60 * 24);
          if (daysBefore < 0) continue;
          if (daysBefore < 1) cancelBuckets.sameDay++;
          else if (daysBefore <= 7) cancelBuckets.oneToSevenDays++;
          else cancelBuckets.sevenPlusDays++;
        }
      }
      avgBookingLeadTimeDays = leads.length > 0 ? Number((leads.reduce((a, x) => a + x, 0) / leads.length).toFixed(2)) : null;
      sameDayBookingsCount = sameDay;
      const cancelTotal = cancelBuckets.sameDay + cancelBuckets.oneToSevenDays + cancelBuckets.sevenPlusDays;
      cancellationByTimeBefore = cancelTotal > 0
        ? { ...cancelBuckets, total: cancelTotal }
        : { sameDay: 0, oneToSevenDays: 0, sevenPlusDays: 0, total: 0 };
    }

    return NextResponse.json({
      success: true,
      data: {
        // KPI Cards
        kpis: {
          totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
          todayRevenue: Number(todayRevenue._sum.totalAmount || 0),
          weekRevenue: Number(weekRevenue._sum.totalAmount || 0),
          monthRevenue: Number(monthRevenue._sum.totalAmount || 0),
          quarterRevenue: Number(quarterRevenue._sum.totalAmount || 0),
          yearRevenue: Number(yearRevenue._sum.totalAmount || 0),
          weekGrowth: Number(weekGrowth.toFixed(2)),
          momGrowth: Number(momGrowth.toFixed(2)),
          yoyGrowth: Number(yoyGrowth.toFixed(2)),
          quarterGrowth: Number(quarterGrowth.toFixed(2)),
          dodGrowth: Number(dodGrowth.toFixed(2)),
          filteredRevenue: Number(filteredRevenue._sum.totalAmount || 0),
          avgOrderValue: Number(avgOrderValue.toFixed(2)),
          medianOrderValue,
          netProfit: Number(totalRevenue._sum?.totalAmount ?? 0) - Number(totalRefunds._sum?.totalAmount ?? 0),
          refundRate: Number(refundRate.toFixed(2)),
          revenuePerVisit,
        },

        // Order Stats
        orders: {
          total: totalOrders,
          thisWeek: ordersThisWeek,
          thisMonth: ordersThisMonth,
          thisYear: ordersThisYear,
          paid: paidOrders,
          pending: pendingOrders,
          refunded: refundedOrders,
          failed: failedOrders,
          completed: completedCount,
          cancelled: cancelledCount,
          completionRate: Number(orderCompletionRate.toFixed(2)),
          cancellationRate: Number(orderCancellationRate.toFixed(2)),
          refundRate: Number(orderRefundRate.toFixed(2)),
          weekGrowth: Number(orderWeekGrowth.toFixed(2)),
          momGrowth: Number(orderMomGrowth.toFixed(2)),
          yoyGrowth: Number(orderYoyGrowth.toFixed(2)),
          quarterGrowth: Number(orderQuarterGrowth.toFixed(2)),
          dodGrowth: Number(orderDodGrowth.toFixed(2)),
          thisQuarter: ordersThisQuarter,
          today: ordersToday,
          yesterday: ordersYesterday,
          avgTimeToPaymentSeconds: Number(avgTimeToPaymentSeconds.toFixed(0)),
          avgTimeToCompletionSeconds: Number(avgTimeToCompletionSeconds.toFixed(0)),
          ...(avgServiceCompletionMinutes != null ? { avgServiceCompletionMinutes } : {}),
          ...(avgScheduledDurationMinutes != null ? { avgScheduledDurationMinutes } : {}),
        },
        partialPayments,
        discounts: { total: totalDiscounts, percentOfRevenue: periodRevenueForHealth > 0 ? Number(((totalDiscounts / periodRevenueForHealth) * 100).toFixed(2)) : 0 },
        paymentProcessingFeesByMethod,
        paymentRetrySuccessRate,
        chargebacks: { total: totalChargebacks, recent: chargebacksList.map((c: { orderNumber: string; chargebackAmount: unknown; chargebackAt: Date | null; customerName?: string }) => ({ orderNumber: c.orderNumber, amount: Number(c.chargebackAmount || 0), chargebackAt: c.chargebackAt, customerName: c.customerName })) },
        bookingChannels,
        financialHealth,
        ...(priorYearSamePeriodResult != null ? { priorYearSamePeriod: priorYearSamePeriodResult } : {}),
        peakTimesByLocation,
        cancellationByService,
        weekendWeekday,

        // Order funnel (All → Paid → Completed)
        orderFunnel: [
          { stage: 'All Orders', count: totalOrders },
          { stage: 'Paid', count: paidOrders },
          { stage: 'Completed', count: completedCount },
        ],

        // Seasonal revenue by month (1–12, all-time)
        seasonalRevenueByMonth,

        // Customer demographics (gender, age buckets)
        demographics,

        // Service demand by location (bookings per city and service)
        serviceDemandByLocation,

        // Revenue by location (city)
        revenueByLocation: revenueByLocationList,

        // Holiday impact (§11) — revenue on Nigerian public holidays vs avg daily in month
        holidayImpact,

        // Location-specific trends over time (§10) — revenue by city by month, last 12 months
        revenueByLocationOverTime,

        // Customer Stats
        customers: {
          total: totalCustomers as number,
          newThisPeriod: newCustomersThisPeriod as number,
          newToday: (newCustomersDailyWeeklyMonthly as { newToday: number }).newToday,
          newThisWeek: (newCustomersDailyWeeklyMonthly as { newThisWeek: number }).newThisWeek,
          newThisMonth: (newCustomersDailyWeeklyMonthly as { newThisMonth: number }).newThisMonth,
          growthRate: Number(customerGrowthRate.toFixed(2)),
          active: activeCustomers,
          inactive: inactiveCustomers,
          arpu: Number(arpu.toFixed(2)),
          avgOrderValuePerCustomer: Number(avgOrderValuePerCustomer.toFixed(2)),
          medianRevenuePerCustomer: Number(medianRevenuePerCustomer.toFixed(2)),
          revenueTop10Percent: Number(revenueTop10Percent.toFixed(2)),
          top10PercentCustomerCount: top10Count,
          revenueTop10PercentOfTotal: Number(revenueTop10PercentOfTotal.toFixed(2)),
          purchaseFrequency: Number(purchaseFrequency.toFixed(2)),
          avgTimeBetweenPurchasesDays: Number(avgTimeBetweenPurchasesDays.toFixed(1)),
          retentionRate: Number(retentionRate.toFixed(2)),
          churnRate: Number(churnRate.toFixed(2)),
          clv: Number(clv.toFixed(2)),
          acquisitionTrends,
        },
        revenueBySegment,

        // Top Services (by order items) — with popularity trends when period filter applied
        topServices: topServicesWithTrends,

        // Least ordered services (by revenue)
        leastOrderedServices,

        // Preferred payment methods (customer distribution)
        preferredPaymentMethods,

        // Booking no-show rate, lead time, same-day, cancellation by time before (when period filter applied)
        ...(bookingNoShowRate != null ? { bookingNoShowRate, bookingNoShowCount, bookingTotal } : {}),
        ...(avgBookingLeadTimeDays != null ? { avgBookingLeadTimeDays } : {}),
        ...(sameDayBookingsCount != null ? { sameDayBookingsCount } : {}),
        ...(cancellationByTimeBefore != null ? { cancellationByTimeBefore } : {}),

        // Most / least sold products (by revenue)
        mostSoldProducts,
        leastSoldProducts,

        // Service vs product revenue breakdown
        serviceVsProductRevenue,

        // Service Categories Analytics
        serviceCategories,

        // Product Categories Analytics
        productCategories,

        // Product seasonality (§4.3) — product revenue by month, last 12 months
        productRevenueByMonth,

        // Peak Booking Times (hourly, daily, monthly)
        peakBookingTimes,

        // Booking heatmap (hour x day of week)
        bookingHeatmap,

        // Revenue projections/forecasts (3‑month average)
        revenueForecast,

        // §11.2 Anomaly detection (last 30 days)
        anomalyDetection,

        // §13 Predictive: customer growth & demand forecasts
        predictive,

        // §10 Branch utilization & profitability
        branchUtilization,
        branchProfitability,

        // CLV by segment (when period filter applied)
        ...(clvBySegment != null ? { clvBySegment } : {}),

        // Payment Methods Breakdown
        paymentMethods: ordersByPaymentMethod.map((item) => ({
          method: item.paymentMethod || 'Unknown',
          amount: Number(item._sum.totalAmount || 0),
          count: item._count.id,
        })),

        // Payment Analytics
        paymentAnalytics: (() => {
          // Calculate success rate, avg transaction value, and completion rate by method
          const methodMap = new Map<string, { total: number; paid: number; amount: number }>();
          
          // Initialize from all orders
          for (const item of allOrdersByPaymentMethod) {
            const method = item.paymentMethod || 'Unknown';
            methodMap.set(method, {
              total: item._count.id,
              paid: 0,
              amount: Number(item._sum.totalAmount || 0),
            });
          }

          // Update paid counts from paid orders
          for (const item of ordersByPaymentMethod) {
            const method = item.paymentMethod || 'Unknown';
            const entry = methodMap.get(method);
            if (entry) {
              entry.paid = item._count.id;
            }
          }

          // Calculate metrics
          const analytics = Array.from(methodMap.entries()).map(([method, data]) => {
            const successRate = data.total > 0 ? (data.paid / data.total) * 100 : 0;
            const avgTransactionValue = data.paid > 0 ? data.amount / data.paid : 0;
            
            return {
              method,
              totalAttempts: data.total,
              successfulPayments: data.paid,
              successRate: Number(successRate.toFixed(2)),
              avgTransactionValue: Number(avgTransactionValue.toFixed(2)),
              totalRevenue: data.amount,
            };
          });

          // Overall payment completion rate
          const totalOrdersWithPaymentMethod = allOrdersByPaymentMethod.reduce((sum, item) => sum + item._count.id, 0);
          const totalPaidOrders = ordersByPaymentMethod.reduce((sum, item) => sum + item._count.id, 0);
          const overallCompletionRate = totalOrdersWithPaymentMethod > 0
            ? (totalPaidOrders / totalOrdersWithPaymentMethod) * 100
            : 0;

          return {
            byMethod: analytics,
            overallCompletionRate: Number(overallCompletionRate.toFixed(2)),
          };
        })(),

        // Order Status Breakdown
        orderStatus: ordersByStatus.map((item) => ({
          status: item.status,
          amount: Number(item._sum.totalAmount || 0),
          count: item._count.id,
        })),

        // Barber Earnings (Admin only) — add cancellation rate per barber
        barberEarnings: user.role === 'ADMIN'
          ? validBarberEarnings
              .map((b: any) => {
                const total = barberTotalMap.get(b.barberId) ?? 0;
                const cancelled = barberCancelledMap.get(b.barberId) ?? 0;
                const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0;
                const retentionRate = barberRetentionMap.get(b.barberId) ?? 0;
                const prevRev = prevBarberRevenueMap.get(b.barberId) ?? 0;
                const earningsGrowth = prevRev > 0
                  ? Number((((b.totalRevenue - prevRev) / prevRev) * 100).toFixed(2))
                  : (b.totalRevenue > 0 ? 100 : null);
                const hoursEst = barberHoursMap.get(b.barberId) || 0;
                const svcComp = b.servicesCompleted ?? 0;
                return {
                  ...b,
                  ordersTotal: total,
                  ordersCancelled: cancelled,
                  cancellationRate: Number(cancellationRate.toFixed(2)),
                  retentionRate,
                  ...(earningsGrowth != null ? { earningsGrowth } : {}),
                  earningsByServiceType: (barberServiceEarningsMap.get(b.barberId) || []).sort((a, x) => x.revenue - a.revenue).slice(0, 10),
                  hoursWorkedEstimate: Number(hoursEst.toFixed(2)),
                  peakPerformanceTimes: (barberPeakHourMap.get(b.barberId) || []).sort((a, x) => x.count - a.count).slice(0, 5).map((x) => x.hour),
                  productivity: Number((svcComp / (hoursEst || 0.001)).toFixed(2)),
                  payoutHistory: (payoutsByBarberMap.get(b.barberId) || []).slice(0, 5).map((p) => ({ id: p.id, amount: p.amount, periodStart: p.periodStart, periodEnd: p.periodEnd, status: p.status, paidAt: p.paidAt })),
                };
              })
              .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
              .slice(0, 10)
          : null,
        totalBarberPayouts: user.role === 'ADMIN' ? totalBarberPayouts : null,
        totalCompanyCommission: user.role === 'ADMIN' ? totalCompanyCommission : null,

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

        // Recent Transactions (with service/product details via order items)
        recentTransactions: recentTransactions.map((order) => {
          const items = (order as any).items ?? [];
          const itemTitles = items.map((i: { title?: string }) => i?.title).filter(Boolean);
          return {
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
            itemTitles: itemTitles.length ? itemTitles : null,
          };
        }),

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
