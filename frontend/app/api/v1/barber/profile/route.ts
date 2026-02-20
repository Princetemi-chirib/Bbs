import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUser } from '@/app/api/v1/utils/auth';

export const dynamic = 'force-dynamic';

async function getBarberFromRequest(request: NextRequest) {
  const auth = await verifyUser(request);
  if (!auth || auth.role !== 'BARBER') {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      include: {
        barber: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                nin: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.barber || !user.isActive) {
      return null;
    }

    return user.barber;
  } catch {
    return null;
  }
}

// GET /api/v1/barber/profile - Get barber profile
export async function GET(request: NextRequest) {
  try {
    const barber = await getBarberFromRequest(request);
    
    if (!barber) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Barber access required.' } },
        { status: 401 }
      );
    }

    // Get availability
    const availability = await prisma.barberAvailability.findMany({
      where: { barberId: barber.id },
      orderBy: { dayOfWeek: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: barber.id,
        barberId: barber.barberId,
        name: barber.user.name,
        email: barber.user.email,
        phone: barber.user.phone,
        nin: barber.user.nin ?? null,
        avatarUrl: barber.user.avatarUrl,
        bio: barber.bio,
        experienceYears: barber.experienceYears,
        specialties: barber.specialties,
        languagesSpoken: barber.languagesSpoken,
        state: barber.state,
        city: barber.city,
        address: barber.address,
        status: barber.status,
        ratingAvg: Number(barber.ratingAvg),
        totalReviews: barber.totalReviews,
        totalBookings: barber.totalBookings,
        availability,
      },
    });
  } catch (error: any) {
    console.error('Get barber profile error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch profile' } },
      { status: 500 }
    );
  }
}

// PUT /api/v1/barber/profile - Update barber profile
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
    const {
      name,
      email,
      phone,
      nin,
      avatarUrl,
      bio,
      experienceYears,
      specialties,
      languagesSpoken,
      state,
      city,
      address,
      availability,
    } = body;

    // Update user info
    const userUpdateData: { name?: string; email?: string; phone?: string | null; nin?: string | null; avatarUrl?: string | null } = {};
    if (name) userUpdateData.name = name;
    if (email !== undefined) userUpdateData.email = email;
    if (phone !== undefined) userUpdateData.phone = phone;
    if (nin !== undefined) userUpdateData.nin = nin || null;
    if (avatarUrl !== undefined) userUpdateData.avatarUrl = avatarUrl;
    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: barber.userId },
        data: userUpdateData,
      });
    }

    // Update barber info
    const barberUpdateData: any = {};
    if (bio !== undefined) barberUpdateData.bio = bio;
    if (experienceYears !== undefined) barberUpdateData.experienceYears = parseInt(experienceYears);
    if (specialties !== undefined) barberUpdateData.specialties = specialties;
    if (languagesSpoken !== undefined) barberUpdateData.languagesSpoken = languagesSpoken;
    if (state !== undefined) barberUpdateData.state = state;
    if (city !== undefined) barberUpdateData.city = city;
    if (address !== undefined) barberUpdateData.address = address;

    if (Object.keys(barberUpdateData).length > 0) {
      await prisma.barber.update({
        where: { id: barber.id },
        data: barberUpdateData,
      });
    }

    // Update availability if provided
    if (availability && Array.isArray(availability)) {
      // Delete existing availability
      await prisma.barberAvailability.deleteMany({
        where: { barberId: barber.id },
      });

      // Prisma DateTime (for @db.Time) expects ISO-8601; use reference date + time
      const timeStringToDate = (t: string): string => {
        const parts = String(t).trim().split(':');
        const h = parts[0]?.padStart(2, '0') ?? '00';
        const m = (parts[1] ?? '00').padStart(2, '0');
        const s = (parts[2] ?? '00').padStart(2, '0');
        return `1970-01-01T${h}:${m}:${s}.000Z`;
      };

      const validAvailability = availability
        .filter((avail: any) =>
          avail.dayOfWeek !== undefined &&
          avail.dayOfWeek !== null &&
          avail.startTime != null &&
          avail.endTime != null
        )
        .map((avail: any) => ({
          barberId: barber.id,
          dayOfWeek: Number(avail.dayOfWeek),
          startTime: timeStringToDate(avail.startTime),
          endTime: timeStringToDate(avail.endTime),
          isAvailable: avail.isAvailable !== false,
        }));

      // Create new availability
      if (validAvailability.length > 0) {
        await prisma.barberAvailability.createMany({
          data: validAvailability,
        });
      }
    }

    // Fetch updated profile
    const updatedBarber = await prisma.barber.findUnique({
      where: { id: barber.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            nin: true,
            avatarUrl: true,
          },
        },
        availability: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedBarber!.id,
        barberId: updatedBarber!.barberId,
        name: updatedBarber!.user.name,
        email: updatedBarber!.user.email,
        phone: updatedBarber!.user.phone,
        nin: updatedBarber!.user.nin ?? null,
        avatarUrl: updatedBarber!.user.avatarUrl,
        bio: updatedBarber!.bio,
        experienceYears: updatedBarber!.experienceYears,
        specialties: updatedBarber!.specialties,
        languagesSpoken: updatedBarber!.languagesSpoken,
        state: updatedBarber!.state,
        city: updatedBarber!.city,
        address: updatedBarber!.address,
        status: updatedBarber!.status,
        ratingAvg: Number(updatedBarber!.ratingAvg),
        totalReviews: updatedBarber!.totalReviews,
        totalBookings: updatedBarber!.totalBookings,
        availability: updatedBarber!.availability,
      },
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    console.error('Update barber profile error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update profile' } },
      { status: 500 }
    );
  }
}
