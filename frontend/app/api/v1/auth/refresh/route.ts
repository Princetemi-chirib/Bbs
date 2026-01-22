import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
    // Get refresh token from cookie
    const refreshToken = request.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Refresh token not found',
          },
        },
        { status: 401 }
      );
    }

    // Validate JWT_SECRET exists
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

    // Find session by refresh token
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session) {
      // Clear cookies if session not found
      const response = NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid refresh token',
          },
        },
        { status: 401 }
      );
      response.cookies.delete('access_token');
      response.cookies.delete('refresh_token');
      return response;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      // Delete expired session
      await prisma.session.delete({
        where: { id: session.id },
      });

      const response = NextResponse.json(
        {
          success: false,
          error: {
            message: 'Refresh token expired',
          },
        },
        { status: 401 }
      );
      response.cookies.delete('access_token');
      response.cookies.delete('refresh_token');
      return response;
    }

    // Check if user is still active
    if (!session.user.isActive) {
      // Delete session for inactive user
      await prisma.session.delete({
        where: { id: session.id },
      });

      const response = NextResponse.json(
        {
          success: false,
          error: {
            message: 'User account is inactive',
          },
        },
        { status: 403 }
      );
      response.cookies.delete('access_token');
      response.cookies.delete('refresh_token');
      return response;
    }

    // Generate new access token
    const accessToken = jwt.sign(
      {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        type: 'access',
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Optionally rotate refresh token (for better security)
    // For now, we'll keep the same refresh token but update expiration
    const newRefreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Update session expiration
    await prisma.session.update({
      where: { id: session.id },
      data: {
        expiresAt: newRefreshTokenExpires,
      },
    });

    // Create response
    const response = NextResponse.json({
      success: true,
      data: {
        message: 'Token refreshed successfully',
      },
    });

    // Set new access token cookie
    response.cookies.set('access_token', accessToken, COOKIE_OPTIONS);
    // Refresh token cookie is already set, just update expiration
    response.cookies.set('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);

    return response;
  } catch (error: any) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to refresh token',
        },
      },
      { status: 500 }
    );
  }
}
