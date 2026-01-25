import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '@/app/api/v1/utils/auth';

export const dynamic = 'force-dynamic';

// GET /api/v1/admin/customers/[id] - Get detailed customer information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAdminOrRep(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin or Rep access required.' } },
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

    // Get related data (with error handling for relations that might not exist yet)
    let notes: any[] = [];
    let tags: any[] = [];
    let preferences: any = null;
    let communications: any[] = [];
    let auditLogs: any[] = [];

    try {
      notes = await prisma.customerNote.findMany({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          note: true,
          isInternal: true,
          createdBy: true,
          createdAt: true,
        },
      });
    } catch (e) {
      // Notes relation doesn't exist yet
    }

    try {
      tags = await prisma.customerTag.findMany({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      // Tags relation doesn't exist yet
    }

    try {
      preferences = await prisma.customerPreference.findUnique({
        where: { customerId: customer.id },
      });
    } catch (e) {
      // Preferences relation doesn't exist yet
    }

    try {
      communications = await prisma.customerCommunication.findMany({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    } catch (e) {
      // Communications relation doesn't exist yet
    }

    try {
      auditLogs = await prisma.customerAuditLog.findMany({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    } catch (e) {
      // Audit logs relation doesn't exist yet
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
        order: {
          select: {
            orderNumber: true,
            items: {
              select: {
                title: true,
              },
              take: 1,
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

    // Get first booking
    const firstBooking = await prisma.booking.findFirst({
      where: { customerId: customer.id },
      orderBy: { bookingDate: 'asc' },
      select: {
        bookingDate: true,
      },
    });

    // Get first order
    const firstOrder = await prisma.order.findFirst({
      where: { customerEmail: customer.user.email },
      orderBy: { createdAt: 'asc' },
      select: {
        createdAt: true,
      },
    });

    // Get no-show count
    const noShowCount = await prisma.booking.count({
      where: {
        customerId: customer.id,
        status: 'NO_SHOW',
      },
    });

    // Get refund statistics
    const refundStats = await prisma.payment.aggregate({
      where: {
        customerId: customer.id,
        status: 'REFUNDED',
      },
      _sum: {
        refundAmount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get discount/refund information
    const allPayments = await prisma.payment.findMany({
      where: { customerId: customer.id },
      select: {
        amount: true,
        refundAmount: true,
        status: true,
      },
    });

    const discountsUsed = allPayments.reduce((sum, p) => {
      // Calculate if there was a discount (simplified - would need discount field in schema)
      return sum;
    }, 0);

    // Get branches visited
    const branches = await prisma.order.findMany({
      where: { customerEmail: customer.user.email },
      select: {
        city: true,
        location: true,
      },
      distinct: ['city', 'location'],
    });

    // Calculate risk indicators
    const totalVisits = bookingStats._count.id + orderStats._count.id;
    const cancellationRate = totalVisits > 0
      ? (cancelledBookings + (await prisma.order.count({ where: { customerEmail: customer.user.email, status: 'CANCELLED' } }))) / totalVisits
      : 0;
    const noShowRate = bookingStats._count.id > 0 ? noShowCount / bookingStats._count.id : 0;
    const refundRate = allPayments.length > 0 ? refundStats._count.id / allPayments.length : 0;

    const riskIndicators = {
      highCancellationRate: cancellationRate > 0.3,
      frequentNoShows: noShowRate > 0.2,
      excessiveRefunds: refundStats._count.id > 2 || refundRate > 0.1,
      abuseOfPromotions: false, // Would need promotion tracking
    };

    const totalSpent = Number(bookingStats._sum.totalPrice || 0) + Number(orderStats._sum.totalAmount || 0);
    const totalVisitsForAvg = bookingStats._count.id + orderStats._count.id;
    const avgOrderValue = totalVisitsForAvg > 0 ? totalSpent / totalVisitsForAvg : 0;
    const avgSpendPerVisit = totalVisitsForAvg > 0 ? totalSpent / totalVisitsForAvg : 0;

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

    // Determine first visit date
    const firstVisitDate = firstBooking?.bookingDate
      ? new Date(firstBooking.bookingDate)
      : firstOrder?.createdAt || customer.createdAt;

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
          status: customer.status || 'ACTIVE',
          membershipType: customer.membershipType,
          loyaltyPoints: customer.loyaltyPoints,
          preferredBarber: customer.preferredBarber
            ? {
                id: customer.preferredBarber.id,
                name: customer.preferredBarber.user.name,
                email: customer.preferredBarber.user.email,
              }
            : null,
          preferredBranch: (customer as any).preferredBranch || null,
          dateOfBirth: customer.dateOfBirth,
          gender: customer.gender,
          address: customer.address,
          allergies: (customer as any).allergies || null,
          servicePreferences: (customer as any).servicePreferences || [],
          emailConsent: (customer as any).emailConsent !== undefined ? (customer as any).emailConsent : true,
          smsConsent: (customer as any).smsConsent !== undefined ? (customer as any).smsConsent : true,
          dataConsent: (customer as any).dataConsent !== undefined ? (customer as any).dataConsent : true,
          consentDate: (customer as any).consentDate || null,
          referralCode: (customer as any).referralCode || null,
          tags: tags,
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
          avgSpendPerVisit,
          totalReviews: reviews.length,
          avgRatingGiven: Number(avgRating.toFixed(2)),
          totalTickets: tickets.length,
          firstVisitDate,
          lastBookingDate: lastBooking?.bookingDate || null,
          noShowCount,
          refundCount: refundStats._count.id,
          refundAmount: Number(refundStats._sum.refundAmount || 0),
          discountsUsed,
          outstandingBalance: 0, // Would need to track this
          branchesVisited: branches.map(b => `${b.city}, ${b.location}`),
        },
        riskIndicators,
        preferences: preferences ? {
          preferredServices: preferences.preferredServices || [],
          preferredBarbers: preferences.preferredBarbers || [],
          allergies: preferences.allergies || null,
          sensitivities: preferences.sensitivities || null,
          specialRequests: preferences.specialRequests || null,
        } : null,
        notes: notes.map(n => ({
          id: n.id,
          note: n.note,
          isInternal: n.isInternal,
          createdBy: n.createdBy,
          createdAt: n.createdAt,
        })),
        communications: communications.map(c => ({
          id: c.id,
          type: c.type,
          channel: c.channel,
          subject: c.subject,
          message: c.message,
          status: c.status,
          sentAt: c.sentAt,
          deliveredAt: c.deliveredAt,
          optInStatus: c.optInStatus,
          createdAt: c.createdAt,
        })),
        auditLogs: auditLogs.map(a => ({
          id: a.id,
          action: a.action,
          performedBy: a.performedBy,
          reason: a.reason,
          oldValue: a.oldValue,
          newValue: a.newValue,
          metadata: a.metadata,
          createdAt: a.createdAt,
        })),
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
          orderNumber: r.order.orderNumber,
          barberName: r.barber.user.name,
          serviceName: r.order.items[0]?.title || 'N/A',
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
