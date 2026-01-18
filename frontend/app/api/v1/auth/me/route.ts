import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

    let decoded: { id: string; email: string; role: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid or expired token',
          },
        },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        barber: true,
        customer: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'User not found or inactive',
          },
        },
        { status: 404 }
      );
    }

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
      barber: user.barber
        ? {
            id: user.barber.id,
            status: user.barber.status,
            location: user.barber.location,
            ratingAvg: Number(user.barber.ratingAvg),
            totalReviews: user.barber.totalReviews,
            totalBookings: user.barber.totalBookings,
          }
        : null,
    };

    return NextResponse.json({
      success: true,
      data: userData,
    });
  } catch (error: any) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to get user information',
        },
      },
      { status: 500 }
    );
  }
}
