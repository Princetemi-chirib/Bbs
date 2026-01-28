import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '@/app/api/v1/utils/auth';

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

    // Get all reviews with related data (Review links to Order, not Booking; use order.items[].product as service proxy)
    const reviews = await prisma.review.findMany({
      where: {
        ...dateFilter,
        isVisible: true,
      },
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

    // Total reviews
    const totalReviews = reviews.length;

    // Average rating
    const avgRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // Rating distribution (1-5 stars)
    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: reviews.filter(r => r.rating === rating).length,
      percentage: totalReviews > 0
        ? (reviews.filter(r => r.rating === rating).length / totalReviews) * 100
        : 0,
    }));

    // Reviews with responses (response rate)
    const reviewsWithResponse = reviews.filter(r => r.barberResponse != null).length;
    const responseRate = totalReviews > 0 ? (reviewsWithResponse / totalReviews) * 100 : 0;

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

    return NextResponse.json({
      success: true,
      data: {
        totalReviews,
        avgRating: Number(avgRating.toFixed(2)),
        ratingDistribution,
        responseRate: Number(responseRate.toFixed(1)),
        reviewsWithResponse,
        reviewsByBarber: reviewsByBarber.slice(0, 20),
        reviewsByService: reviewsByService.slice(0, 20),
        reviewsByCategory,
        recentReviews,
      },
    });
  } catch (error: any) {
    console.error('Get reviews analytics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch reviews analytics',
        },
      },
      { status: 500 }
    );
  }
}

