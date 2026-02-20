import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUser } from '@/app/api/v1/utils/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyUser(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Please sign in.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: { message: 'Current password and new password are required.' } },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: { message: 'New password must be at least 8 characters long.' } },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: { password: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'User not found.' } },
        { status: 404 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { success: false, error: { message: 'Password not set. Please use the password reset link sent to your email.' } },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: { message: 'Current password is incorrect.' } },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: auth.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to change password',
        },
      },
      { status: 500 }
    );
  }
}
