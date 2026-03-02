import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
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
  const { start } = getWeekRange();
  const lastStart = new Date(start);
  lastStart.setDate(lastStart.getDate() - 7);
  const lastEnd = new Date(start);
  lastEnd.setMilliseconds(-1);
  return { start: lastStart, end: lastEnd };
}

const fmt = (n: number) => `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const esc = (s: string) => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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
    const periodLabel = `${weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} – ${weekEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;

    const weekWhere = { createdAt: { gte: weekStart, lte: weekEnd } };

    // ─── Financial & orders ─────────────────────────────────────────────────
    const [
      weekRevenue,
      lastWeekRevenue,
      weekOrdersPaid,
      weekOrdersTotal,
      weekOrdersPending,
      weekOrdersFailed,
      weekOrdersRefunded,
      ordersByStatus,
      ordersByJobStatus,
      ordersByPaymentMethod,
      newCustomersWeek,
      orderItemsWeek,
      barberGroupsWeek,
      recentOrdersWeek,
      refundsWeek,
      revenueByCity,
    ] = await Promise.all([
      prisma.order.aggregate({ where: { paymentStatus: 'PAID', ...weekWhere }, _sum: { totalAmount: true } }),
      prisma.order.aggregate({ where: { paymentStatus: 'PAID', createdAt: { gte: lastStart, lte: lastEnd } }, _sum: { totalAmount: true } }),
      prisma.order.count({ where: { paymentStatus: 'PAID', ...weekWhere } }),
      prisma.order.count({ where: weekWhere }),
      prisma.order.count({ where: { paymentStatus: 'PENDING', ...weekWhere } }),
      prisma.order.count({ where: { paymentStatus: 'FAILED', ...weekWhere } }),
      prisma.order.count({ where: { paymentStatus: 'REFUNDED', ...weekWhere } }),
      prisma.order.groupBy({ by: ['status'], where: weekWhere, _count: { id: true } }),
      prisma.order.groupBy({ by: ['jobStatus'], where: weekWhere, _count: { id: true } }),
      prisma.order.groupBy({
        by: ['paymentMethod'],
        where: { ...weekWhere, paymentMethod: { not: null }, paymentStatus: 'PAID' },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.customer.count({ where: { createdAt: weekWhere.createdAt } }),
      prisma.orderItem.findMany({
        where: { order: { paymentStatus: 'PAID', ...weekWhere } },
        select: { title: true, totalPrice: true },
      }),
      prisma.order.groupBy({
        by: ['assignedBarberId'],
        where: { paymentStatus: 'PAID', ...weekWhere, assignedBarberId: { not: null } },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.order.findMany({
        where: weekWhere,
        take: 15,
        orderBy: { createdAt: 'desc' },
        select: {
          orderNumber: true,
          customerName: true,
          totalAmount: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
        },
      }),
      prisma.order.findMany({
        where: { paymentStatus: 'REFUNDED', ...weekWhere },
        select: { orderNumber: true, customerName: true, totalAmount: true, updatedAt: true },
      }),
      prisma.order
        .groupBy({
          by: ['city'],
          where: { paymentStatus: 'PAID', createdAt: { gte: weekStart, lte: weekEnd } },
          _sum: { totalAmount: true },
          _count: { id: true },
        })
        .then((rows) => rows.filter((r) => r.city != null)),
    ]);

    const revenue = Number(weekRevenue._sum.totalAmount || 0);
    const lastRev = Number(lastWeekRevenue._sum.totalAmount || 0);
    const wowGrowth = lastRev > 0 ? (((revenue - lastRev) / lastRev) * 100) : 0;

    const byTitle = new Map<string, number>();
    for (const i of orderItemsWeek) {
      const t = (i.title || 'Unknown').trim();
      byTitle.set(t, (byTitle.get(t) || 0) + Number(i.totalPrice));
    }
    const topItems = [...byTitle.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([title, rev]) => ({ title, revenue: rev }));

    const sortedBarbers = (barberGroupsWeek as { assignedBarberId: string | null; _sum: { totalAmount: unknown }; _count: { id: number } }[])
      .filter((b) => b.assignedBarberId)
      .sort((a, b) => Number(b._sum?.totalAmount || 0) - Number(a._sum?.totalAmount || 0))
      .slice(0, 10);
    const barberIds = sortedBarbers.map((b) => b.assignedBarberId!);
    const barberNames = barberIds.length > 0
      ? await prisma.barber.findMany({ where: { id: { in: barberIds } }, select: { id: true, user: { select: { name: true } } } })
      : [];
    const nameMap = new Map(barberNames.map((b) => [b.id, b.user?.name || 'Unknown']));
    const topBarbers = sortedBarbers.map((b) => ({
      name: nameMap.get(b.assignedBarberId!) || 'Unknown',
      revenue: Number(b._sum?.totalAmount || 0),
      orders: b._count.id,
    }));

    // ─── Traffic ────────────────────────────────────────────────────────────
    const trafficWhere = weekWhere as { createdAt: { gte: Date; lte: Date } };
    let totalPageViews = 0;
    let uniqueVisitors = 0;
    let byPage: { url: string; count: number }[] = [];
    let byReferrer: { referrer: string; count: number }[] = [];
    let byDevice: { device: string; count: number }[] = [];
    let byCountry: { country: string; count: number }[] = [];
    let byCity: { city: string; count: number }[] = [];
    let overTime: { date: string; count: number }[] = [];

    try {
      const [tTotal, uV, byPageRaw, byRefRaw, byDevRaw, byCountryRaw, byCityRaw, overTimeRaw] = await Promise.all([
        prisma.trafficEvent.count({ where: trafficWhere }),
        prisma.$queryRaw<[{ count: bigint }]>(Prisma.sql`
          SELECT COUNT(DISTINCT session_id)::bigint AS count FROM traffic_events
          WHERE created_at >= ${weekStart} AND created_at <= ${weekEnd} AND session_id IS NOT NULL
        `).then((r) => Number(r[0]?.count ?? 0)),
        prisma.trafficEvent.groupBy({ by: ['url'], where: trafficWhere, _count: { id: true } }).then((r) => r.sort((a, b) => b._count.id - a._count.id).slice(0, 20)),
        prisma.trafficEvent.groupBy({ by: ['referrer'], where: { ...trafficWhere, referrer: { not: null } }, _count: { id: true } }).then((r) => r.sort((a, b) => b._count.id - a._count.id).slice(0, 15)),
        prisma.trafficEvent.groupBy({ by: ['device'], where: { ...trafficWhere, device: { not: null } }, _count: { id: true } }),
        prisma.trafficEvent.groupBy({ by: ['country'], where: { ...trafficWhere, country: { not: null } }, _count: { id: true } }).then((r) => r.sort((a, b) => b._count.id - a._count.id).slice(0, 20)),
        prisma.trafficEvent.groupBy({ by: ['city'], where: { ...trafficWhere, city: { not: null } }, _count: { id: true } }).then((r) => r.sort((a, b) => b._count.id - a._count.id).slice(0, 20)),
        prisma.$queryRaw<{ d: string; c: bigint }[]>(Prisma.sql`
          SELECT DATE(created_at)::text AS d, COUNT(*)::bigint AS c FROM traffic_events
          WHERE created_at >= ${weekStart} AND created_at <= ${weekEnd}
          GROUP BY DATE(created_at) ORDER BY d
        `),
      ]);
      totalPageViews = tTotal;
      uniqueVisitors = uV;
      byPage = byPageRaw.map((r) => ({ url: r.url || '(empty)', count: r._count.id }));
      byReferrer = byRefRaw.map((r) => ({ referrer: r.referrer || '(direct)', count: r._count.id }));
      byDevice = byDevRaw.map((r) => ({ device: r.device || 'unknown', count: r._count.id }));
      byCountry = byCountryRaw.map((r) => ({ country: r.country || 'Unknown', count: r._count.id }));
      byCity = byCityRaw.map((r) => ({ city: r.city || 'Unknown', count: r._count.id }));
      overTime = (overTimeRaw || []).map((r) => ({ date: r.d, count: Number(r.c) }));
    } catch (_) {
      // traffic_events may not exist
    }

    // ─── Reviews (this week) ─────────────────────────────────────────────────
    let reviewsTotal = 0;
    let reviewsAvgRating = 0;
    let reviewsResponseRate = 0;
    let reviewsWithResponse = 0;
    let ratingDist: { rating: number; count: number; percentage: number }[] = [];
    let sentimentSummary = { positiveMentions: 0, negativeMentions: 0, sentimentRatio: 0 };
    let feedbackThemes: { theme: string; count: number }[] = [];
    let reviewsByBarber: { barberName: string; count: number; avgRating: number }[] = [];
    let recentReviewsList: { rating: number; comment: string | null; barberName: string; serviceName: string; createdAt: Date }[] = [];

    try {
      const reviews = await prisma.review.findMany({
        where: { isVisible: true, createdAt: weekWhere.createdAt },
        include: {
          barber: { select: { user: { select: { name: true } } } },
          order: { include: { items: { take: 1, include: { product: { select: { title: true } } } } } },
        },
      });
      reviewsTotal = reviews.length;
      reviewsAvgRating = reviewsTotal > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviewsTotal : 0;
      const withResp = reviews.filter((r) => (r as { barberResponse?: string | null; adminResponse?: string | null }).barberResponse != null || (r as { barberResponse?: string | null; adminResponse?: string | null }).adminResponse != null);
      reviewsWithResponse = withResp.length;
      reviewsResponseRate = reviewsTotal > 0 ? (reviewsWithResponse / reviewsTotal) * 100 : 0;
      ratingDist = [1, 2, 3, 4, 5].map((rating) => {
        const count = reviews.filter((r) => r.rating === rating).length;
        return { rating, count, percentage: reviewsTotal > 0 ? (count / reviewsTotal) * 100 : 0 };
      });
      const pos = ['great', 'excellent', 'amazing', 'love', 'best', 'happy', 'recommend', 'perfect', 'good', 'nice', 'friendly', 'professional', 'clean', 'fast', 'satisfied'];
      const neg = ['bad', 'terrible', 'worst', 'slow', 'rude', 'dirty', 'disappointed', 'poor', 'never', 'unprofessional', 'late', 'messy', 'awful', 'horrible', 'waste', 'complaint'];
      let posCount = 0, negCount = 0;
      const themeCounts: Record<string, number> = {};
      for (const r of reviews) {
        const c = (r.comment || '').toLowerCase();
        pos.forEach((w) => { if (c.includes(w)) posCount++; });
        neg.forEach((w) => { if (c.includes(w)) negCount++; });
        if (c.includes('wait') || c.includes('time')) themeCounts['Wait time'] = (themeCounts['Wait time'] ?? 0) + 1;
        if (c.includes('price') || c.includes('cost')) themeCounts['Pricing'] = (themeCounts['Pricing'] ?? 0) + 1;
        if (c.includes('quality') || c.includes('result')) themeCounts['Service quality'] = (themeCounts['Service quality'] ?? 0) + 1;
        if (c.includes('staff') || c.includes('barber') || c.includes('friendly')) themeCounts['Staff/Barber'] = (themeCounts['Staff/Barber'] ?? 0) + 1;
        if (c.includes('clean') || c.includes('hygiene')) themeCounts['Cleanliness'] = (themeCounts['Cleanliness'] ?? 0) + 1;
      }
      sentimentSummary = { positiveMentions: posCount, negativeMentions: negCount, sentimentRatio: negCount > 0 ? Number((posCount / negCount).toFixed(2)) : (posCount > 0 ? 999 : 0) };
      feedbackThemes = Object.entries(themeCounts).map(([theme, count]) => ({ theme, count })).sort((a, b) => b.count - a.count).slice(0, 10);
      const byBarberMap = new Map<string, { count: number; ratings: number[] }>();
      for (const r of reviews) {
        const name = r.barber?.user?.name || 'Unknown';
        if (!byBarberMap.has(name)) byBarberMap.set(name, { count: 0, ratings: [] });
        const e = byBarberMap.get(name)!;
        e.count++;
        e.ratings.push(r.rating);
      }
      reviewsByBarber = [...byBarberMap.entries()]
        .map(([barberName, v]) => ({ barberName, count: v.count, avgRating: v.ratings.reduce((a, b) => a + b, 0) / v.ratings.length }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      recentReviewsList = reviews
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map((r) => ({
          rating: r.rating,
          comment: r.comment,
          barberName: r.barber?.user?.name || 'Unknown',
          serviceName: r.order?.items?.[0]?.product?.title || 'Unknown',
          createdAt: r.createdAt,
        }));
    } catch (_) {}

    // ─── Staff & barbers ────────────────────────────────────────────────────
    const [totalBarbers, activeBarbers, applicationsPending, applicationsApprovedWeek, applicationsRejectedWeek] = await Promise.all([
      prisma.barber.count(),
      prisma.barber.count({ where: { status: 'ACTIVE' } }),
      prisma.barberApplication.count({ where: { status: 'PENDING' } }),
      prisma.barberApplication.count({ where: { status: 'APPROVED', reviewedAt: { gte: weekStart, lte: weekEnd } } }),
      prisma.barberApplication.count({ where: { status: 'REJECTED', reviewedAt: { gte: weekStart, lte: weekEnd } } }),
    ]);

    // ─── Operations (optional) ─────────────────────────────────────────────
    let supportOpen = 0, supportResolvedWeek = 0, supportTotalWeek = 0;
    try {
      const [o, rw, tw] = await Promise.all([
        prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
        prisma.supportTicket.count({ where: { status: 'RESOLVED', resolvedAt: { gte: weekStart, lte: weekEnd } } }),
        prisma.supportTicket.count({ where: { createdAt: weekWhere.createdAt } }),
      ]);
      supportOpen = o;
      supportResolvedWeek = rw;
      supportTotalWeek = tw;
    } catch (_) {}

    // ─── Marketing (optional) ───────────────────────────────────────────────
    let commSent = 0, commByType: { type: string; count: number }[] = [];
    try {
      const comms = await prisma.customerCommunication.findMany({
        where: { createdAt: weekWhere.createdAt },
        select: { type: true, status: true },
      });
      commSent = comms.length;
      const byType = new Map<string, number>();
      comms.forEach((c) => byType.set(c.type || 'unknown', (byType.get(c.type || 'unknown') || 0) + 1));
      commByType = [...byType.entries()].map(([type, count]) => ({ type, count }));
    } catch (_) {}

    // ─── Inventory (current snapshot) ───────────────────────────────────────
    let inventoryTotal = 0, lowStockCount = 0, outOfStockCount = 0, inventoryValueTotal = 0;
    let lowStockList: { title: string; stockQuantity: number; reorderPoint: number }[] = [];
    let outOfStockList: { title: string }[] = [];
    try {
      const products = await prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, title: true, stockQuantity: true, reorderPoint: true, costPrice: true },
      });
      inventoryTotal = products.length;
      for (const p of products) {
        const stock = p.stockQuantity ?? 0;
        const reorder = p.reorderPoint ?? 0;
        inventoryValueTotal += stock * Number(p.costPrice ?? 0);
        if (reorder > 0 && stock <= reorder && stock > 0) {
          lowStockList.push({ title: p.title, stockQuantity: stock, reorderPoint: reorder });
        }
        if (stock <= 0) {
          outOfStockList.push({ title: p.title });
        }
      }
      lowStockCount = lowStockList.length;
      outOfStockCount = outOfStockList.length;
    } catch (_) {}

    // ─── Build HTML ─────────────────────────────────────────────────────────
    const resolutionRate = supportTotalWeek > 0 ? ((supportResolvedWeek / supportTotalWeek) * 100).toFixed(1) : '0';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Weekly Report</title></head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #333; max-width: 720px; margin: 0 auto; padding: 24px;">
  <h1 style="color: #39413f; margin-bottom: 4px;">Weekly Analytics Report</h1>
  <p style="color: #6c757d; margin: 0 0 24px 0;">${periodLabel} — every detail the dashboard tracked this week.</p>

  <h2 style="color: #39413f; font-size: 1.1rem; margin: 24px 0 12px 0; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px;">1. Financial & orders</h2>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
    <tr style="background: #f8f9fa;"><td style="padding: 10px; border: 1px solid #e5e5e5;"><strong>Revenue (this week)</strong></td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${fmt(revenue)}</td></tr>
    <tr><td style="padding: 10px; border: 1px solid #e5e5e5;">Week-over-week</td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right; color: ${wowGrowth >= 0 ? '#46B450' : '#dc3232'}">${wowGrowth >= 0 ? '+' : ''}${wowGrowth.toFixed(1)}%</td></tr>
    <tr style="background: #f8f9fa;"><td style="padding: 10px; border: 1px solid #e5e5e5;">Orders (total)</td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${weekOrdersTotal}</td></tr>
    <tr><td style="padding: 10px; border: 1px solid #e5e5e5;">Orders (paid)</td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${weekOrdersPaid}</td></tr>
    <tr style="background: #f8f9fa;"><td style="padding: 10px; border: 1px solid #e5e5e5;">Orders (pending)</td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${weekOrdersPending}</td></tr>
    <tr><td style="padding: 10px; border: 1px solid #e5e5e5;">Orders (failed)</td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${weekOrdersFailed}</td></tr>
    <tr style="background: #f8f9fa;"><td style="padding: 10px; border: 1px solid #e5e5e5;">Orders (refunded)</td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${weekOrdersRefunded}</td></tr>
    <tr><td style="padding: 10px; border: 1px solid #e5e5e5;">New customers</td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${newCustomersWeek}</td></tr>
  </table>
  ${ordersByStatus.length > 0 ? `<p style="margin: 0 0 8px 0;"><strong>Orders by status:</strong> ${ordersByStatus.map((s: { status: string; _count: { id: number } }) => `${s.status} (${s._count.id})`).join(', ')}</p>` : ''}
  ${ordersByJobStatus.filter((s: { jobStatus: string | null }) => s.jobStatus).length > 0 ? `<p style="margin: 0 0 12px 0;"><strong>Orders by job status:</strong> ${ordersByJobStatus.filter((s: { jobStatus: string | null }) => s.jobStatus).map((s: { jobStatus: string | null; _count: { id: number } }) => `${s.jobStatus} (${s._count.id})`).join(', ')}</p>` : ''}
  ${(ordersByPaymentMethod as { paymentMethod: string | null; _sum: { totalAmount: unknown }; _count: { id: number } }[]).length > 0 ? `
  <p style="margin: 8px 0 4px 0;"><strong>Revenue by payment method:</strong></p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
    ${(ordersByPaymentMethod as { paymentMethod: string | null; _sum: { totalAmount: unknown }; _count: { id: number } }[]).map((m) => `<tr><td style="padding: 6px 10px; border: 1px solid #e5e5e5;">${esc(m.paymentMethod || '')}</td><td style="padding: 6px 10px; border: 1px solid #e5e5e5; text-align: right;">${fmt(Number(m._sum?.totalAmount || 0))} (${m._count.id} orders)</td></tr>`).join('')}
  </table>` : ''}
  ${revenueByCity.length > 0 ? `<p style="margin: 0 0 8px 0;"><strong>Revenue by city:</strong> ${revenueByCity.map((c) => `${c.city}: ${fmt(Number((c._sum as { totalAmount?: unknown })?.totalAmount || 0))}`).join('; ')}</p>` : ''}
  ${topItems.length > 0 ? `<p style="margin: 12px 0 4px 0;"><strong>Top items by revenue:</strong></p><table style="width: 100%; border-collapse: collapse;"><tbody>${topItems.map((i) => `<tr><td style="padding: 6px 10px; border: 1px solid #e5e5e5;">${esc(i.title)}</td><td style="padding: 6px 10px; border: 1px solid #e5e5e5; text-align: right;">${fmt(i.revenue)}</td></tr>`).join('')}</tbody></table>` : ''}
  ${topBarbers.length > 0 ? `<p style="margin: 12px 0 4px 0;"><strong>Top barbers by revenue:</strong></p><table style="width: 100%; border-collapse: collapse;"><thead><tr style="background: #f8f9fa;"><th style="padding: 6px 10px; border: 1px solid #e5e5e5;">Barber</th><th style="padding: 6px 10px; border: 1px solid #e5e5e5; text-align: right;">Revenue</th><th style="padding: 6px 10px; border: 1px solid #e5e5e5; text-align: right;">Orders</th></tr></thead><tbody>${topBarbers.map((b) => `<tr><td style="padding: 6px 10px; border: 1px solid #e5e5e5;">${esc(b.name)}</td><td style="padding: 6px 10px; border: 1px solid #e5e5e5; text-align: right;">${fmt(b.revenue)}</td><td style="padding: 6px 10px; border: 1px solid #e5e5e5; text-align: right;">${b.orders}</td></tr>`).join('')}</tbody></table>` : ''}
  ${recentOrdersWeek.length > 0 ? `<p style="margin: 12px 0 4px 0;"><strong>Recent transactions (this week):</strong></p><table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;"><tbody>${recentOrdersWeek.map((o: { orderNumber: string; customerName: string; totalAmount: unknown; status: string; paymentStatus: string; createdAt: Date }) => `<tr><td style="padding: 6px 10px; border: 1px solid #e5e5e5;">${esc(o.orderNumber)}</td><td style="padding: 6px 10px; border: 1px solid #e5e5e5;">${esc(o.customerName)}</td><td style="padding: 6px 10px; border: 1px solid #e5e5e5; text-align: right;">${fmt(Number(o.totalAmount))}</td><td style="padding: 6px 10px; border: 1px solid #e5e5e5;">${o.status} / ${o.paymentStatus}</td><td style="padding: 6px 10px; border: 1px solid #e5e5e5;">${new Date(o.createdAt).toLocaleString()}</td></tr>`).join('')}</tbody></table>` : ''}
  ${refundsWeek.length > 0 ? `<p style="margin: 12px 0 4px 0;"><strong>Refunds this week:</strong></p><ul style="margin: 0 0 16px 0;">${refundsWeek.map((r: { orderNumber: string; customerName: string; totalAmount: unknown; updatedAt: Date }) => `<li>${esc(r.orderNumber)} — ${esc(r.customerName)} — ${fmt(Number(r.totalAmount))} (${new Date(r.updatedAt).toLocaleDateString()})</li>`).join('')}</ul>` : ''}

  <h2 style="color: #39413f; font-size: 1.1rem; margin: 24px 0 12px 0; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px;">2. Site traffic</h2>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
    <tr style="background: #f8f9fa;"><td style="padding: 10px; border: 1px solid #e5e5e5;"><strong>Total page views</strong></td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${totalPageViews.toLocaleString()}</td></tr>
    <tr><td style="padding: 10px; border: 1px solid #e5e5e5;">Unique visitors (sessions)</td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${uniqueVisitors.toLocaleString()}</td></tr>
  </table>
  ${overTime.length > 0 ? `<p style="margin: 8px 0 4px 0;"><strong>Page views by day:</strong></p><table style="width: 100%; border-collapse: collapse;"><tbody>${overTime.map((d) => `<tr><td style="padding: 6px 10px; border: 1px solid #e5e5e5;">${d.date}</td><td style="padding: 6px 10px; border: 1px solid #e5e5e5; text-align: right;">${d.count}</td></tr>`).join('')}</tbody></table>` : ''}
  ${byPage.length > 0 ? `<p style="margin: 12px 0 4px 0;"><strong>Top pages:</strong></p><table style="width: 100%; border-collapse: collapse;"><tbody>${byPage.map((r) => `<tr><td style="padding: 6px 10px; border: 1px solid #e5e5e5;">${esc(r.url)}</td><td style="padding: 6px 10px; border: 1px solid #e5e5e5; text-align: right;">${r.count}</td></tr>`).join('')}</tbody></table>` : ''}
  ${byReferrer.length > 0 ? `<p style="margin: 8px 0 4px 0;"><strong>Top referrers:</strong></p><table style="width: 100%; border-collapse: collapse;"><tbody>${byReferrer.map((r) => `<tr><td style="padding: 6px 10px; border: 1px solid #e5e5e5;">${esc(r.referrer)}</td><td style="padding: 6px 10px; border: 1px solid #e5e5e5; text-align: right;">${r.count}</td></tr>`).join('')}</tbody></table>` : ''}
  ${byDevice.length > 0 ? `<p style="margin: 8px 0 4px 0;"><strong>By device:</strong> ${byDevice.map((d) => `${d.device}: ${d.count}`).join(', ')}</p>` : ''}
  ${byCountry.length > 0 ? `<p style="margin: 8px 0 4px 0;"><strong>By country:</strong></p><table style="width: 100%; border-collapse: collapse;"><tbody>${byCountry.map((r) => `<tr><td style="padding: 6px 10px; border: 1px solid #e5e5e5;">${esc(r.country)}</td><td style="padding: 6px 10px; border: 1px solid #e5e5e5; text-align: right;">${r.count}</td></tr>`).join('')}</tbody></table>` : ''}
  ${byCity.length > 0 ? `<p style="margin: 8px 0 4px 0;"><strong>By city:</strong></p><table style="width: 100%; border-collapse: collapse;"><tbody>${byCity.map((r) => `<tr><td style="padding: 6px 10px; border: 1px solid #e5e5e5;">${esc(r.city)}</td><td style="padding: 6px 10px; border: 1px solid #e5e5e5; text-align: right;">${r.count}</td></tr>`).join('')}</tbody></table>` : ''}
  ${totalPageViews === 0 && uniqueVisitors === 0 ? '<p style="color: #6c757d;">No traffic data for this week.</p>' : ''}

  <h2 style="color: #39413f; font-size: 1.1rem; margin: 24px 0 12px 0; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px;">3. Reviews & feedback</h2>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
    <tr style="background: #f8f9fa;"><td style="padding: 10px; border: 1px solid #e5e5e5;"><strong>Reviews this week</strong></td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${reviewsTotal}</td></tr>
    <tr><td style="padding: 10px; border: 1px solid #e5e5e5;">Average rating</td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${reviewsAvgRating.toFixed(2)}</td></tr>
    <tr style="background: #f8f9fa;"><td style="padding: 10px; border: 1px solid #e5e5e5;">Response rate</td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${reviewsResponseRate.toFixed(1)}%</td></tr>
    <tr><td style="padding: 10px; border: 1px solid #e5e5e5;">Reviews with response</td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${reviewsWithResponse}</td></tr>
    <tr style="background: #f8f9fa;"><td style="padding: 10px; border: 1px solid #e5e5e5;">Sentiment (positive / negative)</td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${sentimentSummary.positiveMentions} / ${sentimentSummary.negativeMentions} (ratio ${sentimentSummary.sentimentRatio})</td></tr>
  </table>
  ${ratingDist.some((d) => d.count > 0) ? `<p style="margin: 8px 0 4px 0;"><strong>Rating distribution:</strong> ${ratingDist.map((d) => `${d.rating}★: ${d.count} (${d.percentage.toFixed(1)}%)`).join(', ')}</p>` : ''}
  ${feedbackThemes.length > 0 ? `<p style="margin: 8px 0 4px 0;"><strong>Feedback themes:</strong> ${feedbackThemes.map((t) => `${t.theme} (${t.count})`).join(', ')}</p>` : ''}
  ${reviewsByBarber.length > 0 ? `<p style="margin: 12px 0 4px 0;"><strong>Reviews by barber:</strong></p><table style="width: 100%; border-collapse: collapse;"><tbody>${reviewsByBarber.map((b) => `<tr><td style="padding: 6px 10px; border: 1px solid #e5e5e5;">${esc(b.barberName)}</td><td style="padding: 6px 10px; border: 1px solid #e5e5e5; text-align: right;">${b.count}</td><td style="padding: 6px 10px; border: 1px solid #e5e5e5; text-align: right;">${b.avgRating.toFixed(1)}</td></tr>`).join('')}</tbody></table>` : ''}
  ${recentReviewsList.length > 0 ? `<p style="margin: 12px 0 4px 0;"><strong>Recent reviews:</strong></p><table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;"><tbody>${recentReviewsList.map((r) => `<tr><td style="padding: 6px 10px; border: 1px solid #e5e5e5;">${r.rating}★</td><td style="padding: 6px 10px; border: 1px solid #e5e5e5;">${esc((r.comment || '').slice(0, 80))}${(r.comment || '').length > 80 ? '…' : ''}</td><td style="padding: 6px 10px; border: 1px solid #e5e5e5;">${esc(r.barberName)}</td><td style="padding: 6px 10px; border: 1px solid #e5e5e5;">${esc(r.serviceName)}</td><td style="padding: 6px 10px; border: 1px solid #e5e5e5;">${new Date(r.createdAt).toLocaleString()}</td></tr>`).join('')}</tbody></table>` : ''}
  ${reviewsTotal === 0 ? '<p style="color: #6c757d;">No reviews this week.</p>' : ''}

  <h2 style="color: #39413f; font-size: 1.1rem; margin: 24px 0 12px 0; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px;">4. Staff & barbers</h2>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
    <tr style="background: #f8f9fa;"><td style="padding: 10px; border: 1px solid #e5e5e5;"><strong>Total barbers</strong></td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${totalBarbers}</td></tr>
    <tr><td style="padding: 10px; border: 1px solid #e5e5e5;">Active barbers</td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${activeBarbers}</td></tr>
    <tr style="background: #f8f9fa;"><td style="padding: 10px; border: 1px solid #e5e5e5;">Recruitment: pending applications</td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${applicationsPending}</td></tr>
    <tr><td style="padding: 10px; border: 1px solid #e5e5e5;">Approved this week</td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${applicationsApprovedWeek}</td></tr>
    <tr style="background: #f8f9fa;"><td style="padding: 10px; border: 1px solid #e5e5e5;">Declined this week</td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${applicationsRejectedWeek}</td></tr>
  </table>

  ${supportOpen + supportResolvedWeek + supportTotalWeek > 0 ? `
  <h2 style="color: #39413f; font-size: 1.1rem; margin: 24px 0 12px 0; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px;">5. Operations</h2>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
    <tr style="background: #f8f9fa;"><td style="padding: 10px; border: 1px solid #e5e5e5;">Support tickets open</td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${supportOpen}</td></tr>
    <tr><td style="padding: 10px; border: 1px solid #e5e5e5;">Resolved this week</td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${supportResolvedWeek}</td></tr>
    <tr style="background: #f8f9fa;"><td style="padding: 10px; border: 1px solid #e5e5e5;">Total this week</td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${supportTotalWeek}</td></tr>
    <tr><td style="padding: 10px; border: 1px solid #e5e5e5;">Resolution rate</td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${resolutionRate}%</td></tr>
  </table>` : ''}

  ${commSent > 0 ? `
  <h2 style="color: #39413f; font-size: 1.1rem; margin: 24px 0 12px 0; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px;">6. Marketing</h2>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
    <tr style="background: #f8f9fa;"><td style="padding: 10px; border: 1px solid #e5e5e5;">Communications sent this week</td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${commSent}</td></tr>
  </table>
  ${commByType.length > 0 ? `<p style="margin: 8px 0 4px 0;"><strong>By type:</strong> ${commByType.map((t) => `${t.type}: ${t.count}`).join(', ')}</p>` : ''}` : ''}

  <h2 style="color: #39413f; font-size: 1.1rem; margin: 24px 0 12px 0; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px;">${supportOpen + supportResolvedWeek + supportTotalWeek > 0 || commSent > 0 ? '7' : '5'}. Inventory (current snapshot)</h2>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
    <tr style="background: #f8f9fa;"><td style="padding: 10px; border: 1px solid #e5e5e5;"><strong>Total products</strong></td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${inventoryTotal}</td></tr>
    <tr><td style="padding: 10px; border: 1px solid #e5e5e5;">Low stock alerts</td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${lowStockCount}</td></tr>
    <tr style="background: #f8f9fa;"><td style="padding: 10px; border: 1px solid #e5e5e5;">Out of stock</td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${outOfStockCount}</td></tr>
    <tr><td style="padding: 10px; border: 1px solid #e5e5e5;">Inventory value (total)</td><td style="padding: 10px; border: 1px solid #e5e5e5; text-align: right;">${fmt(inventoryValueTotal)}</td></tr>
  </table>
  ${lowStockList.length > 0 ? `<p style="margin: 8px 0 4px 0;"><strong>Low stock:</strong></p><ul style="margin: 0 0 8px 0;">${lowStockList.map((p) => `<li>${esc(p.title)} — stock: ${p.stockQuantity}, reorder at: ${p.reorderPoint}</li>`).join('')}</ul>` : ''}
  ${outOfStockList.length > 0 ? `<p style="margin: 8px 0 4px 0;"><strong>Out of stock:</strong></p><ul style="margin: 0 0 16px 0;">${outOfStockList.map((p) => `<li>${esc(p.title)}</li>`).join('')}</ul>` : ''}

  <p style="color: #6c757d; font-size: 0.875rem; margin: 32px 0 0 0;">This report contains every detail the dashboard tracked for the week. Generated from the Analytics & Financial Dashboard.</p>
</body>
</html>`;

    const text = `Weekly Analytics Report (${periodLabel})
Revenue: ${fmt(revenue)} (${wowGrowth >= 0 ? '+' : ''}${wowGrowth.toFixed(1)}% WoW)
Orders: ${weekOrdersTotal} total, ${weekOrdersPaid} paid. New customers: ${newCustomersWeek}
Traffic: ${totalPageViews} page views, ${uniqueVisitors} unique visitors
Reviews: ${reviewsTotal} (avg ${reviewsAvgRating.toFixed(2)}). Staff: ${totalBarbers} barbers, ${activeBarbers} active.
View the full dashboard for more details.`;

    const result = await emailService.sendEmail({
      to: user.email,
      subject: `Weekly Analytics Report – ${periodLabel}`,
      html,
      text,
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
