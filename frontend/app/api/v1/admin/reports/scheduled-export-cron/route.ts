import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/server/emailService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function getLastWeekRange() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const lastStart = new Date(weekStart);
  lastStart.setDate(lastStart.getDate() - 7);
  const lastEnd = new Date(weekStart);
  lastEnd.setMilliseconds(-1);
  return { start: lastStart, end: lastEnd };
}

function getPriorWeekRange(lastWeekStart: Date, lastWeekEnd: Date) {
  const priorStart = new Date(lastWeekStart);
  priorStart.setDate(priorStart.getDate() - 7);
  const priorEnd = new Date(lastWeekEnd);
  priorEnd.setDate(priorEnd.getDate() - 7);
  return { start: priorStart, end: priorEnd };
}

function escapeCsv(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${String(s).replace(/"/g, '""')}"`;
  return s;
}

/**
 * GET /api/v1/admin/reports/scheduled-export-cron
 * §14.3 Scheduled exports. For Vercel Cron (or external cron). Runs Tue 10am.
 * Requires: Authorization: Bearer <CRON_SECRET>.
 * Env: CRON_SECRET; SCHEDULED_EXPORT_EMAILS (or WEEKLY_REPORT_EMAILS) comma-separated.
 * Emails last week's financial summary as CSV attachment.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization') || '';
    const secret = process.env.CRON_SECRET || '';
    if (!secret || auth !== `Bearer ${secret}`) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Valid CRON_SECRET required.' } },
        { status: 401 }
      );
    }

    const emailsRaw =
      process.env.SCHEDULED_EXPORT_EMAILS?.trim() || process.env.WEEKLY_REPORT_EMAILS || '';
    const emails = emailsRaw.split(',').map((e) => e.trim()).filter(Boolean);
    if (emails.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message:
            'No SCHEDULED_EXPORT_EMAILS or WEEKLY_REPORT_EMAILS configured; nothing sent.',
          sent: 0,
        },
      });
    }

    const { start: weekStart, end: weekEnd } = getLastWeekRange();
    const { start: priorStart, end: priorEnd } = getPriorWeekRange(weekStart, weekEnd);
    const periodLabel = `${weekStart.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })} – ${weekEnd.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`;

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
        where: {
          paymentStatus: 'PAID',
          createdAt: { gte: priorStart, lte: priorEnd },
        },
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
    const wowGrowth = lastRev > 0 ? ((revenue - lastRev) / lastRev) * 100 : 0;

    const byTitle = new Map<string, number>();
    for (const i of orderItems) {
      const t = (i.title || 'Unknown').trim();
      byTitle.set(t, (byTitle.get(t) || 0) + Number(i.totalPrice));
    }
    const topItems = [...byTitle.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([title, rev]) => ({ title, revenue: rev }));

    const sortedBarbers = (barberGroups as {
      assignedBarberId: string | null;
      _sum: { totalAmount: unknown };
      _count: { id: number };
    }[])
      .filter((b) => b.assignedBarberId)
      .sort((a, b) => Number(b._sum?.totalAmount || 0) - Number(a._sum?.totalAmount || 0))
      .slice(0, 10);

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

    const rows: string[] = [
      'Metric,Value',
      `Period,${escapeCsv(periodLabel)}`,
      'Revenue (NGN),' + revenue.toFixed(2),
      'Orders (paid),' + weekOrdersPaid,
      'Orders (total),' + weekOrdersTotal,
      'New customers,' + newCustomers,
      'WoW %,' + wowGrowth.toFixed(1),
      '',
      'Top items by revenue',
      'Item,Revenue (NGN)',
      ...topItems.map((i) => `${escapeCsv(i.title)},${i.revenue.toFixed(2)}`),
      '',
      'Top barbers by revenue',
      'Barber,Revenue (NGN),Orders',
      ...topBarbers.map(
        (b) => `${escapeCsv(b.name)},${b.revenue.toFixed(2)},${b.orders}`
      ),
    ];
    const csv = rows.join('\n');
    const filename = `financial-export-${weekStart.toISOString().slice(0, 10)}.csv`;

    const subject = `Scheduled Financial Export – ${periodLabel}`;
    const text = `Scheduled financial export (${periodLabel}). Revenue: ₦${revenue.toLocaleString(
      'en-NG',
      { minimumFractionDigits: 2 }
    )} (${wowGrowth >= 0 ? '+' : ''}${wowGrowth.toFixed(1)}% WoW). Orders (paid): ${weekOrdersPaid}. New customers: ${newCustomers}. See attached CSV.`;
    const html = `<p style="font-family: system-ui, sans-serif;">Scheduled financial export for <strong>${periodLabel}</strong>.</p><p>Revenue: ₦${revenue.toLocaleString(
      'en-NG',
      { minimumFractionDigits: 2 }
    )} (${wowGrowth >= 0 ? '+' : ''}${wowGrowth.toFixed(1)}% WoW). Orders (paid): ${weekOrdersPaid}. New customers: ${newCustomers}.</p><p>See attached CSV.</p>`;

    let sent = 0;
    const errors: string[] = [];
    for (const to of emails) {
      const result = await emailService.sendEmail({
        to,
        subject,
        html,
        text,
        attachments: [{ filename, content: Buffer.from(csv, 'utf-8') }],
      });
      if (result.success) sent++;
      else errors.push(`${to}: ${result.error || 'unknown'}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `Scheduled export sent to ${sent} of ${emails.length} recipients.`,
        sent,
        total: emails.length,
        ...(errors.length > 0 ? { errors } : {}),
      },
    });
  } catch (e: unknown) {
    console.error('Scheduled export cron error:', e);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: e instanceof Error ? e.message : 'Failed to send scheduled export',
        },
      },
      { status: 500 }
    );
  }
}
