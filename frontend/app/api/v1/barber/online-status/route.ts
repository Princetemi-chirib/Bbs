import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUser } from '@/app/api/v1/utils/auth';
import { getNowInLagos, formatTimeHHmm } from '@/app/api/v1/utils/timezone';

export const dynamic = 'force-dynamic';

// GET /api/v1/barber/online-status - Get current online status
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyUser(request);
    if (!auth || auth.role !== 'BARBER') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Barber access required.' } },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      include: { barber: true },
    });
    const barber = user?.isActive ? user.barber : null;
    if (!barber) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Barber access required.' } },
        { status: 401 }
      );
    }

    // Get availability to check if within hours
    const availability = await prisma.barberAvailability.findMany({
      where: { 
        barberId: barber.id,
        isAvailable: true,
      },
    });

    // Use Nigeria (Lagos) time so "within hours" matches barber's local time
    const { currentDay, currentTime } = getNowInLagos();
    const todayAvailability = availability.find((a) => a.dayOfWeek === currentDay);
    let isWithinHours = false;

    if (todayAvailability) {
      const startTime = formatTimeHHmm(todayAvailability.startTime);
      const endTime = formatTimeHHmm(todayAvailability.endTime);
      isWithinHours = currentTime >= startTime && currentTime <= endTime;
    }

    // Barber is available if: manual online toggle is ON AND within scheduled hours
    const isAvailable = barber.isOnline && isWithinHours;

    return NextResponse.json({
      success: true,
      data: {
        isOnline: barber.isOnline,
        isWithinHours,
        isAvailable,
        currentTime,
        todayAvailability: todayAvailability ? {
          startTime: formatTimeHHmm(todayAvailability.startTime),
          endTime: formatTimeHHmm(todayAvailability.endTime),
        } : null,
      },
    });
  } catch (error: any) {
    console.error('Get online status error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to get status' } },
      { status: 500 }
    );
  }
}

// PUT /api/v1/barber/online-status - Toggle online status
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyUser(request);
    if (!auth || auth.role !== 'BARBER') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Barber access required.' } },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      include: { barber: true },
    });
    const barber = user?.isActive ? user.barber : null;
    if (!barber) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Barber access required.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { isOnline } = body;

    if (typeof isOnline !== 'boolean') {
      return NextResponse.json(
        { success: false, error: { message: 'isOnline must be a boolean' } },
        { status: 400 }
      );
    }

    // Update online status
    const updatedBarber = await prisma.barber.update({
      where: { id: barber.id },
      data: { isOnline },
      select: {
        id: true,
        isOnline: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        isOnline: updatedBarber.isOnline,
      },
      message: updatedBarber.isOnline ? 'You are now online' : 'You are now offline',
    });
  } catch (error: any) {
    console.error('Toggle online status error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update status' } },
      { status: 500 }
    );
  }
}
