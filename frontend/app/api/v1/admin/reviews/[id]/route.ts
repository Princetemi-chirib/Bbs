import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '../../utils';

export const dynamic = 'force-dynamic';

// PUT /api/v1/admin/reviews/[id] - Update review visibility or moderation status
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminOrRep = await verifyAdminOrRep(request);
    
    if (!adminOrRep) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin or REP access required.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, isVisible } = body;

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: params.id },
      include: {
        barber: true,
      },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: { message: 'Review not found' } },
        { status: 404 }
      );
    }

    let updateData: any = {};

    if (action === 'hide') {
      updateData.isVisible = false;
    } else if (action === 'show') {
      updateData.isVisible = true;
    } else if (action === 'toggle-visibility') {
      updateData.isVisible = !review.isVisible;
    } else if (typeof isVisible === 'boolean') {
      updateData.isVisible = isVisible;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'No valid action provided' } },
        { status: 400 }
      );
    }

    // Update review visibility
    const updatedReview = await prisma.review.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        barber: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        order: {
          select: {
            orderNumber: true,
          },
        },
      },
    });

    // If visibility changed, recalculate barber's rating
    if (updateData.isVisible !== undefined) {
      const barber = await prisma.barber.findUnique({
        where: { id: review.barberId },
        include: {
          reviews: {
            where: { isVisible: true },
          },
        },
      });

      if (barber) {
        const totalReviews = barber.reviews.length;
        const sumRatings = barber.reviews.reduce((sum, r) => sum + r.rating, 0);
        const newRatingAvg = totalReviews > 0 ? sumRatings / totalReviews : 0;

        await prisma.barber.update({
          where: { id: review.barberId },
          data: {
            ratingAvg: newRatingAvg,
            totalReviews: totalReviews,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedReview.id,
        isVisible: updatedReview.isVisible,
        customer: {
          name: updatedReview.customer.user.name,
          email: updatedReview.customer.user.email,
        },
        barber: {
          name: updatedReview.barber.user.name,
        },
        rating: updatedReview.rating,
        comment: updatedReview.comment,
      },
      message: `Review ${updatedReview.isVisible ? 'shown' : 'hidden'} successfully`,
    });
  } catch (error: any) {
    console.error('Update review error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update review' } },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/admin/reviews/[id] - Delete a review (admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminOrRep = await verifyAdminOrRep(request);
    
    if (!adminOrRep || adminOrRep.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin access required.' } },
        { status: 401 }
      );
    }

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: params.id },
      include: {
        barber: true,
      },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: { message: 'Review not found' } },
        { status: 404 }
      );
    }

    const barberId = review.barberId;

    // Delete review and recalculate barber's rating in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.review.delete({
        where: { id: params.id },
      });

      // Recalculate barber's rating
      const barber = await tx.barber.findUnique({
        where: { id: barberId },
        include: {
          reviews: {
            where: { isVisible: true },
          },
        },
      });

      if (barber) {
        const totalReviews = barber.reviews.length;
        const sumRatings = barber.reviews.reduce((sum, r) => sum + r.rating, 0);
        const newRatingAvg = totalReviews > 0 ? sumRatings / totalReviews : 0;

        await tx.barber.update({
          where: { id: barberId },
          data: {
            ratingAvg: newRatingAvg,
            totalReviews: totalReviews,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete review error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to delete review' } },
      { status: 500 }
    );
  }
}
