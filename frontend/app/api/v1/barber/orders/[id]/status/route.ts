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
    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'COMPLETED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
          } 
        },
        { status: 400 }
      );
    }

    // Verify order is assigned to this barber and get full details
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        assignedBarberId: barber.id,
      },
      include: {
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
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { 
          success: false, 
          error: { message: 'Order not found or not assigned to you' } 
        },
        { status: 404 }
      );
    }

    // Validate status transitions
    const currentStatus = order.jobStatus;
    const allowedTransitions: Record<string, string[]> = {
      'ACCEPTED': ['ON_THE_WAY'],
      'ON_THE_WAY': ['ARRIVED'],
      'ARRIVED': ['COMPLETED'],
      'COMPLETED': [], // Cannot transition from completed
    };

    if (currentStatus && !allowedTransitions[currentStatus]?.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: `Cannot transition from ${currentStatus} to ${status}` 
          } 
        },
        { status: 400 }
      );
    }

    // Update order status
    const updateData: any = {
      jobStatus: status,
    };

    // If completing, also update order status and mark payment as completed if not already
    if (status === 'COMPLETED') {
      updateData.status = 'COMPLETED';
      if (order.paymentStatus === 'PENDING') {
        updateData.paymentStatus = 'COMPLETED';
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
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

    // Send email notification to customer based on status change
    if (updatedOrder.customerEmail && updatedOrder.assignedBarber) {
      try {
        const barberName = updatedOrder.assignedBarber.user.name;
        let emailHtml: string | undefined;
        let emailSubject: string | undefined;
        let emailText: string | undefined;

        if (status === 'ON_THE_WAY') {
          emailHtml = emailTemplates.barberOnTheWay({
            customerName: updatedOrder.customerName,
            orderNumber: updatedOrder.orderNumber,
            barberName,
            estimatedArrival: '10 minutes', // Could be calculated based on distance
            city: updatedOrder.city,
            location: updatedOrder.location,
          });
          emailSubject = `Your Barber is On The Way - ${updatedOrder.orderNumber}`;
          emailText = `Hello ${updatedOrder.customerName},\n\nGreat news! Your barber ${barberName} is now on the way to your location.\n\nEstimated Arrival: 10 minutes\nLocation: ${updatedOrder.city}, ${updatedOrder.location}\n\nPlease be ready at the service location.\n\nBest regards,\nBBS Limited Team`;
        } else if (status === 'ARRIVED') {
          emailHtml = emailTemplates.barberArrived({
            customerName: updatedOrder.customerName,
            orderNumber: updatedOrder.orderNumber,
            barberName,
          });
          emailSubject = `Your Barber Has Arrived - ${updatedOrder.orderNumber}`;
          emailText = `Hello ${updatedOrder.customerName},\n\nYour barber ${barberName} has arrived at your location and is ready to provide your service!\n\nOrder Number: ${updatedOrder.orderNumber}\n\nEnjoy your service!\n\nBest regards,\nBBS Limited Team`;
        } else if (status === 'COMPLETED') {
          const env = {
            BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
          };
          const reviewLink = `${env.BASE_URL}/review/${updatedOrder.id}`;

          emailHtml = emailTemplates.serviceComplete({
            customerName: updatedOrder.customerName,
            orderNumber: updatedOrder.orderNumber,
            barberName,
            items: updatedOrder.items.map((item) => ({
              title: item.title,
              quantity: item.quantity,
            })),
            totalAmount: Number(updatedOrder.totalAmount),
            reviewLink,
          });
          emailSubject = `Service Completed! - ${updatedOrder.orderNumber}`;
          emailText = `Hello ${updatedOrder.customerName},\n\nYour service has been completed successfully! We hope you're satisfied with the quality of service provided by ${barberName}.\n\nOrder Number: ${updatedOrder.orderNumber}\nTotal Paid: ₦${Number(updatedOrder.totalAmount).toLocaleString()}\n\nWe'd love to hear your feedback: ${reviewLink}\n\nThank you for choosing BBS Limited!\n\nBest regards,\nBBS Limited Team`;
        }

        if (emailHtml && emailSubject && emailText) {
          await emailService.sendEmail({
            to: updatedOrder.customerEmail,
            subject: emailSubject,
            html: emailHtml,
            text: emailText,
          });

          console.log(`✅ Status update email (${status}) sent to ${updatedOrder.customerEmail}`);
        }
      } catch (emailError) {
        console.error(`⚠️ Failed to send status update email (${status}):`, emailError);
        // Don't fail the status update if email fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          jobStatus: updatedOrder.jobStatus,
          status: updatedOrder.status,
        },
        message: `Order status updated to ${status}`,
      },
    });
  } catch (error: any) {
    console.error('Update order status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to update order status',
        },
      },
      { status: 500 }
    );
  }
}
