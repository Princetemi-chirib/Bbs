import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: { message: 'Token and password are required' } },
        { status: 400 }
      );
    }

    // Decode token if it's URL encoded
    token = decodeURIComponent(token);

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: { message: 'Password must be at least 8 characters long' } },
        { status: 400 }
      );
    }

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
        { success: false, error: { message: 'Reset token has expired. Please request a new one.' } },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        emailVerified: true, // Mark email as verified when password is set
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to reset password',
        },
      },
      { status: 500 }
    );
  }
}
