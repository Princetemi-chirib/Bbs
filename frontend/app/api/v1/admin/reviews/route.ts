import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '../utils';
import { ReviewStatus, ReviewSource } from '@prisma/client';

export const dynamic = 'force-dynamic';

const COMMENT_TRUNCATE = 80;

// GET /api/v1/admin/reviews - List with filters (date, barber, rating, source, visibility)
export async function GET(request: NextRequest) {
  try {
    const adminOrRep = await verifyAdminOrRep(request);
    if (!adminOrRep) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin or REP access required.' } },
        { status: 401 }
      );
    }

    const sp = request.nextUrl.searchParams;
    const visibility = sp.get('visibility'); // 'all' | 'visible' | 'hidden'
    const startDate = sp.get('startDate');
    const endDate = sp.get('endDate');
    const barberId = sp.get('barberId');
    const rating = sp.get('rating'); // '1'..'5'
    const source = sp.get('source'); // 'APP' | 'GOOGLE' | 'WALK_IN'
    const reviewStatus = sp.get('reviewStatus'); // NEW, RESPONDED, ESCALATED, RESOLVED, IGNORED
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (visibility === 'visible') where.isVisible = true;
    else if (visibility === 'hidden') where.isVisible = false;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(endDate);
    }
    if (barberId) where.barberId = barberId;
    if (rating) {
      const r = parseInt(rating, 10);
      if (r >= 1 && r <= 5) where.rating = r;
    }
    if (source && ['APP', 'GOOGLE', 'WALK_IN'].includes(source)) where.source = source as ReviewSource;
    if (reviewStatus && Object.values(ReviewStatus).includes(reviewStatus as ReviewStatus)) {
      where.status = reviewStatus as ReviewStatus;
    }

    const [rows, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          customer: {
            include: {
              user: {
                select: { name: true, email: true, avatarUrl: true },
              },
            },
          },
          barber: {
            include: {
              user: {
                select: { name: true, email: true },
              },
            },
          },
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              createdAt: true,
              totalAmount: true,
              items: {
                include: {
                  product: { select: { id: true, title: true, category: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    const data = rows.map((r) => {
      const comment = r.comment ?? '';
      const truncated = comment.length > COMMENT_TRUNCATE ? comment.slice(0, COMMENT_TRUNCATE) + '…' : comment;
      const serviceName = r.order?.items?.[0]?.product?.title ?? '—';
      return {
        id: r.id,
        orderId: r.orderId,
        orderNumber: r.order?.orderNumber ?? '—',
        date: r.createdAt,
        customerName: r.customer?.user?.name ?? 'Anonymous',
        customerEmail: r.customer?.user?.email ?? null,
        customerAvatarUrl: r.customer?.user?.avatarUrl ?? null,
        rating: r.rating,
        comment: comment,
        commentTruncated: truncated,
        barberId: r.barberId,
        barberName: r.barber?.user?.name ?? '—',
        serviceName,
        status: r.status,
        visibility: r.isVisible ? 'Public' : 'Internal',
        isVisible: r.isVisible,
        source: r.source,
        assignedTo: r.assignedTo ? { id: r.assignedTo.id, name: r.assignedTo.name, email: r.assignedTo.email } : null,
        barberResponse: r.barberResponse,
        barberResponseAt: r.barberResponseAt,
        adminResponse: r.adminResponse,
        adminResponseAt: r.adminResponseAt,
        escalatedAt: r.escalatedAt,
        resolvedAt: r.resolvedAt,
        resolutionOutcome: r.resolutionOutcome,
        slaDueAt: r.slaDueAt,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (e: unknown) {
    console.error('Get reviews error:', e);
    return NextResponse.json(
      { success: false, error: { message: e instanceof Error ? e.message : 'Failed to fetch reviews' } },
      { status: 500 }
    );
  }
}
