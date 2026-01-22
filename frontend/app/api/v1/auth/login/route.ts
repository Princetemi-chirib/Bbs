import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 60 * 60, // 1 hour for access token
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days for refresh token
};

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

    // Validate JWT_SECRET exists (no fallback for security)
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Server configuration error. Please contact support.',
          },
        },
        { status: 500 }
      );
    }

    // Generate access token (short-lived: 1 hour)
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        type: 'access',
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Generate refresh token (long-lived: 7 days)
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Get client IP and user agent for session tracking
    const userAgent = request.headers.get('user-agent') || null;
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      null;

    // Store refresh token in database
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        userAgent,
        ipAddress,
        expiresAt: refreshTokenExpires,
      },
    });

    // Return user data (excluding password and tokens)
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

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      data: {
        user: userData,
      },
    });

    // Set httpOnly cookies
    response.cookies.set('access_token', accessToken, COOKIE_OPTIONS);
    response.cookies.set('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);

    return response;
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
