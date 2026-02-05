import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '../utils';

export const dynamic = 'force-dynamic';

function getDateRange(period: string) {
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
      return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: now };
    }
    case 'quarter': {
      const q = Math.floor(today.getMonth() / 3) + 1;
      return { start: new Date(today.getFullYear(), (q - 1) * 3, 1), end: now };
    }
    case 'year':
      return { start: new Date(today.getFullYear(), 0, 1), end: now };
    default:
      return { start: null, end: null };
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdminOrRep(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = (searchParams.get('search') || '').trim();
    const period = searchParams.get('period') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const barberId = searchParams.get('barber') || undefined;
    const location = searchParams.get('location') || undefined;
    const category = searchParams.get('category') || undefined;
    const service = searchParams.get('service') || undefined;

    let dateFilter: { createdAt?: { gte: Date; lte: Date } } = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
      };
    } else if (period !== 'all') {
      const range = getDateRange(period);
      if (range.start && range.end) {
        dateFilter = { createdAt: { gte: range.start, lte: range.end } };
      }
    }

    const orderFilters: any[] = [];
    if (barberId) orderFilters.push({ assignedBarberId: barberId });
    if (location) orderFilters.push({ city: location });
    if (category) orderFilters.push({ items: { some: { product: { category } } } });
    if (service) orderFilters.push({ items: { some: { title: service } } });

    const where: any =
      orderFilters.length === 0 ? { ...dateFilter } : { AND: [dateFilter, ...orderFilters] };
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          assignedBarber: {
            select: {
              user: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    const transactions = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      amount: Number(o.totalAmount),
      paymentMethod: o.paymentMethod || 'Unknown',
      paymentStatus: o.paymentStatus,
      orderStatus: o.status,
      barberName: o.assignedBarber?.user?.name ?? null,
      createdAt: o.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (e: any) {
    console.error('Transactions API error:', e);
    return NextResponse.json(
      { success: false, error: { message: e.message || 'Failed to fetch transactions' } },
      { status: 500 }
    );
  }
}





