import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

// Helper function to verify admin token
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

// GET /api/v1/admin/customers - List all customers with optional filters
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin access required.' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const membershipType = searchParams.get('membershipType') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      user: {
        role: 'CUSTOMER',
      },
    };

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { phone: { contains: search, mode: 'insensitive' } } },
        { customerId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (membershipType) {
      where.membershipType = membershipType;
    }

    // Get customers with related data
    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatarUrl: true,
              emailVerified: true,
              isActive: true,
              createdAt: true,
            },
          },
          preferredBarber: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              bookings: true,
              reviews: true,
              payments: true,
            },
          },
        },
        orderBy: {
          [sortBy === 'totalSpent' ? 'createdAt' : sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    // Calculate additional stats for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        // Get total spent from bookings
        const bookingStats = await prisma.booking.aggregate({
          where: {
            customerId: customer.id,
            paymentStatus: 'PAID',
          },
          _sum: {
            totalPrice: true,
          },
          _count: {
            id: true,
          },
        });

        // Get completed bookings count
        const completedBookings = await prisma.booking.count({
          where: {
            customerId: customer.id,
            status: 'COMPLETED',
          },
        });

        // Get cancelled bookings count
        const cancelledBookings = await prisma.booking.count({
          where: {
            customerId: customer.id,
            status: 'CANCELLED',
          },
        });

        // Get last booking date
        const lastBooking = await prisma.booking.findFirst({
          where: {
            customerId: customer.id,
          },
          orderBy: {
            bookingDate: 'desc',
          },
          select: {
            bookingDate: true,
          },
        });

        // Get orders total
        const orderStats = await prisma.order.aggregate({
          where: {
            customerEmail: customer.user.email,
            paymentStatus: 'PAID',
          },
          _sum: {
            totalAmount: true,
          },
          _count: {
            id: true,
          },
        });

        const totalSpent = Number(bookingStats._sum.totalPrice || 0) + Number(orderStats._sum.totalAmount || 0);

        return {
          id: customer.id,
          customerId: customer.customerId,
          name: customer.user.name,
          email: customer.user.email,
          phone: customer.user.phone,
          avatarUrl: customer.user.avatarUrl,
          emailVerified: customer.user.emailVerified,
          isActive: customer.user.isActive,
          membershipType: customer.membershipType,
          loyaltyPoints: customer.loyaltyPoints,
          preferredBarber: customer.preferredBarber
            ? {
                id: customer.preferredBarber.id,
                name: customer.preferredBarber.user.name,
              }
            : null,
          dateOfBirth: customer.dateOfBirth,
          gender: customer.gender,
          address: customer.address,
          totalBookings: customer._count.bookings,
          totalOrders: orderStats._count.id,
          totalReviews: customer._count.reviews,
          completedBookings,
          cancelledBookings,
          totalSpent,
          lastBookingDate: lastBooking?.bookingDate || null,
          createdAt: customer.createdAt,
        };
      })
    );

    // Sort by totalSpent if needed (since it's calculated)
    const sortedCustomers = sortBy === 'totalSpent'
      ? customersWithStats.sort((a, b) => {
          return sortOrder === 'desc' ? b.totalSpent - a.totalSpent : a.totalSpent - b.totalSpent;
        })
      : customersWithStats;

    // Get summary statistics
    const summaryStats = await Promise.all([
      prisma.customer.count({
        where: {
          user: {
            role: 'CUSTOMER',
            isActive: true,
          },
        },
      }),
      prisma.customer.count({
        where: {
          user: {
            role: 'CUSTOMER',
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
      }),
      prisma.customer.count({
        where: {
          membershipType: {
            not: 'BASIC',
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        customers: sortedCustomers,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        summary: {
          totalCustomers: summaryStats[0],
          newThisMonth: summaryStats[1],
          premiumMembers: summaryStats[2],
        },
      },
    });
  } catch (error: any) {
    console.error('Customers API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch customers',
        },
      },
      { status: 500 }
    );
  }
}
