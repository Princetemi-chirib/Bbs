import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: barbers.map((barber) => ({
        id: barber.id,
        userId: barber.userId,
        status: barber.status,
        state: barber.state,
        city: barber.city,
        address: barber.address,
        location: barber.location,
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

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin access required.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, phone, state, city, address, bio, specialties, experienceYears } = body;

    if (!name || !email || !phone || !state || !city || !address) {
      return NextResponse.json(
        { success: false, error: { message: 'Name, email, phone, state, city, and address are required' } },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { message: 'User with this email already exists' } },
        { status: 400 }
      );
    }

    // Generate a random password for the barber
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create user account
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        phone,
        password: hashedPassword,
        role: 'BARBER',
        isActive: true,
      },
    });

    // Generate unique barber ID
    const barberId = `BAR-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Create barber profile
    const barber = await prisma.barber.create({
      data: {
        userId: user.id,
        barberId,
        state,
        city,
        address,
        location: city, // Keep for backward compatibility
        bio: bio || null,
        experienceYears: experienceYears ? parseInt(experienceYears) : null,
        specialties: specialties || [],
        status: 'ACTIVE',
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

    // TODO: Send email to barber with login credentials (email: email, password: tempPassword)

    return NextResponse.json({
      success: true,
      data: {
        barber: {
          id: barber.id,
          barberId: barber.barberId,
          state: barber.state,
          city: barber.city,
          address: barber.address,
          status: barber.status,
          user: barber.user,
        },
        tempPassword, // Remove this in production - only send via email
        message: 'Barber created successfully',
      },
    });
  } catch (error: any) {
    console.error('Create barber error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to create barber',
        },
      },
      { status: 500 }
    );
  }
}
