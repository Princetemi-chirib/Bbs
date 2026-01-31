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
    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return { start: weekStart, end: now };
    case 'month':
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: monthStart, end: now };
    case 'quarter': {
      const q = Math.floor(today.getMonth() / 3) + 1;
      const quarterStart = new Date(today.getFullYear(), (q - 1) * 3, 1);
      return { start: quarterStart, end: now };
    }
    case 'year':
      const yearStart = new Date(today.getFullYear(), 0, 1);
      return { start: yearStart, end: now };
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
    const period = searchParams.get('period') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    } else if (period !== 'all') {
      const range = getDateRange(period);
      if (range.start) {
        dateFilter.createdAt = { gte: range.start };
        if (range.end) dateFilter.createdAt.lte = range.end;
      }
    }

    const baseWhere = { ...dateFilter } as Record<string, unknown>;
    const visibleWhere = { ...baseWhere, isVisible: true };

    // Overlay metrics: all-time total, new in period, unresolved negative (1–2 star, not resolved/ignored)
    const [allTimeTotal, newInPeriod, unresolvedNegative] = await Promise.all([
      prisma.review.count({ where: { isVisible: true } }),
      Object.keys(dateFilter).length
        ? prisma.review.count({ where: visibleWhere })
        : Promise.resolve(0),
      prisma.review.count({
        where: {
          rating: { lte: 2 },
          status: { notIn: ['RESOLVED', 'IGNORED'] },
          ...(Object.keys(dateFilter).length ? dateFilter : {}),
        },
      }),
    ]);

    // Get all reviews in scope (visible) with related data
    const reviews = await prisma.review.findMany({
      where: visibleWhere,
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    title: true,
                    category: true,
                  },
                },
              },
            },
          },
        },
        barber: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
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
    });

    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: reviews.filter(r => r.rating === rating).length,
      percentage: totalReviews > 0
        ? (reviews.filter(r => r.rating === rating).length / totalReviews) * 100
        : 0,
    }));

    const c5 = reviews.filter(r => r.rating === 5).length;
    const c12 = reviews.filter(r => r.rating === 1 || r.rating === 2).length;
    const fiveStarVsOneTwoRatio = c12 > 0 ? Number((c5 / c12).toFixed(2)) : (c5 > 0 ? 999 : 0);

    const reviewsWithResponse = reviews.filter(
      r => (r as { barberResponse?: string | null; adminResponse?: string | null }).barberResponse != null ||
           (r as { barberResponse?: string | null; adminResponse?: string | null }).adminResponse != null
    ).length;
    const responseRate = totalReviews > 0 ? (reviewsWithResponse / totalReviews) * 100 : 0;

    const withResponseTime = reviews.filter(r => {
      const br = (r as { barberResponseAt?: Date | null }).barberResponseAt;
      const ar = (r as { adminResponseAt?: Date | null }).adminResponseAt;
      return br != null || ar != null;
    });
    const responseTimesMs = withResponseTime.map(r => {
      const created = new Date(r.createdAt).getTime();
      const br = (r as { barberResponseAt?: Date | null }).barberResponseAt;
      const ar = (r as { adminResponseAt?: Date | null }).adminResponseAt;
      let first = Infinity;
      if (br) first = Math.min(first, new Date(br).getTime());
      if (ar) first = Math.min(first, new Date(ar).getTime());
      return first === Infinity ? 0 : first - created;
    }).filter(Boolean);
    const avgResponseTimeHours = responseTimesMs.length > 0
      ? responseTimesMs.reduce((a, b) => a + b, 0) / responseTimesMs.length / (1000 * 60 * 60)
      : null;

    // Reviews by barber
    const byBarber = new Map<string, {
      barberId: string;
      barberName: string;
      count: number;
      avgRating: number;
      ratings: number[];
    }>();

    for (const review of reviews) {
      const key = review.barberId;
      if (!byBarber.has(key)) {
        byBarber.set(key, {
          barberId: key,
          barberName: review.barber.user.name,
          count: 0,
          avgRating: 0,
          ratings: [],
        });
      }
      const entry = byBarber.get(key)!;
      entry.count++;
      entry.ratings.push(review.rating);
    }

    const reviewsByBarber = Array.from(byBarber.values()).map(entry => ({
      ...entry,
      avgRating: entry.ratings.reduce((a, b) => a + b, 0) / entry.ratings.length,
    })).sort((a, b) => b.count - a.count);

    // Reviews by service
    const byService = new Map<string, {
      serviceId: string;
      serviceName: string;
      category: string;
      count: number;
      avgRating: number;
      ratings: number[];
    }>();

    for (const review of reviews) {
      const product = review.order?.items?.[0]?.product;
      if (!product) continue;
      const key = product.id;
      if (!byService.has(key)) {
        byService.set(key, {
          serviceId: key,
          serviceName: product.title,
          category: String(product.category),
          count: 0,
          avgRating: 0,
          ratings: [],
        });
      }
      const entry = byService.get(key)!;
      entry.count++;
      entry.ratings.push(review.rating);
    }

    const reviewsByService = Array.from(byService.values()).map(entry => ({
      ...entry,
      avgRating: entry.ratings.reduce((a, b) => a + b, 0) / entry.ratings.length,
    })).sort((a, b) => b.count - a.count);

    // Reviews by service category
    const byCategory = new Map<string, {
      category: string;
      count: number;
      avgRating: number;
      ratings: number[];
    }>();

    for (const review of reviews) {
      const category = review.order?.items?.[0]?.product?.category != null ? String(review.order.items[0].product!.category) : 'Unknown';
      if (!byCategory.has(category)) {
        byCategory.set(category, {
          category,
          count: 0,
          avgRating: 0,
          ratings: [],
        });
      }
      const entry = byCategory.get(category)!;
      entry.count++;
      entry.ratings.push(review.rating);
    }

    const reviewsByCategory = Array.from(byCategory.values()).map(entry => ({
      ...entry,
      avgRating: entry.ratings.reduce((a, b) => a + b, 0) / entry.ratings.length,
    })).sort((a, b) => b.count - a.count);

    // Recent reviews (last 20)
    const recentReviews = reviews
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20)
      .map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        barberResponse: r.barberResponse,
        barberResponseAt: r.barberResponseAt,
        barberName: r.barber.user.name,
        serviceName: r.order?.items?.[0]?.product?.title || 'Unknown',
        customerName: r.customer.user.name,
        createdAt: r.createdAt,
      }));

    // §8.1 Sentiment analysis: simple keyword-based (positive/negative word counts)
    const positiveWords = ['great', 'excellent', 'amazing', 'love', 'best', 'happy', 'recommend', 'perfect', 'wonderful', 'fantastic', 'good', 'nice', 'friendly', 'professional', 'clean', 'fast', 'satisfied'];
    const negativeWords = ['bad', 'terrible', 'worst', 'slow', 'rude', 'dirty', 'disappointed', 'poor', 'never', 'unprofessional', 'late', 'messy', 'awful', 'horrible', 'waste', 'complaint'];
    const toTokens = (text: string | null) => (text || '').toLowerCase().replace(/\s+/g, ' ').split(' ').filter(Boolean);
    let positiveCount = 0;
    let negativeCount = 0;
    const themeCounts: Record<string, number> = {};
    for (const r of reviews) {
      const comment = (r.comment || '').toLowerCase();
      const tokens = toTokens(r.comment);
      for (const w of positiveWords) {
        if (comment.includes(w)) positiveCount++;
      }
      for (const w of negativeWords) {
        if (comment.includes(w)) negativeCount++;
      }
      // Simple themes: map keywords to theme labels
      if (comment.includes('wait') || comment.includes('time')) themeCounts['Wait time'] = (themeCounts['Wait time'] ?? 0) + 1;
      if (comment.includes('price') || comment.includes('cost') || comment.includes('expensive')) themeCounts['Pricing'] = (themeCounts['Pricing'] ?? 0) + 1;
      if (comment.includes('quality') || comment.includes('result') || comment.includes('haircut') || comment.includes('style')) themeCounts['Service quality'] = (themeCounts['Service quality'] ?? 0) + 1;
      if (comment.includes('staff') || comment.includes('barber') || comment.includes('friendly') || comment.includes('rude')) themeCounts['Staff/Barber'] = (themeCounts['Staff/Barber'] ?? 0) + 1;
      if (comment.includes('clean') || comment.includes('hygiene') || comment.includes('dirty')) themeCounts['Cleanliness'] = (themeCounts['Cleanliness'] ?? 0) + 1;
      if (comment.includes('book') || comment.includes('appointment') || comment.includes('easy')) themeCounts['Booking experience'] = (themeCounts['Booking experience'] ?? 0) + 1;
    }
    const sentimentSummary = {
      positiveMentions: positiveCount,
      negativeMentions: negativeCount,
      sentimentRatio: negativeCount > 0 ? Number((positiveCount / negativeCount).toFixed(2)) : (positiveCount > 0 ? 999 : 0),
    };
    const feedbackThemes = Object.entries(themeCounts)
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    return NextResponse.json({
      success: true,
      data: {
        totalReviews: allTimeTotal,
        totalInPeriod: totalReviews,
        newInPeriod: Object.keys(dateFilter).length ? newInPeriod : allTimeTotal,
        avgRating: Number(avgRating.toFixed(2)),
        fiveStarVsOneTwoRatio,
        unresolvedNegative,
        responseRate: Number(responseRate.toFixed(1)),
        reviewsWithResponse,
        avgResponseTimeHours: avgResponseTimeHours != null ? Number(avgResponseTimeHours.toFixed(2)) : null,
        ratingDistribution,
        reviewsByBarber: reviewsByBarber.slice(0, 20),
        reviewsByService: reviewsByService.slice(0, 20),
        reviewsByCategory,
        recentReviews,
        sentimentSummary,
        feedbackThemes,
      },
    });
  } catch (e: unknown) {
    console.error('Get reviews analytics error:', e);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: e instanceof Error ? e.message : 'Failed to fetch reviews analytics',
        },
      },
      { status: 500 }
    );
  }
}



