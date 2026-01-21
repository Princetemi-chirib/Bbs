import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '../utils';

export const dynamic = 'force-dynamic';

// GET /api/v1/admin/reviews - Get all reviews with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const adminOrRep = await verifyAdminOrRep(request);
    
    if (!adminOrRep) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin or REP access required.' } },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // 'all', 'visible', 'hidden'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    let whereClause: any = {};

    if (status === 'visible') {
      whereClause.isVisible = true;
    } else if (status === 'hidden') {
      whereClause.isVisible = false;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: whereClause,
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
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      data: reviews.map(review => ({
        id: review.id,
        orderId: review.orderId,
        orderNumber: review.order.orderNumber,
        customer: {
          name: review.customer.user.name,
          email: review.customer.user.email,
          avatarUrl: review.customer.user.avatarUrl,
        },
        barber: {
          name: review.barber.user.name,
          email: review.barber.user.email,
        },
        rating: review.rating,
        comment: review.comment,
        barberResponse: review.barberResponse,
        barberResponseAt: review.barberResponseAt,
        isVerified: review.isVerified,
        isVisible: review.isVisible,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch reviews' } },
      { status: 500 }
    );
  }
}
