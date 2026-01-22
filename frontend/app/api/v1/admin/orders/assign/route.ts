import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { emailService } from '@/lib/server/emailService';
import { emailTemplates } from '@/lib/server/emailTemplates';

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
    const { orderId, barberId } = body;

    if (!orderId || !barberId) {
      return NextResponse.json(
        { success: false, error: { message: 'Order ID and Barber ID are required' } },
        { status: 400 }
      );
    }

    // Use transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Verify order exists and check if already assigned (within transaction)
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { assignedBarber: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Issue 3: Check if order is already assigned or completed
      if (order.assignedBarberId && order.assignedBarberId !== barberId) {
        throw new Error('Order is already assigned to another barber');
      }

      if (order.jobStatus === 'COMPLETED' || order.status === 'COMPLETED') {
        throw new Error('Cannot assign a completed order');
      }

      // Verify barber exists and is active
      const barber = await tx.barber.findUnique({
        where: { id: barberId },
        include: { 
          user: true,
          availability: {
            where: { isAvailable: true },
          },
        },
      });

      if (!barber) {
        throw new Error('Barber not found');
      }

      if (barber.status !== 'ACTIVE') {
        throw new Error('Barber is not active');
      }

      // Issue 4: Check barber availability (online + within hours)
      if (!barber.isOnline) {
        throw new Error('Barber is currently offline and cannot accept new orders');
      }

      // Check if barber is within availability hours
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
      const currentTime = now.toTimeString().slice(0, 5); // HH:mm format

      const todayAvailability = barber.availability.find(a => a.dayOfWeek === currentDay);
      if (todayAvailability) {
        const startTime = todayAvailability.startTime.toString().slice(0, 5); // HH:mm
        const endTime = todayAvailability.endTime.toString().slice(0, 5); // HH:mm
        const isWithinHours = currentTime >= startTime && currentTime <= endTime;
        
        if (!isWithinHours) {
          throw new Error('Barber is outside their scheduled availability hours');
        }
      } else {
        // No availability set for today - barber is not available
        throw new Error('Barber has no availability set for today');
      }

      // Issue 1 & 3: Assign order to barber (atomic update prevents race condition)
      // Use updateMany first to ensure atomicity, then fetch the updated record
      const updateResult = await tx.order.updateMany({
        where: { 
          id: orderId,
          // Only update if not already assigned to a different barber (prevents race condition)
          OR: [
            { assignedBarberId: null },
            { assignedBarberId: barberId }, // Allow reassignment to same barber
          ],
          // Don't assign if already completed
          jobStatus: { not: 'COMPLETED' },
          status: { not: 'COMPLETED' },
        },
        data: {
          assignedBarberId: barberId,
          jobStatus: 'PENDING_ACCEPTANCE',
          declineReason: null, // Clear any previous decline reason
        },
      });

      // Check if update actually affected a row
      if (updateResult.count === 0) {
        throw new Error('Order could not be assigned. It may already be assigned to another barber or completed.');
      }

      // Fetch the updated order with relations
      const updatedOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          assignedBarber: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  phone: true,
                  avatarUrl: true,
                },
              },
            },
          },
          items: true,
        },
      });

      if (!updatedOrder) {
        throw new Error('Order not found after update');
      }

      return { updatedOrder, barber };
    });

    const { updatedOrder, barber } = result;

    // Send email notification to barber about assignment (non-blocking)
    if (barber.user.email) {
      try {
        const barberEmailHtml = emailTemplates.barberAssignment({
          barberName: barber.user.name,
          barberEmail: barber.user.email,
          orderNumber: updatedOrder.orderNumber,
          customerName: updatedOrder.customerName,
          customerPhone: updatedOrder.customerPhone,
          city: updatedOrder.city,
          location: updatedOrder.location,
          address: updatedOrder.address || undefined,
          items: updatedOrder.items.map((item) => ({
            title: item.title,
            quantity: item.quantity,
          })),
          totalAmount: Number(updatedOrder.totalAmount),
        });

        const barberEmailText = emailTemplates.barberAssignmentText({
          barberName: barber.user.name,
          orderNumber: updatedOrder.orderNumber,
          customerName: updatedOrder.customerName,
          customerPhone: updatedOrder.customerPhone,
          city: updatedOrder.city,
          location: updatedOrder.location,
          items: updatedOrder.items.map((item) => ({
            title: item.title,
            quantity: item.quantity,
          })),
          totalAmount: Number(updatedOrder.totalAmount),
        });

        await emailService.sendEmail({
          to: barber.user.email,
          subject: `New Order Assigned - ${updatedOrder.orderNumber}`,
          html: barberEmailHtml,
          text: barberEmailText,
        });

        console.log(`✅ Barber assignment email sent to ${barber.user.email}`);
      } catch (emailError) {
        console.error('⚠️ Failed to send barber assignment email:', emailError);
        // Don't fail the assignment if email fails
      }
    } else {
      console.warn(`⚠️ Barber ${barber.id} has no email address, skipping email notification`);
    }

    // Send email notification to customer about barber assignment (non-blocking)
    if (updatedOrder.customerEmail) {
      try {
        const customerEmailHtml = emailTemplates.customerBarberAssigned({
          customerName: updatedOrder.customerName,
          orderNumber: updatedOrder.orderNumber,
          barberName: barber.user.name,
          barberPhone: barber.user.phone || undefined,
          barberPicture: barber.user.avatarUrl || undefined, // Include barber picture
          city: updatedOrder.city,
          location: updatedOrder.location,
          address: updatedOrder.address || undefined,
          items: updatedOrder.items.map((item) => ({
            title: item.title,
            quantity: item.quantity,
          })),
          totalAmount: Number(updatedOrder.totalAmount),
        });

        const customerEmailText = emailTemplates.customerBarberAssignedText({
          customerName: updatedOrder.customerName,
          orderNumber: updatedOrder.orderNumber,
          barberName: barber.user.name,
          barberPhone: barber.user.phone || undefined,
          city: updatedOrder.city,
          location: updatedOrder.location,
          items: updatedOrder.items.map((item) => ({
            title: item.title,
            quantity: item.quantity,
          })),
          totalAmount: Number(updatedOrder.totalAmount),
        });

        await emailService.sendEmail({
          to: updatedOrder.customerEmail,
          subject: `Barber Assigned - ${updatedOrder.orderNumber}`,
          html: customerEmailHtml,
          text: customerEmailText,
        });

        console.log(`✅ Customer notification email sent to ${updatedOrder.customerEmail}`);
      } catch (emailError) {
        console.error('⚠️ Failed to send customer notification email:', emailError);
        // Don't fail the assignment if email fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          assignedBarber: {
            id: updatedOrder.assignedBarber?.id,
            name: updatedOrder.assignedBarber?.user.name,
            email: updatedOrder.assignedBarber?.user.email,
          },
          jobStatus: updatedOrder.jobStatus,
        },
        message: 'Order assigned successfully',
      },
    });
  } catch (error: any) {
    console.error('Assign order error:', error);
    
    // Handle specific transaction errors
    if (error.message === 'Order not found') {
      return NextResponse.json(
        { success: false, error: { message: 'Order not found' } },
        { status: 404 }
      );
    }
    if (error.message === 'Barber not found') {
      return NextResponse.json(
        { success: false, error: { message: 'Barber not found' } },
        { status: 404 }
      );
    }
    if (error.message.includes('already assigned')) {
      return NextResponse.json(
        { success: false, error: { message: error.message } },
        { status: 400 }
      );
    }
    if (error.message.includes('completed order') || error.message.includes('Cannot assign')) {
      return NextResponse.json(
        { success: false, error: { message: error.message } },
        { status: 400 }
      );
    }
    if (error.message.includes('offline') || error.message.includes('availability') || error.message.includes('not active')) {
      return NextResponse.json(
        { success: false, error: { message: error.message } },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to assign order',
        },
      },
      { status: 500 }
    );
  }
}
