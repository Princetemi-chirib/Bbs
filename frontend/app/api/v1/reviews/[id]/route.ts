import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

// Helper to verify barber
async function verifyBarber(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    
    if (decoded.role !== 'BARBER') {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { barber: true },
    });

    if (!user || !user.barber || !user.isActive) {
      return null;
    }

    return user.barber;
  } catch {
    return null;
  }
}

// PUT /api/v1/reviews/[id]/response - Barber responds to a review
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const barber = await verifyBarber(request);
    
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
