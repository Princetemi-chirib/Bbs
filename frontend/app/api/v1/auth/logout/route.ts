import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get('refresh_token')?.value;

    // If refresh token exists, delete the session
    if (refreshToken) {
      try {
        await prisma.session.deleteMany({
          where: { refreshToken },
        });
      } catch (error) {
        // Session might not exist, continue anyway
        console.warn('Session deletion warning:', error);
      }
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });

    // Clear cookies
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');

    return response;
  } catch (error: any) {
    console.error('Logout error:', error);
    
    // Even if there's an error, clear cookies
    const response = NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to logout',
        },
      },
      { status: 500 }
    );

    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');

    return response;
  }
}

// Also support GET for logout (for convenience)
export async function GET(request: NextRequest) {
  return POST(request);
}
