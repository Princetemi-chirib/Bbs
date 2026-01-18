import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tokenParam = searchParams.get('token');

    if (!tokenParam) {
      return NextResponse.json(
        { success: false, error: { message: 'Reset token is required' } },
        { status: 400 }
      );
    }

    // Decode the token (searchParams.get already decodes, but we'll be explicit)
    const token = decodeURIComponent(tokenParam);

    // Find user with this reset token
    const user = await prisma.user.findUnique({
      where: {
        passwordResetToken: token,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid reset token' } },
        { status: 404 }
      );
    }

    // Check if token has expired
    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return NextResponse.json(
        { success: false, error: { message: 'Reset token has expired' } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error('Verify reset token error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to verify reset token',
        },
      },
      { status: 500 }
    );
  }
}
