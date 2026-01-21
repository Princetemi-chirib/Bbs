import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/server/emailService';
import { emailTemplates } from '@/lib/server/emailTemplates';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// POST /api/v1/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      city,
      location,
      address,
      additionalNotes,
      items,
      totalAmount,
      paymentReference,
      paymentMethod,
    } = body;

    // Validate required fields
    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !city ||
      !location ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !totalAmount
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Missing required fields',
          },
        },
        { status: 400 }
      );
    }

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Auto-create or find Customer
    let customerId: string | null = null;
    
    try {
      // Normalize email
      const normalizedEmail = customerEmail.toLowerCase().trim();
      
      // Check if User exists with this email
      let user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { customer: true },
      });

      // If User doesn't exist, create one
      if (!user) {
        // Generate a secure temporary password (user can reset via email)
        const tempPassword = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        // Generate password reset token so they can set their password
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            name: customerName,
            phone: customerPhone || null,
            password: hashedPassword, // Temporary password
            role: 'CUSTOMER',
            emailVerified: false, // They haven't verified yet
            isActive: true,
            passwordResetToken: resetToken,
            passwordResetExpires: resetExpires,
          },
          include: { customer: true },
        });
      }

      // Check if Customer record exists
      let customer = user.customer;
      
      if (!customer) {
        // Generate unique customer ID
        const customerIdStr = `CUST-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        
        // Create Customer record
        customer = await prisma.customer.create({
          data: {
            userId: user.id,
            customerId: customerIdStr,
            address: address || null, // Store address from first order
            membershipType: 'BASIC',
            loyaltyPoints: 0,
          },
        });
      } else {
        // Update address if not set and we have one
        if (!customer.address && address) {
          await prisma.customer.update({
            where: { id: customer.id },
            data: { address },
          });
        }
      }

      customerId = customer.id;
    } catch (customerError: any) {
      console.error('Error creating/finding customer:', customerError);
      // Continue with order creation even if customer creation fails
      // Order will still have customerEmail for tracking
    }

    // Create order with items and link to customer
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName,
        customerEmail,
        customerPhone,
        city,
        location,
        address: address || null,
        additionalNotes: additionalNotes || null,
        totalAmount,
        paymentReference: paymentReference || null,
        paymentMethod: paymentMethod || null,
        paymentStatus: paymentReference ? 'PAID' : 'PENDING',
        status: paymentReference ? 'CONFIRMED' : 'PENDING',
        customerId: customerId, // Link to customer if created/found
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            title: item.title,
            quantity: item.quantity,
            ageGroup: item.ageGroup || 'fixed',
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Send emails in background (don't wait for them)
    (async () => {
      try {
        // Send customer confirmation email
        const customerEmailHtml = emailTemplates.orderConfirmation({
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          orderReference: order.orderNumber,
          items: order.items.map((item: typeof order.items[0]) => ({
            title: item.title,
            quantity: item.quantity,
            price: Number(item.unitPrice),
            displayAge: item.ageGroup === 'kids' ? 'Kids' : item.ageGroup === 'adults' ? 'Adults' : 'Fixed',
          })),
          total: Number(order.totalAmount),
          city: order.city,
          location: order.location,
          address: order.address || undefined,
          phone: order.customerPhone,
          paymentReference: order.paymentReference || undefined,
        });

        const customerEmailText = emailTemplates.orderConfirmationText({
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          orderReference: order.orderNumber,
          items: order.items.map((item: typeof order.items[0]) => ({
            title: item.title,
            quantity: item.quantity,
            price: Number(item.unitPrice),
            displayAge: item.ageGroup === 'kids' ? 'Kids' : item.ageGroup === 'adults' ? 'Adults' : 'Fixed',
          })),
          total: Number(order.totalAmount),
          city: order.city,
          location: order.location,
          address: order.address || undefined,
          phone: order.customerPhone,
          paymentReference: order.paymentReference || undefined,
        });

        await emailService.sendEmail({
          to: order.customerEmail,
          subject: `Order Confirmation - ${order.orderNumber}`,
          html: customerEmailHtml,
          text: customerEmailText,
        });

        // Send admin notification email
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@bbslimited.online';
        const itemsList = order.items.map((item: typeof order.items[0]) => `- ${item.title} (${item.quantity}x) - ₦${Number(item.totalPrice).toLocaleString()}`).join('\n');
        
        const adminEmailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Order Notification</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #39413f; color: #ffffff; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
              .order-details { background: #ffffff; padding: 15px; margin: 15px 0; border-radius: 5px; }
              .detail-row { margin: 10px 0; }
              .detail-label { font-weight: bold; color: #39413f; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>New Order Received</h1>
              </div>
              <div class="content">
                <p>A new order has been placed and requires your attention.</p>
                <div class="order-details">
                  <div class="detail-row">
                    <span class="detail-label">Order Number:</span> ${order.orderNumber}
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Customer Name:</span> ${order.customerName}
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Email:</span> ${order.customerEmail}
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Phone:</span> ${order.customerPhone}
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Location:</span> ${order.city}, ${order.location}
                  </div>
                  ${order.address ? `<div class="detail-row"><span class="detail-label">Address:</span> ${order.address}</div>` : ''}
                  <div class="detail-row">
                    <span class="detail-label">Total Amount:</span> ₦${Number(order.totalAmount).toLocaleString()}
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Payment Status:</span> ${order.paymentStatus}
                  </div>
                  ${order.paymentReference ? `<div class="detail-row"><span class="detail-label">Payment Reference:</span> ${order.paymentReference}</div>` : ''}
                  <div class="detail-row">
                    <span class="detail-label">Items:</span>
                    <pre style="margin-top: 10px; padding: 10px; background: #f0f0f0; border-radius: 4px;">${itemsList}</pre>
                  </div>
                  ${order.additionalNotes ? `<div class="detail-row"><span class="detail-label">Additional Notes:</span> ${order.additionalNotes}</div>` : ''}
                </div>
                <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/admin/orders" style="background: #39413f; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px;">View Order in Dashboard</a></p>
              </div>
              <div class="footer">
                <p>This is an automated notification from BBS Limited</p>
              </div>
            </div>
          </body>
          </html>
        `;

        const adminEmailText = `
New Order Received

Order Number: ${order.orderNumber}
Customer: ${order.customerName}
Email: ${order.customerEmail}
Phone: ${order.customerPhone}
Location: ${order.city}, ${order.location}
${order.address ? `Address: ${order.address}` : ''}
Total Amount: ₦${Number(order.totalAmount).toLocaleString()}
Payment Status: ${order.paymentStatus}
${order.paymentReference ? `Payment Reference: ${order.paymentReference}` : ''}

Items:
${itemsList}

${order.additionalNotes ? `Additional Notes: ${order.additionalNotes}` : ''}

View order in dashboard: ${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/admin/orders
        `;

        await emailService.sendEmail({
          to: adminEmail,
          subject: `New Order: ${order.orderNumber} - ₦${Number(order.totalAmount).toLocaleString()}`,
          html: adminEmailHtml,
          text: adminEmailText,
        });
      } catch (emailError) {
        console.error('Failed to send emails:', emailError);
        // Don't fail the order creation if email fails
      }
    })();

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        totalAmount: Number(order.totalAmount),
        paymentReference: order.paymentReference,
        status: order.status,
        paymentStatus: order.paymentStatus,
        items: order.items.map((item: typeof order.items[0]) => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          ageGroup: item.ageGroup,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
        createdAt: order.createdAt,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to create order',
        },
      },
      { status: 500 }
    );
  }
}

// GET /api/v1/orders - Get all orders (Admin only - add auth later)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: any = {};
    if (status) {
      where.status = status.toUpperCase();
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          assignedBarber: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: orders.map((order: typeof orders[0]) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        city: order.city,
        location: order.location,
        address: order.address,
        additionalNotes: order.additionalNotes,
        totalAmount: Number(order.totalAmount),
        paymentReference: order.paymentReference,
        paymentMethod: order.paymentMethod,
        status: order.status,
        paymentStatus: order.paymentStatus,
        jobStatus: order.jobStatus,
        assignedBarberId: order.assignedBarberId,
        assignedBarber: order.assignedBarber ? {
          id: order.assignedBarber.id,
          barberId: order.assignedBarber.barberId,
          name: order.assignedBarber.user?.name || 'Unknown',
          email: order.assignedBarber.user?.email || null,
        } : null,
        items: order.items.map((item: typeof order.items[0]) => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          ageGroup: item.ageGroup,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch orders',
        },
      },
      { status: 500 }
    );
  }
}
