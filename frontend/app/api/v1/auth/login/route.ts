import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Email and password are required',
          },
        },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        barber: true,
        customer: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid email or password',
          },
        },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Account is inactive. Please contact support.',
          },
        },
        { status: 403 }
      );
    }

    // Check if password is set (for accounts awaiting password reset)
    if (!user.password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Password not set. Please check your email for the password setup link.',
          },
        },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid email or password',
          },
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (excluding password)
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
          }
        : null,
    };

    return NextResponse.json({
      success: true,
      data: {
        user: userData,
        token,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Login failed. Please try again.',
        },
      },
      { status: 500 }
    );
  }
}
