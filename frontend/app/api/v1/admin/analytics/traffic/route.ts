import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '../../utils';

export const dynamic = 'force-dynamic';

function getDateRange(period: string = 'all') {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (period) {
    case 'today': return { start: today, end: now };
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
    default: return { start: null, end: null };
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
    const period = searchParams.get('period') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let dateFilter: { createdAt?: { gte?: Date; lte?: Date } } = {};
    if (startDate && endDate) {
      dateFilter = { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } };
    } else if (period !== 'all') {
      const range = getDateRange(period);
      if (range.start && range.end) dateFilter = { createdAt: { gte: range.start, lte: range.end } };
    }

    const where = Object.keys(dateFilter).length ? dateFilter : {};
    const w = where as { createdAt?: { gte?: Date; lte?: Date } };

    const [total, uniqueVisitorsResult, byPage, byReferrer, byDevice, overTimeRows] = await Promise.all([
      prisma.trafficEvent.count({ where }),
      w?.createdAt?.gte != null && w?.createdAt?.lte != null
        ? prisma.$queryRaw<[{ count: bigint }]>(Prisma.sql`
            SELECT COUNT(DISTINCT session_id)::bigint AS count FROM traffic_events
            WHERE created_at >= ${w.createdAt.gte} AND created_at <= ${w.createdAt.lte} AND session_id IS NOT NULL
          `).then((r) => Number(r[0]?.count ?? 0))
        : prisma.$queryRaw<[{ count: bigint }]>(Prisma.sql`
            SELECT COUNT(DISTINCT session_id)::bigint AS count FROM traffic_events
            WHERE session_id IS NOT NULL
          `).then((r) => Number(r[0]?.count ?? 0)),
      prisma.trafficEvent.groupBy({
        by: ['url'],
        where,
        _count: { id: true },
      }).then((r) => r.sort((a, b) => b._count.id - a._count.id).slice(0, 20)),
      prisma.trafficEvent.groupBy({
        by: ['referrer'],
        where: { ...where, referrer: { not: null } },
        _count: { id: true },
      }).then((r) => r.sort((a, b) => b._count.id - a._count.id).slice(0, 15)),
      prisma.trafficEvent.groupBy({
        by: ['device'],
        where: { ...where, device: { not: null } },
        _count: { id: true },
      }),
      (() => {
        if (w?.createdAt?.gte != null && w?.createdAt?.lte != null) {
          return prisma.$queryRaw<{ d: string; c: bigint }[]>(Prisma.sql`
            SELECT DATE(created_at)::text AS d, COUNT(*)::bigint AS c
            FROM traffic_events
            WHERE created_at >= ${w.createdAt.gte} AND created_at <= ${w.createdAt.lte}
            GROUP BY DATE(created_at)
            ORDER BY d
          `);
        }
        return prisma.$queryRaw<{ d: string; c: bigint }[]>(Prisma.sql`
          SELECT DATE(created_at)::text AS d, COUNT(*)::bigint AS c
          FROM traffic_events
          GROUP BY DATE(created_at)
          ORDER BY d DESC
          LIMIT 90
        `).then((rows) => [...rows].reverse());
      })(),
    ]);

    const overTime = (overTimeRows || []).map((r) => ({ date: r.d, count: Number(r.c) }));

    return NextResponse.json({
      success: true,
      data: {
        totalPageViews: total,
        uniqueVisitors: typeof uniqueVisitorsResult === 'number' ? uniqueVisitorsResult : 0,
        byPage: byPage.map((r) => ({ url: r.url || '(empty)', count: r._count.id })),
        byReferrer: byReferrer.map((r) => ({ referrer: r.referrer || '(direct)', count: r._count.id })),
        byDevice: byDevice.map((r) => ({ device: r.device || 'unknown', count: r._count.id })),
        overTime,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch traffic' } },
      { status: 500 }
    );
  }
}
