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

export async function PUT(
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
    const body = await request.json();
    const { name, phone, state, city, address, bio, specialties, experienceYears } = body;

    // Get barber first
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

    // Update user info
    if (name || phone) {
      await prisma.user.update({
        where: { id: barber.userId },
        data: {
          ...(name && { name }),
          ...(phone && { phone }),
        },
      });
    }

    // Update barber profile
    const updatedBarber = await prisma.barber.update({
      where: { id: barberId },
      data: {
        ...(state && { state }),
        ...(city && { city }),
        ...(address && { address }),
        ...(city && { location: city }), // Keep for backward compatibility
        ...(bio !== undefined && { bio }),
        ...(experienceYears !== undefined && { experienceYears: experienceYears ? parseInt(experienceYears) : null }),
        ...(specialties && { specialties }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        barber: {
          id: updatedBarber.id,
          state: updatedBarber.state,
          city: updatedBarber.city,
          address: updatedBarber.address,
          user: updatedBarber.user,
        },
        message: 'Barber updated successfully',
      },
    });
  } catch (error: any) {
    console.error('Update barber error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to update barber',
        },
      },
      { status: 500 }
    );
  }
}
