import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/app/api/v1/utils/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin access required.' } },
        { status: 401 }
      );
    }

    const barberId = params.id;

    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      include: { user: true },
    });

    if (!barber) {
      return NextResponse.json(
        { success: false, error: { message: 'Barber not found' } },
        { status: 404 }
      );
    }

    // Update barber status to ACTIVE
    await prisma.barber.update({
      where: { id: barberId },
      data: {
        status: 'ACTIVE',
      },
    });

    // Activate user account
    await prisma.user.update({
      where: { id: barber.userId },
      data: {
        isActive: true,
      },
    });

    // TODO: Create audit log entry
    // TODO: Send email notification to barber

    return NextResponse.json({
      success: true,
      data: {
        message: 'Barber account activated successfully',
      },
    });
  } catch (error: any) {
    console.error('Activate barber error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to activate barber',
        },
      },
      { status: 500 }
    );
  }
}
