import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

async function getBarberFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    
    if (decoded.role !== 'BARBER') {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { barber: true },
    });

    if (!user || !user.barber || !user.isActive) {
      return null;
    }

    return user.barber;
  } catch {
    return null;
  }
}

// GET /api/v1/barber/online-status - Get current online status
export async function GET(request: NextRequest) {
  try {
    const barber = await getBarberFromRequest(request);
    
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

    // Check if currently within availability hours
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
    const currentTime = now.toTimeString().slice(0, 5); // HH:mm format

    const todayAvailability = availability.find(a => a.dayOfWeek === currentDay);
    let isWithinHours = false;

    if (todayAvailability) {
      const startTime = todayAvailability.startTime.toString().slice(0, 5); // HH:mm
      const endTime = todayAvailability.endTime.toString().slice(0, 5); // HH:mm
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
          startTime: todayAvailability.startTime.toString().slice(0, 5),
          endTime: todayAvailability.endTime.toString().slice(0, 5),
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
    const barber = await getBarberFromRequest(request);
    
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
