import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

// Helper to get customer from request
async function getCustomerFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    
    if (decoded.role !== 'CUSTOMER') {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { customer: true },
    });

    if (!user || !user.customer || !user.isActive) {
      return null;
    }

    return user.customer;
  } catch {
    return null;
  }
}

// POST /api/v1/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(request);
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Customer access required.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, rating, comment } = body;

    // Validate input
    if (!orderId || !rating) {
      return NextResponse.json(
        { success: false, error: { message: 'Order ID and rating are required' } },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: { message: 'Rating must be between 1 and 5' } },
        { status: 400 }
      );
    }

    // Check if order exists and belongs to customer, and is completed
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        assignedBarber: true,
        customer: true,
        review: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: { message: 'Order not found' } },
        { status: 404 }
      );
    }

    if (order.customerId !== customer.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. This order does not belong to you.' } },
        { status: 403 }
      );
    }

    if (order.jobStatus !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: { message: 'You can only review completed orders' } },
        { status: 400 }
      );
    }

    if (!order.assignedBarberId) {
      return NextResponse.json(
        { success: false, error: { message: 'Order does not have an assigned barber' } },
        { status: 400 }
      );
    }

    // Check if review already exists
    if (order.review) {
      return NextResponse.json(
        { success: false, error: { message: 'You have already reviewed this order' } },
        { status: 400 }
      );
    }

    // Create review and update barber stats in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the review
      const review = await tx.review.create({
        data: {
          orderId,
          customerId: customer.id,
          barberId: order.assignedBarberId!, // We already checked it's not null above
          rating,
          comment: comment || null,
          isVerified: true,
          isVisible: true,
        },
        include: {
          customer: {
            include: {
              user: {
                select: {
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      // Update barber's rating average and total reviews
      const barber = await tx.barber.findUnique({
        where: { id: order.assignedBarberId! }, // We already checked it's not null above
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
          where: { id: order.assignedBarberId! }, // We already checked it's not null above
          data: {
            ratingAvg: newRatingAvg,
            totalReviews: totalReviews,
          },
        });
      }

      return review;
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        orderId: result.orderId,
        rating: result.rating,
        comment: result.comment,
        createdAt: result.createdAt,
        customer: {
          name: result.customer.user.name,
          avatarUrl: result.customer.user.avatarUrl,
        },
      },
      message: 'Review submitted successfully',
    });
  } catch (error: any) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to create review' } },
      { status: 500 }
    );
  }
}

// GET /api/v1/reviews?barberId=xxx - Get reviews for a barber
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const barberId = searchParams.get('barberId');
    const orderId = searchParams.get('orderId');

    if (!barberId && !orderId) {
      return NextResponse.json(
        { success: false, error: { message: 'barberId or orderId is required' } },
        { status: 400 }
      );
    }

    let whereClause: any = { isVisible: true };

    if (barberId) {
      whereClause.barberId = barberId;
    }

    if (orderId) {
      whereClause.orderId = orderId;
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        customer: {
          include: {
            user: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        order: {
          select: {
            orderNumber: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: reviews.map(review => ({
        id: review.id,
        orderId: review.orderId,
        orderNumber: review.order.orderNumber,
        rating: review.rating,
        comment: review.comment,
        barberResponse: review.barberResponse,
        barberResponseAt: review.barberResponseAt,
        customer: {
          name: review.customer.user.name,
          avatarUrl: review.customer.user.avatarUrl,
        },
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch reviews' } },
      { status: 500 }
    );
  }
}
