import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '../../../utils';

export const dynamic = 'force-dynamic';

// GET /api/v1/admin/reviews/[id]/detail - Full context, order info, customer snapshot, response history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAdminOrRep(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const id = params.id;
    const review = await prisma.review.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          include: {
            user: { select: { name: true, email: true, avatarUrl: true } },
          },
        },
        barber: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        assignedTo: { select: { id: true, name: true, email: true } },
        order: {
          include: {
            items: {
              include: {
                product: { select: { id: true, title: true, category: true } },
              },
            },
            assignedBarber: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        },
        auditLogs: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: { message: 'Review not found' } },
        { status: 404 }
      );
    }

    const customerId = review.customerId;
    const reviewId = params.id;

    const [orderStats, pastReviews, noShowCount] = await Promise.all([
      prisma.order.aggregate({
        where: {
          customerId,
          paymentStatus: 'PAID',
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.review.count({
        where: { customerId, id: { not: reviewId } },
      }),
      prisma.booking.count({
        where: { customerId, status: 'NO_SHOW' },
      }),
    ]);

    const totalVisits = orderStats._count.id ?? 0;
    const lifetimeSpend = Number(orderStats._sum?.totalAmount ?? 0);
    const services = (review.order?.items ?? []).map((i) => ({
      title: i.product?.title ?? i.title,
      category: i.product?.category ?? null,
      quantity: i.quantity,
      totalPrice: Number(i.totalPrice),
    }));

    const responseHistory: { type: 'admin' | 'barber'; text: string; at: string; visibility?: string }[] = [];
    if (review.adminResponse && review.adminResponseAt) {
      responseHistory.push({
        type: 'admin',
        text: review.adminResponse,
        at: review.adminResponseAt.toISOString(),
        visibility: 'public',
      });
    }
    if (review.barberResponse && review.barberResponseAt) {
      responseHistory.push({
        type: 'barber',
        text: review.barberResponse,
        at: review.barberResponseAt.toISOString(),
        visibility: 'public',
      });
    }
    responseHistory.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    return NextResponse.json({
      success: true,
      data: {
        review: {
          id: review.id,
          orderId: review.orderId,
          rating: review.rating,
          comment: review.comment,
          source: review.source,
          submittedAt: review.createdAt,
          status: review.status,
          isVisible: review.isVisible,
          barberResponse: review.barberResponse,
          barberResponseAt: review.barberResponseAt,
          adminResponse: review.adminResponse,
          adminResponseAt: review.adminResponseAt,
          internalNotes: review.internalNotes,
          escalatedAt: review.escalatedAt,
          resolvedAt: review.resolvedAt,
          resolutionOutcome: review.resolutionOutcome,
          slaDueAt: review.slaDueAt,
          assignedTo: review.assignedTo
            ? { id: review.assignedTo.id, name: review.assignedTo.name, email: review.assignedTo.email }
            : null,
          customer: review.customer
            ? {
                id: review.customer.id,
                name: review.customer.user?.name ?? 'Anonymous',
                email: review.customer.user?.email ?? null,
                avatarUrl: review.customer.user?.avatarUrl ?? null,
              }
            : null,
          barber: review.barber
            ? {
                id: review.barber.id,
                name: review.barber.user?.name ?? '—',
                email: review.barber.user?.email ?? null,
              }
            : null,
        },
        order: review.order
          ? {
              orderId: review.order.id,
              orderNumber: review.order.orderNumber,
              date: review.order.createdAt,
              totalAmount: Number(review.order.totalAmount),
              barber: review.order.assignedBarber?.user?.name ?? null,
              services,
            }
          : null,
        customerSnapshot: {
          totalVisits,
          lifetimeSpend,
          pastReviewsCount: pastReviews,
          noShowCount,
        },
        responseHistory,
        auditLogs: review.auditLogs.map((l) => ({
          id: l.id,
          action: l.action,
          performedBy: l.user ? { id: l.user.id, name: l.user.name, email: l.user.email } : null,
          metadata: l.metadata,
          createdAt: l.createdAt,
        })),
      },
    });
  } catch (e: unknown) {
    console.error('Review detail error:', e);
    return NextResponse.json(
      { success: false, error: { message: e instanceof Error ? e.message : 'Failed to fetch review detail' } },
      { status: 500 }
    );
  }
}
