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

// GET /api/v1/admin/customers/[id] - Get detailed customer information
export async function GET(
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

    const customerId = params.id;

    // Get customer with all related data
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
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
            updatedAt: true,
          },
        },
        preferredBarber: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: { message: 'Customer not found' } },
        { status: 404 }
      );
    }

    // Get bookings
    const bookings = await prisma.booking.findMany({
      where: { customerId: customer.id },
      include: {
        barber: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        service: {
          select: {
            name: true,
            price: true,
          },
        },
      },
      orderBy: {
        bookingDate: 'desc',
      },
    });

    // Get orders
    const orders = await prisma.order.findMany({
      where: { customerEmail: customer.user.email },
      include: {
        items: {
          include: {
            product: {
              select: {
                title: true,
              },
            },
          },
        },
        assignedBarber: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get payments
    const payments = await prisma.payment.findMany({
      where: { customerId: customer.id },
      include: {
        booking: {
          select: {
            bookingNumber: true,
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get reviews
    const reviews = await prisma.review.findMany({
      where: { customerId: customer.id },
      include: {
        barber: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        booking: {
          select: {
            bookingNumber: true,
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get support tickets
    const tickets = await prisma.supportTicket.findMany({
      where: { customerId: customer.id },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate statistics
    const bookingStats = await prisma.booking.aggregate({
      where: { customerId: customer.id },
      _sum: {
        totalPrice: true,
      },
      _count: {
        id: true,
      },
    });

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

    const completedBookings = await prisma.booking.count({
      where: {
        customerId: customer.id,
        status: 'COMPLETED',
      },
    });

    const cancelledBookings = await prisma.booking.count({
      where: {
        customerId: customer.id,
        status: 'CANCELLED',
      },
    });

    const totalSpent = Number(bookingStats._sum.totalPrice || 0) + Number(orderStats._sum.totalAmount || 0);
    const avgOrderValue = bookingStats._count.id > 0
      ? Number(bookingStats._sum.totalPrice || 0) / bookingStats._count.id
      : 0;

    // Get average rating given
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Get last booking
    const lastBooking = await prisma.booking.findFirst({
      where: { customerId: customer.id },
      orderBy: { bookingDate: 'desc' },
      select: {
        bookingDate: true,
        bookingTime: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        customer: {
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
                email: customer.preferredBarber.user.email,
              }
            : null,
          dateOfBirth: customer.dateOfBirth,
          gender: customer.gender,
          address: customer.address,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
        },
        statistics: {
          totalBookings: bookingStats._count.id,
          completedBookings,
          cancelledBookings,
          totalOrders: orderStats._count.id,
          totalSpent,
          avgOrderValue,
          totalReviews: reviews.length,
          avgRatingGiven: Number(avgRating.toFixed(2)),
          totalTickets: tickets.length,
          lastBookingDate: lastBooking?.bookingDate || null,
        },
        bookings: bookings.map((b) => ({
          id: b.id,
          bookingNumber: b.bookingNumber,
          barberName: b.barber.user.name,
          serviceName: b.service.name,
          bookingDate: b.bookingDate,
          bookingTime: b.bookingTime,
          totalPrice: Number(b.totalPrice),
          status: b.status,
          paymentStatus: b.paymentStatus,
          paymentMethod: b.paymentMethod,
          notes: b.notes,
          createdAt: b.createdAt,
        })),
        orders: orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          totalAmount: Number(o.totalAmount),
          status: o.status,
          paymentStatus: o.paymentStatus,
          paymentMethod: o.paymentMethod,
          items: o.items.map((item) => ({
            title: item.title,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
          })),
          barberName: o.assignedBarber?.user.name || null,
          createdAt: o.createdAt,
        })),
        payments: payments.map((p) => ({
          id: p.id,
          bookingNumber: p.booking.service?.name || 'N/A',
          amount: Number(p.amount),
          paymentMethod: p.paymentMethod,
          status: p.status,
          transactionId: p.transactionId,
          refundAmount: Number(p.refundAmount),
          createdAt: p.createdAt,
        })),
        reviews: reviews.map((r) => ({
          id: r.id,
          barberName: r.barber.user.name,
          serviceName: r.booking.service?.name || 'N/A',
          rating: r.rating,
          comment: r.comment,
          barberResponse: r.barberResponse,
          createdAt: r.createdAt,
        })),
        tickets: tickets.map((t) => ({
          id: t.id,
          ticketNumber: t.ticketNumber,
          subject: t.subject,
          category: t.category,
          priority: t.priority,
          status: t.status,
          createdAt: t.createdAt,
        })),
      },
    });
  } catch (error: any) {
    console.error('Customer detail API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch customer details',
        },
      },
      { status: 500 }
    );
  }
}
