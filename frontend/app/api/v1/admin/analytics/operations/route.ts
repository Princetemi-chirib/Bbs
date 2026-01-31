import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '../../utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/admin/analytics/operations
 * §6 Operational metrics: uptime, performance, errors, support tickets, system health.
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
    const period = searchParams.get('period') || 'week';
    const now = new Date();
    let start: Date;
    if (period === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
      start = new Date(now);
      start.setDate(start.getDate() - 7);
    } else {
      start = new Date(now);
      start.setMonth(start.getMonth() - 1);
    }

    const [metrics, supportOpen, supportResolved, supportTotal, activeSessions] = await Promise.all([
      prisma.operationalMetric.findMany({
        where: { recordedAt: { gte: start } },
        orderBy: { recordedAt: 'desc' },
        take: 500,
      }),
      prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.supportTicket.count({
        where: {
          status: 'RESOLVED',
          resolvedAt: { gte: start },
        },
      }),
      prisma.supportTicket.count({ where: { createdAt: { gte: start } } }),
      prisma.session.count({
        where: { expiresAt: { gt: now } },
      }),
    ]);

    const byType = new Map<string, { value: number; unit?: string; recordedAt: Date }[]>();
    for (const m of metrics) {
      const key = m.type;
      if (!byType.has(key)) byType.set(key, []);
      byType.get(key)!.push({
        value: Number(m.value),
        unit: m.unit ?? undefined,
        recordedAt: m.recordedAt,
      });
    }

    const latestUptime = (byType.get('UPTIME') ?? []).sort(
      (a, b) => b.recordedAt.getTime() - a.recordedAt.getTime()
    )[0];
    const latestResponseTime = (byType.get('RESPONSE_TIME') ?? []).sort(
      (a, b) => b.recordedAt.getTime() - a.recordedAt.getTime()
    )[0];
    const latestErrorRate = (byType.get('ERROR_RATE') ?? []).sort(
      (a, b) => b.recordedAt.getTime() - a.recordedAt.getTime()
    )[0];

    const resolutionRate =
      supportTotal > 0 ? Number(((supportResolved / supportTotal) * 100).toFixed(2)) : 0;

    return NextResponse.json({
      success: true,
      data: {
        uptime: latestUptime
          ? { value: latestUptime.value, unit: latestUptime.unit ?? '%', recordedAt: latestUptime.recordedAt }
          : null,
        responseTime: latestResponseTime
          ? { value: latestResponseTime.value, unit: latestResponseTime.unit ?? 'ms', recordedAt: latestResponseTime.recordedAt }
          : null,
        errorRate: latestErrorRate
          ? { value: latestErrorRate.value, unit: latestErrorRate.unit ?? '%', recordedAt: latestErrorRate.recordedAt }
          : null,
        metricsByType: Object.fromEntries(
          [...byType.entries()].map(([k, v]) => [k, v.slice(0, 30)])
        ),
        supportTickets: {
          open: supportOpen,
          resolvedInPeriod: supportResolved,
          totalInPeriod: supportTotal,
          resolutionRate,
        },
        activeSessions,
        message:
          metrics.length === 0
            ? 'No operational metrics recorded yet. Configure a cron or monitoring service to POST to a metrics endpoint that writes to OperationalMetric.'
            : undefined,
      },
    });
  } catch (e) {
    console.error('Operations analytics error:', e);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch operations data' } },
      { status: 500 }
    );
  }
}
