import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { emailService } from '@/lib/server/emailService';
import { emailTemplates } from '@/lib/server/emailTemplates';

export const dynamic = 'force-dynamic';

async function verifyBarber(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.id },
      include: { barber: true },
    });
    
    if (!user || user.role !== 'BARBER' || !user.isActive || !user.barber) {
      return null;
    }
    
    return { user, barber: user.barber };
  } catch {
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyBarber(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Barber access required.' } },
        { status: 401 }
      );
    }

    const { barber } = auth;
    const orderId = params.id;

    // Issue 2 & 5: Use transaction to prevent race condition and ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Single query to verify and get order details (prevents race condition)
      const order = await tx.order.findFirst({
        where: {
          id: orderId,
          assignedBarberId: barber.id,
          jobStatus: 'PENDING_ACCEPTANCE', // Only accept if still pending
        },
        include: {
          items: true,
          assignedBarber: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw new Error('Order not found or not available for acceptance');
      }

      // Issue 2 & 5: Update order status atomically within transaction (prevents race condition)
      const updateResult = await tx.order.updateMany({
        where: { 
          id: orderId,
          // Ensure it's still in PENDING_ACCEPTANCE state and assigned to this barber (prevents race condition)
          assignedBarberId: barber.id,
          jobStatus: 'PENDING_ACCEPTANCE',
        },
        data: {
          jobStatus: 'ACCEPTED',
        },
      });

      // Check if update actually affected a row
      if (updateResult.count === 0) {
        throw new Error('Order could not be accepted. It may have been accepted by another barber or the status changed.');
      }

      // Fetch the updated order with relations
      const updatedOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          assignedBarber: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      if (!updatedOrder) {
        throw new Error('Order not found after update');
      }

      return updatedOrder;
    }).catch((error: any) => {
      // Re-throw to be caught by outer try-catch
      if (error.message.includes('not found') || error.message.includes('not available')) {
        throw new Error(error.message);
      }
      throw error;
    });

    const updatedOrder = result;

    // Send email notification to customer that barber accepted
    if (updatedOrder.customerEmail && updatedOrder.assignedBarber) {
      try {
        const barberEmailHtml = emailTemplates.barberAccepted({
          customerName: updatedOrder.customerName,
          orderNumber: updatedOrder.orderNumber,
          barberName: updatedOrder.assignedBarber.user.name,
          city: updatedOrder.city,
          location: updatedOrder.location,
          estimatedArrival: '10 minutes', // Default estimate
        });

        await emailService.sendEmail({
          to: updatedOrder.customerEmail,
          subject: `Barber Accepted Your Order - ${updatedOrder.orderNumber}`,
          html: barberEmailHtml,
          text: `Hello ${updatedOrder.customerName},\n\nGreat news! A professional barber has accepted your order (${updatedOrder.orderNumber}) and is preparing to serve you.\n\nBarber: ${updatedOrder.assignedBarber.user.name}\nLocation: ${updatedOrder.city}, ${updatedOrder.location}\n\nYour barber will arrive within 10 minutes. Please ensure you're available at the service location.\n\nBest regards,\nBBS Limited Team`,
        });

        console.log(`✅ Barber acceptance email sent to ${updatedOrder.customerEmail}`);
      } catch (emailError) {
        console.error('⚠️ Failed to send barber acceptance email:', emailError);
        // Don't fail the acceptance if email fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          jobStatus: updatedOrder.jobStatus,
        },
        message: 'Order accepted successfully',
      },
    });
  } catch (error: any) {
    console.error('Accept order error:', error);
    
    // Handle specific errors
    if (error.message && (error.message.includes('not found') || error.message.includes('not available'))) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
          },
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to accept order',
        },
      },
      { status: 500 }
    );
  }
}
