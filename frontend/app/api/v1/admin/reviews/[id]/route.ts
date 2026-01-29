import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '../../utils';
import { Prisma, ReviewStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

const ADMIN_ONLY_ACTIONS = ['hide', 'show', 'toggle-visibility', 'delete'];

async function logReviewAudit(reviewId: string, userId: string, action: string, metadata?: Record<string, unknown>) {
  await prisma.reviewAuditLog.create({
    data: {
      reviewId,
      performedBy: userId,
      action,
      metadata: metadata == null ? undefined : (metadata as Prisma.InputJsonValue),
    },
  });
}

function recalcBarberRating(barberId: string) {
  return prisma.barber.findUnique({
    where: { id: barberId },
    include: { reviews: { where: { isVisible: true } } },
  }).then((barber) => {
    if (!barber) return;
    const n = barber.reviews.length;
    const sum = barber.reviews.reduce((a, r) => a + r.rating, 0);
    return prisma.barber.update({
      where: { id: barberId },
      data: { ratingAvg: n ? sum / n : 0, totalReviews: n },
    });
  });
}

// PUT /api/v1/admin/reviews/[id] - Assign, escalate, resolve, hide, notes, admin response
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyAdminOrRep(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin or REP access required.' } },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = typeof body.action === 'string' ? body.action : '';
    const isAdmin = user.role === 'ADMIN';

    if (ADMIN_ONLY_ACTIONS.includes(action) && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { message: 'Only Admin can hide, show, or delete reviews.' } },
        { status: 403 }
      );
    }

    const review = await prisma.review.findUnique({
      where: { id: params.id },
      include: {
        barber: true,
        customer: { include: { user: { select: { name: true, email: true, avatarUrl: true } } } },
        order: { select: { orderNumber: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: { message: 'Review not found' } },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (action === 'assign') {
      const v = body.assignedToId;
      updateData.assignedToId = typeof v === 'string' && v.trim() ? v.trim() : null;
      await logReviewAudit(params.id, user.id, 'ASSIGN', { assignedToId: updateData.assignedToId });
    } else if (action === 'escalate') {
      updateData.status = ReviewStatus.ESCALATED;
      updateData.escalatedAt = new Date();
      await logReviewAudit(params.id, user.id, 'ESCALATE');
    } else if (action === 'resolve') {
      updateData.status = ReviewStatus.RESOLVED;
      updateData.resolvedAt = new Date();
      if (typeof body.resolutionOutcome === 'string') updateData.resolutionOutcome = body.resolutionOutcome;
      await logReviewAudit(params.id, user.id, 'RESOLVE', { resolutionOutcome: body.resolutionOutcome });
    } else if (action === 'ignore') {
      updateData.status = ReviewStatus.IGNORED;
      await logReviewAudit(params.id, user.id, 'IGNORE');
    } else if (action === 'hide') {
      updateData.isVisible = false;
      await logReviewAudit(params.id, user.id, 'HIDE');
    } else if (action === 'show') {
      updateData.isVisible = true;
      await logReviewAudit(params.id, user.id, 'UNHIDE');
    } else if (action === 'toggle-visibility') {
      updateData.isVisible = !review.isVisible;
      await logReviewAudit(params.id, user.id, review.isVisible ? 'HIDE' : 'UNHIDE');
    } else if (action === 'internal-notes' && typeof body.internalNotes === 'string') {
      updateData.internalNotes = body.internalNotes;
      await logReviewAudit(params.id, user.id, 'NOTE', { internalNotes: true });
    } else if (action === 'admin-response' && typeof body.adminResponse === 'string') {
      updateData.adminResponse = body.adminResponse;
      updateData.adminResponseAt = new Date();
      updateData.status = ReviewStatus.RESPONDED;
      await logReviewAudit(params.id, user.id, 'RESPOND', { type: 'admin' });
    } else if (typeof body.isVisible === 'boolean' && isAdmin) {
      updateData.isVisible = body.isVisible;
      await logReviewAudit(params.id, user.id, body.isVisible ? 'UNHIDE' : 'HIDE');
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'No valid action provided' } },
        { status: 400 }
      );
    }

    const updated = await prisma.review.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: { include: { user: { select: { name: true, email: true, avatarUrl: true } } } },
        barber: { include: { user: { select: { name: true, email: true } } } },
        order: { select: { orderNumber: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    if (updateData.isVisible !== undefined) {
      await recalcBarberRating(review.barberId);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        isVisible: updated.isVisible,
        assignedTo: updated.assignedTo,
        adminResponse: updated.adminResponse,
        adminResponseAt: updated.adminResponseAt,
        escalatedAt: updated.escalatedAt,
        resolvedAt: updated.resolvedAt,
        resolutionOutcome: updated.resolutionOutcome,
        internalNotes: updated.internalNotes,
      },
      message: 'Review updated successfully',
    });
  } catch (e: unknown) {
    console.error('Update review error:', e);
    return NextResponse.json(
      { success: false, error: { message: e instanceof Error ? e.message : 'Failed to update review' } },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/admin/reviews/[id] - Admin only
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyAdminOrRep(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin access required.' } },
        { status: 401 }
      );
    }

    const review = await prisma.review.findUnique({
      where: { id: params.id },
      include: { barber: true },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: { message: 'Review not found' } },
        { status: 404 }
      );
    }

    const barberId = review.barberId;

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: params.id } });
      const barber = await tx.barber.findUnique({
        where: { id: barberId },
        include: { reviews: { where: { isVisible: true } } },
      });
      if (barber) {
        const n = barber.reviews.length;
        const sum = barber.reviews.reduce((a, r) => a + r.rating, 0);
        await tx.barber.update({
          where: { id: barberId },
          data: { ratingAvg: n ? sum / n : 0, totalReviews: n },
        });
      }
    });

    return NextResponse.json({ success: true, message: 'Review deleted successfully' });
  } catch (e: unknown) {
    console.error('Delete review error:', e);
    return NextResponse.json(
      { success: false, error: { message: e instanceof Error ? e.message : 'Failed to delete review' } },
      { status: 500 }
    );
  }
}
