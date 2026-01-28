import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json(
        { success: false, error: { message: 'Token and email are required' } },
        { status: 400 }
      );
    }

    // Find user by email and token
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        passwordResetToken: token,
        passwordResetExpires: {
          gte: new Date(), // Token not expired
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid or expired invitation token' } },
        { status: 400 }
      );
    }

    // Check if user already has a pending application
    const existingApplication = await prisma.barberApplication.findFirst({
      where: {
        userId: user.id,
        status: 'PENDING',
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { success: false, error: { message: 'You already have a pending application' } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error('Verify invitation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to verify invitation',
        },
      },
      { status: 500 }
    );
  }
}
