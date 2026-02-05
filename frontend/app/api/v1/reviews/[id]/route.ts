import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUser } from '@/app/api/v1/utils/auth';

export const dynamic = 'force-dynamic';

// PUT /api/v1/reviews/[id]/response - Barber responds to a review
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyUser(request);
    if (!auth || auth.role !== 'BARBER') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Barber access required.' } },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      include: { barber: true },
    });

    const barber = user?.isActive ? user.barber : null;
    if (!barber) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Barber access required.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { response } = body;

    if (!response || typeof response !== 'string') {
      return NextResponse.json(
        { success: false, error: { message: 'Response text is required' } },
        { status: 400 }
      );
    }

    // Check if review exists and belongs to this barber
    const review = await prisma.review.findUnique({
      where: { id: params.id },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: { message: 'Review not found' } },
        { status: 404 }
      );
    }

    if (review.barberId !== barber.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. This review does not belong to you.' } },
        { status: 403 }
      );
    }

    // Update review with barber response
    const updatedReview = await prisma.review.update({
      where: { id: params.id },
      data: {
        barberResponse: response,
        barberResponseAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedReview.id,
        barberResponse: updatedReview.barberResponse,
        barberResponseAt: updatedReview.barberResponseAt,
      },
      message: 'Response added successfully',
    });
  } catch (error: any) {
    console.error('Update review response error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update review' } },
      { status: 500 }
    );
  }
}
