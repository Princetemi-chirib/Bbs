import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '../../utils';

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
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: monthStart, end: now };
    }
    case 'year': {
      const yearStart = new Date(today.getFullYear(), 0, 1);
      return { start: yearStart, end: now };
    }
    default:
      return { start: null as Date | null, end: null as Date | null };
  }
}

/**
 * GET /api/v1/admin/analytics/marketing
 * §7 Marketing analytics: campaigns, email/SMS, communications.
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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const range = getDateRange(period);
    const dateFilter =
      range.start && range.end
        ? { createdAt: { gte: range.start, lte: range.end } }
        : {};

    const [campaigns, communications, commByType, commByStatus] = await Promise.all([
      prisma.campaign.findMany({
        where: dateFilter.createdAt
          ? { startAt: { lte: range.end! }, OR: [{ endAt: null }, { endAt: { gte: range.start! } }] }
          : {},
        orderBy: { startAt: 'desc' },
        take: 50,
      }),
      prisma.customerCommunication.findMany({
        where: dateFilter,
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
      prisma.customerCommunication.groupBy({
        by: ['type'],
        where: dateFilter,
        _count: { id: true },
      }),
      prisma.customerCommunication.groupBy({
        by: ['status'],
        where: dateFilter,
        _count: { id: true },
      }),
    ]);

    const totalSent = communications.length;
    const delivered = communications.filter((c) => c.status === 'DELIVERED' || c.status === 'SENT').length;
    const failed = communications.filter((c) => c.status === 'FAILED' || c.status === 'BOUNCED').length;
    const deliveryRate = totalSent > 0 ? Number(((delivered / totalSent) * 100).toFixed(2)) : 0;
    const byChannel = commByType.map((r) => ({
      channel: r.type,
      count: r._count.id,
    }));
    const totalSpend = campaigns.reduce((sum, c) => sum + Number(c.spend ?? 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        campaigns: campaigns.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          startAt: c.startAt,
          endAt: c.endAt,
          spend: c.spend != null ? Number(c.spend) : null,
        })),
        totalCampaigns: campaigns.length,
        totalSpend: Number(totalSpend.toFixed(2)),
        communications: {
          totalSent,
          delivered,
          failed,
          deliveryRate,
          byChannel,
          byStatus: commByStatus.map((r) => ({ status: r.status, count: r._count.id })),
        },
      },
    });
  } catch (e) {
    console.error('Marketing analytics error:', e);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch marketing data' } },
      { status: 500 }
    );
  }
}
