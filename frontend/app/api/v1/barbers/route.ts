import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    
    if (!user || user.role !== 'ADMIN' || !user.isActive) {
      return null;
    }
    
    return user;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin access required.' } },
        { status: 401 }
      );
    }

    const barbers = await prisma.barber.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        availability: {
          where: { isAvailable: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Helper function to check if barber is currently available (online + within hours)
    const checkBarberAvailability = (barber: typeof barbers[0]) => {
      // Must be online
      if (!barber.isOnline) return false;

      // Check if within availability hours
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
      const currentTime = now.toTimeString().slice(0, 5); // HH:mm format

      const todayAvailability = barber.availability.find(a => a.dayOfWeek === currentDay);
      if (!todayAvailability) return false;

      const startTime = todayAvailability.startTime.toString().slice(0, 5); // HH:mm
      const endTime = todayAvailability.endTime.toString().slice(0, 5); // HH:mm
      
      return currentTime >= startTime && currentTime <= endTime;
    };

    return NextResponse.json({
      success: true,
      data: barbers.map((barber: typeof barbers[0]) => ({
        id: barber.id,
        userId: barber.userId,
        status: barber.status,
        isOnline: barber.isOnline,
        isAvailable: checkBarberAvailability(barber), // Computed availability
        location: barber.location,
        city: barber.city,
        state: barber.state,
        address: barber.address,
        ratingAvg: Number(barber.ratingAvg),
        totalReviews: barber.totalReviews,
        totalBookings: barber.totalBookings,
        user: barber.user,
      })),
    });
  } catch (error: any) {
    console.error('Get barbers error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch barbers',
        },
      },
      { status: 500 }
    );
  }
}
