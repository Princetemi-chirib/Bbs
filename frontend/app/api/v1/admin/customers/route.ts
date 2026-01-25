import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '@/app/api/v1/utils/auth';

export const dynamic = 'force-dynamic';

// GET /api/v1/admin/customers - List all customers with optional filters
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdminOrRep(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin or Rep access required.' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const membershipType = searchParams.get('membershipType') || '';
    const status = searchParams.get('status') || '';
    const dateRangeStart = searchParams.get('dateRangeStart') || '';
    const dateRangeEnd = searchParams.get('dateRangeEnd') || '';
    const segment = searchParams.get('segment') || ''; // NEW, LOYAL, VIP, AT_RISK, DORMANT, PROBLEMATIC
    const minSpend = searchParams.get('minSpend') || '';
    const maxSpend = searchParams.get('maxSpend') || '';
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

    if (status) {
      where.status = status;
    }

    if (dateRangeStart || dateRangeEnd) {
      where.createdAt = {};
      if (dateRangeStart) {
        where.createdAt.gte = new Date(dateRangeStart);
      }
      if (dateRangeEnd) {
        const endDate = new Date(dateRangeEnd);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
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
          [sortBy === 'totalSpent' || sortBy === 'avgOrderValue' || sortBy === 'noShowCount' ? 'createdAt' : sortBy]: sortOrder,
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

        // Get order statistics
        const orderStats = await prisma.order.aggregate({
          where: {
            customerEmail: customer.user.email,
          },
          _sum: {
            totalAmount: true,
          },
          _count: {
            id: true,
          },
        });

        // Get first and last order dates
        const firstOrder = await prisma.order.findFirst({
          where: {
            customerEmail: customer.user.email,
          },
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            createdAt: true,
            city: true,
            location: true,
          },
        });

        const lastOrder = await prisma.order.findFirst({
          where: {
            customerEmail: customer.user.email,
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            createdAt: true,
            city: true,
            location: true,
          },
        });

        // Get all unique branches (cities) visited
        const branches = await prisma.order.findMany({
          where: {
            customerEmail: customer.user.email,
          },
          select: {
            city: true,
            location: true,
          },
          distinct: ['city', 'location'],
        });

        // Get tags (if relation exists)
        let tags: any[] = [];
        try {
          tags = await prisma.customerTag.findMany({
            where: { customerId: customer.id },
            select: { id: true, tag: true, color: true },
          });
        } catch (e) {
          // Tags relation doesn't exist yet - migration not run
        }

        // Get latest note (if relation exists)
        let latestNote: any = null;
        try {
          const notes = await prisma.customerNote.findMany({
            where: { customerId: customer.id },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { note: true, createdAt: true, createdBy: true },
          });
          latestNote = notes[0] || null;
        } catch (e) {
          // Notes relation doesn't exist yet - migration not run
        }

        // Get first and last booking dates
        const firstBooking = await prisma.booking.findFirst({
          where: {
            customerId: customer.id,
          },
          orderBy: {
            bookingDate: 'asc',
          },
          select: {
            bookingDate: true,
          },
        });

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

        // Get no-show count
        const noShowCount = await prisma.booking.count({
          where: {
            customerId: customer.id,
            status: 'NO_SHOW',
          },
        });

        // Get refund count and amount
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

        const completedOrders = await prisma.order.count({
          where: {
            customerEmail: customer.user.email,
            status: 'COMPLETED',
          },
        });

        const cancelledOrders = await prisma.order.count({
          where: {
            customerEmail: customer.user.email,
            status: 'CANCELLED',
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

        // Calculate total spent (bookings + orders)
        const totalSpent = Number(bookingStats._sum.totalPrice || 0) + Number(orderStats._sum.totalAmount || 0);
        const totalVisits = (orderStats._count.id || 0) + (bookingStats._count.id || 0);
        const avgOrderValue = totalVisits > 0 ? totalSpent / totalVisits : 0;

        // Determine first visit date (earliest booking or order)
        const firstVisitDate = firstBooking?.bookingDate 
          ? new Date(firstBooking.bookingDate)
          : firstOrder?.createdAt || customer.createdAt;

        // Determine last activity date (most recent booking or order)
        const lastActivityDate = lastBooking?.bookingDate 
          ? new Date(lastBooking.bookingDate)
          : lastOrder?.createdAt || null;

        return {
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
              }
            : null,
          preferredBranch: customer.preferredBranch || null,
          dateOfBirth: customer.dateOfBirth,
          gender: customer.gender,
          address: customer.address,
          tags: tags.map(t => ({ id: t.id, tag: t.tag, color: t.color })),
          latestNote: latestNote,
          totalBookings: customer._count.bookings,
          totalOrders: orderStats._count.id || 0,
          totalReviews: customer._count.reviews,
          completedBookings,
          cancelledBookings,
          completedOrders,
          cancelledOrders,
          noShowCount,
          totalSpent,
          avgOrderValue,
          firstVisitDate,
          lastBookingDate: lastBooking?.bookingDate || null,
          lastOrderDate: lastOrder?.createdAt || null,
          lastVisitDate: lastActivityDate,
          branchesVisited: branches.map(b => `${b.city}, ${b.location}`),
          refundCount: refundStats._count.id || 0,
          refundAmount: Number(refundStats._sum.refundAmount || 0),
          createdAt: customer.createdAt,
        };
      })
    );

    // Apply segment filters
    let filteredCustomers = customersWithStats;
    if (segment) {
      filteredCustomers = customersWithStats.filter(c => {
        const daysSinceLastVisit = c.lastVisitDate 
          ? Math.floor((Date.now() - new Date(c.lastVisitDate).getTime()) / (1000 * 60 * 60 * 24))
          : Infinity;
        const cancellationRate = (c.totalBookings + c.totalOrders) > 0 
          ? (c.cancelledBookings + c.cancelledOrders) / (c.totalBookings + c.totalOrders)
          : 0;
        const noShowRate = c.totalBookings > 0 ? c.noShowCount / c.totalBookings : 0;

        switch (segment) {
          case 'NEW':
            return daysSinceLastVisit <= 30;
          case 'LOYAL':
            return (c.totalBookings + c.totalOrders) >= 5 && daysSinceLastVisit <= 90;
          case 'VIP':
            return c.totalSpent >= 50000 || c.membershipType === 'VIP' || c.membershipType === 'PREMIUM';
          case 'AT_RISK':
            return daysSinceLastVisit > 90 && daysSinceLastVisit <= 180;
          case 'DORMANT':
            return daysSinceLastVisit > 180;
          case 'PROBLEMATIC':
            return cancellationRate > 0.3 || noShowRate > 0.2 || c.refundCount > 2;
          default:
            return true;
        }
      });
    }

    // Apply spend range filter
    if (minSpend || maxSpend) {
      filteredCustomers = filteredCustomers.filter(c => {
        if (minSpend && c.totalSpent < parseFloat(minSpend)) return false;
        if (maxSpend && c.totalSpent > parseFloat(maxSpend)) return false;
        return true;
      });
    }

    // Sort by calculated fields if needed
    const sortedCustomers = (sortBy === 'totalSpent' || sortBy === 'avgOrderValue' || sortBy === 'noShowCount')
      ? filteredCustomers.sort((a, b) => {
          const aVal = sortBy === 'totalSpent' ? a.totalSpent : sortBy === 'avgOrderValue' ? a.avgOrderValue : a.noShowCount;
          const bVal = sortBy === 'totalSpent' ? b.totalSpent : sortBy === 'avgOrderValue' ? b.avgOrderValue : b.noShowCount;
          return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
        })
      : filteredCustomers;

    // Get comprehensive summary statistics
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPeriod = dateRangeStart ? new Date(dateRangeStart) : startOfMonth;
    const endOfPeriod = dateRangeEnd ? new Date(dateRangeEnd) : now;

    // Calculate metrics
    const [totalCustomers, newCustomers, activeCustomers, inactiveCustomers, returningCustomers, allCustomersForCLV, allRefunds] = await Promise.all([
      prisma.customer.count({
        where: {
          user: { role: 'CUSTOMER' },
          ...(dateRangeStart || dateRangeEnd ? {
            createdAt: {
              gte: startOfPeriod,
              lte: endOfPeriod,
            },
          } : {}),
        },
      }),
      prisma.customer.count({
        where: {
          user: {
            role: 'CUSTOMER',
            createdAt: {
              gte: startOfPeriod,
              lte: endOfPeriod,
            },
          },
        },
      }),
      prisma.customer.count({
        where: {
          user: { role: 'CUSTOMER', isActive: true },
          status: 'ACTIVE',
        },
      }),
      prisma.customer.count({
        where: {
          user: { role: 'CUSTOMER', isActive: false },
          OR: [
            { status: 'INACTIVE' },
            { status: 'FLAGGED' },
            { status: 'BLOCKED' },
          ],
        },
      }),
      prisma.customer.count({
        where: {
          user: { role: 'CUSTOMER' },
          bookings: {
            some: {
              bookingDate: {
                gte: startOfPeriod,
                lte: endOfPeriod,
              },
            },
          },
        },
      }),
      prisma.customer.findMany({
        where: {
          user: { role: 'CUSTOMER' },
        },
        include: {
          bookings: {
            where: {
              paymentStatus: 'PAID',
            },
            select: {
              totalPrice: true,
            },
          },
        },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'REFUNDED',
        },
        _sum: {
          refundAmount: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    // Calculate CLV (Customer Lifetime Value)
    const totalRevenue = allCustomersForCLV.reduce((sum, c) => {
      const bookingRevenue = c.bookings.reduce((bSum, b) => bSum + Number(b.totalPrice), 0);
      return sum + bookingRevenue;
    }, 0);
    const avgCLV = allCustomersForCLV.length > 0 ? totalRevenue / allCustomersForCLV.length : 0;

    // Calculate refund rate
    const totalPayments = await prisma.payment.count({
      where: {
        status: { in: ['PAID', 'REFUNDED'] },
      },
    });
    const refundRate = totalPayments > 0 ? (allRefunds._count.id / totalPayments) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        customers: sortedCustomers,
        pagination: {
          page,
          limit,
          total: filteredCustomers.length,
          totalPages: Math.ceil(filteredCustomers.length / limit),
        },
        summary: {
          totalCustomers,
          newCustomers: dateRangeStart || dateRangeEnd ? newCustomers : undefined,
          newThisMonth: !dateRangeStart && !dateRangeEnd ? newCustomers : undefined,
          activeCustomers,
          inactiveCustomers,
          returningCustomers,
          avgCLV,
          refundRate,
          premiumMembers: await prisma.customer.count({
            where: {
              membershipType: { not: 'BASIC' },
            },
          }),
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
