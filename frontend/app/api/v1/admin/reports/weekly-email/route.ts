import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '../../utils';
import { emailService } from '@/lib/server/emailService';

export const dynamic = 'force-dynamic';

function getWeekRange() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(now);
  return { start: weekStart, end: weekEnd };
}

function getLastWeekRange() {
  const { start, end } = getWeekRange();
  const lastStart = new Date(start);
  lastStart.setDate(lastStart.getDate() - 7);
  const lastEnd = new Date(start);
  lastEnd.setMilliseconds(-1);
  return { start: lastStart, end: lastEnd };
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdminOrRep(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin or Rep required.' } },
        { status: 401 }
      );
    }

    const { start: weekStart, end: weekEnd } = getWeekRange();
    const { start: lastStart, end: lastEnd } = getLastWeekRange();

    const [
      weekRevenue,
      weekOrdersPaid,
      weekOrdersTotal,
      newCustomers,
      lastWeekRevenue,
      orderItems,
      barberGroups,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID', createdAt: { gte: weekStart, lte: weekEnd } },
        _sum: { totalAmount: true },
      }),
      prisma.order.count({
        where: { paymentStatus: 'PAID', createdAt: { gte: weekStart, lte: weekEnd } },
      }),
      prisma.order.count({
        where: { createdAt: { gte: weekStart, lte: weekEnd } },
      }),
      prisma.customer.count({
        where: { createdAt: { gte: weekStart, lte: weekEnd } },
      }),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID', createdAt: { gte: lastStart, lte: lastEnd } },
        _sum: { totalAmount: true },
      }),
      prisma.orderItem.findMany({
        where: { order: { paymentStatus: 'PAID', createdAt: { gte: weekStart, lte: weekEnd } } },
        select: { title: true, totalPrice: true },
      }),
      prisma.order.groupBy({
        by: ['assignedBarberId'],
        where: {
          paymentStatus: 'PAID',
          createdAt: { gte: weekStart, lte: weekEnd },
          assignedBarberId: { not: null },
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
    ]);

    const revenue = Number(weekRevenue._sum.totalAmount || 0);
    const lastRev = Number(lastWeekRevenue._sum.totalAmount || 0);
    const wowGrowth = lastRev > 0 ? (((revenue - lastRev) / lastRev) * 100) : 0;

    const byTitle = new Map<string, number>();
    for (const i of orderItems) {
      const t = (i.title || 'Unknown').trim();
      byTitle.set(t, (byTitle.get(t) || 0) + Number(i.totalPrice));
    }
    const topItems = [...byTitle.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([title, rev]) => ({ title, revenue: rev }));

    const sortedBarbers = (barberGroups as { assignedBarberId: string | null; _sum: { totalAmount: unknown }; _count: { id: number } }[])
      .filter((b) => b.assignedBarberId)
      .sort((a, b) => Number(b._sum?.totalAmount || 0) - Number(a._sum?.totalAmount || 0))
      .slice(0, 5);

    const barberIds = sortedBarbers.map((b) => b.assignedBarberId!);
    const barberNames = await prisma.barber.findMany({
      where: { id: { in: barberIds } },
      select: { id: true, user: { select: { name: true } } },
    });
    const nameMap = new Map(barberNames.map((b) => [b.id, b.user?.name || 'Unknown']));
    const topBarbers = sortedBarbers.map((b) => ({
      name: nameMap.get(b.assignedBarberId!) || 'Unknown',
      revenue: Number(b._sum?.totalAmount || 0),
      orders: b._count.id,
    }));

    const fmt = (n: number) => `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const periodLabel = `${weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} – ${weekEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Weekly Report</title></head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #333; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="color: #39413f; margin-bottom: 8px;">Weekly Analytics Report</h1>
  <p style="color: #6c757d; margin: 0 0 24px 0;">${periodLabel}</p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr style="background: #f8f9fa;"><td style="padding: 12px; border: 1px solid #e5e5e5;"><strong>Revenue (this week)</strong></td><td style="padding: 12px; border: 1px solid #e5e5e5; text-align: right;">${fmt(revenue)}</td></tr>
    <tr><td style="padding: 12px; border: 1px solid #e5e5e5;">Week-over-week</td><td style="padding: 12px; border: 1px solid #e5e5e5; text-align: right; color: ${wowGrowth >= 0 ? '#46B450' : '#dc3232'}">${wowGrowth >= 0 ? '+' : ''}${wowGrowth.toFixed(1)}%</td></tr>
    <tr style="background: #f8f9fa;"><td style="padding: 12px; border: 1px solid #e5e5e5;"><strong>Orders (paid)</strong></td><td style="padding: 12px; border: 1px solid #e5e5e5; text-align: right;">${weekOrdersPaid}</td></tr>
    <tr><td style="padding: 12px; border: 1px solid #e5e5e5;">Orders (total)</td><td style="padding: 12px; border: 1px solid #e5e5e5; text-align: right;">${weekOrdersTotal}</td></tr>
    <tr style="background: #f8f9fa;"><td style="padding: 12px; border: 1px solid #e5e5e5;">New customers</td><td style="padding: 12px; border: 1px solid #e5e5e5; text-align: right;">${newCustomers}</td></tr>
  </table>

  ${topItems.length > 0 ? `
  <h2 style="color: #39413f; font-size: 1rem; margin: 0 0 8px 0;">Top items by revenue</h2>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <thead><tr style="background: #f8f9fa;"><th style="padding: 8px 12px; border: 1px solid #e5e5e5; text-align: left;">Item</th><th style="padding: 8px 12px; border: 1px solid #e5e5e5; text-align: right;">Revenue</th></tr></thead>
    <tbody>
    ${topItems.map((i) => `<tr><td style="padding: 8px 12px; border: 1px solid #e5e5e5;">${(i.title || '').replace(/</g, '&lt;')}</td><td style="padding: 8px 12px; border: 1px solid #e5e5e5; text-align: right;">${fmt(i.revenue)}</td></tr>`).join('')}
    </tbody>
  </table>
  ` : ''}

  ${topBarbers.length > 0 ? `
  <h2 style="color: #39413f; font-size: 1rem; margin: 0 0 8px 0;">Top barbers by revenue</h2>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <thead><tr style="background: #f8f9fa;"><th style="padding: 8px 12px; border: 1px solid #e5e5e5; text-align: left;">Barber</th><th style="padding: 8px 12px; border: 1px solid #e5e5e5; text-align: right;">Revenue</th><th style="padding: 8px 12px; border: 1px solid #e5e5e5; text-align: right;">Orders</th></tr></thead>
    <tbody>
    ${topBarbers.map((b) => `<tr><td style="padding: 8px 12px; border: 1px solid #e5e5e5;">${(b.name || '').replace(/</g, '&lt;')}</td><td style="padding: 8px 12px; border: 1px solid #e5e5e5; text-align: right;">${fmt(b.revenue)}</td><td style="padding: 8px 12px; border: 1px solid #e5e5e5; text-align: right;">${b.orders}</td></tr>`).join('')}
    </tbody>
  </table>
  ` : ''}

  <p style="color: #6c757d; font-size: 0.875rem; margin: 0;">This report was generated from the Analytics & Financial Dashboard. You can schedule weekly emails via a cron job calling <code>POST /api/v1/admin/reports/weekly-email</code> with a valid admin session.</p>
</body>
</html>`;

    const result = await emailService.sendEmail({
      to: user.email,
      subject: `Weekly Analytics Report – ${periodLabel}`,
      html,
      text: `Weekly Analytics Report (${periodLabel})\n\nRevenue: ${fmt(revenue)} (${wowGrowth >= 0 ? '+' : ''}${wowGrowth.toFixed(1)}% WoW)\nOrders (paid): ${weekOrdersPaid}\nNew customers: ${newCustomers}\n\nView the full dashboard for more details.`,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: result.error || 'Failed to send email' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Weekly report sent to ' + user.email, messageId: result.messageId },
    });
  } catch (e: any) {
    console.error('Weekly report error:', e);
    return NextResponse.json(
      { success: false, error: { message: e?.message || 'Failed to send weekly report' } },
      { status: 500 }
    );
  }
}
